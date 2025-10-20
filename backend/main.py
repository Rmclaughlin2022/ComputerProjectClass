from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import models, database
from api_integration import fetch_and_store_odds
from sqlalchemy.orm import aliased
from fastapi.responses import JSONResponse


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

class UserCreate(BaseModel):
    username: str
    email: str

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
    fetch_and_store_odds(db)
    return {"message": "Odds updated successfully"}

from sqlalchemy.orm import aliased
from fastapi.responses import JSONResponse
from datetime import datetime

@app.get("/odds")
def get_odds(db: Session = Depends(get_db)):
    team1 = aliased(models.SportsTeam)
    team2 = aliased(models.SportsTeam)

    results = (
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
        .limit(20)
        .all()
    )

    odds_list = []
    for r in results:
        odds_list.append({
            "match_id": r.match_id,
            "team1": r.team1,
            "team2": r.team2,
            "sports_books": r.sports_books,
            "odds_team1": r.odds_team1,
            "odds_team2": r.odds_team2,
            "match_date": r.match_date.isoformat() if isinstance(r.match_date, datetime) else r.match_date,
        })

    return JSONResponse(content=odds_list)
