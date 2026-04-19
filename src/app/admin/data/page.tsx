"use client";
import { useState } from "react";
import Link from "next/link";

type Section = "states" | "national" | "cities";

export default function DataAdmin() {
  const [section, setSection] = useState<Section>("states");
  const [jsonText, setJsonText]   = useState("");
  const [preview, setPreview]     = useState<object | null>(null);
  const [parseError, setParseError] = useState("");
  const [status, setStatus]       = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [message, setMessage]     = useState("");

  function handleParse() {
    setParseError("");
    setPreview(null);
    try {
      const parsed = JSON.parse(jsonText);
      setPreview(parsed);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  async function handleSave() {
    if (!preview) return;
    setStatus("saving");
    const res = await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data: preview }),
    });
    const d = await res.json();
    if (d.ok) { setStatus("ok"); setMessage(d.message ?? "Saved successfully"); }
    else { setStatus("error"); setMessage(d.error ?? "Save failed"); }
  }

  const sectionDesc: Record<Section, string> = {
    states:   "36 states/UTs — IMR, birth rate, death rate, vaccination, stunting, ANC, anaemia etc.",
    national: "National aggregate stats shown in the homepage ticker and national overview.",
    cities:   "213 cities with lat/lng, district, state, AQI source config.",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/admin" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>← Admin</Link>
        <span style={{ color: "#1e3a5f" }}>|</span>
        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>Upload Health Data</span>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        {/* Warning banner */}
        <div style={{ backgroundColor: "#eab30815", border: "1px solid #eab30840", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "2rem", fontSize: "0.82rem", color: "#eab308" }}>
          ⚠ Changes here update the live JSON data files served to all users. Always validate JSON before saving. Invalid schema may break pages.
        </div>

        {/* Section selector */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {(["states", "national", "cities"] as Section[]).map(s => (
            <button key={s} onClick={() => { setSection(s); setPreview(null); setParseError(""); setStatus("idle"); }} style={{ backgroundColor: section === s ? "#0d9488" : "#0f2040", border: `1px solid ${section === s ? "#0d9488" : "#1e3a5f"}`, borderRadius: "6px", padding: "0.35rem 0.9rem", color: section === s ? "#fff" : "#94a3b8", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {s === "national" ? "national.json" : `${s}.json`}
            </button>
          ))}
        </div>

        <p style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: "1.5rem" }}>{sectionDesc[section]}</p>

        {/* Download current */}
        <div style={{ marginBottom: "1.25rem" }}>
          <a href={`/api/admin/data?section=${section}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "#2dd4bf", textDecoration: "none", backgroundColor: "#0d948815", border: "1px solid #0d948830", borderRadius: "6px", padding: "0.35rem 0.85rem" }}>
            ↓ Download current {section}.json
          </a>
        </div>

        {/* Editor */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Paste updated JSON
          </label>
          <textarea
            value={jsonText}
            onChange={e => { setJsonText(e.target.value); setPreview(null); setParseError(""); setStatus("idle"); }}
            rows={16}
            placeholder={`Paste the full updated ${section}.json content here…`}
            style={{ width: "100%", backgroundColor: "#070f1e", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.85rem", color: "#e2e8f0", fontSize: "0.82rem", outline: "none", fontFamily: "'IBM Plex Mono', monospace", resize: "vertical", boxSizing: "border-box" }}
          />
        </div>

        {parseError && (
          <div style={{ backgroundColor: "#ef444415", border: "1px solid #ef444440", borderRadius: "8px", padding: "0.75rem 1rem", color: "#ef4444", fontSize: "0.8rem", marginBottom: "1rem", fontFamily: "'IBM Plex Mono', monospace" }}>
            JSON Error: {parseError}
          </div>
        )}

        {preview && (
          <div style={{ backgroundColor: "#0d948815", border: "1px solid #0d948840", borderRadius: "8px", padding: "0.75rem 1rem", color: "#2dd4bf", fontSize: "0.8rem", marginBottom: "1rem" }}>
            ✓ Valid JSON — {Array.isArray(preview) ? `${(preview as unknown[]).length} items` : `${Object.keys(preview).length} keys`} parsed successfully. Ready to save.
          </div>
        )}

        {(status === "ok" || status === "error") && (
          <div style={{ backgroundColor: status === "ok" ? "#22c55e15" : "#ef444415", border: `1px solid ${status === "ok" ? "#22c55e40" : "#ef444440"}`, borderRadius: "8px", padding: "0.75rem 1rem", color: status === "ok" ? "#22c55e" : "#ef4444", fontSize: "0.8rem", marginBottom: "1rem" }}>
            {status === "ok" ? "✓" : "✗"} {message}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleParse} disabled={!jsonText.trim()} style={{ backgroundColor: "#1e3a5f", border: "1px solid #2d5a8e", borderRadius: "8px", padding: "0.65rem 1.5rem", color: "#94a3b8", fontWeight: 600, cursor: jsonText.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: "0.9rem" }}>
            Validate JSON
          </button>
          <button onClick={handleSave} disabled={!preview || status === "saving"} style={{ backgroundColor: preview ? "#0d9488" : "#0a4f4a", border: "none", borderRadius: "8px", padding: "0.65rem 1.5rem", color: "#fff", fontWeight: 600, cursor: preview ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: "0.9rem", opacity: status === "saving" ? 0.7 : 1 }}>
            {status === "saving" ? "Saving…" : "Save & Publish"}
          </button>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: "3rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: "1rem", fontSize: "0.88rem" }}>How to update data</div>
          <ol style={{ color: "#64748b", fontSize: "0.8rem", lineHeight: 2, paddingLeft: "1.25rem", margin: 0 }}>
            <li>Click &quot;Download current&quot; to get the existing JSON file.</li>
            <li>Edit the values in a text editor or spreadsheet → export as JSON.</li>
            <li>Paste the full updated JSON above and click <strong style={{ color: "#94a3b8" }}>Validate JSON</strong>.</li>
            <li>If valid, click <strong style={{ color: "#94a3b8" }}>Save &amp; Publish</strong> — changes go live immediately.</li>
            <li>The daily cron at 02:00 UTC also refreshes AQI and checks for SRS updates automatically.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
