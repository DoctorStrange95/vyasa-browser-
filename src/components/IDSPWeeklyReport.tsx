"use client";
import { useState, useEffect } from "react";
import type { IDSPWeeklyMeta } from "@/app/api/idsp-weekly/route";
import type { IDSPOutbreak } from "@/lib/idspPDFParser";

const DISEASE_COLORS: Record<string, string> = {
  "Chickenpox":               "#a78bfa",
  "Measles":                  "#f87171",
  "Acute Diarrhoeal Disease": "#60a5fa",
  "Acute Diarrheal Disease":  "#60a5fa",
  "Dengue":                   "#fb923c",
  "Malaria":                  "#4ade80",
  "Hepatitis A":              "#fbbf24",
  "Hepatitis B":              "#f59e0b",
  "Chikungunya":              "#e879f9",
  "Typhoid":                  "#34d399",
  "Suspected Typhoid":        "#34d399",
  "Cholera":                  "#38bdf8",
  "Food Poisoning":           "#ff6b6b",
  "Suspected Food Poisoning": "#ff6b6b",
  "Mpox":                     "#f472b6",
  "Scrub Typhus":             "#facc15",
  "Leptospirosis":            "#86efac",
  "Fever":                    "#94a3b8",
  "Acute Gastroenteritis":    "#67e8f9",
  "Acute Encephalitis Syndrome": "#c084fc",
};

function diseaseColor(d: string): string {
  const key = Object.keys(DISEASE_COLORS).find(k => d?.toLowerCase().includes(k.toLowerCase()));
  return key ? DISEASE_COLORS[key] : "#64748b";
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export default function IDSPWeeklyReport() {
  const [data,    setData]    = useState<IDSPWeeklyMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/idsp-weekly")
      .then(r => r.json())
      .then(d => { setData(d as IDSPWeeklyMeta); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const outbreaks: IDSPOutbreak[] = data?.outbreaks ?? [];
  const pdfUrl = data?.pdfUrl ?? "https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3689";

  // Disease tally
  const diseaseTally: Record<string, number> = {};
  for (const o of outbreaks) {
    diseaseTally[o.disease] = (diseaseTally[o.disease] ?? 0) + 1;
  }
  const sorted = Object.entries(diseaseTally).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCount = sorted[0]?.[1] ?? 1;

  // State tally
  const stateTally: Record<string, { count: number; cases: number; diseases: string[] }> = {};
  for (const o of outbreaks) {
    if (!stateTally[o.state]) stateTally[o.state] = { count: 0, cases: 0, diseases: [] };
    stateTally[o.state].count++;
    stateTally[o.state].cases += o.cases;
    if (o.disease && !stateTally[o.state].diseases.includes(o.disease))
      stateTally[o.state].diseases.push(o.disease);
  }
  const statesSorted = Object.entries(stateTally).sort((a, b) => b[1].count - a[1].count);
  const visibleStates = expanded ? statesSorted : statesSorted.slice(0, 8);

  const totalCases  = outbreaks.reduce((s, o) => s + o.cases, 0);
  const totalDeaths = outbreaks.reduce((s, o) => s + o.deaths, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header card */}
      <div style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0f1e3a 100%)",
        border: "1px solid #1e3a5f", borderTop: "3px solid #ef4444",
        borderRadius: "14px", padding: "1.25rem 1.5rem",
        display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.55rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.15rem" }}>IDSP Week</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#ef4444", lineHeight: 1, fontFamily: "monospace" }}>
              {loading ? "–" : data?.week ? ordinal(data.week) : "–"}
            </div>
            <div style={{ fontSize: "0.6rem", color: "#475569" }}>{data?.year ?? new Date().getFullYear()}</div>
          </div>

          <div style={{ width: "1px", height: "48px", backgroundColor: "#1e3a5f", flexShrink: 0 }} className="divider-v" />

          <div>
            <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "0.3rem" }}>
              {loading ? "Fetching & parsing official PDF…" : data?.dateRange ? `📅 ${data.dateRange}` : "Weekly Outbreak Report"}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", backgroundColor: "#ef444420", border: "1px solid #ef444440", color: "#f87171", borderRadius: "5px", padding: "0.2rem 0.6rem", fontWeight: 700 }}>
                🚨 {loading ? "…" : outbreaks.length} Outbreaks
              </span>
              <span style={{ fontSize: "0.72rem", backgroundColor: "#fb923c20", border: "1px solid #fb923c40", color: "#fb923c", borderRadius: "5px", padding: "0.2rem 0.6rem" }}>
                🧑‍⚕️ {loading ? "…" : totalCases.toLocaleString()} Cases
              </span>
              {totalDeaths > 0 && (
                <span style={{ fontSize: "0.72rem", backgroundColor: "#f8717120", border: "1px solid #f8717140", color: "#f87171", borderRadius: "5px", padding: "0.2rem 0.6rem" }}>
                  ☠ {totalDeaths} Deaths
                </span>
              )}
              <span style={{ fontSize: "0.72rem", backgroundColor: "#0d948820", border: "1px solid #0d948840", color: "#2dd4bf", borderRadius: "5px", padding: "0.2rem 0.6rem" }}>
                📍 {loading ? "…" : statesSorted.length} States
              </span>
              <span style={{ fontSize: "0.72rem", backgroundColor: "#6366f120", border: "1px solid #6366f140", color: "#818cf8", borderRadius: "5px", padding: "0.2rem 0.6rem" }}>
                🏛 {data?.reportingStates ?? 18}/36 Reporting
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
            style={{
              backgroundColor: "#ef444420", border: "1px solid #ef444450", color: "#f87171",
              borderRadius: "8px", padding: "0.55rem 1.1rem",
              fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
            📥 Official PDF
          </a>
          <a href="https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3689"
            target="_blank" rel="noopener noreferrer"
            style={{
              backgroundColor: "#0f2040", border: "1px solid #1e3a5f", color: "#94a3b8",
              borderRadius: "8px", padding: "0.55rem 1.1rem",
              fontSize: "0.8rem", fontWeight: 600, textDecoration: "none",
            }}>
            All Reports ↗
          </a>
        </div>
      </div>

      {/* Two-column: disease chart + state breakdown */}
      {!loading && outbreaks.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="idsp-grid">

          {/* Disease frequency chart */}
          <div style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.1rem 1.25rem" }}>
            <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem", fontWeight: 700 }}>
              Disease Distribution · This Week
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {sorted.map(([disease, count]) => {
                const color = diseaseColor(disease);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={disease}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 500 }}>{disease}</span>
                      <span style={{ fontSize: "0.68rem", color, fontWeight: 700, fontFamily: "monospace" }}>{count}</span>
                    </div>
                    <div style={{ height: "6px", backgroundColor: "#0f2040", borderRadius: "3px" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`, borderRadius: "3px",
                        background: `linear-gradient(90deg, ${color}90, ${color})`,
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* State-wise outbreaks */}
          <div style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem", fontWeight: 700 }}>
              State-wise Outbreaks
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flex: 1 }}>
              {visibleStates.map(([state, info]) => (
                <div key={state} style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.45rem 0.6rem", backgroundColor: "#0a1628", borderRadius: "7px", border: "1px solid #1e3a5f",
                }}>
                  <div style={{
                    minWidth: "22px", height: "22px", borderRadius: "50%",
                    backgroundColor: "#ef444420", border: "1px solid #ef444440",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", fontWeight: 800, color: "#f87171", fontFamily: "monospace", flexShrink: 0,
                  }}>
                    {info.count}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{state}</span>
                      {info.cases > 0 && <span style={{ fontSize: "0.62rem", color: "#fb923c", flexShrink: 0, marginLeft: "0.4rem" }}>{info.cases.toLocaleString()} cases</span>}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {info.diseases.slice(0, 3).join(" · ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {statesSorted.length > 8 && (
              <button onClick={() => setExpanded(e => !e)} style={{
                marginTop: "0.5rem", background: "none", border: "none", color: "#2dd4bf",
                fontSize: "0.7rem", cursor: "pointer", textAlign: "center", fontFamily: "inherit",
              }}>
                {expanded ? "▲ Show less" : `▼ Show ${statesSorted.length - 8} more states`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* District-level outbreak cards */}
      {!loading && outbreaks.length > 0 && (
        <div>
          <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem", fontWeight: 700 }}>
            District-level Detail · Official IDSP Data
          </div>
          <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "6px" }}>
            {outbreaks.slice(0, 20).map((o, i) => {
              const color = diseaseColor(o.disease);
              return (
                <div key={i} style={{
                  minWidth: "210px", maxWidth: "240px", flexShrink: 0,
                  backgroundColor: "#080f1e", border: `1px solid ${color}30`, borderTop: `3px solid ${color}`,
                  borderRadius: "10px", padding: "0.85rem 1rem",
                  display: "flex", flexDirection: "column", gap: "0.3rem",
                }}>
                  <span style={{ fontSize: "0.58rem", fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>
                    {o.disease}
                  </span>
                  <div style={{ fontSize: "0.73rem", fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>
                    {o.district}{o.district && o.state ? ", " : ""}{o.state}
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem", fontSize: "0.63rem", marginTop: "0.1rem" }}>
                    <span style={{ color: "#fb923c" }}>Cases: <b>{o.cases}</b></span>
                    {o.deaths > 0 && <span style={{ color: "#f87171" }}>Deaths: <b>{o.deaths}</b></span>}
                  </div>
                  {o.startDate && <span style={{ fontSize: "0.58rem", color: "#334155" }}>Started: {o.startDate}</span>}
                  <span style={{ fontSize: "0.56rem", color: "#1e3a5f", marginTop: "auto", fontFamily: "monospace" }}>{o.uid}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ minWidth: "220px", height: "120px", backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "10px", flexShrink: 0, opacity: 0.5 }} />
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .idsp-grid { grid-template-columns: 1fr !important; }
          .divider-v { display: none !important; }
        }
      `}</style>
    </div>
  );
}
