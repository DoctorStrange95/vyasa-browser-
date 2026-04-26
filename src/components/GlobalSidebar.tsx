"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HeaderUser } from "./Header";

const HOME_SECTIONS = [
  { id: "sec-hero",       icon: "🏠", label: "Overview" },
  { id: "sec-facilities", icon: "🏥", label: "Facilities" },
  { id: "sec-intel",      icon: "📡", label: "Intel Feed" },
  { id: "sec-idsp",       icon: "📊", label: "IDSP Weekly" },
  { id: "sec-leaders",    icon: "🏆", label: "Leaders" },
  { id: "sec-states",     icon: "📋", label: "All States" },
  { id: "sec-ncd",        icon: "🫀", label: "NCD Burden" },
  { id: "sec-contribute", icon: "📎", label: "Contribute" },
  { id: "sec-join",       icon: "🚀", label: "Join Vyasa" },
];

function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    if (!enabled) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis.length > 0) setActive(vis[0].target.id);
      },
      { threshold: 0.1, rootMargin: "-5% 0px -55% 0px" }
    );
    HOME_SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [enabled]);
  return active;
}

function NavLink({
  href,
  icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`gsidebar-link${active ? " gsidebar-link--active" : ""}`}
    >
      <span style={{ fontSize: "1rem", flexShrink: 0 }}>{icon}</span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </Link>
  );
}

export default function GlobalSidebar({ user }: { user?: HeaderUser | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = pathname === "/";
  const activeSection = useActiveSection(isHome);

  function openFacilityDrawer() {
    window.dispatchEvent(new Event("open-facility-drawer"));
    setMobileOpen(false);
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  }

  const navContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", scrollbarWidth: "none" }}>

      {/* ── Fixed nav ────────────────────────────────── */}
      <div style={{ padding: "1rem 0 0.75rem", borderBottom: "1px solid #1e3a5f" }}>
        <div style={{ fontSize: "0.55rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.65rem", paddingLeft: "1.1rem" }}>
          Navigation
        </div>

        <NavLink href="/"         icon="🏠" label="Home"             active={pathname === "/"} onClick={() => setMobileOpen(false)} />
        <NavLink href="/citizens" icon="🏥" label="Citizens Centre"  active={pathname.startsWith("/citizens")} onClick={() => setMobileOpen(false)} />

        {/* Find Nearby — triggers FacilityDrawer */}
        <button onClick={openFacilityDrawer} className="gsidebar-link gsidebar-btn">
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>📍</span>
          <span style={{ whiteSpace: "nowrap" }}>Find Nearby</span>
        </button>

        {user ? (
          <NavLink href="/profile" icon="👤" label={user.name.split(" ")[0]} active={pathname === "/profile"} onClick={() => setMobileOpen(false)} />
        ) : (
          <NavLink href="/auth" icon="🔑" label="Sign In" active={pathname === "/auth"} onClick={() => setMobileOpen(false)} />
        )}
      </div>

      {/* ── Homepage section shortcuts (adaptive) ────── */}
      {isHome && (
        <div style={{ padding: "0.75rem 0", borderBottom: "1px solid #1e3a5f" }}>
          <div style={{ fontSize: "0.55rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.5rem", paddingLeft: "1.1rem" }}>
            Page Sections
          </div>
          {HOME_SECTIONS.map(s => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`gsidebar-link gsidebar-btn${isActive ? " gsidebar-link--active" : " gsidebar-link--muted"}`}
              >
                <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{s.icon}</span>
                <span style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>{s.label}</span>
                {isActive && (
                  <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", backgroundColor: "#2dd4bf", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Platform links ───────────────────────────── */}
      <div style={{ padding: "0.75rem 0" }}>
        <div style={{ fontSize: "0.55rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.5rem", paddingLeft: "1.1rem" }}>
          About
        </div>
        <NavLink href="/team"    icon="👥" label="Our Team"     active={pathname === "/team"}    onClick={() => setMobileOpen(false)} />
        <NavLink href="/sources" icon="📊" label="Data Sources" active={pathname === "/sources"} onClick={() => setMobileOpen(false)} />
        <NavLink href="/contact" icon="✉️"  label="Contact"      active={pathname === "/contact"} onClick={() => setMobileOpen(false)} />
      </div>

      {/* ── CTA block ────────────────────────────────── */}
      <div style={{ padding: "0 0.85rem 1rem", marginTop: "auto", borderTop: "1px solid #1e3a5f", paddingTop: "0.85rem" }}>
        {/* Sign In CTA — only when not logged in */}
        {!user && (
          <Link
            href="/auth"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "block", textAlign: "center",
              backgroundColor: "#0d9488", color: "#fff",
              padding: "0.65rem 1rem", borderRadius: "8px",
              textDecoration: "none", fontSize: "0.85rem", fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Sign In — See Your State →
          </Link>
        )}
        {/* Join — for healthcare professionals */}
        <Link
          href="/join#join-form"
          onClick={() => setMobileOpen(false)}
          style={{
            display: "block", textAlign: "center",
            backgroundColor: "transparent", border: "1px solid #1e3a5f",
            color: "#475569",
            padding: "0.5rem 1rem", borderRadius: "8px",
            textDecoration: "none", fontSize: "0.75rem", fontWeight: 500,
          }}
        >
          Join as Professional (Doctors)
        </Link>
        <div style={{ fontSize: "0.56rem", color: "#1e3a5f", lineHeight: 1.5, marginTop: "0.65rem", textAlign: "center" }}>
          IDSP · NFHS-5 · SRS 2023 · MoHFW
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="global-sidebar-desktop">
        {navContent}
      </aside>

      {/* Mobile FAB */}
      <button
        className="global-sidebar-fab"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        ☰
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex" }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#00000088" }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "relative",
              width: "260px",
              backgroundColor: "#060d1a",
              borderRight: "1px solid #1e3a5f",
              zIndex: 1,
              paddingTop: "64px",
              height: "100vh",
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                position: "absolute", top: "0.85rem", right: "0.85rem",
                background: "none", border: "none",
                color: "#94a3b8", fontSize: "1.25rem",
                cursor: "pointer", padding: "0.25rem",
              }}
              aria-label="Close navigation"
            >
              ✕
            </button>
            {navContent}
          </div>
        </div>
      )}

      <style>{`
        .global-sidebar-desktop {
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
          width: 240px;
          flex-shrink: 0;
          background-color: #060d1a;
          border-right: 1px solid #1e3a5f;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 10;
        }
        .global-sidebar-desktop::-webkit-scrollbar { display: none; }
        .global-sidebar-fab { display: none !important; }

        .gsidebar-link {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.5rem 0.85rem 0.5rem 1.1rem;
          background: transparent;
          border: none;
          border-left: 3px solid transparent;
          color: #94a3b8;
          text-decoration: none;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          width: 100%;
          border-radius: 0 8px 8px 0;
          min-height: 40px;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
        }
        .gsidebar-link:hover {
          background: #0f2040;
          color: #e2e8f0;
        }
        .gsidebar-link--active {
          background: #0f2040 !important;
          border-left-color: #2dd4bf !important;
          color: #e2e8f0 !important;
          font-weight: 600;
        }
        .gsidebar-link--muted {
          color: #475569;
        }
        .gsidebar-link--muted:hover {
          color: #94a3b8;
        }
        .gsidebar-btn {
          font-family: inherit;
        }

        @media (max-width: 900px) {
          .global-sidebar-desktop { display: none !important; }
          .global-sidebar-fab {
            display: flex !important;
            position: fixed;
            bottom: 1.25rem;
            left: 1rem;
            z-index: 100;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: #0d9488;
            border: none;
            color: #fff;
            font-size: 1.2rem;
            cursor: pointer;
            box-shadow: 0 4px 16px #0d948860;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
