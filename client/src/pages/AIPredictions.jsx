import React, { useCallback, useEffect, useMemo, useState } from "react";

function toAmericanOdds(decimalOdds) {
  const d = Number(decimalOdds);
  if (!Number.isFinite(d) || d <= 1) return "-";
  return d >= 2
    ? `+${Math.round((d - 1) * 100)}`
    : `${Math.round(-100 / (d - 1))}`;
}

function toPercent(p) {
  if (!Number.isFinite(p)) return "-";
  return `${(p * 100).toFixed(1)}%`;
}

function impliedProbFromDecimal(decimalOdds) {
  const d = Number(decimalOdds);
  if (!Number.isFinite(d) || d <= 1) return NaN;
  return 1 / d;
}

export default function AIPredictions() {
  const API = process.env.REACT_APP_API_BASE || "http://localhost:8000";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [minEdge, setMinEdge] = useState(2); 
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setErr("");
    fetch(`${API}/ai-predictions`)
      .then((r) => {
        if (!r.ok) throw new Error(`GET /ai-predictions ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setRows(arr);
      })
      .catch((e) => setErr(e.message || "Request failed"))
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => {
    load();
  }, [load]);

  const enriched = useMemo(() => {
    const q = query.toLowerCase().trim();

    return rows
      .map((m) => {
        const t1Dec = Number(m.odds_team1);
        const t2Dec = Number(m.odds_team2);
        const p1Model = Number(m.model_prob_team1);
        const p2Model = Number(m.model_prob_team2);

        const p1Book = impliedProbFromDecimal(t1Dec);
        const p2Book = impliedProbFromDecimal(t2Dec);

        // Edge in percentage points: model% - book%
        const edge1 = Number.isFinite(p1Model) && Number.isFinite(p1Book)
          ? (p1Model - p1Book) * 100
          : NaN;
        const edge2 = Number.isFinite(p2Model) && Number.isFinite(p2Book)
          ? (p2Model - p2Book) * 100
          : NaN;

        const bestEdge = Math.max(edge1 || -Infinity, edge2 || -Infinity);

        let valueSide = "-";
        if (Number.isFinite(edge1) || Number.isFinite(edge2)) {
          if (edge1 >= edge2 && edge1 > 0) valueSide = m.team1;
          if (edge2 > edge1 && edge2 > 0) valueSide = m.team2;
        }

        return {
          ...m,
          t1Dec,
          t2Dec,
          t1Money: toAmericanOdds(t1Dec),
          t2Money: toAmericanOdds(t2Dec),
          p1Model,
          p2Model,
          p1Book,
          p2Book,
          edge1,
          edge2,
          bestEdge,
          valueSide,
        };
      })
      .filter((row) => {
        if (q) {
          const hay = `${row.team1} ${row.team2} ${row.sports_books}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (!Number.isFinite(row.bestEdge)) return false;
        if (row.bestEdge < minEdge) return false;
        return true;
      })
      .sort((a, b) => b.bestEdge - a.bestEdge); 
  }, [rows, minEdge, query]);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>AI Value Bets (NFL)</h2>
      <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, opacity: 0.8 }}>
        These are matchups where your model&apos;s win probabilities think a side is
        underpriced by the sportsbook. Higher edge = better expected value.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <button onClick={load}>Reload AI predictions</button>

        <label style={{ fontSize: 13 }}>
          Min edge:
          <select
            value={minEdge}
            onChange={(e) => setMinEdge(Number(e.target.value))}
            style={{ marginLeft: 6 }}
          >
            <option value={0}>0%</option>
            <option value={1}>1%</option>
            <option value={2}>2%</option>
            <option value={3}>3%</option>
            <option value={5}>5%</option>
          </select>
        </label>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13 }}>Search:</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Teams or sportsbook…"
            style={{ padding: "4px 8px", fontSize: 13 }}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Matchup</th>
              <th>Sportsbook</th>
              <th>Odds (T1)</th>
              <th>Odds (T2)</th>
              <th>Model Win% T1</th>
              <th>Model Win% T2</th>
              <th>Book Win% T1</th>
              <th>Book Win% T2</th>
              <th>Edge T1</th>
              <th>Edge T2</th>
              <th>Best Side</th>
              <th>Best Edge</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={12}>Loading…</td>
              </tr>
            )}
            {!loading && err && (
              <tr>
                <td colSpan={12} style={{ color: "crimson" }}>
                  Error: {err}
                </td>
              </tr>
            )}
            {!loading && !err && enriched.length === 0 && (
              <tr>
                <td colSpan={12}>No value bets found with current filters.</td>
              </tr>
            )}
            {!loading &&
              !err &&
              enriched.map((m) => (
                <tr key={`${m.match_id}-${m.sports_books}`}>
                  <td>
                    {m.team1} vs {m.team2}
                  </td>
                  <td>{m.sports_books}</td>
                  <td>{m.t1Money}</td>
                  <td>{m.t2Money}</td>
                  <td>{Number.isFinite(m.p1Model) ? toPercent(m.p1Model) : "-"}</td>
                  <td>{Number.isFinite(m.p2Model) ? toPercent(m.p2Model) : "-"}</td>
                  <td>{Number.isFinite(m.p1Book) ? toPercent(m.p1Book) : "-"}</td>
                  <td>{Number.isFinite(m.p2Book) ? toPercent(m.p2Book) : "-"}</td>
                  <td>
                    {Number.isFinite(m.edge1)
                      ? `${m.edge1.toFixed(1)} pts`
                      : "-"}
                  </td>
                  <td>
                    {Number.isFinite(m.edge2)
                      ? `${m.edge2.toFixed(1)} pts`
                      : "-"}
                  </td>
                  <td>{m.valueSide}</td>
                  <td>
                    {Number.isFinite(m.bestEdge)
                      ? `${m.bestEdge.toFixed(1)} pts`
                      : "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
