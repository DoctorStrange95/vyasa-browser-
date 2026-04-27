"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "hfi-signin-prompt-seen";

export default function SignInPrompt({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show on admin pages or auth page, or if already logged in
    if (isLoggedIn) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return;

    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (seen) return;

    const t = setTimeout(() => setVisible(true), 2800);
    return () => clearTimeout(t);
  }, [isLoggedIn, pathname]);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 800,
          backgroundColor: "#00000070",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "hfi-fade-in 0.3s ease",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in prompt"
        style={{
          position: "fixed",
          bottom: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 801,
          width: "min(420px, calc(100vw - 2rem))",
          backgroundColor: "#0a1628",
          border: "1px solid #1e3a5f",
          borderRadius: "20px",
          padding: "2rem 1.75rem 1.75rem",
          boxShadow: "0 24px 64px #00000088, 0 0 0 1px #0d948820",
          animation: "hfi-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: "absolute", top: "0.9rem", right: "0.9rem",
            background: "none", border: "none", color: "#475569",
            fontSize: "1.1rem", cursor: "pointer", lineHeight: 1,
            padding: "0.25rem",
          }}
        >✕</button>

        {/* Pulse dot */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            backgroundColor: "#2dd4bf",
            boxShadow: "0 0 0 4px #2dd4bf20",
            animation: "hfi-pulse-dot 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: "0.68rem", color: "#2dd4bf", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Live Health Data
          </span>
        </div>

        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem", lineHeight: 1.3 }}>
          Know your state&rsquo;s health — free
        </div>
        <div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Create a free account to get personalised IMR trends, disease alerts, nearest hospitals and Ayushman coverage for your state and district.
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex", gap: "1rem", marginBottom: "1.5rem",
          backgroundColor: "#0f2040", borderRadius: "10px", padding: "0.75rem 1rem",
        }}>
          {[
            { v: "36", l: "States" },
            { v: "700+", l: "Districts" },
            { v: "Live", l: "IDSP Data" },
          ].map(s => (
            <div key={s.l} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#2dd4bf" }}>{s.v}</div>
              <div style={{ fontSize: "0.6rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link
            href="/auth"
            onClick={dismiss}
            style={{
              flex: 1, display: "block", textAlign: "center",
              backgroundColor: "#0d9488", color: "#fff", padding: "0.75rem 1rem",
              borderRadius: "10px", textDecoration: "none", fontSize: "0.9rem",
              fontWeight: 700, transition: "background 0.15s",
            }}
          >
            Sign Up Free →
          </Link>
          <button
            onClick={dismiss}
            style={{
              flex: "0 0 auto", backgroundColor: "transparent",
              border: "1px solid #1e3a5f", color: "#64748b",
              borderRadius: "10px", padding: "0.75rem 1rem",
              fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Not now
          </button>
        </div>

        <style>{`
          @keyframes hfi-fade-in {
            from { opacity: 0; } to { opacity: 1; }
          }
          @keyframes hfi-slide-up {
            from { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.96); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          @keyframes hfi-pulse-dot {
            0%, 100% { box-shadow: 0 0 0 4px #2dd4bf20; }
            50%       { box-shadow: 0 0 0 8px #2dd4bf10; }
          }
        `}</style>
      </div>
    </>
  );
}
