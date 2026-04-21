"use client";
import { useState, useEffect } from "react";
import FacilityFinder from "./FacilityFinder";

export default function FacilityDrawer() {
  const [open,  setOpen]  = useState(false);
  const [pulse, setPulse] = useState(false);

  /* Pulse once after 3 s to draw attention on first visit */
  useEffect(() => {
    const t = setTimeout(() => setPulse(true),  3000);
    const t2 = setTimeout(() => setPulse(false), 6000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  /* Close on Escape, open on custom event from homepage button */
  useEffect(() => {
    const kh = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const ch = () => setOpen(true);
    window.addEventListener("keydown", kh);
    window.addEventListener("open-facility-drawer", ch);
    /* Wire up the static button if it exists */
    const btn = document.getElementById("open-facility-drawer");
    if (btn) btn.addEventListener("click", ch);
    return () => {
      window.removeEventListener("keydown", kh);
      window.removeEventListener("open-facility-drawer", ch);
      if (btn) btn.removeEventListener("click", ch);
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "#00000070", zIndex: 998, backdropFilter: "blur(2px)" }}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: "fixed",
        right: open ? 0 : "-420px",
        top: 0, bottom: 0,
        width: "400px",
        maxWidth: "95vw",
        backgroundColor: "#06111f",
        borderLeft: "1px solid #1e3a5f",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        transition: "right 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: open ? "-8px 0 32px #00000080" : "none",
      }}>
        {/* Drawer header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid #1e3a5f", backgroundColor: "#0a1628", flexShrink: 0 }}>
          <span style={{ fontSize: "1.2rem" }}>🏥</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>Find Nearby Health Facilities</div>
            <div style={{ fontSize: "0.65rem", color: "#475569" }}>Hospital · Doctor · Pharmacy · Lab · Blood Bank · Ambulance · Anganwadi</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: "none", border: "1px solid #1e3a5f", color: "#64748b", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            aria-label="Close"
          >✕</button>
        </div>

        {/* Emergency quick-dial bar */}
        <div style={{ display: "flex", gap: "0.4rem", padding: "0.6rem 1rem", backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", flexShrink: 0 }}>
          {[
            { label: "Ambulance",  num: "108", color: "#ef4444" },
            { label: "Police",     num: "100", color: "#3b82f6" },
            { label: "Women Help", num: "1091", color: "#a855f7" },
            { label: "NDMA",       num: "1078", color: "#f97316" },
          ].map(e => (
            <a key={e.num} href={`tel:${e.num}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem", backgroundColor: `${e.color}15`, border: `1px solid ${e.color}40`, borderRadius: "7px", padding: "0.4rem 0.3rem", textDecoration: "none" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: e.color, fontFamily: "monospace" }}>{e.num}</span>
              <span style={{ fontSize: "0.55rem", color: "#475569", textAlign: "center", lineHeight: 1.2 }}>{e.label}</span>
            </a>
          ))}
        </div>

        {/* Finder content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.9rem 1rem" }}>
          <FacilityFinder />
        </div>
      </div>

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Find nearby health facilities"
        style={{
          position: "fixed",
          right: open ? "408px" : "0",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 999,
          backgroundColor: "#0d9488",
          color: "#fff",
          border: "none",
          borderRadius: "10px 0 0 10px",
          padding: "1rem 0.5rem",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          lineHeight: 1.3,
          boxShadow: "-4px 0 16px #0d948840",
          transition: "right 0.3s cubic-bezier(0.4,0,0.2,1)",
          outline: pulse ? "2px solid #2dd4bf" : "none",
          outlineOffset: "2px",
          animation: pulse ? "tab-pulse 1s ease-in-out 3" : "none",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        <span style={{ fontSize: "1.1rem", writingMode: "horizontal-tb" }}>🏥</span>
        <span>FIND NEARBY</span>
      </button>

      <style>{`
        @keyframes tab-pulse {
          0%, 100% { background-color: #0d9488; box-shadow: -4px 0 16px #0d948840; }
          50%       { background-color: #0f766e; box-shadow: -4px 0 24px #0d948880; }
        }
        @media (max-width: 640px) {
          /* On mobile, drawer comes from bottom */
        }
      `}</style>
    </>
  );
}
