import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#060e1c",
        borderTop: "1px solid #1e3a5f",
        padding: "3rem 1.5rem 2rem",
        marginTop: "5rem",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* Brand */}
          <div>
            <div className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
              HealthForIndia
            </div>
            <div style={{ fontSize: "0.75rem", color: "#2dd4bf", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
              by Vyasa
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.7, maxWidth: "260px" }}>
              Bringing public health transparency to every district in India. Powered by Vyasa — intelligent hospital &amp; patient management.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <div style={{ fontSize: "0.75rem", color: "#2dd4bf", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Platform
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <Link href="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>Districts</Link>
              <Link href="/sources" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>Data Sources</Link>
              <a href="#" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>API Access</a>
            </div>
          </div>

          {/* Data */}
          <div>
            <div style={{ fontSize: "0.75rem", color: "#2dd4bf", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Data
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <a href="https://nhp.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>NHP India</a>
              <a href="https://nfhs.iipsindia.ac.in" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>NFHS-5</a>
              <a href="https://pmjay.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>PMJAY</a>
              <a href="https://cpcb.nic.in" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>CPCB AQI</a>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #1e3a5f",
            paddingTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <p style={{ fontSize: "0.8rem", color: "#475569" }}>
            © 2024 Vyasa Health Technologies. Data sourced from NHP, NFHS-5, IDSP, PMJAY, CPCB. For reference only.
          </p>
          <p className="font-data" style={{ fontSize: "0.75rem", color: "#475569" }}>
            v1.0.0 · Updated April 2024
          </p>
        </div>
      </div>
    </footer>
  );
}
