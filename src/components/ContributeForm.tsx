"use client";
import { useState, useRef } from "react";
import states from "@/data/states.json";

type UploadStatus = "idle" | "uploading" | "done" | "error";

interface ExtractedMetric {
  name: string;
  value: number;
  unit: string;
  confidence: "high" | "medium" | "low";
  note?: string;
}

interface ExtractResult {
  state?: string;
  district?: string;
  year?: string;
  metrics?: ExtractedMetric[];
  summary?: string;
  raw?: string;
}

const CONFIDENCE_COLOR = { high: "#22c55e", medium: "#eab308", low: "#f97316" };
const ACCEPT = ".pdf,.csv,.xlsx,.xls,.ods,.jpg,.jpeg,.png,.webp,.gif";

export default function ContributeForm() {
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [state,       setState]       = useState("");
  const [district,    setDistrict]    = useState("");
  const [description, setDescription] = useState("");
  const [file,        setFile]        = useState<File | null>(null);
  const [status,      setStatus]      = useState<UploadStatus>("idle");
  const [result,      setResult]      = useState<ExtractResult | null>(null);
  const [errMsg,      setErrMsg]      = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const stateSlug = states.find(s => s.name === state)?.slug ?? "";

  async function submit() {
    if (!file || !state) return;
    setStatus("uploading");
    try {
      const form = new FormData();
      form.append("file",        file);
      form.append("name",        name);
      form.append("email",       email);
      form.append("state",       stateSlug);
      form.append("district",    district);
      form.append("description", description);

      const res  = await fetch("/api/contribute", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? "Upload failed"); setStatus("error"); return; }
      setResult(data.extractedData as ExtractResult);
      setStatus("done");
    } catch {
      setErrMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle"); setResult(null); setFile(null); setDescription("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", backgroundColor: "#080f1e", border: "1px solid #1e3a5f",
    borderRadius: "8px", color: "#e2e8f0", fontSize: "0.85rem",
    padding: "0.6rem 0.85rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  /* ── Done state: show extracted preview ─────────────────── */
  if (status === "done" && result) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "1.75rem" }}>✅</span>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#22c55e" }}>Submitted for Review</div>
            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>An admin will review the extracted data before publishing.</div>
          </div>
        </div>

        {result.summary && (
          <div style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.4rem" }}>AI Summary</div>
            <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{result.summary}</p>
          </div>
        )}

        {result.metrics && result.metrics.length > 0 && (
          <div style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>
              {result.metrics.length} Metrics Extracted
            </div>
            {result.metrics.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: i < result.metrics!.length - 1 ? "1px solid #0a1628" : "none" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#e2e8f0", textTransform: "capitalize" }}>{m.name.replace(/_/g, " ")}</span>
                  {m.note && <div style={{ fontSize: "0.62rem", color: "#475569" }}>{m.note}</div>}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{m.unit}</span>
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2dd4bf", fontFamily: "monospace" }}>{m.value}</span>
                  <span style={{ fontSize: "0.58rem", backgroundColor: CONFIDENCE_COLOR[m.confidence] + "20", color: CONFIDENCE_COLOR[m.confidence], borderRadius: "3px", padding: "0.1rem 0.35rem" }}>
                    {m.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={reset} style={{ width: "100%", padding: "0.7rem", backgroundColor: "#0d948820", border: "1px solid #0d948840", color: "#2dd4bf", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "0.85rem" }}>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Identity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.35rem" }}>Your Name</label>
          <input style={inputStyle} placeholder="Dr. Priya Sharma" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.35rem" }}>Email (optional)</label>
          <input style={inputStyle} type="email" placeholder="name@org.in" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>

      {/* Location */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.35rem" }}>State / UT <span style={{ color: "#ef4444" }}>*</span></label>
          <select style={{ ...inputStyle, cursor: "pointer" }} value={state} onChange={e => setState(e.target.value)}>
            <option value="">Select state…</option>
            {states.map(s => <option key={s.slug} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.35rem" }}>District (optional)</label>
          <input style={inputStyle} placeholder="e.g. Pune, Wayanad…" value={district} onChange={e => setDistrict(e.target.value)} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.35rem" }}>What does this document contain?</label>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }}
          placeholder="e.g. District-level NFHS-5 report for Wayanad. Contains IMR, vaccination and stunting data for 2021."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* File upload */}
      <div>
        <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.35rem" }}>Upload File <span style={{ color: "#ef4444" }}>*</span></label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? "#2dd4bf" : "#1e3a5f"}`,
            borderRadius: "10px", padding: "1.5rem", textAlign: "center",
            cursor: "pointer", backgroundColor: file ? "#0d948808" : "#080f1e",
            transition: "all 0.15s",
          }}
        >
          {file ? (
            <div>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>
                {file.name.endsWith(".pdf") ? "📄" : file.name.match(/\.(csv|xlsx|xls|ods)$/) ? "📊" : "🖼️"}
              </div>
              <div style={{ fontSize: "0.82rem", color: "#2dd4bf", fontWeight: 600 }}>{file.name}</div>
              <div style={{ fontSize: "0.68rem", color: "#475569" }}>{(file.size / 1024).toFixed(0)} KB</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>📎</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Click to upload</div>
              <div style={{ fontSize: "0.68rem", color: "#334155", marginTop: "0.2rem" }}>PDF · CSV · Excel · Images</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>

      {status === "error" && (
        <div style={{ fontSize: "0.8rem", color: "#f87171", backgroundColor: "#ef444415", border: "1px solid #ef444430", borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
          ⚠ {errMsg}
        </div>
      )}

      <button
        onClick={submit}
        disabled={!file || !state || status === "uploading"}
        style={{
          padding: "0.75rem", borderRadius: "9px", fontFamily: "inherit", fontWeight: 700,
          fontSize: "0.9rem", cursor: (!file || !state) ? "not-allowed" : "pointer",
          backgroundColor: (!file || !state) ? "#0a1628" : "#0d9488",
          color: (!file || !state) ? "#334155" : "#fff",
          border: "none", transition: "all 0.15s",
        }}
      >
        {status === "uploading" ? "🔄 AI is reading your document…" : "Submit for Review →"}
      </button>

      <p style={{ fontSize: "0.68rem", color: "#334155", textAlign: "center", margin: 0 }}>
        Your submission is reviewed by an admin before any data is published.
      </p>
    </div>
  );
}
