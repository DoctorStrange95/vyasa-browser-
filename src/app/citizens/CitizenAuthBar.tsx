"use client";
import Link from "next/link";

export interface CitizenUser { name: string; email: string; }

interface Props {
  user:         CitizenUser | null | "loading";
  onAuthChange: (u: CitizenUser | null) => void;
}

export default function CitizenAuthBar({ user, onAuthChange }: Props) {
  if (user === "loading") return null;

  const handleLogout = async () => {
    await fetch("/api/auth/user/logout", { method: "POST" });
    onAuthChange(null);
  };

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
            <div style={{ color: "#4ade8066", fontSize: "0.72rem" }}>{user.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          background: "transparent", color: "#64748b", border: "1px solid #1e3a5f",
          borderRadius: "6px", padding: "0.3rem 0.65rem", fontSize: "0.78rem", cursor: "pointer",
        }}>
          Sign out
        </button>
      </div>
    );
  }

  // ── Not logged in — redirect to main /auth page ───────────────────────────
  return (
    <div style={{
      background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px",
      padding: "0.8rem 1.1rem", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem",
    }}>
      <div>
        <div style={{ color: "#93c5fd", fontWeight: 600, fontSize: "0.88rem" }}>
          🔐 Citizen Sign In
        </div>
        <div style={{ color: "#475569", fontSize: "0.78rem", marginTop: "0.15rem" }}>
          See hospital registration numbers · Upload health records · Share with your doctor
        </div>
      </div>
      <Link
        href="/auth?next=/citizens"
        style={{
          background: "#2563eb", color: "#fff", borderRadius: "8px",
          padding: "0.5rem 1.1rem", fontWeight: 600, fontSize: "0.85rem",
          textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        Sign In
      </Link>
    </div>
  );
}
