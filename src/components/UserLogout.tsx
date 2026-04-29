"use client";

export default function UserLogout() {
  async function logout() {
    await fetch("/api/auth/user/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button onClick={logout} style={{ fontSize: "0.75rem", color: "#475569", background: "none", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.35rem 0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
      Sign out
    </button>
  );
}
