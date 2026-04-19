import HealthTicker from "@/components/HealthTicker";
import StateTable from "@/components/StateTable";
import VyasaPlatformSection from "@/components/VyasaPlatformSection";
import states from "@/data/states.json";

const NATIONAL_STATS = [
  { label: "States & UTs",         value: "36",    sub: "all covered",               src: "" },
  { label: "Cities Monitored",     value: "213",   sub: "CPCB + Google AQI",         src: "" },
  { label: "National IMR",         value: "25",    sub: "/1000 LB · SRS 2023",       src: "SRS 2023" },
  { label: "Birth Rate",           value: "18.4",  sub: "/1000 pop · SRS 2023",      src: "SRS 2023" },
  { label: "Death Rate",           value: "6.4",   sub: "/1000 pop · SRS 2023",      src: "SRS 2023" },
  { label: "Vaccination Coverage", value: "76.4%", sub: "fully immunized · NFHS-5",  src: "NFHS-5" },
  { label: "Child Stunting",       value: "35.5%", sub: "under 5 · NFHS-5",          src: "NFHS-5" },
  { label: "Child Anaemia",        value: "67.1%", sub: "age 6–59 months · NFHS-5",  src: "NFHS-5" },
];

export default function HomePage() {
  return (
    <div>
      <HealthTicker />

      {/* Hero */}
      <section className="hero-section" style={{ maxWidth: "1280px", margin: "0 auto", padding: "5rem 1.5rem 3rem" }}>
        <div style={{ maxWidth: "700px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            backgroundColor: "#0d948820", border: "1px solid #0d948840",
            borderRadius: "20px", padding: "0.3rem 0.85rem", marginBottom: "1.5rem",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2dd4bf", display: "inline-block" }} />
            <span style={{ fontSize: "0.75rem", color: "#2dd4bf", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>
              Public Health Transparency
            </span>
          </div>

          <h1 className="font-display" style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: "1.25rem" }}>
            India&apos;s Health Data,<br />
            <span style={{ color: "#2dd4bf" }}>State &amp; District by District.</span>
          </h1>

          <p style={{ fontSize: "1.05rem", color: "#94a3b8", lineHeight: 1.75, marginBottom: "2rem" }}>
            HealthForIndia tracks IMR, vaccination, stunting, institutional births and air quality
            across all 36 states &amp; UTs and 213 cities — sourced live from NFHS-5, CPCB and NHP.
          </p>

          <div className="hero-cta" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <a href="#states" style={{ backgroundColor: "#0d9488", color: "#fff", padding: "0.65rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
              Explore States
            </a>
            <a href="/sources" style={{ backgroundColor: "transparent", color: "#2dd4bf", padding: "0.65rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", border: "1px solid #1e3a5f" }}>
              Data Sources
            </a>
          </div>
        </div>
      </section>

      {/* National Stats Bar */}
      <section style={{ backgroundColor: "#060e1c", borderTop: "1px solid #1e3a5f", borderBottom: "1px solid #1e3a5f" }}>
        <div className="national-stats-grid" style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem" }}>
          {NATIONAL_STATS.map((stat, i) => (
            <div key={i} style={{ padding: "1.25rem 1rem", textAlign: "center", borderBottom: "1px solid #1e3a5f10" }}>
              <div className="font-data" style={{ fontSize: "1.75rem", fontWeight: 600, color: "#2dd4bf", marginBottom: "0.2rem" }}>{stat.value}</div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.2rem" }}>{stat.label}</div>
              <div style={{ fontSize: "0.68rem", color: "#475569" }}>{stat.sub}</div>
              {stat.src && (
                <div style={{ marginTop: "0.35rem", display: "inline-block", fontSize: "0.6rem", color: stat.src === "SRS" ? "#0d9488" : "#6366f1", backgroundColor: stat.src === "SRS" ? "#0d948818" : "#6366f118", border: `1px solid ${stat.src === "SRS" ? "#0d948840" : "#6366f140"}`, borderRadius: "3px", padding: "0.1rem 0.35rem", letterSpacing: "0.05em", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {stat.src}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* State Table */}
      <StateTable states={states} />

      {/* Vyasa Platform Section */}
      <VyasaPlatformSection />
    </div>
  );
}
