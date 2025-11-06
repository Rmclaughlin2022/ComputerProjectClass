import React, { useEffect, useMemo, useState } from "react";

function toAmericanOdds(decimalOdds) {
  const d = Number(decimalOdds);
  if (!Number.isFinite(d) || d <= 1) return "-";
  return d >= 2 ? `+${Math.round((d - 1) * 100)}` : `${Math.round(-100 / (d - 1))}`;
}

/**
 * props:
 *  - filters: { sport, team, query }
 *  - onTeamsReady?: (string[]) => void   // gives the available teams to the parent
 */
export default function NFLOddsTable({ filters = {}, onTeamsReady }) {
  const [odds, setOdds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const API = process.env.REACT_APP_API_BASE || "http://localhost:8000";
    setLoading(true);
    fetch(`${API}/odds`)
      .then((res) => { if (!res.ok) throw new Error("Failed to fetch odds"); return res.json(); })
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setOdds(arr);
        setLoading(false);

        const teams = Array.from(
          new Set(arr.flatMap((m) => [m.team1, m.team2]).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));
        if (typeof onTeamsReady === "function") onTeamsReady(teams);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Request failed");
        setLoading(false);
      });
  }, [onTeamsReady]);

  const filtered = useMemo(() => {
    const q = (filters.query || "").toLowerCase().trim();
    const team = (filters.team || "").toLowerCase().trim();

    return odds.filter((m) => {
      // team dropdown filter
      if (team) {
        const t1 = String(m.team1 || "").toLowerCase();
        const t2 = String(m.team2 || "").toLowerCase();
        if (t1 !== team && t2 !== team) return false;
      }

      if (q) {
        const hay = `${m.team1} ${m.team2} ${m.sports_books}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [odds, filters.query, filters.team, filters.sport]);

  return (
    <div style={{ overflowX: "auto" }}>
      <table cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Sportsbook</th>
            <th>Odds (Team 1)</th>
            <th>Odds (Team 2)</th>
            <th>Date (CT)</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={6}>Loading odds…</td></tr>
          )}
          {!loading && error && (
            <tr><td colSpan={6} style={{ color: "crimson" }}>Error: {error}</td></tr>
          )}
          {!loading && !error && filtered.length === 0 && (
            <tr><td colSpan={6}>No matchups found.</td></tr>
          )}
          {!loading && !error && filtered.map((match) => {
            const t1 = toAmericanOdds(parseFloat(match.odds_team1));
            const t2 = toAmericanOdds(parseFloat(match.odds_team2));
            const when = new Date(`${match.match_date}Z`).toLocaleString("en-US", {
              timeZone: "America/Chicago",
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
            return (
              <tr key={match.match_id}>
                <td>{match.team1}</td>
                <td>{match.team2}</td>
                <td>{match.sports_books}</td>
                <td>{t1}</td>
                <td>{t2}</td>
                <td>{when}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
