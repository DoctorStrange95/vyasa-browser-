"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import states from "@/data/states.json";

type Mode = "login" | "register";

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

export default function AuthForm({ redirectTo = "/profile", initialMode = "register" }: { redirectTo?: string; initialMode?: Mode }) {
  const router = useRouter();
  const [mode,         setMode]        = useState<Mode>(initialMode);
  const [name,         setName]        = useState("");
  const [age,          setAge]         = useState("");
  const [email,        setEmail]       = useState("");
  const [phone,        setPhone]       = useState("");
  const [identifier,   setIdentifier]  = useState("");
  const [place,        setPlace]       = useState("");
  const [password,     setPassword]    = useState("");
  const [showPw,       setShowPw]      = useState(false);
  const [status,       setStatus]      = useState<"idle"|"loading"|"error"|"done">("idle");
  const [errMsg,       setErrMsg]      = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google redirect result on mount (fired after signInWithRedirect returns)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getRedirectResult } = await import("firebase/auth");
        const { clientAuth } = await import("@/lib/firebaseClient");
        const result = await getRedirectResult(clientAuth);
        if (!result || cancelled) return;
        setGoogleLoading(true);
        const idToken = await result.user.getIdToken();
        const res  = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        const data = await res.json();
        if (!res.ok) { setErrMsg(data.error ?? "Google sign-in failed."); setGoogleLoading(false); return; }
        router.push(redirectTo);
        router.refresh();
      } catch { /* no redirect in progress — normal */ }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setErrMsg("");
    try {
      const { signInWithRedirect, GoogleAuthProvider } = await import("firebase/auth");
      const { clientAuth } = await import("@/lib/firebaseClient");
      await signInWithRedirect(clientAuth, new GoogleAuthProvider());
      // Page navigates away — result handled in the useEffect above on return
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      if (code === "auth/unauthorized-domain") {
        setErrMsg("This domain is not authorised in Firebase. Ask admin to add it under Authentication → Settings → Authorized domains.");
      } else {
        setErrMsg((e instanceof Error ? e.message : String(e)) || "Google sign-in failed. Please try again.");
      }
      setGoogleLoading(false);
    }
  }

  const base: React.CSSProperties = {
    width: "100%", backgroundColor: "#080f1e", border: "1px solid #1e3a5f",
    borderRadius: "8px", color: "#e2e8f0", fontSize: "0.88rem",
    padding: "0.65rem 0.9rem", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };

  async function submit() {
    setStatus("loading"); setErrMsg("");
    try {
      const body = mode === "login"
        ? { identifier, password }
        : { name, age: Number(age) || null, email, phone, place, password };

      const res  = await fetch(`/api/auth/user/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? "Something went wrong"); setStatus("error"); return; }
      setStatus("done");
      router.push(redirectTo);
      router.refresh();
    } catch {
      setErrMsg("Network error. Please try again."); setStatus("error");
    }
  }

  function switchMode(m: Mode) {
    setMode(m); setErrMsg(""); setStatus("idle"); setIdentifier("");
  }

  return (
    <div style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

      {/* Toggle */}
      <div style={{ display: "flex", backgroundColor: "#050c19", borderRadius: "10px", padding: "3px", marginBottom: "1.75rem", gap: "2px" }}>
        {(["register", "login"] as Mode[]).map(m => (
          <button key={m} onClick={() => switchMode(m)}
            style={{
              flex: 1, padding: "0.55rem", borderRadius: "8px", fontFamily: "inherit",
              fontSize: "0.85rem", fontWeight: mode === m ? 700 : 400, border: "none",
              background: mode === m ? "#0d9488" : "transparent",
              color: mode === m ? "#fff" : "#475569",
              cursor: "pointer", transition: "background 0.2s, color 0.2s",
            }}>
            {m === "login" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* ── Google OAuth button ── */}
      <button
        onClick={signInWithGoogle}
        disabled={googleLoading || status === "loading"}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
          backgroundColor: googleLoading ? "#0f1f3a" : "#131f35",
          border: "1px solid #2d3f5e", borderRadius: "10px", padding: "0.72rem 1rem",
          color: googleLoading ? "#475569" : "#e2e8f0", fontSize: "0.9rem", fontWeight: 600,
          cursor: googleLoading ? "not-allowed" : "pointer", fontFamily: "inherit",
          transition: "background-color 0.15s, border-color 0.15s", marginBottom: "1rem",
        }}
        onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.borderColor = "#4285F4"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#2d3f5e"; }}
      >
        {googleLoading ? (
          <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", fontSize: "1rem" }}>↻</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          </svg>
        )}
        {googleLoading ? "Signing in…" : "Continue with Google"}
      </button>

      {/* ── Divider ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#1e3a5f" }} />
        <span style={{ fontSize: "0.7rem", color: "#334155", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>or</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#1e3a5f" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>

        {mode === "register" && (
          <>
            <div>
              <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.35rem" }}>
                Full Name <span style={{ color: "#0d9488" }}>*</span>
              </label>
              <input style={base} placeholder="e.g. Priya Sharma" value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                onFocus={e => (e.currentTarget.style.borderColor = "#0d9488")}
                onBlur={e => (e.currentTarget.style.borderColor = "#1e3a5f")} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.35rem" }}>Age</label>
                <input style={base} type="number" min="10" max="100" placeholder="e.g. 28"
                  value={age} onChange={e => setAge(e.target.value)}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0d9488")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#1e3a5f")} />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.35rem" }}>Phone</label>
                <input style={base} type="tel" placeholder="+91 98765 43210"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0d9488")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#1e3a5f")} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.35rem" }}>Your State</label>
              <select style={{ ...base, cursor: "pointer" }} value={place} onChange={e => setPlace(e.target.value)}
                onFocus={e => (e.currentTarget.style.borderColor = "#0d9488")}
                onBlur={e => (e.currentTarget.style.borderColor = "#1e3a5f")}>
                <option value="">Select your state…</option>
                {states.map(s => <option key={s.slug} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </>
        )}

        {mode === "login" ? (
          <div>
            <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.35rem" }}>
              Email or Phone <span style={{ color: "#0d9488" }}>*</span>
            </label>
            <input style={base} type="text" placeholder="you@example.com or 98765 43210"
              value={identifier} onChange={e => setIdentifier(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              onFocus={e => (e.currentTarget.style.borderColor = "#0d9488")}
              onBlur={e => (e.currentTarget.style.borderColor = "#1e3a5f")} />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.35rem" }}>
              Email <span style={{ color: "#0d9488" }}>*</span>
            </label>
            <input style={base} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              onFocus={e => (e.currentTarget.style.borderColor = "#0d9488")}
              onBlur={e => (e.currentTarget.style.borderColor = "#1e3a5f")} />
          </div>
        )}

        <div>
          <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.35rem" }}>
            Password <span style={{ color: "#0d9488" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...base, paddingRight: "2.75rem" }}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              onFocus={e => (e.currentTarget.style.borderColor = "#0d9488")}
              onBlur={e => (e.currentTarget.style.borderColor = "#1e3a5f")}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{
                position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#475569", cursor: "pointer",
                padding: "0.15rem", display: "flex", alignItems: "center",
              }}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        {status === "error" && (
          <div style={{ fontSize: "0.8rem", color: "#f87171", backgroundColor: "#ef444412", border: "1px solid #ef444430", borderRadius: "8px", padding: "0.65rem 0.85rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0 }}>⚠</span>
            <span>{errMsg}</span>
          </div>
        )}

        <button
          onClick={submit}
          disabled={status === "loading"}
          style={{
            marginTop: "0.25rem", padding: "0.8rem", borderRadius: "10px",
            fontFamily: "inherit", fontWeight: 700, fontSize: "0.95rem", border: "none",
            backgroundColor: status === "loading" ? "#0a3830" : "#0d9488",
            color: status === "loading" ? "#2dd4bf60" : "#fff",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            transition: "background-color 0.15s",
            letterSpacing: "0.01em",
          }}
        >
          {status === "loading"
            ? "Please wait…"
            : mode === "login"
              ? "Sign In →"
              : "Create Free Account →"}
        </button>

        {mode === "register" && (
          <p style={{ fontSize: "0.72rem", color: "#334155", textAlign: "center", margin: 0 }}>
            Already have an account?{" "}
            <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#0d9488", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", fontWeight: 600, padding: 0 }}>
              Sign In
            </button>
          </p>
        )}
        {mode === "login" && (
          <p style={{ fontSize: "0.72rem", color: "#334155", textAlign: "center", margin: 0 }}>
            New here?{" "}
            <button onClick={() => switchMode("register")} style={{ background: "none", border: "none", color: "#0d9488", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", fontWeight: 600, padding: 0 }}>
              Sign Up free
            </button>
          </p>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
