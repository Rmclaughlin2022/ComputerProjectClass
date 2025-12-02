const API = "http://127.0.0.1:8000";

export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}
export function getToken() {
  return localStorage.getItem("token");
}
export function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function signup(payload) {
  const res = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();

  return data;
}

export async function login(payload) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();

  // Save token if provided
  const token = data?.access_token || data?.token || data?.jwt;
  if (token) setToken(token);

  window.dispatchEvent(new Event("auth-changed"));
  window.location.replace("/"); // hard refresh so header updates immediately

  return data;
}

export async function me() {
  const res = await fetch(`${API}/auth/me`, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function logout() {
  setToken(null);
  window.dispatchEvent(new Event("auth-changed"));
  window.location.href = "/login";
}
