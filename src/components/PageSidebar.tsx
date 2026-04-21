"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export interface SidebarSection {
  group: string;
  items: { id: string; icon: string; label: string }[];
}

export default function PageSidebar({
  sections, backHref, backLabel,
}: {
  sections: SidebarSection[];
  backHref?: string;
  backLabel?: string;
}) {
  const [active,  setActive]  = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ids = sections.flatMap(s => s.items.map(i => i.id));
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [sections]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setVisible(v => !v)}
        style={{ display: "none", position: "fixed", bottom: "5rem", right: "1rem", zIndex: 200, backgroundColor: "#0d9488", color: "#fff", border: "none", borderRadius: "50%", width: "48px", height: "48px", fontSize: "1.2rem", cursor: "pointer", boxShadow: "0 4px 12px #0d948840" }}
        className="sidebar-fab"
        aria-label="Sections"
      >☰</button>

      {/* Overlay for mobile */}
      {visible && (
        <div onClick={() => setVisible(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "#00000080", zIndex: 149 }}
          className="sidebar-overlay"
        />
      )}

      <aside
        style={{ width: "200px", flexShrink: 0, position: "sticky", top: "80px", alignSelf: "flex-start", maxHeight: "calc(100vh - 100px)", overflowY: "auto", paddingRight: "0.5rem" }}
        className={`page-sidebar${visible ? " sidebar-open" : ""}`}
      >
        {backHref && (
          <div style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #1e3a5f" }}>
            <Link href={backHref} style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#0d9488", textDecoration: "none", fontSize: "0.75rem", fontWeight: 600 }}>
              ← {backLabel ?? "Back"}
            </Link>
          </div>
        )}

        {sections.map(sec => (
          <div key={sec.group} style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem", paddingLeft: "0.5rem" }}>
              {sec.group}
            </div>
            {sec.items.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setVisible(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.4rem 0.6rem", borderRadius: "6px", textDecoration: "none",
                  fontSize: "0.78rem", fontWeight: active === item.id ? 600 : 400,
                  color: active === item.id ? "#e2e8f0" : "#475569",
                  backgroundColor: active === item.id ? "#0f2040" : "transparent",
                  borderLeft: `2px solid ${active === item.id ? "#0d9488" : "transparent"}`,
                  transition: "all 0.15s",
                  marginBottom: "0.1rem",
                }}
              >
                <span style={{ fontSize: "0.85rem" }}>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </aside>

      <style>{`
        .page-sidebar::-webkit-scrollbar { width: 3px; }
        .page-sidebar::-webkit-scrollbar-track { background: transparent; }
        .page-sidebar::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
        @media (max-width: 900px) {
          .page-sidebar {
            position: fixed !important; left: 0; top: 0; bottom: 0; z-index: 150;
            width: 220px !important; max-height: 100vh !important;
            background: #070f1e; border-right: 1px solid #1e3a5f;
            padding: 1.5rem 1rem !important; transform: translateX(-100%);
            transition: transform 0.25s;
          }
          .page-sidebar.sidebar-open { transform: translateX(0); }
          .sidebar-fab { display: flex !important; align-items: center; justify-content: center; }
          .sidebar-overlay { display: block !important; }
        }
      `}</style>
    </>
  );
}
