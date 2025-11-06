import React, { useCallback, useEffect, useMemo, useState } from "react";

function toAmericanOdds(decimalOdds) {
  const d = Number(decimalOdds);
  if (!Number.isFinite(d) || d <= 1) return "-";
  return d >= 2 ? `+${Math.round((d - 1) * 100)}` : `${Math.round(-100 / (d - 1))}`;
}

export default function NFLOddsTable({ filters = {}, onTeamsReady }) {
  const API = process.env.REACT_APP_API_BASE || "http://localhost:8000";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    setLoading(true); setErr("");
    fetch(`${API}/odds?upcoming=true`)
      .then((r) => { if (!r.ok) throw new Error(`GET /odds ${r.status}`); return r.json(); })
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setRows(arr);
        const teams = Array.from(new Set(arr.flatMap(m => [m.team1, m.team2]).filter(Boolean))).sort();
        if (typeof onTeamsReady === "function") onTeamsReady(teams);
      })
      .catch((e) => setErr(e.message || "Request failed"))
      .finally(() => setLoading(false));
  }, [API, onTeamsReady]);

  const refreshFromBook = useCallback(() => {
    setLoading(true); setErr("");
    fetch(`${API}/update-odds/`, { method: "POST" })
      .then((r) => { if (!r.ok) return r.json().then(j => { throw new Error(j.detail || `POST /update-odds ${r.status}`); }); })
      .then(() => load())
      .catch((e) => { setErr(e.message || "Update failed"); setLoading(false); });
  }, [API, load]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = (filters.query || "").toLowerCase();
    const team = (filters.team || "").toLowerCase();
    return rows.filter((m) => {
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
  }, [rows, filters.query, filters.team]);

  return (
    <div style={{ marginTop: 12, overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={load}>Reload</button>
        <button onClick={refreshFromBook}>Refresh from sportsbook</button>
        {!err ? null : <span style={{ color: "crimson" }}>Error: {err}</span>}
      </div>

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
          {loading && <tr><td colSpan={6}>Loading…</td></tr>}
          {!loading && !err && filtered.length === 0 && <tr><td colSpan={6}>No matchups found.</td></tr>}
          {!loading && !err && filtered.map((m) => {
            const t1 = toAmericanOdds(parseFloat(m.odds_team1));
            const t2 = toAmericanOdds(parseFloat(m.odds_team2));
            const when = new Date(`${m.match_date}Z`).toLocaleString("en-US", {
              timeZone: "America/Chicago",
              weekday: "short", month: "short", day: "numeric",
              hour: "numeric", minute: "2-digit", hour12: true,
            });
            return (
              <tr key={`${m.match_id}-${m.sports_books}`}>
                <td>{m.team1}</td>
                <td>{m.team2}</td>
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
