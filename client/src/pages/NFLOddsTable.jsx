import React, { useEffect, useState } from "react";

function NFLOddsTable() {
  const [odds, setOdds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function toAmericanOdds(decimalOdds) {
    if (decimalOdds >= 2.0) {
      return `+${Math.round((decimalOdds - 1) * 100)}`;
    } else {
      return `${Math.round(-100 / (decimalOdds - 1))}`;
    }
  }

  useEffect(() => {
    fetch("http://localhost:8000/odds")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch odds");
        return res.json();
      })
      .then((data) => {
        setOdds(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching odds:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []); //Run once 

  if (loading) return <p>Loading odds...</p>;
  if (!odds.length) return <p>No matchups found for this week.</p>;

  return (
    <div style={{ marginTop: "20px" }}>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Sportsbook</th>
            <th>Odds (Team 1)</th>
            <th>Odds (Team 2)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {odds.map((match) => (
            <tr key={match.match_id}>
              <td>{match.team1}</td>
              <td>{match.team2}</td>
              <td>{match.sports_books}</td>
              <td>{toAmericanOdds(parseFloat(match.odds_team1))}</td>
              <td>{toAmericanOdds(parseFloat(match.odds_team2))}</td>
              <td>
                {new Date(match.match_date + "Z").toLocaleString("en-US", {
                  timeZone: "America/Chicago",
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NFLOddsTable;

