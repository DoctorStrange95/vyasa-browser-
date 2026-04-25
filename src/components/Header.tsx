"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import VyasaLogo from "./VyasaLogo";

const HOME_SECTIONS = [
  { id: "sec-hero",       icon: "🏠", label: "Overview" },
  { id: "sec-facilities", icon: "🏥", label: "Find Facilities" },
  { id: "sec-intel",      icon: "📡", label: "Health Intel" },
  { id: "sec-idsp",       icon: "📊", label: "IDSP Weekly" },
  { id: "sec-leaders",    icon: "🏆", label: "Health Leaders" },
  { id: "sec-states",     icon: "📋", label: "All States" },
  { id: "sec-ncd",        icon: "🫀", label: "NCD Burden" },
  { id: "sec-contribute", icon: "📎", label: "Contribute Data" },
  { id: "sec-join",       icon: "🚀", label: "Join Vyasa" },
];

export interface HeaderUser { name: string; email: string; }

export default function Header({ user }: { user?: HeaderUser | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f" }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <VyasaLogo size={36} />
          <div>
            <div className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
              HealthForIndia
            </div>
            <div style={{ fontSize: "0.65rem", color: "#2dd4bf", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              by Vyasa
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }} className="desktop-nav">
          <Link href="/citizens" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            🏥 Citizens
          </Link>
          <Link href="/team" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            Our Team
          </Link>
          <Link href="/sources" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            Data Sources
          </Link>
          <Link href="/contribute" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            Contribute
          </Link>
          <Link href="/join" style={{ backgroundColor: "#0d948820", border: "1px solid #0d948860", color: "#2dd4bf", padding: "0.4rem 1rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700 }}>
            Join Now
          </Link>
          {user ? (
            <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", color: "#94a3b8", padding: "0.35rem 0.9rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#0d948840", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700 }}>{user.name[0].toUpperCase()}</span>
              {user.name.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/auth" style={{ backgroundColor: "#0d9488", color: "#fff", padding: "0.4rem 1rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
              Sign In →
            </Link>
          )}

        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "#e2e8f0",
            cursor: "pointer",
            padding: "0.5rem",
          }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{ backgroundColor: "#0a1628", borderTop: "1px solid #1e3a5f", paddingBottom: "1.25rem" }}
          className="mobile-menu-panel"
        >
          {/* Page links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", padding: "0.75rem 1.25rem 0" }}>
            <Link href="/citizens" style={{ color: "#93c5fd", textDecoration: "none", fontSize: "0.875rem", padding: "0.55rem 0", borderBottom: "1px solid #1e3a5f10", fontWeight: 500 }} onClick={() => setMenuOpen(false)}>
              🏥 Citizens Centre
            </Link>
            <Link href="/team" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", padding: "0.55rem 0", borderBottom: "1px solid #1e3a5f10" }} onClick={() => setMenuOpen(false)}>
              Our Team
            </Link>
            <Link href="/sources" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", padding: "0.55rem 0", borderBottom: "1px solid #1e3a5f10" }} onClick={() => setMenuOpen(false)}>
              Data Sources
            </Link>
            <Link href="/contribute" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", padding: "0.55rem 0", borderBottom: "1px solid #1e3a5f10" }} onClick={() => setMenuOpen(false)}>
              Contribute
            </Link>
            <Link href="/join" style={{ color: "#2dd4bf", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700, padding: "0.55rem 0", borderBottom: "1px solid #1e3a5f10" }} onClick={() => setMenuOpen(false)}>
              Join Vyasa →
            </Link>
            {user ? (
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", padding: "0.55rem 0" }}
              >
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#0d948840", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#2dd4bf" }}>
                  {user.name[0].toUpperCase()}
                </span>
                {user.name.split(" ")[0]}
              </Link>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMenuOpen(false)}
                style={{ display: "inline-block", background: "#0d9488", color: "#fff", borderRadius: "8px", padding: "0.55rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", marginTop: "0.4rem", textAlign: "center" }}
              >
                Sign In →
              </Link>
            )}

          </div>

          {/* Section nav — only on homepage */}
          {isHome && (
            <>
              <div style={{ margin: "0.75rem 1.25rem 0.6rem", borderTop: "1px solid #1e3a5f", paddingTop: "0.75rem" }}>
                <div style={{ fontSize: "0.6rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Jump to section
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  {HOME_SECTIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        setMenuOpen(false);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        backgroundColor: "#0f2040", border: "1px solid #1e3a5f",
                        borderRadius: "7px", padding: "0.45rem 0.65rem",
                        color: "#94a3b8", fontSize: "0.75rem", fontWeight: 500,
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem" }}>{s.icon}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
