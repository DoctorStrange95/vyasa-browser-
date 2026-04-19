"use client";
import Link from "next/link";

interface District {
  slug: string;
  name: string;
  state: string;
  imr: number;
  vaccinationPct: number;
  doctorsPer1000: number;
  pmjayEnrolled: number;
  aqi: number;
  aqiLabel: string;
  hospitals: number;
}

function aqiColor(label: string): string {
  if (label === "Good") return "#22c55e";
  if (label === "Moderate") return "#eab308";
  if (label.includes("Sensitive")) return "#f97316";
  if (label === "Unhealthy") return "#ef4444";
  return "#a855f7";
}

export default function DistrictCard({ district }: { district: District }) {
  const color = aqiColor(district.aqiLabel);
  return (
    <Link
      href={`/district/${district.slug}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          backgroundColor: "#0f2040",
          border: "1px solid #1e3a5f",
          borderRadius: "12px",
          padding: "1.5rem",
          cursor: "pointer",
          transition: "border-color 0.2s, transform 0.2s",
          height: "100%",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#0d9488";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#1e3a5f";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "0.2rem" }}>
            {district.name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {district.state}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Stat label="IMR" value={district.imr} unit="/1000" />
          <Stat label="Vaccination" value={`${district.vaccinationPct}%`} />
          <Stat label="Doctors/1k" value={district.doctorsPer1000} />
          <Stat label="Hospitals" value={district.hospitals} />
        </div>

        {/* AQI badge */}
        <div
          style={{
            marginTop: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0a1628",
            borderRadius: "8px",
            padding: "0.6rem 0.9rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>AQI</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="font-data" style={{ fontSize: "1rem", fontWeight: 600, color }}>
              {district.aqi}
            </span>
            <span style={{ fontSize: "0.7rem", color, backgroundColor: `${color}22`, padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
              {district.aqiLabel}
            </span>
          </div>
        </div>

        {/* PMJAY */}
        <div
          style={{
            marginTop: "0.75rem",
            fontSize: "0.78rem",
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>PMJAY Enrolled</span>
          <span className="font-data" style={{ color: "#2dd4bf" }}>
            {(district.pmjayEnrolled / 1000).toFixed(0)}K
          </span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: "1.25rem", fontSize: "0.8rem", color: "#0d9488", fontWeight: 600 }}>
          View dashboard →
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, unit = "" }: { label: string; value: string | number; unit?: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>
        {label}
      </div>
      <div className="font-data" style={{ fontSize: "1.1rem", fontWeight: 600, color: "#e2e8f0" }}>
        {value}
        {unit && <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "2px" }}>{unit}</span>}
      </div>
    </div>
  );
}
