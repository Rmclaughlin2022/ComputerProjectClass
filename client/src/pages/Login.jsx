import React, { useState } from "react";
import { login, setToken } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await login({ email, password });
      setToken(res.access_token);
      nav("/");
    } catch {
      setErr("Invalid email or password");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#e0f2fe,#fafafa,#ede9fe)" }}>
      <div style={{ width: 360, background: "white", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Login</h1>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <button type="submit" style={{ background: "#4f46e5", color: "white", border: "none", padding: "10px", borderRadius: 8 }}>Login</button>
          {err && <div style={{ color: "red" }}>{err}</div>}
        </form>
        <p style={{ marginTop: 10 }}>Don’t have an account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  );
}
