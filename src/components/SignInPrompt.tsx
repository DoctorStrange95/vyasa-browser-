"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Persistence ───────────────────────────────────────────────────────────────
const LS_KEY = "hfi_conv_v2";

interface ConvState {
  count:          number;   // shows today
  lastDate:       string;   // YYYY-MM-DD
  lastShown:      number;   // ms
  dismissCount:   number;   // lifetime
  lastDismissed:  number;   // ms
}

function loadState(): ConvState {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const s = JSON.parse(raw) as ConvState;
      // Reset daily counter on new day but keep lifetime dismissals
      if (s.lastDate !== today) return { count: 0, lastDate: today, lastShown: 0, dismissCount: s.dismissCount, lastDismissed: s.lastDismissed };
      return s;
    }
  } catch { /* ignore */ }
  return { count: 0, lastDate: today, lastShown: 0, dismissCount: 0, lastDismissed: 0 };
}

function saveState(s: ConvState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// Cooldown after each dismissal: 3 min → 8 min → 20 min → done for today
function cooldownMs(dismissCount: number): number {
  if (dismissCount <= 0) return 3 * 60_000;
  if (dismissCount === 1) return 8 * 60_000;
  return 20 * 60_000;
}

const MAX_DAILY = 4;   // never show more than 4 times per day
const SESSION_PV_KEY = "hfi_pv_count"; // session page-view counter

// ── Context-aware prompt copy ─────────────────────────────────────────────────
type PromptContext = "default" | "pin" | "locker" | "alerts" | "explore" | "state" | "hospital";

interface PromptCopy {
  icon:      string;
  tag:       string;
  headline:  string;
  sub:       string;
  cta:       string;
  showStats: boolean;
}

function getCopy(pathname: string, ctx: PromptContext, wave: number): PromptCopy {
  if (ctx === "pin") return {
    icon: "📌", tag: "Save your progress",
    headline: "Sign up to keep pinned states",
    sub: "Your pinned states sync across every device — free, no spam.",
    cta: "Sign Up & Pin →", showStats: false,
  };
  if (ctx === "locker") return {
    icon: "🔒", tag: "Health Locker",
    headline: "Your personal health record",
    sub: "Store OPD numbers, prescriptions and hospital visits — private and encrypted.",
    cta: "Create Free Account →", showStats: false,
  };
  if (ctx === "alerts") return {
    icon: "🔔", tag: "Push alerts",
    headline: "Get outbreak alerts on your phone",
    sub: "Be the first to know when your district reports a disease cluster.",
    cta: "Sign Up for Alerts →", showStats: false,
  };
  if (ctx === "hospital") return {
    icon: "🏥", tag: "Find Nearby",
    headline: "Save hospitals to your locker",
    sub: "Store OPD numbers and Ayushman registration details across devices.",
    cta: "Sign Up Free →", showStats: false,
  };

  // Page-contextual defaults
  if (pathname === "/dashboard") return {
    icon: "📊", tag: "Your dashboard",
    headline: "Make it yours — sign up free",
    sub: "Pin states, track IMR trends, and get weekly IDSP disease summaries for your district.",
    cta: "Sign Up Free →", showStats: wave === 0,
  };
  if (pathname.startsWith("/citizens")) return {
    icon: "🏥", tag: "Citizens Health",
    headline: "Access your health locker",
    sub: "OPD numbers, Ayushman cards, facility maps — all in one place, across every device.",
    cta: "Sign Up Free →", showStats: false,
  };
  if (ctx === "explore" || wave >= 2) return {
    icon: "🗺️", tag: "You've been exploring",
    headline: "Track what matters to your state",
    sub: "Sign up to get personalised outbreak alerts, IMR rankings and hospital coverage.",
    cta: "Sign Up Free →", showStats: false,
  };
  if (ctx === "state") return {
    icon: "📡", tag: "Live state data",
    headline: "Get alerts for your state",
    sub: "Receive push notifications when your district reports a new outbreak or health alert.",
    cta: "Sign Up for Alerts →", showStats: false,
  };

  // Generic first impression
  return {
    icon: "🩺", tag: "Live Health Data",
    headline: "Know your state's health — free",
    sub: "Personalised IMR trends, disease alerts, nearest hospitals and Ayushman coverage for your district.",
    cta: "Sign Up Free →", showStats: true,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignInPrompt({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const [visible,  setVisible]  = useState(false);
  const [ctx,      setCtx]      = useState<PromptContext>("default");
  const stateRef               = useRef<ConvState | null>(null);

  const blocked = isLoggedIn
    || pathname.startsWith("/admin")
    || pathname.startsWith("/auth");

  // ── Show logic ──────────────────────────────────────────────────────────────
  const tryShow = useCallback((context: PromptContext = "default") => {
    if (blocked) return;
    if (visible) return;

    const s = stateRef.current ?? loadState();
    stateRef.current = s;

    if (s.count >= MAX_DAILY) return;

    const now = Date.now();
    const cd  = cooldownMs(s.dismissCount);
    if (s.lastDismissed > 0 && now - s.lastDismissed < cd) return;
    // Also enforce minimum gap between shows (45s)
    if (s.lastShown > 0 && now - s.lastShown < 45_000) return;

    setCtx(context);
    setVisible(true);
    const next = { ...s, count: s.count + 1, lastShown: now };
    stateRef.current = next;
    saveState(next);
  }, [blocked, visible]);

  // ── Dismiss ─────────────────────────────────────────────────────────────────
  function dismiss() {
    setVisible(false);
    const s = stateRef.current ?? loadState();
    const next = { ...s, dismissCount: s.dismissCount + 1, lastDismissed: Date.now() };
    stateRef.current = next;
    saveState(next);
  }

  // ── Triggers ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (blocked) return;

    // Page-view counter (session)
    const pv = Number(sessionStorage.getItem(SESSION_PV_KEY) ?? "0") + 1;
    sessionStorage.setItem(SESSION_PV_KEY, String(pv));

    // Trigger 1: initial 4s delay on first page
    let t1: ReturnType<typeof setTimeout>;
    if (pv === 1) {
      t1 = setTimeout(() => tryShow("default"), 4000);
    }

    // Trigger 2: 3rd unique page visited → "explore" context
    if (pv === 3) {
      t1 = setTimeout(() => tryShow("explore"), 1500);
    }

    // Trigger 3: 90s on site → state-contextual nudge
    const isStatePage = /^\/[a-z-]+$/.test(pathname) && pathname !== "/" && pathname !== "/citizens";
    const t2 = setTimeout(
      () => tryShow(isStatePage ? "state" : "default"),
      90_000
    );

    // Trigger 4: scroll depth 70% on state/district pages
    let scrollFired = false;
    function onScroll() {
      if (scrollFired) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total    = document.documentElement.scrollHeight;
      if (total > 800 && scrolled / total >= 0.7) {
        scrollFired = true;
        tryShow(isStatePage ? "state" : "explore");
      }
    }
    if (isStatePage) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname, blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger 5: action-blocked events from anywhere in the app
  useEffect(() => {
    if (blocked) return;
    function onAction(e: Event) {
      const detail = (e as CustomEvent<{ context?: PromptContext }>).detail;
      tryShow(detail?.context ?? "default");
    }
    window.addEventListener("hfi:auth-prompt", onAction);
    return () => window.removeEventListener("hfi:auth-prompt", onAction);
  }, [blocked, tryShow]);

  if (!visible) return null;

  const s    = stateRef.current ?? loadState();
  const wave = s.dismissCount;
  const copy = getCopy(pathname, ctx, wave);

  // Derive context-aware redirect destination for auth links
  function authHref(mode?: string): string {
    let next = "/profile";
    if (ctx === "locker")   next = "/citizens?tab=locker";
    else if (ctx === "pin") next = "/dashboard";
    else if (ctx === "alerts" || ctx === "hospital") next = pathname;
    else if (pathname !== "/" && pathname !== "/auth") next = pathname;
    const params = new URLSearchParams({ next });
    if (mode) params.set("mode", mode);
    return `/auth?${params.toString()}`;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 800,
          backgroundColor: "#00000068",
          backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
          animation: "cp-fade 0.25s ease",
        }}
      />

      {/* Card */}
      <div
        role="dialog" aria-modal="true" aria-label="Sign up prompt"
        style={{
          position: "fixed",
          bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",   // above mobile nav
          left: "50%", transform: "translateX(-50%)",
          zIndex: 801,
          width: "min(440px, calc(100vw - 1.5rem))",
          backgroundColor: "#0a1628",
          border: "1px solid #1e3a5f",
          borderTop: "2px solid #0d9488",
          borderRadius: "18px",
          padding: "1.5rem 1.5rem 1.35rem",
          boxShadow: "0 32px 80px #000a, 0 0 0 1px #0d948818",
          animation: "cp-up 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Close */}
        <button onClick={dismiss} aria-label="Close"
          style={{ position: "absolute", top: "0.85rem", right: "0.85rem", background: "none", border: "none", color: "#334155", fontSize: "1rem", cursor: "pointer", padding: "0.25rem", lineHeight: 1 }}>
          ✕
        </button>

        {/* Tag row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
          <span style={{
            display: "inline-block", width: 7, height: 7, borderRadius: "50%",
            backgroundColor: "#2dd4bf", boxShadow: "0 0 0 4px #2dd4bf18",
            animation: "cp-pulse 2s ease-in-out infinite", flexShrink: 0,
          }} />
          <span style={{ fontSize: "0.65rem", color: "#2dd4bf", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {copy.tag}
          </span>
        </div>

        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.4rem", lineHeight: 1.3 }}>
          {copy.icon} {copy.headline}
        </div>
        <div style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6, marginBottom: copy.showStats ? "1rem" : "1.25rem" }}>
          {copy.sub}
        </div>

        {copy.showStats && (
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", backgroundColor: "#0f2040", borderRadius: "10px", padding: "0.65rem 0.85rem" }}>
            {[{ v: "36",  l: "States" }, { v: "700+", l: "Districts" }, { v: "Live", l: "IDSP" }].map(s => (
              <div key={s.l} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#2dd4bf" }}>{s.v}</div>
                <div style={{ fontSize: "0.58rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href={authHref()} onClick={dismiss}
            style={{
              flex: 1, textAlign: "center", backgroundColor: "#0d9488", color: "#fff",
              padding: "0.72rem 1rem", borderRadius: "10px", textDecoration: "none",
              fontSize: "0.88rem", fontWeight: 700,
            }}>
            {copy.cta}
          </Link>
          <Link href={authHref("login")} onClick={dismiss}
            style={{ fontSize: "0.78rem", color: "#475569", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            Sign in
          </Link>
        </div>

        <style>{`
          @keyframes cp-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes cp-up {
            from { opacity:0; transform:translateX(-50%) translateY(20px) scale(0.97); }
            to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
          }
          @keyframes cp-pulse {
            0%,100% { box-shadow: 0 0 0 4px #2dd4bf18; }
            50%      { box-shadow: 0 0 0 8px #2dd4bf08; }
          }
        `}</style>
      </div>
    </>
  );
}
