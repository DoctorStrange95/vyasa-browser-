"use client";
import { useState } from "react";

export interface CitizenUser { name: string; email: string; }

interface Props {
  user:           CitizenUser | null | "loading";
  onAuthChange:   (u: CitizenUser | null) => void;
}

export default function CitizenAuthBar({ user, onAuthChange }: Props) {
  const [open,  setOpen]  = useState(false);
  const [mode,  setMode]  = useState<"login" | "register">("login");
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [err,   setErr]   = useState("");
  const [busy,  setBusy]  = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/user/login" : "/api/auth/user/register";
      const body = mode === "login" ? { email, password: pw } : { name, email, password: pw };
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Authentication failed."); return; }
      onAuthChange({ name: d.name, email: d.email });
      setOpen(false);
    } catch { setErr("Network error."); }
    finally { setBusy(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/user/logout", { method: "POST" });
    onAuthChange(null);
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.5rem 0.75rem", borderRadius: "8px",
    border: "1px solid #1e3a5f", background: "#070f1e", color: "#e2e8f0",
    fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
  };

  if (user === "loading") return null;

  // ── Logged in ──────────────────────────────────────────────────────────────
  if (user) {
    return (
      <div style={{
        background: "#071a10", border: "1px solid #14532d", borderRadius: "10px",
        padding: "0.7rem 1.1rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "1.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "#166534", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: 700, color: "#4ade80", fontSize: "0.9rem",
          }}>
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ color: "#86efac", fontWeight: 600, fontSize: "0.88rem" }}>{user.name}</div>
            <div style={{ color: "#4ade8088", fontSize: "0.72rem" }}>{user.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          background: "transparent", color: "#64748b", border: "1px solid #1e3a5f",
          borderRadius: "6px", padding: "0.3rem 0.65rem", fontSize: "0.78rem", cursor: "pointer",
        }}>Sign out</button>
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      {/* Collapsed banner */}
      {!open && (
        <div style={{
          background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px",
          padding: "0.8rem 1.1rem", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "1rem",
        }}>
          <div>
            <div style={{ color: "#93c5fd", fontWeight: 600, fontSize: "0.88rem" }}>
              🔐 Citizen Sign In
            </div>
            <div style={{ color: "#475569", fontSize: "0.78rem", marginTop: "0.15rem" }}>
              Access hospital registration numbers, upload health records & share with your doctor
            </div>
          </div>
          <button onClick={() => setOpen(true)} style={{
            background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px",
            padding: "0.5rem 1.1rem", fontWeight: 600, fontSize: "0.85rem",
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>Sign In</button>
        </div>
      )}

      {/* Expanded form */}
      {open && (
        <div style={{
          background: "#0d1f3c", border: "1px solid #2563eb44", borderRadius: "12px", padding: "1.25rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 600, color: "#93c5fd", fontSize: "0.95rem" }}>🔐 Citizen Sign In</div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
          </div>

          <div style={{ display: "flex", marginBottom: "1rem", border: "1px solid #1e3a5f", borderRadius: "8px", overflow: "hidden" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "0.45rem", border: "none", fontSize: "0.83rem",
                background: mode === m ? "#1e3a5f" : "transparent",
                color: mode === m ? "#93c5fd" : "#64748b", cursor: "pointer",
              }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth} style={{ display: "grid", gap: "0.65rem" }}>
            {mode === "register" && (
              <input style={inp} required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input style={inp} type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={inp} type="password" required minLength={8} placeholder="Password (min 8 chars)" value={pw} onChange={(e) => setPw(e.target.value)} />
            {err && <p style={{ color: "#f87171", fontSize: "0.8rem", margin: 0 }}>{err}</p>}
            <button type="submit" disabled={busy} style={{
              background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px",
              padding: "0.6rem", fontWeight: 600, fontSize: "0.88rem",
              cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
            }}>
              {busy ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
