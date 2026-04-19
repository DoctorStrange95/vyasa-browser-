"use client";
import { useState } from "react";
import DistrictCard from "./DistrictCard";

interface District {
  slug: string;
  name: string;
  state: string;
  population: number;
  imr: number;
  hospitals: number;
  doctorsPer1000: number;
  vaccinationPct: number;
  pmjayEnrolled: number;
  aqi: number;
  aqiLabel: string;
  bedsPer1000: number;
  malnutritionPct: number;
}

const SORT_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "imr", label: "IMR (best first)" },
  { value: "vaccination", label: "Vaccination %" },
  { value: "aqi", label: "AQI (cleanest)" },
];

export default function DistrictGrid({ districts }: { districts: District[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");

  const filtered = districts
    .filter(
      (d) =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.state.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "imr") return a.imr - b.imr;
      if (sort === "vaccination") return b.vaccinationPct - a.vaccinationPct;
      if (sort === "aqi") return a.aqi - b.aqi;
      return 0;
    });

  return (
    <section id="districts" style={{ maxWidth: "1280px", margin: "0 auto", padding: "4rem 1.5rem" }}>
      {/* Header row */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h2 className="font-display" style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.4rem" }}>
            District Health Dashboards
          </h2>
          <p style={{ fontSize: "0.88rem", color: "#64748b" }}>
            {filtered.length} of {districts.length} districts
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search district or state…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              backgroundColor: "#0f2040",
              border: "1px solid #1e3a5f",
              borderRadius: "8px",
              padding: "0.5rem 0.9rem",
              color: "#e2e8f0",
              fontSize: "0.85rem",
              outline: "none",
              width: "220px",
              fontFamily: "inherit",
            }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              backgroundColor: "#0f2040",
              border: "1px solid #1e3a5f",
              borderRadius: "8px",
              padding: "0.5rem 0.9rem",
              color: "#94a3b8",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#475569" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</div>
          <p>No districts match &quot;{query}&quot;</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((district) => (
            <DistrictCard key={district.slug} district={district} />
          ))}
        </div>
      )}
    </section>
  );
}
