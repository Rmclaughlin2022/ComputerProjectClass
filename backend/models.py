from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="user")
    password_hash = Column(String, nullable=False)

    bets = relationship("Bet", back_populates="user")


class Sport(Base):
    __tablename__ = "sports"

    sport_id = Column(Integer, primary_key=True, index=True)
    sport_name = Column(String, unique=True, nullable=False)

    teams = relationship("SportsTeam", back_populates="sport")
    matches = relationship("Match", back_populates="sport")


class SportsTeam(Base):
    __tablename__ = "sports_teams"

    sports_teamsid = Column(Integer, primary_key=True, index=True)
    sport_id = Column(Integer, ForeignKey("sports.sport_id"))
    team_name = Column(String, nullable=False)

    sport = relationship("Sport", back_populates="teams")
    players = relationship("SportsPlayer", back_populates="team")


class SportsPlayer(Base):
    __tablename__ = "sports_players"

    player_id = Column(Integer, primary_key=True, index=True)
    sports_teamsid = Column(Integer, ForeignKey("sports_teams.sports_teamsid"))
    player_name = Column(String)
    position = Column(String)
    stats = Column(String)

    team = relationship("SportsTeam", back_populates="players")


class Match(Base):
    __tablename__ = "matches"

    match_id = Column(Integer, primary_key=True, index=True)
    sport_id = Column(Integer, ForeignKey("sports.sport_id"))
    team1_id = Column(Integer, ForeignKey("sports_teams.sports_teamsid"))
    team2_id = Column(Integer, ForeignKey("sports_teams.sports_teamsid"))
    match_date = Column(DateTime)
    location = Column(String)
    final_score = Column(String)

    sport = relationship("Sport", back_populates="matches")
    odds = relationship("BettingOdds", back_populates="match")
    predictions = relationship("Prediction", back_populates="match")
    historical_stats = relationship("HistoricalStats", back_populates="match")


class BettingOdds(Base):
    __tablename__ = "betting_odds"

    odds_id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.match_id"))
    sports_books = Column(String)
    odds_team1 = Column(Float)
    odds_team2 = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow)

    match = relationship("Match", back_populates="odds")


class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.match_id"))
    predicted_winner = Column(String)
    predicted_stats = Column(String)
    confidence_score = Column(Float)

    match = relationship("Match", back_populates="predictions")


class HistoricalStats(Base):
    __tablename__ = "historical_stats"

    histstats_id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.match_id"))
    team_id = Column(Integer, ForeignKey("sports_teams.sports_teamsid"))
    stats_ = Column(String)

    match = relationship("Match", back_populates="historical_stats")


class Bet(Base):
    __tablename__ = "bets"

    bet_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    match_id = Column(Integer, ForeignKey("matches.match_id"))
    prediction_id = Column(Integer, ForeignKey("predictions.prediction_id"))
    amount = Column(Float)
    outcome = Column(String)
    profit_loss = Column(Float)

    user = relationship("User", back_populates="bets")
