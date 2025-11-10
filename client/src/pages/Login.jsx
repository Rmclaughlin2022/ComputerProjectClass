import React, { useState } from "react";
import { login } from "../api";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login({ email, password }); // api.js handles token + redirect
      // no nav()/setToken() needed
    } catch (e) {
      setErr(e?.message || "Invalid email or password");
      setLoading(false);
    }
  }

  const field = {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    background: "#fff",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box", 
  };
  const label = {
    fontSize: 12,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0B0B0B" }}>
      {/* LEFT: same image panel as signup */}
      <aside
        style={{
          flex: 1,
          minHeight: "100vh",
          backgroundImage: "url('/images/left-panel.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "grid",
            placeItems: "center",
            color: "#F8FAFC",
          }}
        />
      </aside>

      {/* RIGHT: dark background, white card */}
      <main
        style={{
          flex: 1,
          background: "#0B0B0B",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#FFFFFF",
            borderRadius: 16,
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Log in</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B7280" }}>
              Welcome back! enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={label}>Email</label>
              <input
                style={field}
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={label}>Password</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...field, flex: 1 }}
                  type={showPw ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    background: "#F3F4F6",
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#16A34A99" : "#16A34A",
                color: "White",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Logging in…" : "Log in"}
            </button>

            {err && <div style={{ color: "#DC2626", fontSize: 13 }}>{err}</div>}
          </form>

          <div style={{ marginTop: 16, fontSize: 14 }}>
            Don’t have an account?{" "}
            <Link to="/signup" style={{ color: "#111827", fontWeight: 700 }}>
              Sign up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
