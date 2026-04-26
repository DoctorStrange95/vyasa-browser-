"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface FeedbackItem {
  id: string;
  type: string;
  page: string;
  field?: string;
  message: string;
  currentValue?: string;
  suggestedValue?: string;
  submitterName?: string;
  submitterEmail?: string;
  timestamp: string;
  status: "open" | "reviewed" | "resolved";
  adminNote?: string;
}

const TYPE_LABELS: Record<string, string> = {
  wrong_data: "Wrong Data",
  missing_data: "Missing Data",
  new_hospital: "New Hospital",
  general: "General",
};

const STATUS_COLOR: Record<string, string> = {
  open: "#eab308",
  reviewed: "#6366f1",
  resolved: "#22c55e",
};

export default function FeedbackAdmin() {
  const [items, setItems]       = useState<FeedbackItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<string>("all");
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [note, setNote]         = useState("");

  useEffect(() => {
    fetch("/api/feedback").then((r) => r.json()).then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  async function updateStatus(id: string, status: string, adminNote?: string) {
    await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, adminNote }) });
    setItems((prev) => prev.map((f) => f.id === id ? { ...f, status: status as FeedbackItem["status"], adminNote: adminNote ?? f.adminNote } : f));
    setSelected(null);
  }

  const filtered = filter === "all" ? items : items.filter((f) => f.status === filter);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e", padding: "0" }}>
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/admin" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>← Admin</Link>
        <span style={{ color: "#1e3a5f" }}>|</span>
        <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.95rem" }}>Feedback & Reports</span>
      </div>

      <div className="admin-inner-wrap" style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        {/* Filter bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {["all", "open", "reviewed", "resolved"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ backgroundColor: filter === f ? "#0d9488" : "#0f2040", border: `1px solid ${filter === f ? "#0d9488" : "#1e3a5f"}`, borderRadius: "6px", padding: "0.35rem 0.85rem", color: filter === f ? "#fff" : "#94a3b8", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {f} {f !== "all" && `(${items.filter((i) => i.status === f).length})`}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "#475569" }}>{filtered.length} items</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#475569" }}>Loading feedback…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "#0f2040", borderRadius: "12px", color: "#475569" }}>
            No feedback yet. Items submitted via the feedback button will appear here.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map((item) => (
              <div key={item.id} style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1.25rem", cursor: "pointer" }} onClick={() => { setSelected(item); setNote(item.adminNote ?? ""); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.68rem", backgroundColor: "#1e3a5f", borderRadius: "4px", padding: "0.15rem 0.5rem", color: "#94a3b8" }}>{TYPE_LABELS[item.type] ?? item.type}</span>
                    <span style={{ fontSize: "0.72rem", color: STATUS_COLOR[item.status], backgroundColor: `${STATUS_COLOR[item.status]}20`, borderRadius: "4px", padding: "0.15rem 0.5rem", textTransform: "capitalize" }}>{item.status}</span>
                    {item.page && <span style={{ fontSize: "0.7rem", color: "#475569" }}>{item.page}</span>}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#334155", fontFamily: "'IBM Plex Mono', monospace" }}>{new Date(item.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.4rem", lineHeight: 1.5 }}>{item.message}</p>
                {(item.currentValue || item.suggestedValue) && (
                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.78rem" }}>
                    {item.currentValue  && <span style={{ color: "#ef4444" }}>Current: {item.currentValue}</span>}
                    {item.suggestedValue && <span style={{ color: "#22c55e" }}>Suggested: {item.suggestedValue}</span>}
                  </div>
                )}
                {item.submitterName && <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", color: "#475569" }}>From: {item.submitterName}{item.submitterEmail ? ` · ${item.submitterEmail}` : ""}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "#00000080", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", zIndex: 50 }} onClick={() => setSelected(null)}>
          <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "16px", padding: "2rem", maxWidth: "560px", width: "100%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>Feedback Detail</h3>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <Row label="Type" value={TYPE_LABELS[selected.type] ?? selected.type} />
              <Row label="Page" value={selected.page || "—"} />
              {selected.field && <Row label="Field" value={selected.field} />}
              <Row label="Message" value={selected.message} />
              {selected.currentValue  && <Row label="Current Value" value={selected.currentValue} color="#ef4444" />}
              {selected.suggestedValue && <Row label="Suggested Value" value={selected.suggestedValue} color="#22c55e" />}
              {selected.submitterName  && <Row label="Submitted by" value={`${selected.submitterName}${selected.submitterEmail ? ` (${selected.submitterEmail})` : ""}`} />}
              <Row label="Submitted at" value={new Date(selected.timestamp).toLocaleString("en-IN")} />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Admin Note</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add an internal note…" style={{ width: "100%", backgroundColor: "#070f1e", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.65rem", color: "#e2e8f0", fontSize: "0.85rem", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button onClick={() => updateStatus(selected.id, "reviewed", note)} style={btnStyle("#6366f1")}>Mark Reviewed</button>
              <button onClick={() => updateStatus(selected.id, "resolved", note)} style={btnStyle("#0d9488")}>Mark Resolved</button>
              <button onClick={() => updateStatus(selected.id, "open", note)} style={btnStyle("#334155")}>Reopen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", gap: "1rem", fontSize: "0.82rem" }}>
      <span style={{ color: "#475569", minWidth: "120px", flexShrink: 0 }}>{label}</span>
      <span style={{ color: color ?? "#94a3b8" }}>{value}</span>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return { backgroundColor: bg, border: "none", borderRadius: "7px", padding: "0.55rem 1.1rem", color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
}
