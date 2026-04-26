"use client";
import Link from "next/link";
import VyasaLogo from "./VyasaLogo";

export interface HeaderUser { name: string; email: string; }

export default function Header({ user }: { user?: HeaderUser | null }) {
  function openFacilityDrawer() {
    window.dispatchEvent(new Event("open-facility-drawer"));
  }

  return (
    <header style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", position: "sticky", top: 0, zIndex: 200 }}>
      <div
        style={{
          maxWidth: "100%",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          gap: "0.75rem",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
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

        {/* Right-side actions */}
        <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
          {/* Find Nearby — mobile shortcut (hidden on desktop since GlobalSidebar shows it) */}
          <button
            onClick={openFacilityDrawer}
            className="header-find-nearby"
            aria-label="Find nearby hospitals"
            style={{
              display: "none",
              alignItems: "center", gap: "0.4rem",
              backgroundColor: "#0d948820", border: "1px solid #0d948840",
              color: "#2dd4bf", borderRadius: "8px",
              padding: "0.5rem 0.85rem",
              fontSize: "0.8rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              minHeight: "44px",
              whiteSpace: "nowrap",
            }}
          >
            📍 Find
          </button>

          {/* For professionals only */}
          <Link
            href="/join#join-form"
            className="header-join-btn"
            title="Join Vyasa Health Platform — for healthcare professionals"
            style={{ backgroundColor: "#0d948815", border: "1px solid #0d948840", color: "#64748b", padding: "0.55rem 0.9rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.82rem", fontWeight: 500, minHeight: "44px", display: "inline-flex", alignItems: "center" }}
          >
            For Doctors
          </Link>

          {user ? (
            <Link
              href="/profile"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", color: "#94a3b8", padding: "0.55rem 0.9rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, minHeight: "44px" }}
            >
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#0d948840", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700 }}>
                {user.name[0].toUpperCase()}
              </span>
              <span className="header-username">{user.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link
              href="/auth"
              style={{ backgroundColor: "#0d9488", color: "#fff", padding: "0.6rem 1.25rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700, minHeight: "44px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
            >
              Sign In →
            </Link>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .header-find-nearby { display: inline-flex !important; }
          .header-join-btn { display: none !important; }
          .header-username { display: none; }
        }
      `}</style>
    </header>
  );
}
