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

  const fileRef                     = useRef<HTMLInputElement>(null);
  const [fileName, setFileName]     = useState("");
  const [importing, setImporting]   = useState(false);
  const [importErr, setImportErr]   = useState("");
  const [preview, setPreview]       = useState<ImportPreview | null>(null);
  const [saving, setSaving]         = useState(false);
  const [savedMsg, setSavedMsg]     = useState("");

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

  async function handlePreview() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setImportErr("Select a file first"); return; }
    setImportErr(""); setPreview(null); setImporting(true); setSavedMsg("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("save", "false");
    try {
      const res  = await fetch("/api/admin/upload-hospitals", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setImportErr(data.error ?? "Upload failed");
      else setPreview(data);
    } catch {
      setImportErr("Network error — try again");
    } finally {
      setImporting(false);
    }
  }

  async function handleSave() {
    const file = fileRef.current?.files?.[0];
    if (!file || !preview) return;
    setSaving(true); setSavedMsg("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("save", "true");
    try {
      const res  = await fetch("/api/admin/upload-hospitals", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setImportErr(data.error ?? "Save failed");
      else { setSavedMsg(`Saved ${data.count.toLocaleString()} hospitals for ${data.stateName} to Firestore.`); setPreview({ ...data, saved: true }); }
    } catch {
      setImportErr("Network error — try again");
    } finally {
      setSaving(false);
    }
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
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Upload one state .xls file at a time. Preview columns and confirm before saving to Firestore.</div>
            </div>

            <div style={{ backgroundColor: "#0f2040", border: "2px dashed #1e3a5f", borderRadius: "12px", padding: "2rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "2rem" }}>📂</div>
              <input
                ref={fileRef}
                type="file"
                accept=".xls,.xlsx"
                style={{ display: "none" }}
                onChange={e => { setPreview(null); setSavedMsg(""); setImportErr(""); setFileName(e.target.files?.[0]?.name ?? ""); }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                style={{ backgroundColor: "#1e3a5f", border: "none", borderRadius: "8px", padding: "0.6rem 1.4rem", color: "#e2e8f0", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Choose .xls / .xlsx file
              </button>
              <div style={{ fontSize: "0.78rem", color: "#475569" }}>One state file at a time — e.g. Maharastra.xls</div>
              {fileName && (
                <div style={{ fontSize: "0.8rem", color: "#2dd4bf", backgroundColor: "#0d948815", borderRadius: "6px", padding: "0.35rem 0.9rem" }}>
                  Selected: {fileName}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <button
                onClick={handlePreview}
                disabled={importing}
                style={{ backgroundColor: "#0d9488", border: "none", borderRadius: "8px", padding: "0.6rem 1.4rem", color: "#fff", fontSize: "0.88rem", fontWeight: 600, cursor: importing ? "wait" : "pointer", fontFamily: "inherit", opacity: importing ? 0.7 : 1 }}
              >
                {importing ? "Parsing…" : "Preview Columns"}
              </button>
              {preview && !preview.saved && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ backgroundColor: "#1d4ed8", border: "none", borderRadius: "8px", padding: "0.6rem 1.4rem", color: "#fff", fontSize: "0.88rem", fontWeight: 600, cursor: saving ? "wait" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving…" : `Save ${preview.count.toLocaleString()} hospitals to Firestore`}
                </button>
              )}
            </div>

            {importErr && (
              <div style={{ backgroundColor: "#ef444415", border: "1px solid #ef444440", borderRadius: "8px", padding: "0.75rem 1rem", color: "#ef4444", fontSize: "0.82rem", marginBottom: "1rem" }}>
                {importErr}
              </div>
            )}

            {savedMsg && (
              <div style={{ backgroundColor: "#22c55e15", border: "1px solid #22c55e40", borderRadius: "8px", padding: "0.75rem 1rem", color: "#22c55e", fontSize: "0.82rem", marginBottom: "1rem" }}>
                {savedMsg}
              </div>
            )}

            {preview && (
              <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e2e8f0" }}>{preview.stateName}</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.75rem" }}>{preview.count.toLocaleString()} rows · {preview.columns.length} columns</span>
                  </div>
                  {preview.saved && <span style={{ fontSize: "0.7rem", backgroundColor: "#22c55e20", color: "#22c55e", borderRadius: "5px", padding: "0.15rem 0.6rem", fontWeight: 700 }}>Saved to Firestore</span>}
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>Columns ({preview.columns.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {preview.columns.map((col, i) => (
                      <span key={i} style={{ fontSize: "0.72rem", backgroundColor: "#0d948820", color: "#2dd4bf", border: "1px solid #0d948840", borderRadius: "5px", padding: "0.2rem 0.55rem" }}>
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>First 5 rows (sample)</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", fontSize: "0.7rem", minWidth: "100%" }}>
                      <thead>
                        <tr>
                          {preview.columns.map((col, i) => (
                            <th key={i} style={{ textAlign: "left", padding: "0.4rem 0.7rem", color: "#94a3b8", borderBottom: "1px solid #1e3a5f", whiteSpace: "nowrap" }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.map((row, ri) => (
                          <tr key={ri}>
                            {preview.columns.map((col, ci) => (
                              <td key={ci} style={{ padding: "0.4rem 0.7rem", color: "#64748b", borderBottom: "1px solid #0f1e3a", whiteSpace: "nowrap", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {String(row[col] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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
