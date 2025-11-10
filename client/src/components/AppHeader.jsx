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
    try { setUser(await me()); } catch { setUser(null); } finally { setLoading(false); }
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

  const btnBase = {
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 600,
    textDecoration: "none",
    transition: "all .15s ease",
  };

  return (
  <header
    style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxSizing: "border-box",
      background: "#0B0B0B",
      borderBottom: "1px solid #1F2937",
      boxShadow: "0 1px 0 rgba(255,255,255,0.02)",
      padding: "12px 16px",             
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",   
      color: "#E2E8F0",
    }}
  >
    {/* Left: logo + brand */}
    <div
      onClick={() => nav("/")}
      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
    >
      <img
        src="/images/sportsLogo.png"
        alt="WinCurve logo"
        style={{ height: 50, width: 50, objectFit: "contain", borderRadius: 6 }}
      />
      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.3 }}>WinCurve</span>
    </div>

    {/* Right: auth actions*/}
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {loading ? null : user ? (
        <>
          <span style={{ color: "#9CA3AF" }}>
            Hello, <span style={{ color: "#E5E7EB" }}>{user.name}</span>
          </span>
          <button
            onClick={() => {
              logout();
              window.dispatchEvent(new Event("auth-changed"));
              nav("/login");
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              fontWeight: 600,
              background: "#00C896",
              color: "#001C33",
              border: "1px solid #00a881",
              transition: "all .15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              fontWeight: 600,
              color: "#E0F7FA",
              border: "1px solid #2DD4BF",
              textDecoration: "none",
              transition: "all .15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(45,212,191,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Log in
          </Link>
          <Link
            to="/signup"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              fontWeight: 600,
              background: "#00C896",
              color: "#001C33",
              border: "1px solid #00a881",
              textDecoration: "none",
              transition: "all .15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          >
            Sign up
          </Link>
        </>
      )}
    </div>
  </header>
);

}
