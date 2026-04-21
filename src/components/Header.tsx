"use client";
import Link from "next/link";
import { useState } from "react";
import VyasaLogo from "./VyasaLogo";

export interface HeaderUser { name: string; email: string; }

export default function Header({ user }: { user?: HeaderUser | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <Link href="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            Districts
          </Link>
          <Link href="/sources" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            Data Sources
          </Link>
          <Link href="/contribute" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            Contribute
          </Link>
          {user ? (
            <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#0d948820", border: "1px solid #0d948840", color: "#2dd4bf", padding: "0.35rem 0.9rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>
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
          style={{
            backgroundColor: "#0f2040",
            borderTop: "1px solid #1e3a5f",
            padding: "1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
          className="mobile-menu-panel"
        >
          <Link href="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }} onClick={() => setMenuOpen(false)}>
            Districts
          </Link>
          <Link href="/sources" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }} onClick={() => setMenuOpen(false)}>
            Data Sources
          </Link>
          <a href="#" style={{ color: "#2dd4bf", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            Vyasa Platform →
          </a>
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
