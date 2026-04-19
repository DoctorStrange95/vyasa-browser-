"use client";
import Link from "next/link";

interface City {
  slug: string;
  name: string;
  aqi: number;
  aqiLabel: string;
  stations: number;
  stateSlug: string;
  stateName: string;
  lastUpdate: string;
}

function aqiColor(label: string) {
  if (label === "Good") return "#22c55e";
  if (label === "Moderate") return "#eab308";
  if (label.includes("Sensitive")) return "#f97316";
  if (label === "Unhealthy") return "#ef4444";
  return "#a855f7";
}

export default function CityCard({ city }: { city: City }) {
  const col = aqiColor(city.aqiLabel);
  return (
    <Link href={`/district/${city.slug}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          backgroundColor: "#0f2040",
          border: "1px solid #1e3a5f",
          borderRadius: "10px",
          padding: "1.25rem",
          cursor: "pointer",
          transition: "border-color 0.2s, transform 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = col;
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#1e3a5f";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div style={{ fontWeight: 600, color: "#fff", marginBottom: "0.75rem", fontSize: "0.95rem" }}>
          {city.name}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="font-data" style={{ fontSize: "1.75rem", fontWeight: 700, color: col }}>
              {city.aqi}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>PM2.5 µg/m³</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{
              fontSize: "0.72rem", color: col, backgroundColor: `${col}22`,
              padding: "0.2rem 0.55rem", borderRadius: "4px", display: "block", marginBottom: "0.3rem",
            }}>
              {city.aqiLabel}
            </span>
            <span style={{ fontSize: "0.68rem", color: "#475569" }}>
              {city.stations} station{city.stations !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "#0d9488" }}>
          View dashboard →
        </div>
      </div>
    </Link>
  );
}
