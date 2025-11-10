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
