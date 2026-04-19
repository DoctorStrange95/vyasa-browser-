"use client";
import { useState } from "react";

const FLOORS = [
  {
    id: "hospital",
    icon: "🏥",
    name: "Hospital",
    desc: "Floor 1 — IPD, beds, billing",
    color: "#22c55e",
    bg: "#052010",
    border: "#0a3a1a",
    features: ["IPD patient dashboard", "Bed management", "Staff roster & shifts", "Auto-billing & invoices", "NABH compliance tracking"],
    interactions: [
      { t: "Hospital → Lobby", d: "Post referral requests, broadcast bed availability." },
      { t: "Hospital → Doctor", d: "Assign admitted patients, view doctor activity on IPD cases." },
      { t: "Hospital → Lab/Pharmacy", d: "Track test orders and drug dispensing for billing." },
    ],
  },
  {
    id: "doctor",
    icon: "👨‍⚕️",
    name: "Doctor",
    desc: "Floor 2 — Prescriptions, EMR",
    color: "#3b82f6",
    bg: "#031428",
    border: "#0c2a50",
    features: ["Digital prescriptions", "Real-time patient vitals", "AI discharge summaries", "Accept referrals from lobby", "Peer consult network"],
    interactions: [
      { t: "Doctor → Lobby", d: "Accept referrals, post complex cases for peer consult." },
      { t: "Doctor → Nurse", d: "Push care orders; receive real-time vitals & SOS alerts." },
      { t: "Doctor → Pharmacy", d: "Send digital prescription; confirm dispensing before billing." },
    ],
  },
  {
    id: "nurse",
    icon: "👩‍⚕️",
    name: "Nurse",
    desc: "Floor 3 — Vitals, MAR, SOS",
    color: "#a855f7",
    bg: "#160d30",
    border: "#2d1a5e",
    features: ["Vitals live dashboard", "Auto-MAR (medication record)", "SOS trigger button", "Task notifications from doctor", "Care activity log"],
    interactions: [
      { t: "Nurse → Doctor", d: "Send SOS alerts, update vitals, request order clarification." },
      { t: "Nurse → Pharmacy", d: "Confirm medication received; flag discrepancies." },
      { t: "Nurse → Lab", d: "Receive sample collection tasks; log handoff timestamps." },
    ],
  },
  {
    id: "lab",
    icon: "🧪",
    name: "Lab",
    desc: "Floor 4 — Tests, results",
    color: "#f59e0b",
    bg: "#1a0e02",
    border: "#3a1e04",
    features: ["Receive test orders", "Upload results digitally", "Auto-notify doctor & patient", "Critical value alert to lobby", "NABL integration"],
    interactions: [
      { t: "Lab → Doctor", d: "Push results in real time; send critical value alerts." },
      { t: "Lab → Lobby", d: "Broadcast critical findings affecting other patients." },
      { t: "Lab → Hospital", d: "Reports feed billing module; NABL compliance auto-generated." },
    ],
  },
  {
    id: "pharmacy",
    icon: "💊",
    name: "Pharmacy",
    desc: "Floor 5 — Dispensing, inventory",
    color: "#10b981",
    bg: "#021a10",
    border: "#043a22",
    features: ["Receive digital prescriptions", "Dispensing confirmation", "Inventory tracking", "Auto-bill on dispense", "Drug-drug interaction alerts"],
    interactions: [
      { t: "Pharmacy → Doctor", d: "Confirm dispensing; flag drug-drug interaction before dispensing." },
      { t: "Pharmacy → Nurse", d: "Notify medication ready; track MAR timestamps." },
      { t: "Pharmacy → Patient", d: "Patient sees each medication dispensed on their portal." },
    ],
  },
];

export default function VyasaPlatformSection() {
  const [active, setActive] = useState<string | null>(null);
  const activeFloor = FLOORS.find((f) => f.id === active);

  return (
    <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem 5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="font-display" style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
          Vyasa Platform Architecture
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
          Five specialised floors connected by a shared coordination lobby — no phone calls, no clipboards.
        </p>
      </div>

      {/* Lobby */}
      <div
        style={{
          backgroundColor: "#0f2040",
          border: "1px solid #0d9488",
          borderRadius: "12px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ fontSize: "0.7rem", color: "#2dd4bf", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          Common Lobby — Shared Coordination Layer
        </div>
        <div className="font-display" style={{ fontSize: "1rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>
          VYASA Unified Hub
        </div>
        <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1rem", lineHeight: 1.6 }}>
          Any role can broadcast, request, or respond here. Hospitals post referrals. Doctors pick up cases. Labs share alerts. Everyone sees only what's relevant to their role.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {["📢 Post referral", "🔴 Broadcast SOS", "📊 IDSP feed", "🤝 Cross-institution consult", "🛏 Bed board", "🧪 Critical lab alerts"].map((a) => (
            <span key={a} style={{ fontSize: "0.75rem", color: "#94a3b8", backgroundColor: "#0a1628", border: "1px solid #1e3a5f", padding: "0.3rem 0.7rem", borderRadius: "6px" }}>
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Floor cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        {FLOORS.map((f) => (
          <div
            key={f.id}
            onClick={() => setActive(active === f.id ? null : f.id)}
            style={{
              backgroundColor: active === f.id ? f.bg : "#0f2040",
              border: `1px solid ${active === f.id ? f.color : "#1e3a5f"}`,
              borderRadius: "10px",
              padding: "1rem",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>{f.icon}</span>
              <span style={{ fontWeight: 600, color: active === f.id ? f.color : "#e2e8f0", fontSize: "0.9rem" }}>{f.name}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{f.desc}</div>
            {active === f.id && (
              <div style={{ marginTop: "0.75rem", borderTop: `1px solid ${f.border}`, paddingTop: "0.75rem" }}>
                {f.features.map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", marginBottom: "0.3rem" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: f.color, marginTop: "6px", flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Interaction panel */}
      {activeFloor && (
        <div
          style={{
            backgroundColor: activeFloor.bg,
            border: `1px solid ${activeFloor.border}`,
            borderRadius: "10px",
            padding: "1.25rem",
            animation: "fadeSlide 0.2s ease",
          }}
        >
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: activeFloor.color, marginBottom: "0.85rem" }}>
            {activeFloor.name} — Role Interactions
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
            {activeFloor.interactions.map((i) => (
              <div key={i.t} style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.85rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "0.3rem" }}>{i.t}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5 }}>{i.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
