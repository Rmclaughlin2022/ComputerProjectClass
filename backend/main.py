from datetime import datetime, timedelta
import logging, traceback
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session, aliased
from api_integration import fetch_provider_json


from datetime import datetime, timedelta
from fastapi import Query
import os
import database
import models
from auth import create_access_token, decode_access_token, hash_password, verify_password
from api_integration import fetch_and_store_odds
import math

load_dotenv()
logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Sports Betting API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

def implied_prob_from_decimal(decimal_odds: float):
    """Convert decimal odds like 1.80 or 2.10 to implied probability (0–1)."""
    if decimal_odds is None:
        return None
    try:
        d = float(decimal_odds)
    except (TypeError, ValueError):
        return None
    if d <= 1.0:
        return None
    return 1.0 / d

def model_probs_from_ratings(team1_name: str, team2_name: str, db: Session):
    """Return (p_team1, p_team2) based on TeamRating.overall_rating and a logistic curve."""
    r1 = db.query(models.TeamRating).filter(models.TeamRating.team_name == team1_name).first()
    r2 = db.query(models.TeamRating).filter(models.TeamRating.team_name == team2_name).first()

    if not r1 or not r2:
        return 0.5, 0.5

    diff = (r1.overall_rating or 0.0) - (r2.overall_rating or 0.0)

    scale = 12.0 
    p1 = 1.0 / (1.0 + math.exp(-diff / scale))
    p2 = 1.0 - p1
    return p1, p2

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Schema
class UserCreate(BaseModel):
    username: str
    email: str

class SignupInput(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

# Routes
@app.get("/")
def root():
    return {"message": "connected"}

@app.post("/users/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(username=user.username, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/update-odds/")
def update_odds(db: Session = Depends(get_db)):
    try:
        fetch_and_store_odds(db)
        return {"message": "Odds updated successfully"}
    except Exception as e:
        logger.error("update_odds failed: %s\n%s", e, traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": "update_odds failed", "detail": str(e)})

from fastapi import Query

@app.get("/odds")
def get_odds(
    db: Session = Depends(get_db),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    upcoming: bool = Query(default=False),
    limit: int = Query(default=100, ge=1, le=500),
):
    team1 = aliased(models.SportsTeam)
    team2 = aliased(models.SportsTeam)

    base = (
        db.query(
            models.Match.match_id,
            team1.team_name.label("team1"),
            team2.team_name.label("team2"),
            models.BettingOdds.sports_books,
            models.BettingOdds.odds_team1,
            models.BettingOdds.odds_team2,
            models.Match.match_date,
        )
        .join(models.BettingOdds, models.Match.match_id == models.BettingOdds.match_id)
        .join(team1, models.Match.team1_id == team1.sports_teamsid)
        .join(team2, models.Match.team2_id == team2.sports_teamsid)
    )

    if date_from and date_to:
        start_dt = datetime.fromisoformat(f"{date_from}T00:00:00")
        end_dt = datetime.fromisoformat(f"{date_to}T23:59:59")
    elif upcoming:
        start_dt = datetime.utcnow()
        end_dt = start_dt + timedelta(days=14)
    else:
        today = datetime.utcnow().date()
        start_of_week = today - timedelta(days=(today.weekday() - 1) % 7)  
        start_dt = datetime.combine(start_of_week, datetime.min.time())
        end_dt = datetime.combine(start_of_week + timedelta(days=6), datetime.max.time())

    q = base.filter(
        models.Match.match_date >= start_dt,
        models.Match.match_date <= end_dt,
    )

    rows = q.order_by(models.Match.match_date.asc()).limit(limit).all()

    return JSONResponse(content=[
        {
            "match_id": r.match_id,
            "team1": r.team1,
            "team2": r.team2,
            "sports_books": r.sports_books,
            "odds_team1": r.odds_team1,
            "odds_team2": r.odds_team2,
            "match_date": r.match_date.isoformat() if isinstance(r.match_date, datetime) else r.match_date,
        }
        for r in rows
    ])

# Auth
@app.post("/auth/signup")
def signup(data: SignupInput, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(name=data.name, email=data.email, password_hash=hash_password(data.password))
    db.add(user); db.commit(); db.refresh(user)
    return {"message": "Account created successfully", "user": {"id": user.user_id, "email": user.email}}

@app.post("/auth/login")
def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.user_id), "email": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/me")
def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.user_id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": user.user_id, "name": user.name, "email": user.email, "role": user.role}

# Debug helpers
@app.get("/debug/counts")
def counts(db: Session = Depends(get_db)):
    return {
        "teams": db.query(models.SportsTeam).count(),
        "matches": db.query(models.Match).count(),
        "odds": db.query(models.BettingOdds).count(),
    }

@app.get("/debug/provider")
def debug_provider():
    data = fetch_provider_json()
    return {
        "count": len(data),
        "sample_keys": list(data[0].keys()) if data else [],
        "first_commence_time": data[0].get("commence_time") if data else None,
    }



NFL_INITIAL_RATINGS = [
    # AFC East
    {"team_name": "Buffalo Bills", "offense_rating": 88, "defense_rating": 84, "overall_rating": 86},
    {"team_name": "Miami Dolphins", "offense_rating": 89, "defense_rating": 80, "overall_rating": 85},
    {"team_name": "New England Patriots", "offense_rating": 74, "defense_rating": 79, "overall_rating": 76},
    {"team_name": "New York Jets", "offense_rating": 78, "defense_rating": 83, "overall_rating": 80},

    # AFC North
    {"team_name": "Baltimore Ravens", "offense_rating": 88, "defense_rating": 90, "overall_rating": 89},
    {"team_name": "Cincinnati Bengals", "offense_rating": 90, "defense_rating": 79, "overall_rating": 86},
    {"team_name": "Cleveland Browns", "offense_rating": 78, "defense_rating": 88, "overall_rating": 83},
    {"team_name": "Pittsburgh Steelers", "offense_rating": 76, "defense_rating": 84, "overall_rating": 80},

    # AFC South
    {"team_name": "Houston Texans", "offense_rating": 84, "defense_rating": 78, "overall_rating": 81},
    {"team_name": "Indianapolis Colts", "offense_rating": 80, "defense_rating": 76, "overall_rating": 78},
    {"team_name": "Jacksonville Jaguars", "offense_rating": 82, "defense_rating": 78, "overall_rating": 80},
    {"team_name": "Tennessee Titans", "offense_rating": 75, "defense_rating": 77, "overall_rating": 76},

    # AFC West
    {"team_name": "Denver Broncos", "offense_rating": 77, "defense_rating": 76, "overall_rating": 76},
    {"team_name": "Kansas City Chiefs", "offense_rating": 92, "defense_rating": 86, "overall_rating": 90},
    {"team_name": "Las Vegas Raiders", "offense_rating": 76, "defense_rating": 75, "overall_rating": 76},
    {"team_name": "Los Angeles Chargers", "offense_rating": 84, "defense_rating": 76, "overall_rating": 80},

    # NFC East
    {"team_name": "Dallas Cowboys", "offense_rating": 88, "defense_rating": 87, "overall_rating": 88},
    {"team_name": "New York Giants", "offense_rating": 74, "defense_rating": 76, "overall_rating": 75},
    {"team_name": "Philadelphia Eagles", "offense_rating": 90, "defense_rating": 83, "overall_rating": 87},
    {"team_name": "Washington Commanders", "offense_rating": 74, "defense_rating": 75, "overall_rating": 74},

    # NFC North
    {"team_name": "Chicago Bears", "offense_rating": 77, "defense_rating": 74, "overall_rating": 75},
    {"team_name": "Detroit Lions", "offense_rating": 89, "defense_rating": 79, "overall_rating": 85},
    {"team_name": "Green Bay Packers", "offense_rating": 82, "defense_rating": 79, "overall_rating": 81},
    {"team_name": "Minnesota Vikings", "offense_rating": 84, "defense_rating": 77, "overall_rating": 81},

    # NFC South
    {"team_name": "Atlanta Falcons", "offense_rating": 79, "defense_rating": 78, "overall_rating": 79},
    {"team_name": "Carolina Panthers", "offense_rating": 71, "defense_rating": 75, "overall_rating": 73},
    {"team_name": "New Orleans Saints", "offense_rating": 80, "defense_rating": 80, "overall_rating": 80},
    {"team_name": "Tampa Bay Buccaneers", "offense_rating": 82, "defense_rating": 79, "overall_rating": 81},

    # NFC West
    {"team_name": "Arizona Cardinals", "offense_rating": 75, "defense_rating": 73, "overall_rating": 74},
    {"team_name": "Los Angeles Rams", "offense_rating": 84, "defense_rating": 78, "overall_rating": 81},
    {"team_name": "San Francisco 49ers", "offense_rating": 93, "defense_rating": 92, "overall_rating": 93},
    {"team_name": "Seattle Seahawks", "offense_rating": 82, "defense_rating": 78, "overall_rating": 80},
]

@app.post("/debug/seed-nfl-ratings")
def seed_nfl_ratings(db: Session = Depends(get_db)):
    created = 0
    for data in NFL_INITIAL_RATINGS:
        existing = db.query(models.TeamRating).filter_by(team_name=data["team_name"]).first()
        if existing:
            continue
        db.add(models.TeamRating(**data))
        created += 1
    db.commit()
    return {"inserted": created}


@app.get("/ai-predictions")
def ai_predictions(db: Session = Depends(get_db), limit: int = Query(default=100, ge=1, le=500)):
    """
    AI predictions using TeamRating.overall_rating for each team.
    """

    team1 = aliased(models.SportsTeam)
    team2 = aliased(models.SportsTeam)

    base = (
        db.query(
            models.Match.match_id,
            team1.team_name.label("team1"),
            team2.team_name.label("team2"),
            models.BettingOdds.sports_books,
            models.BettingOdds.odds_team1,
            models.BettingOdds.odds_team2,
            models.Match.match_date,
        )
        .join(models.BettingOdds, models.Match.match_id == models.BettingOdds.match_id)
        .join(team1, models.Match.team1_id == team1.sports_teamsid)
        .join(team2, models.Match.team2_id == team2.sports_teamsid)
    )

    start_dt = datetime.utcnow()
    end_dt = start_dt + timedelta(days=14)

    q = base.filter(
        models.Match.match_date >= start_dt,
        models.Match.match_date <= end_dt,
    )

    rows = q.order_by(models.Match.match_date.asc()).limit(limit).all()

    results = []
    for r in rows:
        p1_model, p2_model = model_probs_from_ratings(r.team1, r.team2, db)

        results.append({
            "match_id": r.match_id,
            "team1": r.team1,
            "team2": r.team2,
            "sports_books": r.sports_books,
            "odds_team1": r.odds_team1,
            "odds_team2": r.odds_team2,
            "match_date": r.match_date.isoformat() if isinstance(r.match_date, datetime) else r.match_date,
            "model_prob_team1": p1_model,
            "model_prob_team2": p2_model,
        })

    return JSONResponse(content=results)
