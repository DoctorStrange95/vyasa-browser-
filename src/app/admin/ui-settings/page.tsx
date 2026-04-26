"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { UIConfig } from "@/lib/siteConfig";

const DEFAULTS: UIConfig = {
  header:  { showForDoctors: true },
  sidebar: { showFindNearby: true, showSignInCTA: true, showJoinProfessional: true, showAbout: true, showHomeSections: true },
  mobile:  { showFAB: true },
  content: { showIDSPSection: true, showIntelFeed: true, showAyushmanTab: true, showHealthLockerTab: true, idspMaxItems: 20, intelMaxItems: 6 },
};

export default function UISettingsPage() {
  const [config,  setConfig]  = useState<UIConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState("");

  useEffect(() => {
    fetch("/api/admin/ui-settings")
      .then(r => r.json())
      .then(d => { if (d && !d.error) setConfig(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/ui-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setToast("Saved! Changes live within 60 seconds.");
    } catch {
      setToast("Save failed. Try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 4000);
    }
  }

  function setH(patch: Partial<UIConfig["header"]>)  { setConfig(c => ({ ...c, header:  { ...c.header,  ...patch } })); }
  function setS(patch: Partial<UIConfig["sidebar"]>) { setConfig(c => ({ ...c, sidebar: { ...c.sidebar, ...patch } })); }
  function setM(patch: Partial<UIConfig["mobile"]>)  { setConfig(c => ({ ...c, mobile:  { ...c.mobile,  ...patch } })); }
  function setC(patch: Partial<UIConfig["content"]>) { setConfig(c => ({ ...c, content: { ...c.content, ...patch } })); }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>

      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, background: toast.includes("fail") ? "#7f1d1d" : "#166534", color: "#fff", padding: "0.75rem 1.25rem", borderRadius: "8px", fontSize: "0.85rem" }}>
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/admin" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>← Admin</Link>
          <span style={{ color: "#fff", fontWeight: 700 }}>UI Visibility Settings</span>
        </div>
        <button onClick={save} disabled={saving} style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: "7px", padding: "0.45rem 1.25rem", fontWeight: 700, cursor: saving ? "wait" : "pointer", fontSize: "0.85rem" }}>
          {saving ? "Saving…" : "💾 Save Changes"}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "4rem", color: "#475569", textAlign: "center" }}>Loading settings…</div>
      ) : (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          {/* Header */}
          <Section title="🔝 Header Bar" desc="Controls what appears in the top navigation bar">
            <Toggle label="Show 'For Doctors' button" sub="Muted link to /join in the top-right header area" value={config.header.showForDoctors} onChange={v => setH({ showForDoctors: v })} />
          </Section>

          {/* Sidebar */}
          <Section title="📋 Sidebar Navigation" desc="Controls what appears in the left sidebar (desktop) and drawer (mobile)">
            <Toggle label="Show 'Find Nearby' button" sub="Opens the FacilityDrawer to search nearby hospitals" value={config.sidebar.showFindNearby} onChange={v => setS({ showFindNearby: v })} />
            <Toggle label="Show 'Sign In' CTA" sub="'Sign In — See Your State →' button shown to logged-out users at the bottom" value={config.sidebar.showSignInCTA} onChange={v => setS({ showSignInCTA: v })} />
            <Toggle label="Show 'Join as Professional' button" sub="Secondary CTA at the bottom of sidebar for doctors" value={config.sidebar.showJoinProfessional} onChange={v => setS({ showJoinProfessional: v })} />
            <Toggle label="Show 'About' section" sub="Our Team · Data Sources · Contact links" value={config.sidebar.showAbout} onChange={v => setS({ showAbout: v })} />
            <Toggle label="Show homepage section shortcuts" sub="Scroll anchors (Overview, Facilities, Intel Feed…) shown only on the homepage" value={config.sidebar.showHomeSections} onChange={v => setS({ showHomeSections: v })} />
          </Section>

          {/* Mobile */}
          <Section title="📱 Mobile Experience" desc="Controls the floating elements on phones and small screens">
            <Toggle label="Show mobile FAB (floating ☰ button)" sub="Bottom-left floating button that opens the navigation drawer on mobile" value={config.mobile.showFAB} onChange={v => setM({ showFAB: v })} />
          </Section>

          {/* Content */}
          <Section title="📊 Content Sections" desc="Show or hide entire page sections, and set maximum item counts">
            <Toggle label="Show IDSP Weekly Report section" sub="Disease outbreak report section on the homepage" value={config.content.showIDSPSection} onChange={v => setC({ showIDSPSection: v })} />
            <Toggle label="Show Public Health Intelligence feed" sub="Scraped intelligence items on the homepage" value={config.content.showIntelFeed} onChange={v => setC({ showIntelFeed: v })} />
            <Toggle label="Show 'Ayushman Card' tab in Citizens Centre" sub="🛡️ Ayushman Card info tab with eligibility steps, helplines, links" value={config.content.showAyushmanTab} onChange={v => setC({ showAyushmanTab: v })} />
            <Toggle label="Show 'Health Locker' tab in Citizens Centre" sub="🔐 Secure personal health record storage (requires sign-in)" value={config.content.showHealthLockerTab} onChange={v => setC({ showHealthLockerTab: v })} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
              <NumberField label="IDSP max outbreak cards" sub="How many outbreak cards to show (homepage)" value={config.content.idspMaxItems} min={5} max={50} onChange={v => setC({ idspMaxItems: v })} />
              <NumberField label="Intel feed max items" sub="Max items in health intelligence feed" value={config.content.intelMaxItems} min={3} max={20} onChange={v => setC({ intelMaxItems: v })} />
            </div>
          </Section>

          <button onClick={save} disabled={saving} style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: "8px", padding: "0.7rem 2rem", fontWeight: 700, cursor: saving ? "wait" : "pointer", fontSize: "0.9rem", alignSelf: "flex-end" }}>
            {saving ? "Saving…" : "💾 Save All Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "14px", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #1e3a5f" }}>
        <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{title}</div>
        <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.2rem" }}>{desc}</div>
      </div>
      <div style={{ padding: "0.5rem 0" }}>{children}</div>
    </div>
  );
}

function Toggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.5rem", gap: "1rem", cursor: "pointer", borderBottom: "1px solid #1e3a5f10" }}
      onClick={() => onChange(!value)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.88rem", color: value ? "#e2e8f0" : "#64748b", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: "0.72rem", color: "#334155", marginTop: "0.1rem" }}>{sub}</div>
      </div>
      {/* Toggle switch */}
      <div style={{
        width: "44px", height: "24px", borderRadius: "12px", flexShrink: 0, position: "relative",
        background: value ? "#0d9488" : "#1e3a5f",
        transition: "background 0.2s",
        border: `1px solid ${value ? "#0d948880" : "#334155"}`,
      }}>
        <div style={{
          position: "absolute", top: "3px",
          left: value ? "22px" : "3px",
          width: "16px", height: "16px", borderRadius: "50%",
          background: value ? "#fff" : "#64748b",
          transition: "left 0.2s",
        }} />
      </div>
    </div>
  );
}

function NumberField({ label, sub, value, min, max, onChange }: { label: string; sub: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "9px", padding: "0.85rem 1rem" }}>
      <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontSize: "0.65rem", color: "#334155", marginBottom: "0.5rem" }}>{sub}</div>
      <input
        type="number"
        min={min} max={max}
        value={value}
        onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        style={{ width: "80px", background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "6px", color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 700, padding: "0.3rem 0.55rem", outline: "none", fontFamily: "inherit" }}
      />
    </div>
  );
}
