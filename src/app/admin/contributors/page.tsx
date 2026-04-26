"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Contributor { id: string; name: string; role: string; org?: string; url?: string; avatar?: string; addedAt: string; }
interface Sponsor { id: string; name: string; tier: "gold" | "silver" | "community"; url?: string; logo?: string; addedAt: string; }
interface DataAuthor { id: string; name: string; dataset: string; source: string; year: string; url?: string; addedAt: string; }

type Tab = "contributors" | "sponsors" | "dataAuthors";

const ROLES = ["Developer", "Data Analyst", "Researcher", "Designer", "Content", "Volunteer", "Advisor", "Other"];
const TIERS = ["gold", "silver", "community"];

export default function ContributorsAdmin() {
  const [tab, setTab] = useState<Tab>("contributors");
  const [data, setData] = useState<{ contributors: Contributor[]; sponsors: Sponsor[]; dataAuthors: DataAuthor[] }>({ contributors: [], sponsors: [], dataAuthors: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cForm, setCForm] = useState({ name: "", role: "Developer", org: "", url: "", avatar: "" });
  const [sForm, setSForm] = useState({ name: "", tier: "community", url: "", logo: "" });
  const [dForm, setDForm] = useState({ name: "", dataset: "", source: "", year: "", url: "" });

  useEffect(() => {
    fetch("/api/admin/contributors").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  async function addContributor(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/contributors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "contributor", ...cForm }) });
    const d = await res.json();
    if (d.ok) { setData(prev => ({ ...prev, contributors: [d.item, ...prev.contributors] })); setShowForm(false); setCForm({ name: "", role: "Developer", org: "", url: "", avatar: "" }); }
  }

  async function addSponsor(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/contributors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "sponsor", ...sForm }) });
    const d = await res.json();
    if (d.ok) { setData(prev => ({ ...prev, sponsors: [d.item, ...prev.sponsors] })); setShowForm(false); setSForm({ name: "", tier: "community", url: "", logo: "" }); }
  }

  async function addDataAuthor(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/contributors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "dataAuthor", ...dForm }) });
    const d = await res.json();
    if (d.ok) { setData(prev => ({ ...prev, dataAuthors: [d.item, ...prev.dataAuthors] })); setShowForm(false); setDForm({ name: "", dataset: "", source: "", year: "", url: "" }); }
  }

  async function remove(type: string, id: string) {
    if (!confirm("Remove this entry?")) return;
    await fetch("/api/admin/contributors", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
    if (type === "contributor") setData(prev => ({ ...prev, contributors: prev.contributors.filter(x => x.id !== id) }));
    if (type === "sponsor") setData(prev => ({ ...prev, sponsors: prev.sponsors.filter(x => x.id !== id) }));
    if (type === "dataAuthor") setData(prev => ({ ...prev, dataAuthors: prev.dataAuthors.filter(x => x.id !== id) }));
  }

  const tierColor: Record<string, string> = { gold: "#eab308", silver: "#94a3b8", community: "#0d9488" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/admin" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>← Admin</Link>
        <span style={{ color: "#1e3a5f" }}>|</span>
        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>Contributors & Sponsors</span>
        <button onClick={() => setShowForm(!showForm)} style={{ marginLeft: "auto", backgroundColor: "#0d9488", border: "none", borderRadius: "7px", padding: "0.45rem 1.1rem", color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          + Add Entry
        </button>
      </div>

      <div className="admin-inner-wrap" style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {(["contributors", "sponsors", "dataAuthors"] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setShowForm(false); }} style={{ backgroundColor: tab === t ? "#0d9488" : "#0f2040", border: `1px solid ${tab === t ? "#0d9488" : "#1e3a5f"}`, borderRadius: "6px", padding: "0.35rem 0.9rem", color: tab === t ? "#fff" : "#94a3b8", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {t === "dataAuthors" ? "Data Authors" : t.charAt(0).toUpperCase() + t.slice(1)} ({data[t].length})
            </button>
          ))}
        </div>

        {/* Add forms */}
        {showForm && tab === "contributors" && (
          <div style={formBoxStyle}>
            <h3 style={formTitleStyle}>Add Contributor</h3>
            <form onSubmit={addContributor} style={gridStyle}>
              <CField label="Name *" value={cForm.name} onChange={v => setCForm(f => ({ ...f, name: v }))} required />
              <div>
                <label style={labelStyle}>Role *</label>
                <select value={cForm.role} onChange={e => setCForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <CField label="Organisation" value={cForm.org} onChange={v => setCForm(f => ({ ...f, org: v }))} />
              <CField label="Profile URL" value={cForm.url} onChange={v => setCForm(f => ({ ...f, url: v }))} placeholder="https://github.com/..." />
              <CField label="Avatar URL" value={cForm.avatar} onChange={v => setCForm(f => ({ ...f, avatar: v }))} placeholder="https://..." />
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.75rem" }}>
                <button type="submit" style={saveBtnStyle}>Save</button>
                <button type="button" onClick={() => setShowForm(false)} style={cancelBtnStyle}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {showForm && tab === "sponsors" && (
          <div style={formBoxStyle}>
            <h3 style={formTitleStyle}>Add Sponsor</h3>
            <form onSubmit={addSponsor} style={gridStyle}>
              <CField label="Sponsor Name *" value={sForm.name} onChange={v => setSForm(f => ({ ...f, name: v }))} required />
              <div>
                <label style={labelStyle}>Tier *</label>
                <select value={sForm.tier} onChange={e => setSForm(f => ({ ...f, tier: e.target.value }))} style={inputStyle}>
                  {TIERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <CField label="Website URL" value={sForm.url} onChange={v => setSForm(f => ({ ...f, url: v }))} placeholder="https://..." />
              <CField label="Logo URL" value={sForm.logo} onChange={v => setSForm(f => ({ ...f, logo: v }))} placeholder="https://..." />
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.75rem" }}>
                <button type="submit" style={saveBtnStyle}>Save</button>
                <button type="button" onClick={() => setShowForm(false)} style={cancelBtnStyle}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {showForm && tab === "dataAuthors" && (
          <div style={formBoxStyle}>
            <h3 style={formTitleStyle}>Add Data Author / Source</h3>
            <form onSubmit={addDataAuthor} style={gridStyle}>
              <CField label="Author / Org Name *" value={dForm.name} onChange={v => setDForm(f => ({ ...f, name: v }))} required />
              <CField label="Dataset Name *" value={dForm.dataset} onChange={v => setDForm(f => ({ ...f, dataset: v }))} required placeholder="e.g. SRS 2023" />
              <CField label="Source / Publisher *" value={dForm.source} onChange={v => setDForm(f => ({ ...f, source: v }))} required placeholder="e.g. RGI, MOHFW" />
              <CField label="Year" value={dForm.year} onChange={v => setDForm(f => ({ ...f, year: v }))} placeholder="2023" />
              <CField label="URL" value={dForm.url} onChange={v => setDForm(f => ({ ...f, url: v }))} placeholder="https://..." />
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.75rem" }}>
                <button type="submit" style={saveBtnStyle}>Save</button>
                <button type="button" onClick={() => setShowForm(false)} style={cancelBtnStyle}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Lists */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#475569" }}>Loading…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {tab === "contributors" && (
              data.contributors.length === 0
                ? <EmptyState text="No contributors yet." />
                : data.contributors.map(c => (
                  <div key={c.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        {c.avatar ? <img src={c.avatar} alt={c.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontWeight: 700 }}>{c.name[0]}</div>}
                        <div>
                          <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.92rem" }}>{c.name}</div>
                          <div style={{ color: "#64748b", fontSize: "0.78rem" }}>{c.role}{c.org ? ` · ${c.org}` : ""}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {c.url && <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "#2dd4bf", textDecoration: "none" }}>Profile ↗</a>}
                        <button onClick={() => remove("contributor", c.id)} style={removeBtnStyle}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))
            )}
            {tab === "sponsors" && (
              data.sponsors.length === 0
                ? <EmptyState text="No sponsors yet." />
                : data.sponsors.map(s => (
                  <div key={s.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.2rem" }}>
                          <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.92rem" }}>{s.name}</span>
                          <span style={{ fontSize: "0.62rem", color: tierColor[s.tier], backgroundColor: `${tierColor[s.tier]}20`, borderRadius: "4px", padding: "0.1rem 0.4rem", textTransform: "capitalize" }}>{s.tier}</span>
                        </div>
                        {s.url && <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "#2dd4bf", textDecoration: "none" }}>{s.url} ↗</a>}
                      </div>
                      <button onClick={() => remove("sponsor", s.id)} style={removeBtnStyle}>Remove</button>
                    </div>
                  </div>
                ))
            )}
            {tab === "dataAuthors" && (
              data.dataAuthors.length === 0
                ? <EmptyState text="No data authors yet." />
                : data.dataAuthors.map(d => (
                  <div key={d.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.92rem", marginBottom: "0.15rem" }}>{d.dataset} <span style={{ color: "#475569", fontWeight: 400, fontSize: "0.8rem" }}>({d.year})</span></div>
                        <div style={{ color: "#64748b", fontSize: "0.78rem" }}>{d.name} · {d.source}</div>
                        {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.72rem", color: "#2dd4bf", textDecoration: "none" }}>Source ↗</a>}
                      </div>
                      <button onClick={() => remove("dataAuthor", d.id)} style={removeBtnStyle}>Remove</button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "#0f2040", borderRadius: "12px", color: "#475569" }}>{text}</div>;
}

function CField({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" };
const inputStyle: React.CSSProperties = { width: "100%", backgroundColor: "#070f1e", border: "1px solid #1e3a5f", borderRadius: "7px", padding: "0.6rem 0.8rem", color: "#e2e8f0", fontSize: "0.88rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const formBoxStyle: React.CSSProperties = { backgroundColor: "#0f2040", border: "1px solid #0d9488", borderRadius: "12px", padding: "2rem", marginBottom: "2rem" };
const formTitleStyle: React.CSSProperties = { color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: "1.5rem" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" };
const cardStyle: React.CSSProperties = { backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1.25rem" };
const saveBtnStyle: React.CSSProperties = { backgroundColor: "#0d9488", border: "none", borderRadius: "8px", padding: "0.65rem 1.5rem", color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" };
const cancelBtnStyle: React.CSSProperties = { backgroundColor: "transparent", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.65rem 1.25rem", color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" };
const removeBtnStyle: React.CSSProperties = { backgroundColor: "transparent", border: "1px solid #ef444440", borderRadius: "6px", padding: "0.3rem 0.75rem", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
