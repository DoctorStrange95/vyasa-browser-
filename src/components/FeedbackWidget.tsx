"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import states from "@/data/states.json";

const LS_KEY      = "hfi_fb_v1";
const COOLDOWN_MS = 3 * 24 * 60 * 60_000; // 3 days between prompts
const SESSION_KEY = "hfi_fb_session";
const PV_KEY      = "hfi_pv_count";
const TRIGGER_PVS = 3;   // show after 3rd page view
const TRIGGER_MS  = 45_000; // or after 45 seconds

interface UserInfo { name: string; email: string; }
interface Props { user?: UserInfo | null; }

function shouldShow(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return true;
    const { lastShown } = JSON.parse(raw) as { lastShown: number };
    return Date.now() - lastShown > COOLDOWN_MS;
  } catch { return true; }
}

function markShown() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ lastShown: Date.now() })); } catch { /* */ }
}
function markDismissed() {
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* */ }
}

export default function FeedbackWidget({ user }: Props) {
  const pathname = usePathname();

  const [phase,   setPhase]   = useState<"hidden" | "chip" | "open" | "done">("hidden");
  const [stars,   setStars]   = useState(0);
  const [hover,   setHover]   = useState(0);
  const [msg,     setMsg]     = useState("");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [gender,  setGender]  = useState("");
  const [state,   setState]   = useState("");
  const [busy,    setBusy]    = useState(false);
  const triggered = useRef(false);

  const blocked = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  // Increment page-view counter on every navigation
  useEffect(() => {
    if (blocked) return;
    try {
      const pv = Number(sessionStorage.getItem(PV_KEY) ?? "0") + 1;
      sessionStorage.setItem(PV_KEY, String(pv));
    } catch { /* */ }
  }, [pathname, blocked]);

  // Trigger logic
  useEffect(() => {
    if (blocked || triggered.current || !shouldShow()) return;

    function fire() {
      if (triggered.current) return;
      triggered.current = true;
      markShown();
      setTimeout(() => setPhase("chip"), 600);
    }

    // Check current page-view count
    const pv = Number(sessionStorage.getItem(PV_KEY) ?? "0");
    if (pv >= TRIGGER_PVS) {
      // Already hit threshold — fire after short delay
      const t = setTimeout(fire, 1500);
      return () => clearTimeout(t);
    }

    // Otherwise wait TRIGGER_MS
    const t = setTimeout(fire, TRIGGER_MS);
    return () => clearTimeout(t);
  }, [pathname, blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss() { markDismissed(); setPhase("hidden"); }

  async function submit() {
    if (!stars) return;
    setBusy(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode:           "feedback",
          type:           "general",
          rating:         stars,
          message:        msg || null,
          page:           pathname,
          submitterName:  user?.name  ?? (name  || null),
          submitterEmail: user?.email ?? (email || null),
          gender:         gender || null,
          state:          state  || null,
        }),
      });
      setPhase("done");
      setTimeout(dismiss, 2500);
    } finally { setBusy(false); }
  }

  if (phase === "hidden") return null;

  const inp: React.CSSProperties = {
    width: "100%", backgroundColor: "#060e1c", border: "1px solid #1e3a5f",
    borderRadius: "7px", color: "#e2e8f0", padding: "0.45rem 0.65rem",
    fontSize: "0.8rem", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };
  const focus = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget as HTMLElement & { style: CSSStyleDeclaration }).style.borderColor = "#0d9488";
  const blur  = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget as HTMLElement & { style: CSSStyleDeclaration }).style.borderColor = "#1e3a5f";

  return (
    <div style={{
      position: "fixed",
      bottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 0.75rem)",
      right: "1rem",
      zIndex: 790,
      maxWidth: phase === "chip" ? "auto" : "300px",
      width:    phase === "chip" ? "auto" : "min(300px, calc(100vw - 2rem))",
    }}>

      {/* ── Chip ───────────────────────────────────────────────────────── */}
      {phase === "chip" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => setPhase("open")} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            backgroundColor: "#0a1628", border: "1px solid #1e3a5f",
            borderRadius: "999px", padding: "0.5rem 0.9rem",
            color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 16px #0006",
            animation: "fw-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <span>⭐</span>
            <span>How&apos;s your experience?</span>
          </button>
          <button onClick={dismiss} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: "0.9rem", padding: "0.25rem" }}>✕</button>
        </div>
      )}

      {/* ── Expanded form ──────────────────────────────────────────────── */}
      {phase === "open" && (
        <div style={{
          backgroundColor: "#0a1628", border: "1px solid #1e3a5f",
          borderTop: "2px solid #0d9488", borderRadius: "14px",
          padding: "1.1rem", boxShadow: "0 16px 48px #0008",
          animation: "fw-pop 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e2e8f0" }}>Rate your experience</span>
            <button onClick={dismiss} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}>✕</button>
          </div>

          {/* Stars */}
          <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.75rem", justifyContent: "center" }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setStars(n)}
                onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                style={{
                  fontSize: "1.6rem", background: "none", border: "none",
                  cursor: "pointer", padding: "0.1rem",
                  filter: n <= (hover || stars) ? "none" : "grayscale(1) opacity(0.35)",
                  transform: n <= (hover || stars) ? "scale(1.15)" : "scale(1)",
                  transition: "transform 0.1s, filter 0.1s",
                }}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >⭐</button>
            ))}
          </div>

          {/* Comment */}
          <textarea value={msg} onChange={e => setMsg(e.target.value)}
            placeholder="Tell us more… (optional)" rows={2}
            style={{ ...inp, resize: "vertical", marginBottom: "0.55rem" }}
            onFocus={focus} onBlur={blur}
          />

          {/* Guest fields: name, email, gender, state */}
          {!user && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.6rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <input style={inp} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} onFocus={focus} onBlur={blur} />
                <input style={inp} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <select style={{ ...inp, cursor: "pointer" }} value={gender} onChange={e => setGender(e.target.value)} onFocus={focus} onBlur={blur}>
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not">Prefer not to say</option>
                </select>
                <select style={{ ...inp, cursor: "pointer" }} value={state} onChange={e => setState(e.target.value)} onFocus={focus} onBlur={blur}>
                  <option value="">Your State</option>
                  {(states as { slug: string; name: string }[]).map(s => (
                    <option key={s.slug} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button onClick={submit} disabled={busy || !stars} style={{
            width: "100%", backgroundColor: stars ? "#0d9488" : "#0a1f38",
            color: stars ? "#fff" : "#334155", border: "none",
            borderRadius: "8px", padding: "0.55rem", fontSize: "0.85rem",
            fontWeight: 700, cursor: stars && !busy ? "pointer" : "not-allowed",
            fontFamily: "inherit", transition: "background 0.15s",
          }}>
            {busy ? "Sending…" : "Submit Feedback"}
          </button>
        </div>
      )}

      {/* ── Done ───────────────────────────────────────────────────────── */}
      {phase === "done" && (
        <div style={{
          backgroundColor: "#0a1628", border: "1px solid #1e3a5f",
          borderRadius: "14px", padding: "1rem 1.25rem",
          textAlign: "center", boxShadow: "0 16px 48px #0008",
          animation: "fw-pop 0.25s ease",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>🙏</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#4ade80" }}>Thank you!</div>
          <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.2rem" }}>Your feedback helps improve HealthForIndia.</div>
        </div>
      )}

      <style>{`
        @keyframes fw-pop {
          from { opacity:0; transform:scale(0.9) translateY(8px); }
          to   { opacity:1; transform:scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
}
