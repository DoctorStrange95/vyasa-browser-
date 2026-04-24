"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

const ISSUE_TYPES = [
  { value: "wrong_data",    label: "Wrong / Outdated Data" },
  { value: "missing_data",  label: "Missing Data" },
  { value: "new_hospital",  label: "Add a Hospital / PHC / CHC" },
  { value: "general",       label: "General" },
];

type Tab = "feedback" | "report";

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen]             = useState(false);
  const [tab, setTab]               = useState<Tab>("feedback");
  const [sent, setSent]             = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [feedback, setFeedback] = useState({
    name: "", email: "", phone: "", message: "", wantsToJoin: "" as "" | "yes" | "maybe" | "no",
  });
  const [report, setReport] = useState({
    type: "wrong_data", message: "", field: "", currentValue: "",
    suggestedValue: "", submitterName: "", submitterEmail: "",
  });

  if (pathname?.startsWith("/admin")) return null;

  function fch(k: string, v: string) { setFeedback(f => ({ ...f, [k]: v })); }
  function rch(k: string, v: string) { setReport(r => ({ ...r, [k]: v })); }

  function close() {
    setOpen(false);
    setSent(false);
    setFeedback({ name: "", email: "", phone: "", message: "", wantsToJoin: "" });
    setReport({ type: "wrong_data", message: "", field: "", currentValue: "", suggestedValue: "", submitterName: "", submitterEmail: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = tab === "feedback"
      ? { ...feedback, mode: "feedback", page: pathname }
      : { ...report, mode: "report", page: pathname };
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    setSent(true);
    setTimeout(close, 2800);
  }

  const canSubmit = tab === "feedback"
    ? feedback.name.trim() && feedback.email.trim() && feedback.message.trim()
    : report.message.trim();

  return (
    <>
      {/* Floating trigger — small pill */}
      <button
        onClick={() => setOpen(true)}
        title="Feedback or report an issue"
        style={{
          position: "fixed", bottom: "1.5rem", right: "1rem", zIndex: 40,
          backgroundColor: "#0d9488", border: "none", borderRadius: "50px",
          padding: "0.4rem 0.75rem", color: "#fff", fontSize: "0.7rem",
          fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px #0d948850",
          display: "flex", alignItems: "center", gap: "0.35rem", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: "0.8rem" }}>✏</span> Feedback
      </button>

      {/* Bottom-sheet modal */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "#00000088", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={close}
        >
          <div
            style={{ backgroundColor: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "16px 16px 0 0", padding: "1.25rem 1.25rem 2rem", width: "100%", maxWidth: "540px", maxHeight: "92dvh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            {sent ? (
              <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✓</div>
                <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "1.05rem" }}>Thank you!</div>
                <div style={{ color: "#64748b", fontSize: "0.82rem", marginTop: "0.4rem" }}>
                  {tab === "feedback" && feedback.wantsToJoin === "yes"
                    ? "We'll be in touch about Vyasa Platform soon."
                    : "Your message has been received."}
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                    {tab === "feedback" ? "Share Feedback" : "Report an Issue"}
                  </h3>
                  <button onClick={close} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.4rem", lineHeight: 1, padding: "0 0.25rem" }}>×</button>
                </div>

                {/* Tab switcher */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  {(["feedback", "report"] as Tab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{
                        flex: 1, padding: "0.45rem", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        border: tab === t ? "none" : "1px solid #1e3a5f",
                        backgroundColor: tab === t ? "#0d9488" : "transparent",
                        color: tab === t ? "#fff" : "#475569",
                      }}
                    >
                      {t === "feedback" ? "💬 Give Feedback" : "⚠️ Report Issue"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

                  {tab === "feedback" ? (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={lbl}>Name *</label>
                          <input type="text" required value={feedback.name} onChange={e => fch("name", e.target.value)} placeholder="Your name" style={inp} />
                        </div>
                        <div>
                          <label style={lbl}>Email *</label>
                          <input type="email" required value={feedback.email} onChange={e => fch("email", e.target.value)} placeholder="you@email.com" style={inp} />
                        </div>
                      </div>

                      <div>
                        <label style={lbl}>Phone <span style={{ color: "#334155", fontWeight: 400 }}>(optional)</span></label>
                        <input type="tel" value={feedback.phone} onChange={e => fch("phone", e.target.value)} placeholder="+91 98765 43210" style={inp} />
                      </div>

                      <div>
                        <label style={lbl}>Your Feedback *</label>
                        <textarea required value={feedback.message} onChange={e => fch("message", e.target.value)} rows={3} placeholder="Tell us what you think…" style={{ ...inp, resize: "vertical" }} />
                      </div>

                      {/* Join Vyasa platform */}
                      <div style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                        <div style={{ fontSize: "0.78rem", color: "#e2e8f0", fontWeight: 600, marginBottom: "0.15rem" }}>
                          Want to join the Vyasa Platform?
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#475569", marginBottom: "0.65rem" }}>
                          Get early access to our AI-powered public health intelligence tools.
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {(["yes", "maybe", "no"] as const).map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => fch("wantsToJoin", v)}
                              style={{
                                flex: 1, padding: "0.4rem 0.5rem", borderRadius: "7px", fontSize: "0.75rem",
                                fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                                border: feedback.wantsToJoin === v ? "none" : "1px solid #1e3a5f",
                                backgroundColor: feedback.wantsToJoin === v
                                  ? v === "yes" ? "#0d9488" : v === "maybe" ? "#6366f1" : "#334155"
                                  : "transparent",
                                color: feedback.wantsToJoin === v ? "#fff" : "#475569",
                              }}
                            >
                              {v === "yes" ? "Yes!" : v === "maybe" ? "Maybe" : "Not now"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label style={lbl}>Type of issue *</label>
                        <select value={report.type} onChange={e => rch("type", e.target.value)} style={inp}>
                          {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={lbl}>Message *</label>
                        <textarea value={report.message} onChange={e => rch("message", e.target.value)} required rows={3} placeholder="Describe the issue…" style={{ ...inp, resize: "vertical" }} />
                      </div>

                      {report.type === "wrong_data" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                          <div>
                            <label style={lbl}>Field (optional)</label>
                            <input type="text" value={report.field} onChange={e => rch("field", e.target.value)} placeholder="e.g. IMR" style={inp} />
                          </div>
                          <div>
                            <label style={lbl}>Current value</label>
                            <input type="text" value={report.currentValue} onChange={e => rch("currentValue", e.target.value)} style={inp} />
                          </div>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label style={lbl}>Correct value</label>
                            <input type="text" value={report.suggestedValue} onChange={e => rch("suggestedValue", e.target.value)} style={inp} />
                          </div>
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={lbl}>Your name (optional)</label>
                          <input type="text" value={report.submitterName} onChange={e => rch("submitterName", e.target.value)} style={inp} />
                        </div>
                        <div>
                          <label style={lbl}>Email (optional)</label>
                          <input type="email" value={report.submitterEmail} onChange={e => rch("submitterEmail", e.target.value)} style={inp} />
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ fontSize: "0.65rem", color: "#334155" }}>
                    Page: <span style={{ color: "#475569" }}>{pathname}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    style={{
                      backgroundColor: submitting || !canSubmit ? "#0a4040" : "#0d9488",
                      border: "none", borderRadius: "8px", padding: "0.7rem",
                      color: submitting || !canSubmit ? "#334155" : "#fff",
                      fontWeight: 600, cursor: submitting || !canSubmit ? "not-allowed" : "pointer",
                      fontFamily: "inherit", fontSize: "0.88rem", transition: "all 0.15s",
                    }}
                  >
                    {submitting ? "Sending…" : "Submit"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: "0.68rem", color: "#94a3b8",
  marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.06em",
};
const inp: React.CSSProperties = {
  width: "100%", backgroundColor: "#070f1e", border: "1px solid #1e3a5f",
  borderRadius: "7px", padding: "0.55rem 0.8rem", color: "#e2e8f0",
  fontSize: "0.85rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
