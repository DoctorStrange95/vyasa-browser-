"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────
interface KV      { label: string; sub: string; }
interface LinkItem { label: string; href: string; }
interface TimelineItem { year: string; label: string; desc: string; }
interface Member {
  id: string; name: string; role: string; photo: string;
  color: string; degree: string;
  links: LinkItem[]; bullets: string[]; order: number;
}
interface ValidationItem { icon: string; title: string; sub: string; }

interface TeamConfig {
  hero:       { headline: string; subhead: string };
  founder:    {
    name: string; photo: string; tagline: string; role: string;
    credentials: KV[]; quote: string; expertise: string[];
    timeline: TimelineItem[]; links: LinkItem[];
  };
  members:    Member[];
  validation: ValidationItem[];
  cta:        { headline: string; body: string; buttonLabel: string; buttonHref: string };
}

// ── Defaults (mirrors the hardcoded page) ───────────────────────────────────
const DEFAULT: TeamConfig = {
  hero: {
    headline: "Built from the ward,\nnot the boardroom.",
    subhead:  "Every feature in Vyasa comes from a real frustration lived inside an Indian hospital — not a product manager's spreadsheet. We are clinicians, engineers, and operators who decided to fix it ourselves.",
  },
  founder: {
    name:    "Dr. Nilanjan Roy",
    photo:   "/team/nilanjan.jpg",
    tagline: "MD (AIIMS Patna)",
    role:    "Founder & CEO",
    credentials: [
      { label: "AIIMS Patna",       sub: "MD Community & Family Medicine" },
      { label: "AIIMS Rishikesh",   sub: "Senior Resident (Clinical Practice)" },
      { label: "Burdwan Medical",   sub: "MBBS 2019 · 5+ Years Clinical" },
      { label: "Harvard HSIL 2025", sub: "Hackathon Selected · IIT Patna Hub" },
    ],
    quote: "I spent years watching doctors handwrite prescriptions that nurses couldn't read, seeing patients deteriorate because a lab result sat in a fax queue for two hours, and watching billing teams manually re-enter every clinical action at end of shift. Vyasa is the system I wanted on every ward I worked — built for Indian hospitals as they actually are, not as a textbook imagines them.",
    expertise: [
      "Public health surveillance & IDSP workflow",
      "Primary, secondary & tertiary care delivery",
      "PHC app design & community health programs",
      "Disease burden analytics — NCD & communicable",
      "Clinical coordination across ward settings",
      "Health data governance & MoHFW protocols",
    ],
    timeline: [
      { year: "2019",     label: "MBBS",               desc: "Burdwan Medical College — graduated with clinical honors" },
      { year: "2019–22",  label: "MD Community Medicine", desc: "AIIMS Patna — population-level health, IDSP surveillance, PHC system design" },
      { year: "2022–24",  label: "Senior Resident",     desc: "AIIMS Rishikesh — advanced clinical practice, tertiary care workflows" },
      { year: "2024",     label: "PHC App",             desc: "Built & deployed proof-of-concept at AIIMS — first clinical digital tool" },
      { year: "2025",     label: "Harvard HSIL Hackathon", desc: "Selected participant at IIT Patna India Hub — validated product-market fit" },
      { year: "Jan 2026", label: "Vyasa Founded",       desc: "Incorporated Vyasa Integrated Healthcare Pvt Ltd (CIN: U86909WR2026PT*29280)" },
    ],
    links: [
      { label: "LinkedIn", href: "https://linkedin.com/in/dr-nilanjan-roy-516403a8/" },
      { label: "Email",    href: "mailto:nilanjan1995@gmail.com" },
    ],
  },
  members: [
    {
      id: "roshni", name: "Roshni Basu", role: "Co-Director · Operations & Strategy",
      photo: "/team/roshni.jpg", color: "#a855f7", degree: "MSc Forensic Sciences", order: 1,
      links: [
        { label: "LinkedIn", href: "https://linkedin.com/in/roshni-basu-a950b3256/" },
        { label: "Email",    href: "mailto:roshni.basu97@gmail.com" },
      ],
      bullets: [
        "Strategic partner in business development",
        "Operations & compliance co-lead",
        "Brings complementary forensic-science lens to healthcare data governance",
      ],
    },
    {
      id: "yashvardhan", name: "Yashvardhan Shaktawat", role: "Tech Co-Founder · Engineering",
      photo: "/team/yashvardhan.jpg", color: "#3b82f6", degree: "Economics · IIT Patna", order: 2,
      links: [
        { label: "LinkedIn", href: "https://linkedin.com/in/yashvardhan-shaktawat/" },
        { label: "Email",    href: "mailto:yashvardhansingh012@gmail.com" },
      ],
      bullets: [
        "Full-stack: Node.js, APIs, real-time systems, databases",
        "Built a complete clinical app on React Native end-to-end",
        "Product design, backend architecture & real-time data handling",
      ],
    },
  ],
  validation: [
    { icon: "🏛️", title: "AIIMS Patna",       sub: "MD + PHC App Deployment" },
    { icon: "🏛️", title: "AIIMS Rishikesh",   sub: "Senior Residency — Tertiary Care" },
    { icon: "🎓", title: "IIT Patna",          sub: "Tech Co-Founder · Economics" },
    { icon: "🌐", title: "Harvard HSIL 2025",  sub: "Hackathon Selected Participant" },
    { icon: "🏢", title: "Incorporated 2026",  sub: "Vyasa Integrated Healthcare Pvt Ltd" },
  ],
  cta: {
    headline:    "We're building with the first 100 clinicians",
    body:        "If you've felt the same frustrations in your ward, clinic, or hospital — we want you on the platform before it ships.",
    buttonLabel: "Request Early Access →",
    buttonHref:  "/join",
  },
};

// ── Small helpers ────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", background: "#0d1f3c", border: "1px solid #1e3a5f",
  borderRadius: "6px", color: "#e2e8f0", fontSize: "0.85rem",
  padding: "0.45rem 0.7rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
const ta: React.CSSProperties = { ...inp, resize: "vertical", minHeight: "80px" };
const btn = (color = "#3b82f6"): React.CSSProperties => ({
  background: color + "20", border: `1px solid ${color}60`, color,
  borderRadius: "6px", padding: "0.35rem 0.85rem", cursor: "pointer",
  fontSize: "0.8rem", fontWeight: 600,
});
const label: React.CSSProperties = { fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.25rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" };

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>{children}</div>;
}
function Field({ l, children }: { l: string; children: React.ReactNode }) {
  return <div><label style={label}>{l}</label>{children}</div>;
}

// ── PhotoInput ────────────────────────────────────────────────────────────────
function PhotoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    // Resize to max 200×200 and compress to JPEG to keep Firestore doc under 1MB
    const img = new window.Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const MAX = 200;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      onChange(canvas.toDataURL("image/jpeg", 0.80));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {value && (
        <img src={value} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "1px solid #1e3a5f", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1 }}>
        <input style={inp} value={value} onChange={e => onChange(e.target.value)} placeholder="/team/photo.jpg or https://…" />
      </div>
      <button type="button" onClick={() => ref.current?.click()} style={btn("#a78bfa")}>Upload</button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

// ── KV list editor ────────────────────────────────────────────────────────────
function KVList({ items, onChange, labelA = "Label", labelB = "Sub-text" }: { items: KV[]; onChange: (v: KV[]) => void; labelA?: string; labelB?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input style={{ ...inp, flex: 1 }} value={it.label} placeholder={labelA} onChange={e => { const n=[...items]; n[i]={...n[i],label:e.target.value}; onChange(n); }} />
          <input style={{ ...inp, flex: 2 }} value={it.sub} placeholder={labelB} onChange={e => { const n=[...items]; n[i]={...n[i],sub:e.target.value}; onChange(n); }} />
          <button type="button" onClick={() => onChange(items.filter((_,j)=>j!==i))} style={{ ...btn("#ef4444"), flexShrink: 0 }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { label: "", sub: "" }])} style={btn("#22c55e")}>+ Add</button>
    </div>
  );
}

// ── Link list editor ──────────────────────────────────────────────────────────
function LinkList({ items, onChange }: { items: LinkItem[]; onChange: (v: LinkItem[]) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
          <input style={{ ...inp, width: "100px", flexShrink: 0 }} value={it.label} placeholder="Label" onChange={e => { const n=[...items]; n[i]={...n[i],label:e.target.value}; onChange(n); }} />
          <input style={{ ...inp, flex: 1 }} value={it.href} placeholder="URL or mailto:…" onChange={e => { const n=[...items]; n[i]={...n[i],href:e.target.value}; onChange(n); }} />
          <button type="button" onClick={() => onChange(items.filter((_,j)=>j!==i))} style={{ ...btn("#ef4444"), flexShrink: 0 }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { label: "", href: "" }])} style={btn("#22c55e")}>+ Add</button>
    </div>
  );
}

// ── String list editor ─────────────────────────────────────────────────────────
function StrList({ items, onChange, placeholder = "Item…" }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
          <input style={{ ...inp, flex: 1 }} value={it} placeholder={placeholder} onChange={e => { const n=[...items]; n[i]=e.target.value; onChange(n); }} />
          <button type="button" onClick={() => onChange(items.filter((_,j)=>j!==i))} style={{ ...btn("#ef4444"), flexShrink: 0 }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ""])} style={btn("#22c55e")}>+ Add</button>
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────
type Tab = "hero" | "founder" | "members" | "validation" | "cta";

export default function TeamAdmin() {
  const [config,  setConfig]  = useState<TeamConfig>(DEFAULT);
  const [tab,     setTab]     = useState<Tab>("hero");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<string>("");
  const [editMember, setEditMember] = useState<Member | null>(null);

  useEffect(() => {
    fetch("/api/admin/team")
      .then(r => r.json())
      .then(d => {
        if (d && Object.keys(d).length > 2) {
          setConfig({ ...DEFAULT, ...d });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
      setToast("Saved! Changes will appear on the live /team page within 60 seconds.");
    } catch {
      setToast("Save failed. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 5000);
    }
  }

  function setFounder(patch: Partial<TeamConfig["founder"]>) {
    setConfig(c => ({ ...c, founder: { ...c.founder, ...patch } }));
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "hero",       label: "Hero" },
    { id: "founder",    label: "Founder" },
    { id: "members",    label: "Team Members" },
    { id: "validation", label: "Validation Strip" },
    { id: "cta",        label: "CTA" },
  ];

  const s: React.CSSProperties = { padding: "0 2rem" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, background: toast.includes("fail") ? "#7f1d1d" : "#166534", color: "#fff", padding: "0.75rem 1.25rem", borderRadius: "8px", fontSize: "0.85rem", maxWidth: "360px" }}>
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/admin" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>← Admin</Link>
          <span style={{ color: "#fff", fontWeight: 700 }}>Team Page Editor</span>
          <a href="/team" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#2dd4bf", border: "1px solid #2dd4bf40", borderRadius: "4px", padding: "0.15rem 0.5rem", textDecoration: "none" }}>Preview ↗</a>
        </div>
        <button onClick={save} disabled={saving} style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: "7px", padding: "0.45rem 1.25rem", fontWeight: 700, cursor: saving ? "wait" : "pointer", fontSize: "0.85rem" }}>
          {saving ? "Saving…" : "💾 Save Changes"}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: "1px solid #1e3a5f", display: "flex", padding: "0 2rem" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "0.7rem 1rem", border: "none", background: "transparent",
            color: tab === t.id ? "#93c5fd" : "#64748b",
            borderBottom: tab === t.id ? "2px solid #3b82f6" : "2px solid transparent",
            fontWeight: tab === t.id ? 600 : 400, fontSize: "0.85rem", cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", color: "#475569", textAlign: "center" }}>Loading…</div>
      ) : (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>

          {/* ── HERO ── */}
          {tab === "hero" && (
            <div>
              <h2 style={{ color: "#fff", marginBottom: "1.5rem", fontSize: "1.1rem" }}>Hero Section</h2>
              <Field l="Headline (use \\n for line break)">
                <textarea style={ta} value={config.hero.headline} onChange={e => setConfig(c => ({ ...c, hero: { ...c.hero, headline: e.target.value } }))} rows={3} />
              </Field>
              <Field l="Sub-headline">
                <textarea style={ta} value={config.hero.subhead} onChange={e => setConfig(c => ({ ...c, hero: { ...c.hero, subhead: e.target.value } }))} rows={4} />
              </Field>
            </div>
          )}

          {/* ── FOUNDER ── */}
          {tab === "founder" && (
            <div>
              <h2 style={{ color: "#fff", marginBottom: "1.5rem", fontSize: "1.1rem" }}>Founder Section</h2>
              <Row>
                <Field l="Name"><input style={inp} value={config.founder.name} onChange={e => setFounder({ name: e.target.value })} /></Field>
                <Field l="Role / Tag"><input style={inp} value={config.founder.role} onChange={e => setFounder({ role: e.target.value })} /></Field>
              </Row>
              <Row>
                <Field l="Tagline (under name)"><input style={inp} value={config.founder.tagline} onChange={e => setFounder({ tagline: e.target.value })} /></Field>
              </Row>
              <Field l="Photo (URL or upload)">
                <PhotoInput value={config.founder.photo} onChange={v => setFounder({ photo: v })} />
              </Field>

              <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>Links</div>
              <LinkList items={config.founder.links} onChange={v => setFounder({ links: v })} />

              <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>Credentials</div>
              <KVList items={config.founder.credentials} onChange={v => setFounder({ credentials: v })} labelA="Institution" labelB="Degree / Note" />

              <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>Quote</div>
              <textarea style={ta} value={config.founder.quote} onChange={e => setFounder({ quote: e.target.value })} rows={5} />

              <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>Expertise bullet points</div>
              <StrList items={config.founder.expertise} onChange={v => setFounder({ expertise: v })} placeholder="Expertise item…" />

              <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>Timeline</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {config.founder.timeline.map((t, i) => (
                  <div key={i} style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <input style={{ ...inp, width: "120px", flexShrink: 0 }} value={t.year} placeholder="Year" onChange={e => { const n=[...config.founder.timeline]; n[i]={...n[i],year:e.target.value}; setFounder({ timeline: n }); }} />
                      <input style={{ ...inp, flex: 1 }} value={t.label} placeholder="Milestone label" onChange={e => { const n=[...config.founder.timeline]; n[i]={...n[i],label:e.target.value}; setFounder({ timeline: n }); }} />
                      <button type="button" onClick={() => setFounder({ timeline: config.founder.timeline.filter((_,j)=>j!==i) })} style={{ ...btn("#ef4444"), flexShrink: 0 }}>✕</button>
                    </div>
                    <textarea style={{ ...ta, minHeight: "50px" }} value={t.desc} placeholder="Description…" onChange={e => { const n=[...config.founder.timeline]; n[i]={...n[i],desc:e.target.value}; setFounder({ timeline: n }); }} rows={2} />
                  </div>
                ))}
                <button type="button" onClick={() => setFounder({ timeline: [...config.founder.timeline, { year: "", label: "", desc: "" }] })} style={btn("#22c55e")}>+ Add Timeline Item</button>
              </div>
            </div>
          )}

          {/* ── TEAM MEMBERS ── */}
          {tab === "members" && !editMember && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ color: "#fff", fontSize: "1.1rem", margin: 0 }}>Team Members</h2>
                <button onClick={() => setEditMember({ id: `m_${Date.now()}`, name: "", role: "", photo: "", color: "#3b82f6", degree: "", links: [], bullets: [], order: config.members.length + 1 })} style={btn("#22c55e")}>+ Add Member</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[...config.members].sort((a,b) => a.order - b.order).map(m => (
                  <div key={m.id} style={{ background: "#0d1f3c", border: `1px solid ${m.color}40`, borderLeft: `3px solid ${m.color}`, borderRadius: "9px", padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <img src={m.photo || "/team/placeholder.jpg"} alt={m.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: `2px solid ${m.color}40`, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#e2e8f0" }}>{m.name || <span style={{ color: "#334155" }}>Unnamed</span>}</div>
                      <div style={{ fontSize: "0.75rem", color: m.color }}>{m.role}</div>
                      <div style={{ fontSize: "0.68rem", color: "#475569" }}>{m.degree}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => setEditMember({ ...m })} style={btn("#60a5fa")}>Edit</button>
                      <button onClick={() => { if (confirm(`Remove ${m.name}?`)) setConfig(c => ({ ...c, members: c.members.filter(x => x.id !== m.id) })); }} style={btn("#ef4444")}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "members" && editMember && (
            <MemberEditor
              member={editMember}
              onSave={m => {
                setConfig(c => {
                  const exists = c.members.find(x => x.id === m.id);
                  return { ...c, members: exists ? c.members.map(x => x.id === m.id ? m : x) : [...c.members, m] };
                });
                setEditMember(null);
              }}
              onCancel={() => setEditMember(null)}
            />
          )}

          {/* ── VALIDATION STRIP ── */}
          {tab === "validation" && (
            <div>
              <h2 style={{ color: "#fff", marginBottom: "1.5rem", fontSize: "1.1rem" }}>Validation Strip</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {config.validation.map((v, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input style={{ ...inp, width: "50px", flexShrink: 0 }} value={v.icon} placeholder="🏛️" onChange={e => { const n=[...config.validation]; n[i]={...n[i],icon:e.target.value}; setConfig(c=>({...c,validation:n})); }} />
                    <input style={{ ...inp, flex: 1 }} value={v.title} placeholder="Title" onChange={e => { const n=[...config.validation]; n[i]={...n[i],title:e.target.value}; setConfig(c=>({...c,validation:n})); }} />
                    <input style={{ ...inp, flex: 2 }} value={v.sub} placeholder="Sub-text" onChange={e => { const n=[...config.validation]; n[i]={...n[i],sub:e.target.value}; setConfig(c=>({...c,validation:n})); }} />
                    <button onClick={() => setConfig(c=>({...c,validation:c.validation.filter((_,j)=>j!==i)}))} style={{ ...btn("#ef4444"), flexShrink: 0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setConfig(c=>({...c,validation:[...c.validation,{icon:"🏛️",title:"",sub:""}]}))} style={btn("#22c55e")}>+ Add Item</button>
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          {tab === "cta" && (
            <div>
              <h2 style={{ color: "#fff", marginBottom: "1.5rem", fontSize: "1.1rem" }}>Call-to-Action Section</h2>
              <Field l="Headline"><input style={inp} value={config.cta.headline} onChange={e => setConfig(c=>({...c,cta:{...c.cta,headline:e.target.value}}))} /></Field>
              <div style={{ marginBottom: "0.75rem" }} />
              <Field l="Body text"><textarea style={ta} value={config.cta.body} onChange={e => setConfig(c=>({...c,cta:{...c.cta,body:e.target.value}}))} rows={3} /></Field>
              <Row>
                <Field l="Button label"><input style={inp} value={config.cta.buttonLabel} onChange={e => setConfig(c=>({...c,cta:{...c.cta,buttonLabel:e.target.value}}))} /></Field>
                <Field l="Button link"><input style={inp} value={config.cta.buttonHref} onChange={e => setConfig(c=>({...c,cta:{...c.cta,buttonHref:e.target.value}}))} /></Field>
              </Row>
            </div>
          )}

          <div style={{ marginTop: "2.5rem", borderTop: "1px solid #1e3a5f", paddingTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={save} disabled={saving} style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.75rem", fontWeight: 700, cursor: saving ? "wait" : "pointer", fontSize: "0.9rem" }}>
              {saving ? "Saving…" : "💾 Save All Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Member editor sub-form ────────────────────────────────────────────────────
function MemberEditor({ member, onSave, onCancel }: { member: Member; onSave: (m: Member) => void; onCancel: () => void }) {
  const [m, setM] = useState<Member>(member);
  const set = (patch: Partial<Member>) => setM(prev => ({ ...prev, ...patch }));

  const inp2: React.CSSProperties = {
    width: "100%", background: "#0d1f3c", border: "1px solid #1e3a5f",
    borderRadius: "6px", color: "#e2e8f0", fontSize: "0.85rem",
    padding: "0.45rem 0.7rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button onClick={onCancel} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>← Back</button>
        <h2 style={{ color: "#fff", fontSize: "1.1rem", margin: 0 }}>{m.name || "New Member"}</h2>
      </div>

      <Row>
        <Field l="Full Name"><input style={inp2} value={m.name} onChange={e => set({ name: e.target.value })} /></Field>
        <Field l="Role / Title"><input style={inp2} value={m.role} onChange={e => set({ role: e.target.value })} /></Field>
      </Row>
      <Row>
        <Field l="Degree / Education"><input style={inp2} value={m.degree} onChange={e => set({ degree: e.target.value })} /></Field>
        <Field l="Card accent colour"><div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}><input type="color" value={m.color} onChange={e => set({ color: e.target.value })} style={{ width: 40, height: 36, border: "none", borderRadius: 6, cursor: "pointer", background: "none" }} /><input style={{ ...inp2, flex: 1 }} value={m.color} onChange={e => set({ color: e.target.value })} /></div></Field>
      </Row>
      <Row>
        <Field l="Display order (lower = first)"><input type="number" style={inp2} value={m.order} onChange={e => set({ order: Number(e.target.value) })} /></Field>
      </Row>

      <Field l="Photo (URL or upload)">
        <PhotoInput value={m.photo} onChange={v => set({ photo: v })} />
      </Field>

      <div style={{ margin: "1.25rem 0 0.5rem", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Links</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {m.links.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
            <input style={{ ...inp2, width: "100px", flexShrink: 0 }} value={l.label} placeholder="Label" onChange={e => { const n=[...m.links]; n[i]={...n[i],label:e.target.value}; set({ links: n }); }} />
            <input style={{ ...inp2, flex: 1 }} value={l.href} placeholder="URL" onChange={e => { const n=[...m.links]; n[i]={...n[i],href:e.target.value}; set({ links: n }); }} />
            <button onClick={() => set({ links: m.links.filter((_,j)=>j!==i) })} style={{ ...btn("#ef4444"), flexShrink: 0 }}>✕</button>
          </div>
        ))}
        <button onClick={() => set({ links: [...m.links, { label: "", href: "" }] })} style={btn("#22c55e")}>+ Add Link</button>
      </div>

      <div style={{ margin: "1.25rem 0 0.5rem", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Bullet points</div>
      <StrList items={m.bullets} onChange={v => set({ bullets: v })} placeholder="Bullet point…" />

      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btn("#64748b")}>Cancel</button>
        <button onClick={() => onSave(m)} style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: "7px", padding: "0.5rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>Save Member</button>
      </div>
    </div>
  );
}
