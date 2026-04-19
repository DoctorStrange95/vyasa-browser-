"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Section = "states" | "national" | "cities";
type Source  = "aqi" | "phc" | "idsp" | "srs" | "all";

interface RefreshResult {
  ok: boolean;
  source: Source;
  elapsed_ms: number;
  timestamp: string;
  log: string[];
  errors: string[];
  results: Record<string, unknown>;
}

interface CacheStatus {
  idsp: {
    lastRefresh: string | null;
    diseaseRecords: number;
    outbreaks: number;
    nhpAlerts: number;
    hospitalBeds: number;
  };
}

const SOURCES: { id: Source; label: string; desc: string; icon: string; color: string }[] = [
  { id: "aqi",  label: "CPCB Air Quality",         desc: "PM2.5 data for all 213 cities via data.gov.in",    icon: "🌫", color: "#f97316" },
  { id: "phc",  label: "PHC/CHC Counts",            desc: "Primary & Community Health Centres via NHP API",   icon: "🏥", color: "#2dd4bf" },
  { id: "idsp", label: "IDSP Disease Surveillance", desc: "Outbreak alerts, disease burden via IDSP/NHP",     icon: "🦠", color: "#eab308" },
  { id: "srs",  label: "SRS Vital Statistics",      desc: "SRS 2023 update check via data.gov.in",            icon: "📊", color: "#6366f1" },
  { id: "all",  label: "Refresh All Sources",       desc: "Run all refreshes + revalidate all pages",         icon: "🔄", color: "#22c55e" },
];

export default function DataAdmin() {
  const [tab, setTab] = useState<"refresh" | "upload">("refresh");
  const [refreshing, setRefreshing] = useState<Source | null>(null);
  const [lastResult, setLastResult] = useState<RefreshResult | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [section, setSection] = useState<Section>("states");
  const [jsonText, setJsonText] = useState("");
  const [preview, setPreview] = useState<object | null>(null);
  const [parseError, setParseError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState("");

  const loadCacheStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/refresh");
      if (res.ok) setCacheStatus(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadCacheStatus(); }, [loadCacheStatus]);

  async function runRefresh(source: Source) {
    setRefreshing(source);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const data = await res.json();
      setLastResult(data);
      await loadCacheStatus();
    } catch (e) {
      setLastResult({ ok: false, source, elapsed_ms: 0, timestamp: new Date().toISOString(), log: [], errors: [`Network error: ${e}`], results: {} });
    } finally {
      setRefreshing(null);
    }
  }

  function handleParse() {
    setParseError(""); setPreview(null);
    try { setPreview(JSON.parse(jsonText)); }
    catch (e: unknown) { setParseError(e instanceof Error ? e.message : "Invalid JSON"); }
  }

  async function handleUpload() {
    if (!preview) return;
    setUploadStatus("saving");
    const res = await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data: preview }),
    });
    const d = await res.json();
    if (d.ok) { setUploadStatus("ok"); setUploadMsg(d.message ?? "Saved."); }
    else { setUploadStatus("error"); setUploadMsg(d.error ?? "Failed."); }
  }

  const sectionDesc: Record<Section, string> = {
    states:   "36 states/UTs — IMR, birth/death rate, vaccination, stunting, anaemia etc.",
    national: "National aggregate stats shown in the homepage ticker.",
    cities:   "213 cities with lat/lng, district, state, AQI source config.",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>
      {/* Top bar */}
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/admin" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>← Admin</Link>
        <span style={{ color: "#1e3a5f" }}>|</span>
        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>Data Management</span>
        {/* Tab switcher */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          {(["refresh", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ backgroundColor: tab === t ? "#0d9488" : "transparent", border: `1px solid ${tab === t ? "#0d9488" : "#1e3a5f"}`, borderRadius: "6px", padding: "0.3rem 0.85rem", color: tab === t ? "#fff" : "#64748b", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {t === "refresh" ? "🔄 Refresh Data" : "📤 Upload JSON"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 2rem" }}>

        {tab === "refresh" && (
          <>
            <div style={{ marginBottom: "1.75rem" }}>
              <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.3rem" }}>Data Source Refresh</h2>
              <p style={{ color: "#64748b", fontSize: "0.82rem" }}>
                All sources auto-refresh every 48 hours via cron. Use manual refresh to pull latest data immediately.
              </p>
            </div>

            {/* Cache status */}
            {cacheStatus && (
              <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.7rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Current Cache Status</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
                  {[
                    { l: "IDSP last refresh", v: cacheStatus.idsp.lastRefresh ? new Date(cacheStatus.idsp.lastRefresh).toLocaleString("en-IN") : "Never" },
                    { l: "Disease records",   v: String(cacheStatus.idsp.diseaseRecords) },
                    { l: "Outbreak alerts",   v: String(cacheStatus.idsp.outbreaks + cacheStatus.idsp.nhpAlerts) },
                    { l: "Hospital bed data", v: String(cacheStatus.idsp.hospitalBeds) + " states" },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <div style={{ fontSize: "0.65rem", color: "#475569", marginBottom: "0.15rem" }}>{l}</div>
                      <div className="font-data" style={{ fontSize: "0.88rem", color: "#2dd4bf" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {SOURCES.map(src => {
                const isRunning = refreshing === src.id;
                return (
                  <div key={src.id} style={{ backgroundColor: "#0f2040", border: `1px solid ${src.id === "all" ? src.color + "40" : "#1e3a5f"}`, borderRadius: "10px", padding: "1.1rem 1.5rem", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>{src.icon}</span>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.92rem", marginBottom: "0.15rem" }}>{src.label}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{src.desc}</div>
                    </div>
                    <button
                      onClick={() => runRefresh(src.id)}
                      disabled={!!refreshing}
                      style={{ backgroundColor: isRunning ? src.color + "40" : src.color + "20", border: `1px solid ${src.color}60`, borderRadius: "7px", padding: "0.5rem 1.25rem", color: isRunning ? src.color : src.color, fontSize: "0.82rem", fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}
                    >
                      {isRunning ? (
                        <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>↻</span> Running…</>
                      ) : "Refresh Now"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Last result */}
            {lastResult && (
              <div style={{ backgroundColor: "#0f2040", border: `1px solid ${lastResult.ok ? "#22c55e40" : "#ef444440"}`, borderRadius: "10px", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ fontWeight: 600, color: lastResult.ok ? "#22c55e" : "#ef4444", fontSize: "0.92rem" }}>
                    {lastResult.ok ? "✓ Refresh complete" : "✗ Refresh had errors"} · {lastResult.elapsed_ms}ms
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#334155" }}>{new Date(lastResult.timestamp).toLocaleTimeString("en-IN")}</span>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {lastResult.log.map((l, i) => (
                    <div key={i} style={{ color: l.startsWith("✓") ? "#22c55e" : l.startsWith("⚠") ? "#eab308" : "#94a3b8" }}>{l}</div>
                  ))}
                  {lastResult.errors.map((e, i) => (
                    <div key={`e${i}`} style={{ color: "#ef4444" }}>{e}</div>
                  ))}
                </div>
              </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {tab === "upload" && (
          <>
            <div style={{ backgroundColor: "#eab30815", border: "1px solid #eab30840", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.5rem", fontSize: "0.82rem", color: "#eab308" }}>
              ⚠ Changes here update the live JSON files served to all users. Validate before saving.
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {(["states", "national", "cities"] as Section[]).map(s => (
                <button key={s} onClick={() => { setSection(s); setPreview(null); setParseError(""); setUploadStatus("idle"); }} style={{ backgroundColor: section === s ? "#0d9488" : "#0f2040", border: `1px solid ${section === s ? "#0d9488" : "#1e3a5f"}`, borderRadius: "6px", padding: "0.35rem 0.9rem", color: section === s ? "#fff" : "#94a3b8", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
                  {s}.json
                </button>
              ))}
            </div>
            <p style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: "1rem" }}>{sectionDesc[section]}</p>
            <div style={{ marginBottom: "1rem" }}>
              <a href={`/api/admin/data?section=${section}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "#2dd4bf", textDecoration: "none", backgroundColor: "#0d948815", border: "1px solid #0d948830", borderRadius: "6px", padding: "0.35rem 0.85rem" }}>
                ↓ Download current {section}.json
              </a>
            </div>
            <textarea value={jsonText} onChange={e => { setJsonText(e.target.value); setPreview(null); setParseError(""); setUploadStatus("idle"); }} rows={14} placeholder={`Paste updated ${section}.json here…`} style={{ width: "100%", backgroundColor: "#070f1e", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.85rem", color: "#e2e8f0", fontSize: "0.82rem", outline: "none", fontFamily: "'IBM Plex Mono', monospace", resize: "vertical", boxSizing: "border-box", marginBottom: "0.75rem" }} />
            {parseError && <div style={{ backgroundColor: "#ef444415", border: "1px solid #ef444440", borderRadius: "8px", padding: "0.75rem 1rem", color: "#ef4444", fontSize: "0.78rem", marginBottom: "0.75rem", fontFamily: "'IBM Plex Mono', monospace" }}>JSON Error: {parseError}</div>}
            {preview && <div style={{ backgroundColor: "#0d948815", border: "1px solid #0d948840", borderRadius: "8px", padding: "0.75rem 1rem", color: "#2dd4bf", fontSize: "0.78rem", marginBottom: "0.75rem" }}>✓ Valid — {Array.isArray(preview) ? `${(preview as unknown[]).length} items` : `${Object.keys(preview).length} keys`}</div>}
            {(uploadStatus === "ok" || uploadStatus === "error") && <div style={{ backgroundColor: uploadStatus === "ok" ? "#22c55e15" : "#ef444415", border: `1px solid ${uploadStatus === "ok" ? "#22c55e40" : "#ef444440"}`, borderRadius: "8px", padding: "0.75rem 1rem", color: uploadStatus === "ok" ? "#22c55e" : "#ef4444", fontSize: "0.78rem", marginBottom: "0.75rem" }}>{uploadMsg}</div>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={handleParse} disabled={!jsonText.trim()} style={{ backgroundColor: "#1e3a5f", border: "1px solid #2d5a8e", borderRadius: "8px", padding: "0.65rem 1.5rem", color: "#94a3b8", fontWeight: 600, cursor: jsonText.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: "0.9rem" }}>Validate JSON</button>
              <button onClick={handleUpload} disabled={!preview || uploadStatus === "saving"} style={{ backgroundColor: preview ? "#0d9488" : "#0a4f4a", border: "none", borderRadius: "8px", padding: "0.65rem 1.5rem", color: "#fff", fontWeight: 600, cursor: preview ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: "0.9rem" }}>{uploadStatus === "saving" ? "Saving…" : "Save & Publish"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
