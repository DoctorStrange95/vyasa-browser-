"use client";

import { useEffect, useState } from "react";
import HospitalFinder from "./HospitalFinder";
import HealthLocker from "./HealthLocker";
import CitizenAuthBar, { CitizenUser } from "./CitizenAuthBar";

const TABS = [
  { id: "hospitals", label: "🏥 Find Hospital" },
  { id: "emergency", label: "🚨 Emergency" },
  { id: "locker",    label: "🔐 Health Locker" },
];

function EmergencyConnect() {
  const cards = [
    { icon: "🚑", title: "108 Ambulance",           sub: "Free emergency ambulance",         num: "108",          bg: "#1a0a0a", border: "#7f1d1d", color: "#fca5a5", btnBg: "#dc2626" },
    { icon: "🩺", title: "PM-JAY Helpline",         sub: "Ayushman Bharat grievance & info", num: "14555",        bg: "#071a14", border: "#14532d", color: "#86efac", btnBg: "#16a34a" },
    { icon: "🧠", title: "iCall Mental Health",     sub: "Free counselling (Mon–Sat)",        num: "9152987821",   bg: "#0f0a1f", border: "#3b0764", color: "#c4b5fd", btnBg: "#7c3aed" },
    { icon: "☎️", title: "National Health Helpline", sub: "Health info & referrals",          num: "1800-180-1104",bg: "#1a1000", border: "#78350f", color: "#fcd34d", btnBg: "#d97706" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
      {cards.map((c) => (
        <div key={c.num} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{c.icon}</div>
          <div style={{ fontWeight: 700, color: c.color, fontSize: "1rem", marginBottom: "0.2rem" }}>{c.title}</div>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "1rem" }}>{c.sub}</div>
          <a href={`tel:${c.num.replace(/-/g, "")}`} style={{ display: "block", background: c.btnBg, color: "#fff", borderRadius: "8px", padding: "0.7rem", fontWeight: 700, fontSize: "1.1rem", textDecoration: "none", letterSpacing: "1px" }}>
            {c.num}
          </a>
        </div>
      ))}
    </div>
  );
}

export default function CitizensPage() {
  const [user, setUser]         = useState<CitizenUser | null | "loading">("loading");
  const [activeTab, setActiveTab] = useState("hospitals");

  useEffect(() => {
    fetch("/api/citizens/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d))
      .catch(() => setUser(null));
  }, []);

  const isLoggedIn = user !== null && user !== "loading";

  return (
    <div style={{ backgroundColor: "#070f1e", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ borderBottom: "1px solid #1e3a5f", padding: "2rem 1.5rem 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🏥</span>
            <h1 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: 0 }}>
              Citizens Health Centre
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
            Find Ayushman Bharat hospitals · Emergency helplines · Secure health locker
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e3a5f" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", display: "flex", overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "0.85rem 1.25rem", border: "none", background: "transparent",
              color: activeTab === tab.id ? "#93c5fd" : "#64748b",
              borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap",
            }}>
              {tab.label}
              {tab.id === "locker" && !isLoggedIn && (
                <span style={{ marginLeft: "4px", fontSize: "0.65rem", color: "#475569" }}>🔒</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        {/* Citizen auth bar — always visible */}
        <CitizenAuthBar user={user} onAuthChange={setUser} />

        {activeTab === "hospitals" && (
          <HospitalFinder isLoggedIn={isLoggedIn} />
        )}

        {activeTab === "emergency" && <EmergencyConnect />}

        {activeTab === "locker" && (
          <HealthLocker
            user={isLoggedIn ? (user as CitizenUser) : null}
          />
        )}
      </div>
    </div>
  );
}
