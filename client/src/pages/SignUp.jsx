import React, { useState } from "react";
import { signup } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await signup({ name, email, password });
      setMsg("Account created! Redirecting...");
      setTimeout(() => nav("/login"), 1000);
    } catch {
      setErr("Signup failed (email may exist).");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#ede9fe,#fafafa,#e0f2fe)" }}>
      <div style={{ width: 360, background: "white", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Sign up</h1>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <input type="text" placeholder="Full name" value={name} onChange={(e)=>setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <button type="submit" style={{ background: "#059669", color: "white", border: "none", padding: "10px", borderRadius: 8 }}>Sign up</button>
          {msg && <div style={{ color: "green" }}>{msg}</div>}
          {err && <div style={{ color: "red" }}>{err}</div>}
        </form>
        <p style={{ marginTop: 10 }}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
