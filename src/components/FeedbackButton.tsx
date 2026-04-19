"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

const TYPES = [
  { value: "wrong_data",    label: "Wrong / Outdated Data" },
  { value: "missing_data",  label: "Missing Data" },
  { value: "new_hospital",  label: "Add a Hospital / PHC / CHC" },
  { value: "general",       label: "General Feedback" },
];

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen]           = useState(false);
  const [sent, setSent]           = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "wrong_data", message: "", field: "", currentValue: "",
    suggestedValue: "", submitterName: "", submitterEmail: "",
  });

  // Don't show on admin pages
  if (pathname?.startsWith("/admin")) return null;

  function ch(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, page: pathname }),
    });
    setSubmitting(false);
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); setForm({ type: "wrong_data", message: "", field: "", currentValue: "", suggestedValue: "", submitterName: "", submitterEmail: "" }); }, 2500);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="Report an issue or suggest a correction"
        style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 40, backgroundColor: "#0d9488", border: "none", borderRadius: "50px", padding: "0.6rem 1.1rem", color: "#fff", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px #0d948860", display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "inherit" }}
      >
        <span style={{ fontSize: "1rem" }}>✏</span> Report Issue
      </button>

      {/* Modal overlay */}
      {open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "#00000080", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }} onClick={() => setOpen(false)}>
          <div
            style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "16px 16px 0 0", padding: "2rem", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            {sent ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✓</div>
                <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "1.1rem" }}>Thank you!</div>
                <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.4rem" }}>Your feedback has been submitted.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>Report an Issue</h3>
                  <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1 }}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={lbl}>Type of issue *</label>
                    <select value={form.type} onChange={e => ch("type", e.target.value)} style={inp}>
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={lbl}>Message *</label>
                    <textarea value={form.message} onChange={e => ch("message", e.target.value)} required rows={3} placeholder="Describe the issue…" style={{ ...inp, resize: "vertical" }} />
                  </div>

                  {form.type === "wrong_data" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={lbl}>Field name (optional)</label>
                        <input type="text" value={form.field} onChange={e => ch("field", e.target.value)} placeholder="e.g. IMR, BirthRate" style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Current (wrong) value</label>
                        <input type="text" value={form.currentValue} onChange={e => ch("currentValue", e.target.value)} style={inp} />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={lbl}>Suggested (correct) value</label>
                        <input type="text" value={form.suggestedValue} onChange={e => ch("suggestedValue", e.target.value)} style={inp} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={lbl}>Your name (optional)</label>
                      <input type="text" value={form.submitterName} onChange={e => ch("submitterName", e.target.value)} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Email (optional)</label>
                      <input type="email" value={form.submitterEmail} onChange={e => ch("submitterEmail", e.target.value)} style={inp} />
                    </div>
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "#334155" }}>
                    Page: <span style={{ color: "#475569" }}>{pathname}</span>
                  </div>

                  <button type="submit" disabled={submitting || !form.message.trim()} style={{ backgroundColor: submitting ? "#0a7368" : "#0d9488", border: "none", borderRadius: "8px", padding: "0.75rem", color: "#fff", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "0.9rem" }}>
                    {submitting ? "Submitting…" : "Submit Feedback"}
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

const lbl: React.CSSProperties = { display: "block", fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" };
const inp: React.CSSProperties = { width: "100%", backgroundColor: "#070f1e", border: "1px solid #1e3a5f", borderRadius: "7px", padding: "0.6rem 0.8rem", color: "#e2e8f0", fontSize: "0.85rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
