# api_integration.py
import os
from datetime import datetime
import requests
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import models

load_dotenv()
API_KEY = os.getenv("SPORTS_API_KEY", "d8ccd0d282c783d88e87dd347f9db9e0")
BASE_URL = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds"

def _parse_commence_time(s: str) -> datetime:
    # '2025-11-06T01:20:00Z' -> naive UTC datetime
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return datetime.fromisoformat(s).replace(tzinfo=None)

def fetch_provider_json() -> list[dict]:
    params = {"apiKey": API_KEY, "regions": "us", "markets": "h2h", "oddsFormat": "decimal"}
    r = requests.get(BASE_URL, params=params, timeout=20)
    if r.status_code != 200:
        raise RuntimeError(f"Provider error {r.status_code}: {r.text[:200]}")
    data = r.json()
    if not isinstance(data, list):
        raise RuntimeError("Provider returned non-list")
    return data

def fetch_and_store_odds(db: Session) -> None:
    events = fetch_provider_json()
    sport = db.query(models.Sport).filter_by(sport_name="American Football").first()
    if not sport:
        sport = models.Sport(sport_name="American Football")
        db.add(sport); db.commit(); db.refresh(sport)

    for ev in events:
        home = ev.get("home_team")
        away = ev.get("away_team")
        ct   = ev.get("commence_time")
        books = ev.get("bookmakers")  # correct key

        if not (home and away and ct):
            continue

        when = _parse_commence_time(ct)

        # teams
        t1 = db.query(models.SportsTeam).filter_by(team_name=home).first()
        if not t1:
            t1 = models.SportsTeam(sport_id=sport.sport_id, team_name=home)
            db.add(t1); db.commit(); db.refresh(t1)

        t2 = db.query(models.SportsTeam).filter_by(team_name=away).first()
        if not t2:
            t2 = models.SportsTeam(sport_id=sport.sport_id, team_name=away)
            db.add(t2); db.commit(); db.refresh(t2)

        # match (include date in uniqueness so future games don’t collide)
        match = (
            db.query(models.Match)
            .filter(
                models.Match.sport_id == sport.sport_id,
                models.Match.team1_id == t1.sports_teamsid,
                models.Match.team2_id == t2.sports_teamsid,
                models.Match.match_date == when,
            )
            .first()
        )
        if not match:
            match = models.Match(
                sport_id=sport.sport_id,
                team1_id=t1.sports_teamsid,
                team2_id=t2.sports_teamsid,
                match_date=when,
                location="TBD",
            )
            db.add(match); db.commit(); db.refresh(match)

        # odds rows
        if isinstance(books, list):
            for bk in books:
                book_name = bk.get("title") or bk.get("key") or "Unknown"
                markets = bk.get("markets") or []
                h2h = next((m for m in markets if m.get("key") == "h2h"), None)
                if not h2h:
                    continue
                outcomes = h2h.get("outcomes") or []
                # map by team name first
                prices = {str(o.get("name")): o.get("price") for o in outcomes if "name" in o}
                o1 = prices.get(home)
                o2 = prices.get(away)
                if o1 is None or o2 is None:
                    if len(outcomes) >= 2:
                        o1 = o1 if o1 is not None else outcomes[0].get("price")
                        o2 = o2 if o2 is not None else outcomes[1].get("price")
                if o1 is None or o2 is None:
                    continue

                existing = (
                    db.query(models.BettingOdds)
                    .filter(
                        models.BettingOdds.match_id == match.match_id,
                        models.BettingOdds.sports_books == book_name,
                    )
                    .first()
                )
                if existing:
                    existing.odds_team1 = float(o1)
                    existing.odds_team2 = float(o2)
                    existing.updated_at = datetime.utcnow()
                else:
                    db.add(
                        models.BettingOdds(
                            match_id=match.match_id,
                            sports_books=book_name,
                            odds_team1=float(o1),
                            odds_team2=float(o2),
                            updated_at=datetime.utcnow(),
                        )
                    )
            db.commit()
