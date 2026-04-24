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
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    const ids = sections.flatMap(s => s.items.map(i => i.id));
    const obs = new IntersectionObserver(
      entries => {
        const vis = entries.filter(e => e.isIntersecting);
        if (vis.length > 0) setActive(vis[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [sections]);

  // Close sidebar on route change / resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 900) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const activeLabel = sections.flatMap(s => s.items).find(i => i.id === active);

  return (
    <>
      {/* Mobile FAB — opens drawer */}
      <button
        onClick={() => setOpen(v => !v)}
        className="sidebar-fab"
        aria-label="Jump to section"
        style={{
          position: "fixed", bottom: "5.5rem", right: "1rem", zIndex: 200,
          backgroundColor: "#0d1f3c", color: "#e2e8f0",
          border: "1px solid #1e3a5f",
          borderRadius: "50px", padding: "0.45rem 0.85rem",
          fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 16px #00000060",
          display: "none", alignItems: "center", gap: "0.4rem",
          fontFamily: "inherit",
          maxWidth: "160px", overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>☰</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {activeLabel ? activeLabel.label : "Sections"}
        </span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "#00000070", zIndex: 149, backdropFilter: "blur(2px)" }}
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`page-sidebar${open ? " sidebar-open" : ""}`}
        style={{
          width: "200px", flexShrink: 0, position: "sticky",
          top: "80px", alignSelf: "flex-start",
          maxHeight: "calc(100vh - 100px)", overflowY: "auto",
          paddingRight: "0.5rem",
        }}
      >
        {/* Mobile drawer header */}
        <div className="sidebar-mobile-header" style={{ display: "none" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Jump to section
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1 }}
          >×</button>
        </div>

        {backHref && (
          <div style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #1e3a5f" }}>
            <Link
              href={backHref}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#0d9488", textDecoration: "none", fontSize: "0.75rem", fontWeight: 600 }}
            >
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
                onClick={() => setOpen(false)}
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
          .sidebar-fab { display: flex !important; }

          .page-sidebar {
            position: fixed !important;
            left: 0; top: 0; bottom: 0;
            z-index: 150;
            width: 240px !important;
            max-height: 100dvh !important;
            background: #070f1e;
            border-right: 1px solid #1e3a5f;
            padding: 1.25rem 1rem 2rem !important;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
            overflow-y: auto;
          }
          .page-sidebar.sidebar-open {
            transform: translateX(0);
            box-shadow: 4px 0 24px #00000060;
          }
          .sidebar-mobile-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.25rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #1e3a5f;
          }
        }
      `}</style>
    </>
  );
}
