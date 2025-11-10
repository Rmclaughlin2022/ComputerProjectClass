import React, { useState } from "react";
import { signup } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    setLoading(true);
    try {
      await signup({ name, email, password });
      setMsg("Account created! Redirecting…");
      setTimeout(() => nav("/login"), 900);
    } catch (e) {
      setErr(e?.message || "Signup failed.");
    } finally {
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
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "#0B0B0B"
    }}>
      {/* LEFT PANEL */}
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
  <div style={{
    position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)"
  }} />

  <div style={{
    position: "relative", height: "100%",
    display: "grid", placeItems: "center", color: "#F8FAFC"
  }}>
  </div>
</aside>

      {/* RIGHT PANEL */}
      <main style={{
        flex: 1,
        background: "#020202ff",
        display: "grid",
        placeItems: "center",
        padding: "24px"
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "#FFFFFF",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          padding: 24
        }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Sign up</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B7280" }}>
              Create your account to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid" }}>
              <label style={label}>Full name</label>
              <input
                style={field}
                type="text"
                placeholder="e.g., Ryan McLaughlin"
                value={name}
                onChange={(e)=>setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid" }}>
              <label style={label}>Email</label>
              <input
                style={field}
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid" }}>
              <label style={label}>Password</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...field, flex: 1 }}
                  type={showPw ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  minLength={6}
                  onChange={(e)=>setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={()=>setShowPw(s=>!s)}
                  style={{
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    background: "#F3F4F6",
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              <small style={{ color:"#6B7280", marginTop: 6 }}>
                Use 6+ characters with a mix of letters and numbers.
              </small>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#16A34A99" : "#16A34A",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating…" : "Sign up"}
            </button>

            {msg && <div style={{ color: "#16A34A", fontSize: 13 }}>{msg}</div>}
            {err && <div style={{ color: "#DC2626", fontSize: 13 }}>{err}</div>}
          </form>

          <div style={{
            marginTop: 14,
            fontSize: 12,
            color: "#6B7280",
            lineHeight: 1.5
          }}>
            By continuing, you agree to our <a href="#" style={{ color:"#111827" }}>Terms</a> and <a href="#" style={{ color:"#111827" }}>Privacy Policy</a>.
          </div>

          <div style={{ marginTop: 16, fontSize: 14 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#111827", fontWeight: 700 }}>Log in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
