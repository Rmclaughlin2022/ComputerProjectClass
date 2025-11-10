import React, { useMemo, useState } from "react";
import NFLOddsTable from "../pages/NFLOddsTable.jsx";
import "./home.css";

const SPORTS = ["NFL", "NBA", "NHL", "CFB", "CBB", "Soccer", "Tennis"];

export default function Home() {
  const [sport, setSport] = useState("NFL");
  const [team, setTeam] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filters = useMemo(() => ({ sport, team, query }), [sport, team, query]);

  return (
    <div className="ux-page">
      <div className="ux-toolbar">
        <div className="ux-pillrow">
          {SPORTS.map((s) => (
            <button
              key={s}
              className={`ux-pill ${sport === s ? "is-active" : ""}`}
              onClick={() => setSport(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="ux-actions">
          <div className="ux-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
            </svg>
            <input placeholder="Search teams, sportsbooks…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="ux-menu">
            <button className={`ux-btn ${open ? "is-open" : ""}`} onClick={() => setOpen((v) => !v)}>
              {team || "Teams"} <span className="ux-caret" />
            </button>
            {open && (
              <div className="ux-dropdown">
                <TeamOptions onPick={(t) => { setTeam(t); setOpen(false); }} onClear={() => { setTeam(""); setOpen(false); }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ux-card">
        <NFLOddsTable filters={filters} onTeamsReady={window.__setTeamOptions} />
      </div>
    </div>
  );
}

function TeamOptions({ onPick, onClear }) {
  const [teams, setTeams] = useState([]);
  React.useEffect(() => {
    window.__setTeamOptions = (arr) => setTeams(arr || []);
    return () => { delete window.__setTeamOptions; };
  }, []);
  return (
    <div className="ux-dd-list">
      {teams.length === 0 ? <div className="ux-dd-empty">No teams yet</div> :
        teams.map((t) => <button key={t} className="ux-dd-item" onClick={() => onPick(t)}>{t}</button>)}
      <button className="ux-dd-clear" onClick={onClear}>Clear team</button>
    </div>
  );
}
