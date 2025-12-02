import React, { useCallback, useEffect, useMemo, useState } from "react";

function toAmericanOdds(decimalOdds) {
  const d = Number(decimalOdds);
  if (!Number.isFinite(d) || d <= 1) return "-";
  return d >= 2
    ? `+${Math.round((d - 1) * 100)}`
    : `${Math.round(-100 / (d - 1))}`;
}

// --- NFL division data ---
const NFL_DIVISIONS = [
  "AFC East",
  "AFC North",
  "AFC South",
  "AFC West",
  "NFC East",
  "NFC North",
  "NFC South",
  "NFC West",
];

// Map team name -> division
// Make sure these match the team names coming from your API
const NFL_TEAM_TO_DIVISION = {
  // AFC East
  "Buffalo Bills": "AFC East",
  "Miami Dolphins": "AFC East",
  "New England Patriots": "AFC East",
  "New York Jets": "AFC East",

  // AFC North
  "Baltimore Ravens": "AFC North",
  "Cincinnati Bengals": "AFC North",
  "Cleveland Browns": "AFC North",
  "Pittsburgh Steelers": "AFC North",

  // AFC South
  "Houston Texans": "AFC South",
  "Indianapolis Colts": "AFC South",
  "Jacksonville Jaguars": "AFC South",
  "Tennessee Titans": "AFC South",

  // AFC West
  "Denver Broncos": "AFC West",
  "Kansas City Chiefs": "AFC West",
  "Las Vegas Raiders": "AFC West",
  "Los Angeles Chargers": "AFC West",

  // NFC East
  "Dallas Cowboys": "NFC East",
  "New York Giants": "NFC East",
  "Philadelphia Eagles": "NFC East",
  "Washington Commanders": "NFC East",

  // NFC North
  "Chicago Bears": "NFC North",
  "Detroit Lions": "NFC North",
  "Green Bay Packers": "NFC North",
  "Minnesota Vikings": "NFC North",

  // NFC South
  "Atlanta Falcons": "NFC South",
  "Carolina Panthers": "NFC South",
  "New Orleans Saints": "NFC South",
  "Tampa Bay Buccaneers": "NFC South",

  // NFC West
  "Arizona Cardinals": "NFC West",
  "Los Angeles Rams": "NFC West",
  "San Francisco 49ers": "NFC West",
  "Seattle Seahawks": "NFC West",
};

export default function NFLOddsTable({ filters = {}, onTeamsReady }) {
  const API = process.env.REACT_APP_API_BASE || "http://localhost:8000";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // NEW: division filter local state
  const [division, setDivision] = useState("All");

  const load = useCallback(() => {
    setLoading(true);
    setErr("");
    fetch(`${API}/odds?upcoming=true`)
      .then((r) => {
        if (!r.ok) throw new Error(`GET /odds ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setRows(arr);
        const teams = Array.from(
          new Set(arr.flatMap((m) => [m.team1, m.team2]).filter(Boolean))
        ).sort();
        if (typeof onTeamsReady === "function") onTeamsReady(teams);
      })
      .catch((e) => setErr(e.message || "Request failed"))
      .finally(() => setLoading(false));
  }, [API, onTeamsReady]);

  const refreshFromBook = useCallback(() => {
    setLoading(true);
    setErr("");
    fetch(`${API}/update-odds/`, { method: "POST" })
      .then((r) => {
        if (!r.ok)
          return r.json().then((j) => {
            throw new Error(j.detail || `POST /update-odds ${r.status}`);
          });
        return null;
      })
      .then(() => load())
      .catch((e) => {
        setErr(e.message || "Update failed");
        setLoading(false);
      });
  }, [API, load]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = (filters.query || "").toLowerCase();
    const team = (filters.team || "").toLowerCase();

    return rows.filter((m) => {
      const t1Name = String(m.team1 || "");
      const t2Name = String(m.team2 || "");
      const t1 = t1Name.toLowerCase();
      const t2 = t2Name.toLowerCase();

      // Filter by selected team (from dropdown)
      if (team) {
        if (t1 !== team && t2 !== team) return false;
      }

      // Filter by search query
      if (q) {
        const hay = `${m.team1} ${m.team2} ${m.sports_books}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Filter by division (local state)
      if (division !== "All") {
        const d1 = NFL_TEAM_TO_DIVISION[t1Name];
        const d2 = NFL_TEAM_TO_DIVISION[t2Name];
        // Keep matchup only if at least one team is in the selected division
        if (d1 !== division && d2 !== division) return false;
      }

      return true;
    });
  }, [rows, filters.query, filters.team, division]);

  return (
    <div style={{ marginTop: 12, overflowX: "auto" }}>
      {/* Controls row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <button onClick={load}>Reload</button>
        <button onClick={refreshFromBook}>Refresh from sportsbook</button>
        {!err ? null : (
          <span style={{ color: "crimson", marginLeft: 8 }}>Error: {err}</span>
        )}
      </div>

      {/* Division filter pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, opacity: 0.7 }}>Division:</span>
        <button
          onClick={() => setDivision("All")}
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            border: "1px solid #444",
            background: division === "All" ? "#222" : "transparent",
            color: division === "All" ? "#fff" : "#ddd",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          All
        </button>
        {NFL_DIVISIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDivision(d)}
            style={{
              padding: "4px 8px",
              borderRadius: 999,
              border: "1px solid #444",
              background: division === d ? "#222" : "transparent",
              color: division === d ? "#fff" : "#ddd",
              fontSize: 12,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <table cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Team 1</th>
            <th>Div (T1)</th>
            <th>Team 2</th>
            <th>Div (T2)</th>
            <th>Sportsbook</th>
            <th>Odds (Team 1)</th>
            <th>Odds (Team 2)</th>
            <th>Date (CT)</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={8}>Loading…</td>
            </tr>
          )}
          {!loading && !err && filtered.length === 0 && (
            <tr>
              <td colSpan={8}>No matchups found.</td>
            </tr>
          )}
          {!loading &&
            !err &&
            filtered.map((m) => {
              const t1Name = String(m.team1 || "");
              const t2Name = String(m.team2 || "");
              const t1 = toAmericanOdds(parseFloat(m.odds_team1));
              const t2 = toAmericanOdds(parseFloat(m.odds_team2));
              const when = new Date(`${m.match_date}Z`).toLocaleString(
                "en-US",
                {
                  timeZone: "America/Chicago",
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }
              );
              const div1 = NFL_TEAM_TO_DIVISION[t1Name] || "-";
              const div2 = NFL_TEAM_TO_DIVISION[t2Name] || "-";

              return (
                <tr key={`${m.match_id}-${m.sports_books}`}>
                  <td>{t1Name}</td>
                  <td>{div1}</td>
                  <td>{t2Name}</td>
                  <td>{div2}</td>
                  <td>{m.sports_books}</td>
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
