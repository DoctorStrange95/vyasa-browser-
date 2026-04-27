"use client";
import { useState } from "react";
import Link from "next/link";

export default function AdminRefreshButton() {
  const [status, setStatus] = useState<"idle" | "running" | "ok" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);
  const [phiCount, setPhiCount] = useState<number | null>(null);

  async function trigger() {
    setStatus("running");
    setLog([]);
    try {
      const res = await fetch("/api/admin/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "all" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setLog([data.error ?? "Unknown error"]);
        return;
      }
      setStatus("ok");
      setLog(data.log ?? []);
      setPhiCount(data.results?.["ph-intelligence"]?.items ?? null);
    } catch (e) {
      setStatus("error");
      setLog([String(e)]);
    }
  }

  const colors: Record<typeof status, string> = {
    idle:    "#0d9488",
    running: "#475569",
    ok:      "#16a34a",
    error:   "#dc2626",
  };

  return (
    <div>
      <button
        onClick={trigger}
        disabled={status === "running"}
        style={{ backgroundColor: colors[status], color: "#fff", border: "none", borderRadius: "7px", padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, cursor: status === "running" ? "wait" : "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}
      >
        {status === "running" ? "Refreshing…" : status === "ok" ? "✓ Done" : status === "error" ? "✗ Failed" : "Trigger Now"}
      </button>
      {log.length > 0 && (
        <div style={{ marginTop: "0.75rem", background: "#060e1c", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.75rem", fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.7 }}>
          {log.map((l, i) => (
            <div key={i} style={{ color: l.startsWith("✗") ? "#fca5a5" : l.startsWith("⚠") ? "#fbbf24" : "#4ade80" }}>{l}</div>
          ))}
        </div>
      )}
      {status === "ok" && (
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link
            href="/admin/intelligence"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.45rem 0.9rem", fontSize: "0.78rem", color: "#2dd4bf", textDecoration: "none", fontWeight: 600 }}
          >
            🛰 Review Intelligence{phiCount !== null ? ` (${phiCount} items)` : ""} →
          </Link>
          <Link
            href="/admin/sources"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.45rem 0.9rem", fontSize: "0.78rem", color: "#94a3b8", textDecoration: "none", fontWeight: 500 }}
          >
            🗂 View Data Sources →
          </Link>
        </div>
      )}
    </div>
  );
}
