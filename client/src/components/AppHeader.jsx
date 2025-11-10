import React, { useEffect, useState } from "react";
import { me, logout, getToken } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function AppHeader() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  async function fetchUser() {
    const token = getToken();
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const u = await me();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
    const onAuthChanged = () => fetchUser();
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, []);

  return (
    <header
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #0b0b0b",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(7, 4, 4, 0.85)",
        backdropFilter: "blur(6px)",
        color: "#E0F7FA",
      }}
    >
      {/* Logo + Title */}
      <div
        onClick={() => nav("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          userSelect: "none",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <img
          src="/images/sportsLogo.png"

          alt="WinCurve logo"
          style={{
            height: 50,
            width: 50,
            objectFit: "contain",
            borderRadius: 6,
            display: "block",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))",
          }}
        />
        <h2 style={{ fontWeight: 700, margin: 0 }}>WinCurve</h2>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {loading ? null : user ? (
          <>
            <span>Hello, {user.name}</span>
            <button
              onClick={() => {
                logout();
                window.dispatchEvent(new Event("auth-changed"));
                nav("/login");
              }}
              style={{
                background: "#00C896",
                color: "#001C33",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                fontWeight: 600,
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
                color: "#E0F7FA",
                textDecoration: "none",
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #2dd4bf",
              }}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              style={{
                background: "#00C896",
                color: "#001C33",
                borderRadius: 8,
                padding: "6px 10px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
