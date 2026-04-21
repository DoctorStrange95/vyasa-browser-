"use client";
import { useState } from "react";

/* ── Raw Firestore row (all unknown) ─────────────────────────────────────── */
interface Sub {
  _id: string;
  [key: string]: unknown;
}

/* ── Strongly typed view model ───────────────────────────────────────────── */
interface TSub {
  _id: string;
  submitterName: string;
  submitterEmail: string;
  state: string;
  district: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedData: string;
  rawTextPreview: string;
  status: string;
  submittedAt: string;
  rejectionReason: string;
}

function toTyped(s: Sub): TSub {
  return {
    _id:             s._id,
    submitterName:   String(s.submitterName  ?? ""),
    submitterEmail:  String(s.submitterEmail ?? ""),
    state:           String(s.state          ?? ""),
    district:        String(s.district       ?? ""),
    fileName:        String(s.fileName       ?? ""),
    fileType:        String(s.fileType       ?? ""),
    fileSize:        Number(s.fileSize       ?? 0),
    extractedData:   String(s.extractedData  ?? "{}"),
    rawTextPreview:  String(s.rawTextPreview ?? ""),
    status:          String(s.status         ?? "pending"),
    submittedAt:     String(s.submittedAt    ?? ""),
    rejectionReason: String(s.rejectionReason ?? ""),
  };
}

/* ── Extracted AI data ────────────────────────────────────────────────────── */
interface ExtractedMetric {
  name: string; value: number; unit: string;
  confidence: "high" | "medium" | "low"; note?: string;
}
interface Extracted {
  state?: string; district?: string; year?: string;
  metrics?: ExtractedMetric[]; summary?: string;
}

const CONF_COLOR: Record<string, string> = { high: "#22c55e", medium: "#eab308", low: "#f97316" };

function parseExtracted(raw: string): Extracted {
  try { return JSON.parse(raw) as Extracted; } catch { return {}; }
}

/* ── Card component (uses TSub — fully typed) ────────────────────────────── */
function SubCard({
  sub, isOpen, loading, reason,
  onToggle, onReasonChange, onApprove, onReject,
}: {
  sub: TSub;
  isOpen: boolean;
  loading: boolean;
  reason: string;
  onToggle: () => void;
  onReasonChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const parsed  = parseExtracted(sub.extractedData);
  const statusC = sub.status === "approved" ? "#22c55e" : sub.status === "rejected" ? "#ef4444" : "#eab308";

  return (
    <div style={{ backgroundColor: "#0a1628", borderLeft: `4px solid ${statusC}`, borderRadius: "10px", overflow: "hidden", border: "1px solid #1e3a5f" }}>

      {/* Header */}
      <div onClick={onToggle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", cursor: "pointer" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e2e8f0" }}>{sub.fileName}</span>
            <span style={{ fontSize: "0.62rem", backgroundColor: statusC + "20", color: statusC, borderRadius: "4px", padding: "0.1rem 0.45rem", fontWeight: 600, textTransform: "capitalize" }}>{sub.status}</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem" }}>
            {sub.submitterName} · {sub.state}{sub.district ? ` / ${sub.district}` : ""}
            {" · "}{new Date(sub.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          {parsed.metrics && <div style={{ fontSize: "0.68rem", color: "#334155", marginTop: "0.15rem" }}>{parsed.metrics.length} metrics extracted</div>}
        </div>
        <span style={{ fontSize: "0.75rem", color: "#475569", marginLeft: "1rem" }}>{isOpen ? "▲" : "▼"}</span>
      </div>

      {/* Expanded detail */}
      {isOpen && (
        <div style={{ borderTop: "1px solid #1e3a5f", padding: "1.25rem" }}>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem", marginBottom: "1rem" }}>
            {([
              ["Submitter", sub.submitterName],
              ["Email",     sub.submitterEmail],
              ["State",     sub.state],
              ["District",  sub.district || "—"],
              ["File type", sub.fileType.toUpperCase()],
              ["File size", `${Math.round(sub.fileSize / 1024)} KB`],
            ] as [string, string][]).map(([lbl, val]) => (
              <div key={lbl} style={{ backgroundColor: "#080f1e", borderRadius: "7px", padding: "0.6rem 0.85rem" }}>
                <div style={{ fontSize: "0.6rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lbl}</div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.1rem", wordBreak: "break-all" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {parsed.summary && (
            <div style={{ backgroundColor: "#080f1e", borderRadius: "8px", padding: "0.85rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.62rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.4rem" }}>AI Summary</div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>{parsed.summary}</p>
            </div>
          )}

          {/* Metrics */}
          {parsed.metrics && parsed.metrics.length > 0 && (
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.62rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>Extracted Metrics</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
                {parsed.metrics.map((m, i) => (
                  <div key={i} style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "7px", padding: "0.65rem 0.85rem" }}>
                    <div style={{ fontSize: "0.65rem", color: "#475569", textTransform: "capitalize", marginBottom: "0.2rem" }}>{m.name.replace(/_/g, " ")}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "#2dd4bf", fontFamily: "monospace" }}>{m.value}</span>
                      <span style={{ fontSize: "0.68rem", color: "#475569" }}>{m.unit}</span>
                      <span style={{ marginLeft: "auto", fontSize: "0.58rem", backgroundColor: (CONF_COLOR[m.confidence] ?? "#94a3b8") + "20", color: CONF_COLOR[m.confidence] ?? "#94a3b8", borderRadius: "3px", padding: "0.05rem 0.3rem" }}>{m.confidence}</span>
                    </div>
                    {m.note && <div style={{ fontSize: "0.6rem", color: "#334155", marginTop: "0.2rem", lineHeight: 1.4 }}>{m.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw preview */}
          {sub.rawTextPreview && (
            <details style={{ marginBottom: "1.25rem" }}>
              <summary style={{ fontSize: "0.72rem", color: "#334155", cursor: "pointer" }}>Raw text preview</summary>
              <pre style={{ fontSize: "0.68rem", color: "#334155", backgroundColor: "#060d1a", borderRadius: "6px", padding: "0.75rem", marginTop: "0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: "120px", overflow: "auto" }}>
                {sub.rawTextPreview}
              </pre>
            </details>
          )}

          {/* Approve / Reject */}
          {sub.status === "pending" && (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>Rejection reason (optional)</label>
                <input value={reason} onChange={e => onReasonChange(e.target.value)}
                  placeholder="e.g. Data source unclear, year not specified…"
                  style={{ width: "100%", backgroundColor: "#060d1a", border: "1px solid #1e3a5f", borderRadius: "7px", color: "#e2e8f0", fontSize: "0.8rem", padding: "0.5rem 0.75rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <button onClick={onApprove} disabled={loading}
                style={{ padding: "0.55rem 1.5rem", backgroundColor: "#22c55e20", border: "1px solid #22c55e50", color: "#22c55e", borderRadius: "7px", fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                {loading ? "…" : "✓ Approve"}
              </button>
              <button onClick={onReject} disabled={loading}
                style={{ padding: "0.55rem 1.5rem", backgroundColor: "#ef444420", border: "1px solid #ef444450", color: "#f87171", borderRadius: "7px", fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                {loading ? "…" : "✕ Reject"}
              </button>
            </div>
          )}

          {sub.status === "rejected" && sub.rejectionReason && (
            <div style={{ fontSize: "0.78rem", color: "#f87171", backgroundColor: "#ef444410", borderRadius: "7px", padding: "0.6rem 0.85rem" }}>
              Rejection reason: {sub.rejectionReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main reviewer ────────────────────────────────────────────────────────── */
export default function SubmissionReviewer({
  pending, reviewed,
}: { pending: Sub[]; reviewed: Sub[] }) {
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [reason,    setReason]    = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [localList, setLocalList] = useState({ pending, reviewed });

  async function review(id: string, action: "approve" | "reject") {
    setLoadingId(id);
    await fetch("/api/admin/review-submission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reason: action === "reject" ? reason : undefined }),
    });
    const item = localList.pending.find(s => s._id === id);
    if (item) {
      setLocalList(prev => ({
        pending:  prev.pending.filter(s => s._id !== id),
        reviewed: [{ ...item, status: action === "approve" ? "approved" : "rejected", rejectionReason: reason }, ...prev.reviewed],
      }));
    }
    setLoadingId(null); setExpanded(null); setReason("");
  }

  const list = activeTab === "pending" ? localList.pending : localList.reviewed;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {(["pending", "reviewed"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: "0.5rem 1.25rem", borderRadius: "7px", fontFamily: "inherit",
            fontSize: "0.82rem", fontWeight: activeTab === t ? 700 : 400, border: "none",
            background: activeTab === t ? "#0f2040" : "transparent",
            color: activeTab === t ? "#e2e8f0" : "#475569", cursor: "pointer",
          }}>
            {t === "pending" ? `Pending (${localList.pending.length})` : `Reviewed (${localList.reviewed.length})`}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", color: "#334155" }}>
          {activeTab === "pending" ? "No pending submissions. 🎉" : "No reviewed submissions yet."}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {list.map(s => (
          <SubCard
            key={s._id}
            sub={toTyped(s)}
            isOpen={expanded === s._id}
            loading={loadingId === s._id}
            reason={reason}
            onToggle={() => setExpanded(expanded === s._id ? null : s._id)}
            onReasonChange={setReason}
            onApprove={() => review(s._id, "approve")}
            onReject={() => review(s._id, "reject")}
          />
        ))}
      </div>
    </div>
  );
}
