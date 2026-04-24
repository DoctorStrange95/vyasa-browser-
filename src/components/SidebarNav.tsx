"use client";
import { useState, useEffect } from "react";

const SECTIONS = [
  { id: "sec-hero",        icon: "🏠", label: "Overview" },
  { id: "sec-facilities",  icon: "🏥", label: "Find Facilities" },
  { id: "sec-intel",       icon: "📡", label: "Health Intel" },
  { id: "sec-idsp",        icon: "📊", label: "IDSP Weekly" },
  { id: "sec-leaders",     icon: "🏆", label: "Health Leaders" },
  { id: "sec-states",      icon: "📋", label: "All States" },
  { id: "sec-ncd",         icon: "🫀", label: "NCD Burden" },
  { id: "sec-contribute",  icon: "📎", label: "Contribute" },
  { id: "sec-join",        icon: "🚀", label: "Join Vyasa" },
];

export default function SidebarNav() {
  const [active,   setActive]   = useState<string>("sec-hero");
  const [mobileOpen, setMobile] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { threshold: 0.15, rootMargin: "-5% 0px -60% 0px" }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
    setMobile(false);
  }

  const navItems = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", padding: "0.75rem 0" }}>
      {/* Brand */}
      <div style={{ padding: "0 1rem 0.85rem", borderBottom: "1px solid #1e3a5f", marginBottom: "0.4rem" }}>
        <div style={{ fontSize: "0.55rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
          HealthForIndia
        </div>
        <div style={{ fontSize: "0.6rem", color: "#2dd4bf", fontWeight: 600, marginTop: "0.1rem" }}>
          Navigation
        </div>
      </div>

      {SECTIONS.map(s => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.5rem 1rem",
              background: isActive ? "#0f2040" : "transparent",
              border: "none",
              borderLeft: `3px solid ${isActive ? "#2dd4bf" : "transparent"}`,
              color: isActive ? "#e2e8f0" : "#475569",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              width: "100%",
              transition: "all 0.15s",
              borderRadius: "0 6px 6px 0",
            }}
          >
            <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{s.icon}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap" }}>
              {s.label}
            </span>
            {isActive && (
              <div style={{ marginLeft: "auto", width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#2dd4bf", flexShrink: 0 }} />
            )}
          </button>
        );
      })}

      {/* IDSP data source note */}
      <div style={{ padding: "0.75rem 1rem 0", marginTop: "0.5rem", borderTop: "1px solid #1e3a5f" }}>
        <div style={{ fontSize: "0.58rem", color: "#1e3a5f", lineHeight: 1.5 }}>
          Data: IDSP · NFHS-5 · SRS 2023 · MoHFW · NCDC · WHO
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="sidebar-desktop"
        style={{
          position: "sticky",
          top: "64px",
          height: "calc(100vh - 64px)",
          width: "190px",
          flexShrink: 0,
          overflowY: "auto",
          backgroundColor: "#060d1a",
          borderRight: "1px solid #1e3a5f",
          scrollbarWidth: "none",
        }}
      >
        {navItems}
      </aside>

      {/* Mobile floating toggle */}
      <button
        className="sidebar-mobile-btn"
        onClick={() => setMobile(v => !v)}
        aria-label="Toggle navigation"
        style={{
          position: "fixed",
          bottom: "1.25rem",
          left: "1rem",
          zIndex: 50,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          backgroundColor: "#0d9488",
          border: "none",
          color: "#fff",
          fontSize: "1.1rem",
          cursor: "pointer",
          boxShadow: "0 4px 16px #0d948860",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            display: "flex",
          }}
          onClick={() => setMobile(false)}
        >
          {/* Backdrop */}
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#00000080" }} />
          {/* Panel */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "relative",
              width: "220px",
              backgroundColor: "#060d1a",
              borderRight: "1px solid #1e3a5f",
              overflowY: "auto",
              zIndex: 1,
            }}
          >
            {navItems}
          </div>
        </div>
      )}

      <style>{`
        .sidebar-desktop { display: flex; flex-direction: column; }
        .sidebar-mobile-btn { display: none !important; }
        @media (max-width: 900px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-btn { display: flex !important; }
        }
        /* hide scrollbar */
        .sidebar-desktop::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
