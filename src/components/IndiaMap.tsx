"use client";
import { useState } from "react";

interface StateData {
  slug: string;
  name: string;
  imr: number | null;
  vaccinationPct: number | null;
  stuntingPct: number | null;
  under5MR: number | null;
  institutionalBirthsPct: number | null;
  neonatalMR: number | null;
}

interface Props {
  states: StateData[];
  onSelect: (slug: string, name: string) => void;
  selectedSlug: string | null;
}

// SVG viewBox: 0 0 100 108
const toX = (lng: number) => ((lng - 68) / 29.4) * 100;
const toY = (lat: number) => ((37.1 - lat) / 29.1) * 108;

const COORDS: Record<string, [number, number]> = {
  "andaman-nicobar-islands": [11.74, 92.66],
  "andhra-pradesh":          [15.91, 79.74],
  "arunachal-pradesh":       [28.22, 94.73],
  "assam":                   [26.20, 92.94],
  "bihar":                   [25.10, 85.31],
  "chandigarh":              [30.73, 76.78],
  "chhattisgarh":            [21.28, 81.87],
  "dadra-nagar-haveli":      [20.18, 73.02],
  "delhi":                   [28.70, 77.10],
  "goa":                     [15.30, 74.12],
  "gujarat":                 [22.26, 71.19],
  "haryana":                 [29.06, 76.09],
  "himachal-pradesh":        [31.10, 77.17],
  "jammu-kashmir":           [33.78, 76.58],
  "jharkhand":               [23.61, 85.28],
  "karnataka":               [15.32, 75.71],
  "kerala":                  [10.85, 76.27],
  "ladakh":                  [34.15, 77.58],
  "lakshadweep":             [10.57, 72.64],
  "madhya-pradesh":          [22.97, 78.66],
  "maharashtra":             [19.75, 75.71],
  "manipur":                 [24.66, 93.91],
  "meghalaya":               [25.47, 91.37],
  "mizoram":                 [23.16, 92.94],
  "nagaland":                [26.16, 94.56],
  "odisha":                  [20.95, 85.10],
  "puducherry":              [11.94, 79.81],
  "punjab":                  [31.15, 75.34],
  "rajasthan":               [27.02, 74.22],
  "sikkim":                  [27.53, 88.51],
  "tamil-nadu":              [11.13, 78.66],
  "telangana":               [18.11, 79.02],
  "tripura":                 [23.94, 91.99],
  "uttar-pradesh":           [26.85, 80.95],
  "uttarakhand":             [30.07, 79.02],
  "west-bengal":             [22.99, 87.86],
};

// Short labels for major states
const ABBR: Record<string, string> = {
  "uttar-pradesh": "UP", "madhya-pradesh": "MP", "maharashtra": "MH",
  "rajasthan": "RJ", "gujarat": "GJ", "karnataka": "KA",
  "andhra-pradesh": "AP", "telangana": "TG", "tamil-nadu": "TN",
  "west-bengal": "WB", "odisha": "OD", "bihar": "BR",
  "jharkhand": "JH", "chhattisgarh": "CG", "kerala": "KL",
  "assam": "AS", "delhi": "DL", "haryana": "HR",
  "punjab": "PB", "uttarakhand": "UK", "himachal-pradesh": "HP",
};

type Metric = "imr" | "vacc" | "stunt";

function stateColor(s: StateData, m: Metric): string {
  if (m === "imr") {
    const v = s.imr;
    if (v === null) return "#1e3a5f";
    if (v <= 10) return "#16a34a"; if (v <= 18) return "#22c55e";
    if (v <= 25) return "#84cc16"; if (v <= 32) return "#eab308";
    if (v <= 38) return "#f97316"; return "#ef4444";
  }
  if (m === "vacc") {
    const v = s.vaccinationPct;
    if (v === null) return "#1e3a5f";
    if (v >= 88) return "#16a34a"; if (v >= 80) return "#22c55e";
    if (v >= 72) return "#84cc16"; if (v >= 65) return "#eab308";
    if (v >= 58) return "#f97316"; return "#ef4444";
  }
  const v = s.stuntingPct;
  if (v === null) return "#1e3a5f";
  if (v <= 20) return "#16a34a"; if (v <= 27) return "#22c55e";
  if (v <= 33) return "#84cc16"; if (v <= 39) return "#eab308";
  if (v <= 44) return "#f97316"; return "#ef4444";
}

const LEGEND: Record<Metric, { color: string; label: string }[]> = {
  imr:   [{ color:"#16a34a",label:"≤10"},{ color:"#22c55e",label:"11–18"},{ color:"#84cc16",label:"19–25"},{ color:"#eab308",label:"26–32"},{ color:"#f97316",label:"33–38"},{ color:"#ef4444",label:">38"}],
  vacc:  [{ color:"#16a34a",label:"≥88%"},{ color:"#22c55e",label:"80%"},{ color:"#84cc16",label:"72%"},{ color:"#eab308",label:"65%"},{ color:"#ef4444",label:"<58%"}],
  stunt: [{ color:"#16a34a",label:"≤20%"},{ color:"#22c55e",label:"27%"},{ color:"#84cc16",label:"33%"},{ color:"#eab308",label:"39%"},{ color:"#ef4444",label:">44%"}],
};

export default function IndiaMap({ states, onSelect, selectedSlug }: Props) {
  const [metric,  setMetric]  = useState<Metric>("imr");
  const [hovered, setHovered] = useState<string | null>(null);

  const hoveredState  = hovered  ? states.find(s => s.slug === hovered)  : null;
  const selectedState = selectedSlug ? states.find(s => s.slug === selectedSlug) : null;
  const focusSlug = hovered ?? selectedSlug;
  const focusState = focusSlug ? states.find(s => s.slug === focusSlug) : null;

  const METRICS: { key: Metric; label: string }[] = [
    { key: "imr",   label: "Infant Mortality" },
    { key: "vacc",  label: "Vaccination" },
    { key: "stunt", label: "Stunting" },
  ];

  function metricVal(s: StateData, m: Metric): string {
    if (m === "imr")   return s.imr !== null ? `${s.imr}/1000 LB` : "—";
    if (m === "vacc")  return s.vaccinationPct !== null ? `${s.vaccinationPct}%` : "—";
    return s.stuntingPct !== null ? `${s.stuntingPct}%` : "—";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.5rem" }}>
      {/* Metric pills */}
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: "0.63rem", color: "#334155" }}>View:</span>
        {METRICS.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)} style={{
            fontSize: "0.67rem", padding: "0.18rem 0.6rem",
            backgroundColor: metric === m.key ? "#0f2040" : "transparent",
            border: `1px solid ${metric === m.key ? "#2dd4bf" : "#1e3a5f"}`,
            color: metric === m.key ? "#2dd4bf" : "#475569",
            borderRadius: "20px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
          }}>{m.label}</button>
        ))}
      </div>

      {/* SVG Map */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <svg
          viewBox="0 0 100 108"
          style={{ width: "100%", height: "100%", display: "block" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Heatmap blur filter */}
            <filter id="heat" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
            {/* Dot glow */}
            <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Selected ring pulse */}
            <filter id="pulse" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect width="100" height="108" fill="#060d1a" rx="2" />

          {/* Subtle grid */}
          {[20,40,60,80].map(v => (
            <g key={v} opacity="0.04">
              <line x1={v} y1="0" x2={v} y2="108" stroke="#2dd4bf" strokeWidth="0.3" strokeDasharray="1 2"/>
              <line x1="0" y1={v} x2="100" y2={v} stroke="#2dd4bf" strokeWidth="0.3" strokeDasharray="1 2"/>
            </g>
          ))}

          {/* ── Layer 1: Heat glow (blurred, large radius) ── */}
          <g filter="url(#heat)" opacity="0.45">
            {states.map(s => {
              const c = COORDS[s.slug]; if (!c) return null;
              const color = stateColor(s, metric);
              const r = (s.imr ?? 20) > 30 ? 7 : 5;
              return <circle key={s.slug + "-h"} cx={toX(c[1])} cy={toY(c[0])} r={r} fill={color} />;
            })}
          </g>

          {/* ── Layer 2: Selected state large ring ── */}
          {selectedSlug && (() => {
            const c = COORDS[selectedSlug]; if (!c) return null;
            const sel = states.find(s => s.slug === selectedSlug);
            if (!sel) return null;
            const color = stateColor(sel, metric);
            return (
              <circle
                cx={toX(c[1])} cy={toY(c[0])} r={6}
                fill={color + "30"} stroke={color} strokeWidth="0.6"
                opacity="0.8" filter="url(#pulse)"
              />
            );
          })()}

          {/* ── Layer 3: State dots + labels ── */}
          {states.map(s => {
            const c = COORDS[s.slug]; if (!c) return null;
            const cx = toX(c[1]), cy = toY(c[0]);
            const color = stateColor(s, metric);
            const isSelected = selectedSlug === s.slug;
            const isHovered  = hovered === s.slug;
            const r = isSelected ? 3.2 : isHovered ? 2.8 : 2.2;
            const abbr = ABBR[s.slug];

            return (
              <g
                key={s.slug}
                onMouseEnter={() => setHovered(s.slug)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(s.slug, s.name)}
                style={{ cursor: "pointer" }}
              >
                {/* Outer ring on hover/select */}
                {(isHovered || isSelected) && (
                  <circle cx={cx} cy={cy} r={r + 2.5} fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" />
                )}
                {/* Main dot */}
                <circle cx={cx} cy={cy} r={r} fill={color} stroke="#060d1a" strokeWidth="0.5" filter="url(#glow)" />
                {/* Abbreviation label for major states */}
                {abbr && (isHovered || isSelected) && (
                  <text x={cx} y={cy - r - 1.5} textAnchor="middle" fontSize="2.2" fill="#e2e8f0" fontWeight="bold" fontFamily="monospace">
                    {abbr}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Tooltip overlay ── */}
          {focusState && (() => {
            const c = COORDS[focusState.slug]; if (!c) return null;
            const bx = toX(c[1]), by = toY(c[0]);
            const tx = bx > 60 ? bx - 22 : bx + 3;
            const ty = by > 75 ? by - 24 : by + 3;
            const color = stateColor(focusState, metric);
            const val = metricVal(focusState, metric);
            return (
              <g>
                <rect x={tx} y={ty} width="22" height="14" rx="1.5" fill="#080f1eee" stroke={color + "60"} strokeWidth="0.3" />
                <text x={tx + 1.5} y={ty + 3.5} fontSize="2.2" fill="#e2e8f0" fontWeight="700" fontFamily="system-ui">{focusState.name.length > 14 ? focusState.name.slice(0,14)+"…" : focusState.name}</text>
                <text x={tx + 1.5} y={ty + 7.2} fontSize="2.8" fill={color} fontWeight="700" fontFamily="monospace">{val}</text>
                <text x={tx + 1.5} y={ty + 10.5} fontSize="1.9" fill="#475569" fontFamily="system-ui">
                  {`Vacc ${focusState.vaccinationPct ?? "—"}%  Stunt ${focusState.stuntingPct ?? "—"}%`}
                </text>
              </g>
            );
          })()}

          {/* ── Legend ── */}
          <g>
            <rect x="0.5" y="80" width="14" height={LEGEND[metric].length * 3.5 + 2} rx="1" fill="#060d1acc" />
            {LEGEND[metric].map((l, i) => (
              <g key={l.label}>
                <circle cx="3" cy={83 + i * 3.5} r="1" fill={l.color} />
                <text x="5" y={83.7 + i * 3.5} fontSize="1.9" fill="#64748b" fontFamily="monospace">{l.label}</text>
              </g>
            ))}
          </g>

          {/* India label */}
          <text x="1" y="3.5" fontSize="2" fill="#1e3a5f" fontFamily="monospace" letterSpacing="0.3">INDIA · {states.length} STATES</text>
        </svg>
      </div>
    </div>
  );
}
