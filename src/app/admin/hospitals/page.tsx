"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import states from "@/data/states.json";

interface Hospital {
  id: string; name: string; type: string; address: string;
  district: string; state: string; stateSlug: string; pincode?: string;
  phone?: string; phone2?: string; lat?: number; lng?: number;
  services: string[]; beds?: number; doctors?: number;
  openHours?: string; website?: string;
  addedBy: string; addedAt: string; verified: boolean; notes?: string;
}

interface ImportPreview {
  columns: string[];
  preview: Record<string, unknown>[];
  count: number;
  stateSlug: string;
  stateName: string;
  saved?: boolean;
}

const TYPES = ["PHC", "CHC", "District Hospital", "Sub-Centre", "Ayushman Bharat", "Other"];
const DEFAULT_SERVICES: Record<string, string> = {
  PHC: "OPD, Vaccination, Maternal Care, Family Planning, Essential Medicines",
  CHC: "OPD, IPD (30 beds), Emergency, Surgical, Lab Tests, X-Ray, Vaccination",
  "District Hospital": "Emergency, Surgery, ICU, Maternity, Paediatrics, Blood Bank, Radiology, Pharmacy",
  "Sub-Centre": "Vaccination, Maternal Care, Health Education",
  "Ayushman Bharat": "",
  Other: "",
};

export default function HospitalsAdmin() {
  const [tab, setTab]             = useState<"list" | "import">("import");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ name: "", type: "PHC", address: "", district: "", stateSlug: "", pincode: "", phone: "", phone2: "", lat: "", lng: "", services: "", beds: "", doctors: "", openHours: "", website: "", addedBy: "Admin", notes: "" });

  const fileRef = useRef<HTMLInputElement>(null);

  type FileStatus = "pending" | "previewing" | "ready" | "saving" | "saved" | "error";
  interface FileEntry { file: File; status: FileStatus; preview?: ImportPreview; error?: string; }
  const [queue, setQueue]         = useState<FileEntry[]>([]);
  const [bulkRunning, setBulkRun] = useState(false);

  useEffect(() => {
    fetch("/api/admin/hospitals").then(r => r.json()).then(d => { setHospitals(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  function handleChange(k: string, v: string) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "type" && !f.services) next.services = DEFAULT_SERVICES[v] ?? "";
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stateObj = states.find(s => s.slug === form.stateSlug);
    const payload  = { ...form, state: stateObj?.name ?? form.stateSlug };
    const res = await fetch("/api/admin/hospitals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json();
    if (d.ok) {
      setHospitals(h => [d.hospital, ...h]);
      setShowForm(false);
      setForm({ name: "", type: "PHC", address: "", district: "", stateSlug: "", pincode: "", phone: "", phone2: "", lat: "", lng: "", services: "", beds: "", doctors: "", openHours: "", website: "", addedBy: "Admin", notes: "" });
    }
  }

  async function deleteHospital(id: string) {
    if (!confirm("Delete this facility?")) return;
    await fetch("/api/admin/hospitals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setHospitals(h => h.filter(x => x.id !== id));
  }

  function updateEntry(idx: number, patch: Partial<FileEntry>) {
    setQueue(q => q.map((e, i) => i === idx ? { ...e, ...patch } : e));
  }

  async function uploadOne(entry: FileEntry, idx: number, save: boolean): Promise<boolean> {
    updateEntry(idx, { status: save ? "saving" : "previewing" });
    const fd = new FormData();
    fd.append("file", entry.file);
    fd.append("save", save ? "true" : "false");
    try {
      const res  = await fetch("/api/admin/upload-hospitals", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { updateEntry(idx, { status: "error", error: data.error ?? "Upload failed" }); return false; }
      updateEntry(idx, { status: save ? "saved" : "ready", preview: data });
      return true;
    } catch {
      updateEntry(idx, { status: "error", error: "Network error" });
      return false;
    }
  }

  async function handleImportAll() {
    if (bulkRunning) return;
    setBulkRun(true);
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === "saved") continue;
      await uploadOne(queue[i], i, true);
    }
    setBulkRun(false);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/admin" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>← Admin</Link>
        <span style={{ color: "#1e3a5f" }}>|</span>
        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>Manage Health Centres</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          {(["import", "list"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ backgroundColor: tab === t ? "#0d9488" : "transparent", border: `1px solid ${tab === t ? "#0d9488" : "#1e3a5f"}`, borderRadius: "7px", padding: "0.4rem 1rem", color: tab === t ? "#fff" : "#64748b", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {t === "import" ? "Import XLS" : "Manual List"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 2rem" }}>

        {/* ── Import Tab ── */}
        {tab === "import" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.35rem" }}>Import Ayushman Bharat Hospital Data</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Select one or all 36 state .xls files at once — pan-India import supported.</div>
            </div>

            {/* Drop zone */}
            <div
              style={{ backgroundColor: "#0f2040", border: "2px dashed #1e3a5f", borderRadius: "12px", padding: "2rem", marginBottom: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).filter(f => f.name.match(/\.(xls|xlsx)$/i));
                if (files.length) setQueue(files.map(f => ({ file: f, status: "pending" })));
              }}
            >
              <div style={{ fontSize: "2rem" }}>📂</div>
              <input
                ref={fileRef}
                type="file"
                accept=".xls,.xlsx"
                multiple
                style={{ display: "none" }}
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) setQueue(files.map(f => ({ file: f, status: "pending" as FileStatus })));
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                style={{ backgroundColor: "#1e3a5f", border: "none", borderRadius: "8px", padding: "0.6rem 1.4rem", color: "#e2e8f0", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Choose files (select all 36 at once)
              </button>
              <div style={{ fontSize: "0.75rem", color: "#475569" }}>Or drag &amp; drop XLS files here</div>
            </div>

            {/* Queue list */}
            {queue.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{queue.length} file{queue.length > 1 ? "s" : ""} selected · {queue.filter(e => e.status === "saved").length} saved</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setQueue([])}
                      style={{ backgroundColor: "transparent", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.35rem 0.85rem", color: "#475569", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleImportAll}
                      disabled={bulkRunning}
                      style={{ backgroundColor: "#1d4ed8", border: "none", borderRadius: "7px", padding: "0.4rem 1.1rem", color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: bulkRunning ? "wait" : "pointer", fontFamily: "inherit", opacity: bulkRunning ? 0.7 : 1 }}
                    >
                      {bulkRunning ? "Importing…" : `Import All ${queue.length} States to Firestore`}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {queue.map((entry, idx) => {
                    const statusColor: Record<string, string> = { pending: "#475569", previewing: "#eab308", ready: "#2dd4bf", saving: "#eab308", saved: "#22c55e", error: "#ef4444" };
                    const statusLabel: Record<string, string> = { pending: "Pending", previewing: "Reading…", ready: "Ready", saving: "Saving…", saved: "Saved", error: "Error" };
                    const col = statusColor[entry.status] ?? "#475569";
                    return (
                      <div key={idx} style={{ backgroundColor: "#0f2040", border: `1px solid ${col}30`, borderLeft: `3px solid ${col}`, borderRadius: "8px", padding: "0.65rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.82rem", color: "#e2e8f0", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.file.name}</div>
                          {entry.preview && (
                            <div style={{ fontSize: "0.7rem", color: "#475569", marginTop: "0.15rem" }}>
                              {entry.preview.count.toLocaleString()} hospitals · {entry.preview.columns.length} columns
                            </div>
                          )}
                          {entry.error && <div style={{ fontSize: "0.7rem", color: "#ef4444", marginTop: "0.15rem" }}>{entry.error}</div>}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "0.65rem", backgroundColor: `${col}20`, color: col, border: `1px solid ${col}40`, borderRadius: "4px", padding: "0.1rem 0.45rem", fontWeight: 700 }}>
                            {statusLabel[entry.status] ?? entry.status}
                          </span>
                          {entry.status === "pending" && (
                            <button
                              onClick={() => uploadOne(entry, idx, true)}
                              style={{ backgroundColor: "transparent", border: "1px solid #1e3a5f", borderRadius: "5px", padding: "0.2rem 0.6rem", color: "#2dd4bf", fontSize: "0.68rem", cursor: "pointer", fontFamily: "inherit" }}
                            >
                              Save
                            </button>
                          )}
                          {entry.status === "error" && (
                            <button
                              onClick={() => uploadOne(entry, idx, true)}
                              style={{ backgroundColor: "transparent", border: "1px solid #ef444440", borderRadius: "5px", padding: "0.2rem 0.6rem", color: "#ef4444", fontSize: "0.68rem", cursor: "pointer", fontFamily: "inherit" }}
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Column preview for first ready/saved entry */}
            {(() => {
              const first = queue.find(e => e.preview && (e.status === "ready" || e.status === "saved"));
              if (!first?.preview) return null;
              const p = first.preview;
              return (
                <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.75rem" }}>Column structure (from {first.file.name})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" }}>
                    {p.columns.map((col, i) => (
                      <span key={i} style={{ fontSize: "0.72rem", backgroundColor: "#0d948820", color: "#2dd4bf", border: "1px solid #0d948840", borderRadius: "5px", padding: "0.2rem 0.55rem" }}>{col}</span>
                    ))}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", fontSize: "0.7rem", minWidth: "100%" }}>
                      <thead>
                        <tr>{p.columns.map((col, i) => <th key={i} style={{ textAlign: "left", padding: "0.4rem 0.7rem", color: "#94a3b8", borderBottom: "1px solid #1e3a5f", whiteSpace: "nowrap" }}>{col}</th>)}</tr>
                      </thead>
                      <tbody>
                        {p.preview.map((row, ri) => (
                          <tr key={ri}>{p.columns.map((col, ci) => <td key={ci} style={{ padding: "0.4rem 0.7rem", color: "#64748b", borderBottom: "1px solid #0f1e3a", whiteSpace: "nowrap", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}>{String(row[col] ?? "")}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Manual List Tab ── */}
        {tab === "list" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
              <button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: "#0d9488", border: "none", borderRadius: "7px", padding: "0.45rem 1.1rem", color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                + Add Facility
              </button>
            </div>

            {showForm && (
              <div style={{ backgroundColor: "#0f2040", border: "1px solid #0d9488", borderRadius: "12px", padding: "2rem", marginBottom: "2rem" }}>
                <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: "1.5rem" }}>Add Health Centre</h3>
                <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                  <Field label="Facility Name *" value={form.name} onChange={v => handleChange("name", v)} required />
                  <div>
                    <label style={labelStyle}>Type *</label>
                    <select value={form.type} onChange={e => handleChange("type", e.target.value)} style={inputStyle}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Full Address *" value={form.address} onChange={v => handleChange("address", v)} required />
                  </div>
                  <Field label="District *" value={form.district} onChange={v => handleChange("district", v)} required />
                  <div>
                    <label style={labelStyle}>State *</label>
                    <select value={form.stateSlug} onChange={e => handleChange("stateSlug", e.target.value)} required style={inputStyle}>
                      <option value="">Select state…</option>
                      {states.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                    </select>
                  </div>
                  <Field label="PIN Code" value={form.pincode} onChange={v => handleChange("pincode", v)} />
                  <Field label="Phone 1" value={form.phone} onChange={v => handleChange("phone", v)} />
                  <Field label="Phone 2" value={form.phone2} onChange={v => handleChange("phone2", v)} />
                  <Field label="Latitude" value={form.lat} onChange={v => handleChange("lat", v)} placeholder="e.g. 19.0760" />
                  <Field label="Longitude" value={form.lng} onChange={v => handleChange("lng", v)} placeholder="e.g. 72.8777" />
                  <Field label="Beds" value={form.beds} onChange={v => handleChange("beds", v)} type="number" />
                  <Field label="Doctors on Staff" value={form.doctors} onChange={v => handleChange("doctors", v)} type="number" />
                  <Field label="Opening Hours" value={form.openHours} onChange={v => handleChange("openHours", v)} placeholder="Mon–Sat 8AM–4PM" />
                  <Field label="Website" value={form.website} onChange={v => handleChange("website", v)} />
                  <Field label="Added By" value={form.addedBy} onChange={v => handleChange("addedBy", v)} />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Services (comma-separated)</label>
                    <textarea value={form.services} onChange={e => handleChange("services", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Admin Notes" value={form.notes} onChange={v => handleChange("notes", v)} />
                  </div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.75rem" }}>
                    <button type="submit" style={{ backgroundColor: "#0d9488", border: "none", borderRadius: "8px", padding: "0.65rem 1.5rem", color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" }}>Save Facility</button>
                    <button type="button" onClick={() => setShowForm(false)} style={{ backgroundColor: "transparent", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.65rem 1.25rem", color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "#475569" }}>Loading…</div>
            ) : hospitals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "#0f2040", borderRadius: "12px", color: "#475569" }}>
                No facilities added yet. Use Import XLS or &quot;+ Add Facility&quot;.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {hospitals.map(h => (
                  <div key={h.id} style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                          <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{h.name}</span>
                          <span style={{ fontSize: "0.65rem", backgroundColor: "#0d948820", border: "1px solid #0d948840", borderRadius: "4px", padding: "0.1rem 0.45rem", color: "#2dd4bf" }}>{h.type}</span>
                          {h.verified && <span style={{ fontSize: "0.62rem", color: "#22c55e", backgroundColor: "#22c55e15", borderRadius: "4px", padding: "0.1rem 0.4rem" }}>✓ Verified</span>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{h.address} · {h.district}, {h.state}{h.pincode ? ` - ${h.pincode}` : ""}</div>
                        {h.phone && <div style={{ fontSize: "0.78rem", color: "#2dd4bf", marginTop: "0.2rem" }}>📞 {h.phone}{h.phone2 ? ` · ${h.phone2}` : ""}</div>}
                        {h.services?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
                            {h.services.map(s => <span key={s} style={{ fontSize: "0.65rem", color: "#64748b", backgroundColor: "#1e3a5f40", borderRadius: "4px", padding: "0.1rem 0.4rem" }}>{s}</span>)}
                          </div>
                        )}
                      </div>
                      <button onClick={() => deleteHospital(h.id)} style={{ backgroundColor: "transparent", border: "1px solid #ef444440", borderRadius: "6px", padding: "0.3rem 0.75rem", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>Remove</button>
                    </div>
                    <div style={{ marginTop: "0.5rem", fontSize: "0.68rem", color: "#334155" }}>Added by {h.addedBy} · {new Date(h.addedAt).toLocaleDateString("en-IN")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" };
const inputStyle: React.CSSProperties = { width: "100%", backgroundColor: "#070f1e", border: "1px solid #1e3a5f", borderRadius: "7px", padding: "0.6rem 0.8rem", color: "#e2e8f0", fontSize: "0.88rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

function Field({ label, value, onChange, required, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type ?? "text"} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}
