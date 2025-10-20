# api_integration.py
import requests
from sqlalchemy.orm import Session
from datetime import datetime
import models

API_KEY = "d8ccd0d282c783d88e87dd347f9db9e0"
BASE_URL = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/"

def fetch_and_store_odds(db: Session):
    params = {
        "apiKey": API_KEY,
        "regions": "us",  
        "markets": "h2h",  
        "oddsFormat": "decimal",
    }

    print("Fetching odds from The Odds API...")
    response = requests.get(BASE_URL, params=params)
    if response.status_code != 200:
        raise Exception(f"Error fetching odds: {response.text}")

    data = response.json()

    for event in data:
        sport_name = "American Football"
        team1_name = event["home_team"]
        team2_name = event["away_team"]
        match_date = event.get("commence_time")

        # --- Sport ---
        sport = db.query(models.Sport).filter_by(sport_name=sport_name).first()
        if not sport:
            sport = models.Sport(sport_name=sport_name)
            db.add(sport)
            db.commit()
            db.refresh(sport)

        # --- Teams ---
        team1 = db.query(models.SportsTeam).filter_by(team_name=team1_name).first()
        if not team1:
            team1 = models.SportsTeam(sport_id=sport.sport_id, team_name=team1_name)
            db.add(team1)
            db.commit()
            db.refresh(team1)

        team2 = db.query(models.SportsTeam).filter_by(team_name=team2_name).first()
        if not team2:
            team2 = models.SportsTeam(sport_id=sport.sport_id, team_name=team2_name)
            db.add(team2)
            db.commit()
            db.refresh(team2)

        # --- Match ---
        match = (
            db.query(models.Match)
            .filter_by(team1_id=team1.sports_teamsid, team2_id=team2.sports_teamsid)
            .first()
        )
        if not match:
            match = models.Match(
                sport_id=sport.sport_id,
                team1_id=team1.sports_teamsid,
                team2_id=team2.sports_teamsid,
                match_date=match_date,
                location="TBD",
            )
            db.add(match)
            db.commit()
            db.refresh(match)

        # --- Odds ---
        for bookmaker in event["bookmakers"]:
            book_name = bookmaker["title"]

            for market in bookmaker["markets"]:
                if market["key"] != "h2h":
                    continue
                outcomes = market["outcomes"]
                if len(outcomes) < 2:
                    continue

                odds_team1 = outcomes[0]["price"]
                odds_team2 = outcomes[1]["price"]

                new_odds = models.BettingOdds(
                    match_id=match.match_id,
                    sports_books=book_name,
                    odds_team1=odds_team1,
                    odds_team2=odds_team2,
                    updated_at=datetime.utcnow(),
                )
                db.add(new_odds)
        db.commit()

    print("Odds successfully updated from The Odds API.")
