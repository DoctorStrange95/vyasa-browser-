"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import states from "@/data/states.json";

type Mode = "login" | "register";

export default function AuthForm() {
  const router = useRouter();
  const [mode,     setMode]     = useState<Mode>("login");
  const [name,     setName]     = useState("");
  const [age,      setAge]      = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [place,    setPlace]    = useState("");
  const [password, setPassword] = useState("");
  const [status,   setStatus]   = useState<"idle"|"loading"|"error"|"done">("idle");
  const [errMsg,   setErrMsg]   = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", backgroundColor: "#080f1e", border: "1px solid #1e3a5f",
    borderRadius: "8px", color: "#e2e8f0", fontSize: "0.85rem",
    padding: "0.6rem 0.85rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  async function submit() {
    setStatus("loading"); setErrMsg("");
    try {
      const body = mode === "login"
        ? { email, password }
        : { name, age: Number(age) || null, email, phone, place, password };

      const res  = await fetch(`/api/auth/user/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) { setErrMsg(data.error ?? "Something went wrong"); setStatus("error"); return; }
      setStatus("done");
      router.push("/profile");
      router.refresh();
    } catch {
      setErrMsg("Network error. Please try again."); setStatus("error");
    }
  }

  return (
    <div style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "14px", padding: "1.75rem" }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", backgroundColor: "#060d1a", borderRadius: "9px", padding: "3px", marginBottom: "1.5rem" }}>
        {(["login", "register"] as Mode[]).map(m => (
          <button key={m} onClick={() => { setMode(m); setErrMsg(""); setStatus("idle"); }}
            style={{
              flex: 1, padding: "0.5rem", borderRadius: "7px", fontFamily: "inherit",
              fontSize: "0.82rem", fontWeight: mode === m ? 700 : 400, border: "none",
              background: mode === m ? "#0f2040" : "transparent",
              color: mode === m ? "#e2e8f0" : "#475569", cursor: "pointer",
            }}>
            {m === "login" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

        {mode === "register" && (
          <>
            <div>
              <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={inputStyle} placeholder="Dr. Priya Sharma" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>Age</label>
                <input style={inputStyle} type="number" min="10" max="100" placeholder="28" value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>Phone</label>
                <input style={inputStyle} type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>State / Location</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={place} onChange={e => setPlace(e.target.value)}>
                <option value="">Select your state…</option>
                {states.map(s => <option key={s.slug} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </>
        )}

        <div>
          <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>Email <span style={{ color: "#ef4444" }}>*</span></label>
          <input style={inputStyle} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>Password <span style={{ color: "#ef4444" }}>*</span></label>
          <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>

        {status === "error" && (
          <div style={{ fontSize: "0.78rem", color: "#f87171", backgroundColor: "#ef444415", border: "1px solid #ef444430", borderRadius: "7px", padding: "0.6rem 0.75rem" }}>
            ⚠ {errMsg}
          </div>
        )}

        <button
          onClick={submit}
          disabled={status === "loading"}
          style={{
            padding: "0.75rem", borderRadius: "9px", fontFamily: "inherit",
            fontWeight: 700, fontSize: "0.9rem", border: "none",
            backgroundColor: status === "loading" ? "#0a1628" : "#0d9488",
            color: status === "loading" ? "#334155" : "#fff",
            cursor: status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "loading" ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>
      </div>
    </div>
  );
}
