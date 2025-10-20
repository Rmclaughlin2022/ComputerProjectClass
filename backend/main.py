from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import models, database
from api_integration import fetch_and_store_odds

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

@app.get("/odds")
def get_odds(db: Session = Depends(get_db)):
    odds = db.query(models.BettingOdds).all()
    return odds
