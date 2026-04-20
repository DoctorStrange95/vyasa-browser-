"use client";
import { useEffect, useState, useCallback } from "react";

interface PHItem {
  type: "Outbreak" | "Program" | "Policy" | "Infrastructure";
  title: string;
  disease?: string;
  program?: string;
  location: { state?: string; district?: string; village?: string };
  summary: string;
  cases?: number;
  deaths?: number;
  date?: string;
  source: string;
  sourceUrl?: string;
  confidence: "High" | "Medium" | "Low";
}

interface FeedData {
  refreshedAt: string | null;
  items: PHItem[];
  sources: string[];
  errors: string[];
  fromCache?: boolean;
  cacheAgeHours?: number;
}

type Tab = "All" | "Outbreak" | "Program" | "Policy" | "Infrastructure";
const TABS: Tab[] = ["All", "Outbreak", "Program", "Policy", "Infrastructure"];

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Outbreak:       { bg: "#ef444415", border: "#ef444440", text: "#f87171" },
  Program:        { bg: "#0d948815", border: "#0d948840", text: "#2dd4bf" },
  Policy:         { bg: "#6366f115", border: "#6366f140", text: "#818cf8" },
  Infrastructure: { bg: "#eab30815", border: "#eab30840", text: "#fcd34d" },
};

const CONF_COLORS: Record<string, { bg: string; text: string }> = {
  High:   { bg: "#16a34a20", text: "#4ade80" },
  Medium: { bg: "#d9770620", text: "#fb923c" },
  Low:    { bg: "#64748b20", text: "#94a3b8" },
};

function LocationChips({ loc }: { loc: PHItem["location"] }) {
  const parts = [loc.state, loc.district, loc.village].filter(Boolean);
  if (!parts.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.4rem" }}>
      {parts.map((p) => (
        <span key={p} style={{ fontSize: "0.65rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "4px", padding: "0.1rem 0.4rem", color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace" }}>
          📍 {p}
        </span>
      ))}
    </div>
  );
}

function ItemCard({ item }: { item: PHItem }) {
  const tc = TYPE_COLORS[item.type] ?? TYPE_COLORS.Policy;
  const cc = CONF_COLORS[item.confidence] ?? CONF_COLORS.Low;
  const dateStr = item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* Top row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, backgroundColor: tc.bg, border: `1px solid ${tc.border}`, color: tc.text, borderRadius: "4px", padding: "0.15rem 0.5rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {item.type}
        </span>
        {(item.disease || item.program) && (
          <span style={{ fontSize: "0.7rem", color: "#2dd4bf", fontFamily: "'IBM Plex Mono', monospace" }}>
            {item.disease ?? item.program}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "0.6rem", backgroundColor: cc.bg, color: cc.text, borderRadius: "3px", padding: "0.1rem 0.4rem", fontFamily: "'IBM Plex Mono', monospace" }}>
          {item.confidence}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 }}>
        {item.sourceUrl ? (
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#e2e8f0", textDecoration: "none" }}>
            {item.title}
          </a>
        ) : item.title}
      </div>

      {/* Summary */}
      <div style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>{item.summary}</div>

      {/* Stats row */}
      {(item.cases != null || item.deaths != null) && (
        <div style={{ display: "flex", gap: "1rem" }}>
          {item.cases != null && (
            <span style={{ fontSize: "0.72rem", color: "#fb923c" }}>
              Cases: <strong>{item.cases.toLocaleString("en-IN")}</strong>
            </span>
          )}
          {item.deaths != null && (
            <span style={{ fontSize: "0.72rem", color: "#f87171" }}>
              Deaths: <strong>{item.deaths.toLocaleString("en-IN")}</strong>
            </span>
          )}
        </div>
      )}

      <LocationChips loc={item.location} />

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.2rem" }}>
        <span style={{ fontSize: "0.65rem", color: "#475569" }}>{item.source}</span>
        {dateStr && <span style={{ fontSize: "0.65rem", color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>{dateStr}</span>}
      </div>
    </div>
  );
}

export default function PHIntelligenceFeed() {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/ph-intelligence${refresh ? "?refresh=1" : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: FeedData = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = data?.items.filter((i) => tab === "All" || i.type === tab) ?? [];

  const counts: Record<Tab, number> = {
    All: data?.items.length ?? 0,
    Outbreak: data?.items.filter((i) => i.type === "Outbreak").length ?? 0,
    Program: data?.items.filter((i) => i.type === "Program").length ?? 0,
    Policy: data?.items.filter((i) => i.type === "Policy").length ?? 0,
    Infrastructure: data?.items.filter((i) => i.type === "Infrastructure").length ?? 0,
  };

  return (
    <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444", boxShadow: "0 0 6px #ef4444", animation: "pulse 2s infinite" }} />
            <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0 }}>
              Public Health Intelligence
            </h2>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
            Real-time outbreak alerts, program updates &amp; policy signals · PIB · MoHFW · NHP · IDSP
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {data?.refreshedAt && (
            <span style={{ fontSize: "0.68rem", color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>
              Updated {new Date(data.refreshedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={loading}
            style={{ fontSize: "0.75rem", backgroundColor: "transparent", border: "1px solid #1e3a5f", color: "#94a3b8", borderRadius: "6px", padding: "0.35rem 0.75rem", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {TABS.map((t) => {
          const active = tab === t;
          const tc = t === "All" ? null : TYPE_COLORS[t];
          return (
            <button key={t} onClick={() => setTab(t)}
              style={{
                fontSize: "0.78rem", fontWeight: active ? 700 : 400,
                backgroundColor: active ? (tc?.bg ?? "#0d948820") : "transparent",
                border: `1px solid ${active ? (tc?.border ?? "#0d948840") : "#1e3a5f"}`,
                color: active ? (tc?.text ?? "#2dd4bf") : "#64748b",
                borderRadius: "6px", padding: "0.3rem 0.8rem",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}>
              {t} {counts[t] > 0 && <span style={{ opacity: 0.7 }}>({counts[t]})</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {error && (
        <div style={{ backgroundColor: "#ef444415", border: "1px solid #ef444440", borderRadius: "8px", padding: "1rem", color: "#f87171", fontSize: "0.82rem", marginBottom: "1rem" }}>
          Could not load intelligence feed: {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: "140px", backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "10px", opacity: 0.5 }} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#475569", fontSize: "0.875rem" }}>
          No {tab === "All" ? "" : tab.toLowerCase() + " "}items found.
          {data?.items.length === 0 && " Try refreshing to fetch live data."}
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {filtered.map((item, i) => <ItemCard key={i} item={item} />)}
        </div>
      )}

      {/* Source attribution */}
      {data?.sources && data.sources.length > 0 && (
        <div style={{ marginTop: "1.5rem", fontSize: "0.7rem", color: "#334155" }}>
          Sources: {data.sources.join(" · ")}
        </div>
      )}
    </section>
  );
}
