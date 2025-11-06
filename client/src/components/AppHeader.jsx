import React, { useEffect, useState } from "react";
import { me, logout, getToken } from "../api";
import { Link, useNavigate } from "react-router-dom";

 function AppHeader() {
  const [user, setUser] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <header
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(6px)",
      }}
    >
      <h2 style={{ fontWeight: 600, cursor: "pointer" }} onClick={() => nav("/")}>
        Sports Betting
      </h2>

      <div style={{ display: "flex", gap: "10px" }}>
        {user ? (
          <>
            <span style={{ color: "#374151" }}>Hi, {user.name}</span>
            <button
              onClick={logout}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                background: "#4f46e5",
                color: "white",
                borderRadius: 6,
                padding: "6px 10px",
                textDecoration: "none",
              }}
            >
              Login
            </Link>
            <Link
              to="/signup"
              style={{
                background: "#10b981",
                color: "white",
                borderRadius: 6,
                padding: "6px 10px",
                textDecoration: "none",
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
} export default AppHeader;
