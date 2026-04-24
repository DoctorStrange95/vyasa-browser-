"use client";
import { useState, useEffect } from "react";

interface PHItem {
  type: string;
  disease?: string;
  location: { state?: string; district?: string };
  cases?: string | number;
  deaths?: string | number;
  date?: string;
  confidence: string;
  sourceUrl?: string;
  title: string;
}

interface WeekMeta {
  week: number;
  year: number;
  dateRange: string;
  pdfUrl: string;
  reportingStates: number;
  fromCache?: boolean;
  stale?: boolean;
}

const DISEASE_COLORS: Record<string, string> = {
  "Chickenpox":              "#a78bfa",
  "Measles":                 "#f87171",
  "Acute Diarrhoeal Disease":"#60a5fa",
  "Dengue":                  "#fb923c",
  "Malaria":                 "#4ade80",
  "Hepatitis A":             "#fbbf24",
  "Hepatitis B":             "#f59e0b",
  "Chikungunya":             "#e879f9",
  "Typhoid":                 "#34d399",
  "Cholera":                 "#38bdf8",
  "Food Poisoning":          "#ff6b6b",
  "Mpox":                    "#f472b6",
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
  const [meta,     setMeta]     = useState<WeekMeta | null>(null);
  const [items,    setItems]    = useState<PHItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/idsp-weekly").then(r => r.json()),
      fetch("/api/ph-intelligence").then(r => r.json()),
    ]).then(([metaRes, feedRes]) => {
      if (metaRes.status === "fulfilled") setMeta(metaRes.value as WeekMeta);
      if (feedRes.status === "fulfilled") {
        const outbreaks = ((feedRes.value as { items?: PHItem[] }).items ?? [])
          .filter((i: PHItem) => i.type === "Outbreak");
        setItems(outbreaks);
      }
      setLoading(false);
    });
  }, []);

  // Tally diseases from our scraped items
  const diseaseTally: Record<string, number> = {};
  for (const item of items) {
    const d = item.disease ?? "Unknown";
    diseaseTally[d] = (diseaseTally[d] ?? 0) + 1;
  }
  const sorted = Object.entries(diseaseTally).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCount = sorted[0]?.[1] ?? 1;

  // State tally
  const stateTally: Record<string, { count: number; diseases: string[] }> = {};
  for (const item of items) {
    const st = item.location?.state ?? "Unknown";
    if (!stateTally[st]) stateTally[st] = { count: 0, diseases: [] };
    stateTally[st].count++;
    const d = item.disease;
    if (d && !stateTally[st].diseases.includes(d)) stateTally[st].diseases.push(d);
  }
  const statesSorted = Object.entries(stateTally).sort((a, b) => b[1].count - a[1].count);
  const visibleStates = expanded ? statesSorted : statesSorted.slice(0, 8);

  const totalAlerts = items.length;
  const pdfUrl = meta?.pdfUrl ?? "https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3689";

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
          {/* Week badge */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.55rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.15rem" }}>IDSP Week</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#ef4444", lineHeight: 1, fontFamily: "monospace" }}>
              {loading ? "–" : meta?.week ? ordinal(meta.week) : "–"}
            </div>
            <div style={{ fontSize: "0.6rem", color: "#475569" }}>{meta?.year ?? new Date().getFullYear()}</div>
          </div>

          <div style={{ width: "1px", height: "48px", backgroundColor: "#1e3a5f", flexShrink: 0 }} className="divider-v" />

          <div>
            <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "0.3rem" }}>
              {loading ? "Fetching latest report…" : meta?.dateRange ? `📅 ${meta.dateRange}` : "Weekly Outbreak Report"}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", backgroundColor: "#ef444420", border: "1px solid #ef444440", color: "#f87171", borderRadius: "5px", padding: "0.2rem 0.6rem", fontWeight: 700 }}>
                🚨 {loading ? "…" : totalAlerts} Outbreak Alerts
              </span>
              <span style={{ fontSize: "0.72rem", backgroundColor: "#0d948820", border: "1px solid #0d948840", color: "#2dd4bf", borderRadius: "5px", padding: "0.2rem 0.6rem" }}>
                📍 {loading ? "…" : statesSorted.length} States Affected
              </span>
              <span style={{ fontSize: "0.72rem", backgroundColor: "#6366f120", border: "1px solid #6366f140", color: "#818cf8", borderRadius: "5px", padding: "0.2rem 0.6rem" }}>
                🏛 {meta?.reportingStates ?? 18}/36 States Reporting
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "#ef444420", border: "1px solid #ef444450", color: "#f87171",
              borderRadius: "8px", padding: "0.55rem 1.1rem",
              fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem",
            }}
          >
            📥 Official PDF
          </a>
          <a
            href="https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3689"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "#0f2040", border: "1px solid #1e3a5f", color: "#94a3b8",
              borderRadius: "8px", padding: "0.55rem 1.1rem",
              fontSize: "0.8rem", fontWeight: 600, textDecoration: "none",
            }}
          >
            All Reports ↗
          </a>
        </div>
      </div>

      {/* Two-column layout: disease chart + state map */}
      {!loading && totalAlerts > 0 && (
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

          {/* State-wise alerts */}
          <div style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem", fontWeight: 700 }}>
              State-wise Alerts
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flex: 1, overflowY: "auto" }}>
              {visibleStates.map(([state, info]) => (
                <div key={state} style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.45rem 0.6rem",
                  backgroundColor: "#0a1628", borderRadius: "7px",
                  border: "1px solid #1e3a5f",
                }}>
                  <div style={{
                    minWidth: "22px", height: "22px", borderRadius: "50%",
                    backgroundColor: "#ef444420", border: "1px solid #ef444440",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", fontWeight: 800, color: "#f87171", fontFamily: "monospace",
                    flexShrink: 0,
                  }}>
                    {info.count}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state}</div>
                    <div style={{ fontSize: "0.6rem", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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

      {/* Detailed alert cards — horizontal scroll */}
      {!loading && items.length > 0 && (
        <div>
          <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem", fontWeight: 700 }}>
            Active Outbreak Alerts
          </div>
          <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "6px" }}>
            {items.slice(0, 12).map((item, i) => {
              const color = diseaseColor(item.disease ?? "");
              const loc = [item.location?.district, item.location?.state].filter(Boolean).join(", ");
              const hasCases = item.cases && item.cases !== "0";
              const hasDeaths = item.deaths && item.deaths !== "0";
              return (
                <div key={i} style={{
                  minWidth: "220px", maxWidth: "250px", flexShrink: 0,
                  backgroundColor: "#080f1e",
                  border: `1px solid ${color}30`,
                  borderTop: `3px solid ${color}`,
                  borderRadius: "10px",
                  padding: "0.85rem 1rem",
                  display: "flex", flexDirection: "column", gap: "0.35rem",
                }}>
                  {item.disease && (
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 800, color,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      fontFamily: "monospace",
                    }}>
                      {item.disease}
                    </span>
                  )}
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#e2e8f0", lineHeight: 1.35 }}>
                    {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#e2e8f0", textDecoration: "none" }}>
                        {item.title.length > 65 ? item.title.slice(0, 63) + "…" : item.title}
                      </a>
                    ) : (
                      item.title.length > 65 ? item.title.slice(0, 63) + "…" : item.title
                    )}
                  </div>
                  {loc && <span style={{ fontSize: "0.63rem", color: "#64748b" }}>📍 {loc}</span>}
                  {(hasCases || hasDeaths) && (
                    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.63rem", marginTop: "0.1rem" }}>
                      {hasCases && <span style={{ color: "#fb923c" }}>Cases: <b>{item.cases}</b></span>}
                      {hasDeaths && <span style={{ color: "#f87171" }}>Deaths: <b>{item.deaths}</b></span>}
                    </div>
                  )}
                  <span style={{ fontSize: "0.58rem", color: "#1e3a5f", marginTop: "auto" }}>
                    {item.date ?? ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ minWidth: "220px", height: "110px", backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "10px", flexShrink: 0, opacity: 0.5 }} />
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
