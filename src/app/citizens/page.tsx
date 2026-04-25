"use client";

import { useState } from "react";
import HospitalFinder from "./HospitalFinder";
import HealthLocker from "./HealthLocker";

const TABS = [
  { id: "hospitals", label: "🏥 Find Hospital", desc: "Ayushman Bharat empanelled hospitals" },
  { id: "emergency", label: "🚨 Emergency",     desc: "108 ambulance & PM-JAY helpline" },
  { id: "locker",    label: "🔐 Health Locker", desc: "Your personal health documents" },
];

function EmergencyConnect() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
      {/* 108 Ambulance */}
      <div style={{ background: "#1a0a0a", border: "1px solid #7f1d1d", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🚑</div>
        <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: "1.1rem", marginBottom: "0.25rem" }}>108 Ambulance</div>
        <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "1rem" }}>Free emergency ambulance service</div>
        <a
          href="tel:108"
          style={{ display: "block", background: "#dc2626", color: "#fff", borderRadius: "8px", padding: "0.75rem", fontWeight: 700, fontSize: "1.3rem", textDecoration: "none", letterSpacing: "2px" }}
        >
          Call 108
        </a>
      </div>

      {/* PM-JAY Helpline */}
      <div style={{ background: "#071a14", border: "1px solid #14532d", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🩺</div>
        <div style={{ fontWeight: 700, color: "#86efac", fontSize: "1.1rem", marginBottom: "0.25rem" }}>PM-JAY Helpline</div>
        <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "1rem" }}>Ayushman Bharat grievance & info helpline</div>
        <a
          href="tel:14555"
          style={{ display: "block", background: "#16a34a", color: "#fff", borderRadius: "8px", padding: "0.75rem", fontWeight: 700, fontSize: "1.3rem", textDecoration: "none", letterSpacing: "2px" }}
        >
          Call 14555
        </a>
      </div>

      {/* NIMHANS Mental Health */}
      <div style={{ background: "#0f0a1f", border: "1px solid #3b0764", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🧠</div>
        <div style={{ fontWeight: 700, color: "#c4b5fd", fontSize: "1.1rem", marginBottom: "0.25rem" }}>iCall Mental Health</div>
        <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "1rem" }}>Free mental health counselling (Mon–Sat)</div>
        <a
          href="tel:9152987821"
          style={{ display: "block", background: "#7c3aed", color: "#fff", borderRadius: "8px", padding: "0.75rem", fontWeight: 700, fontSize: "1.1rem", textDecoration: "none", letterSpacing: "1px" }}
        >
          Call 9152987821
        </a>
      </div>

      {/* Poisons helpline */}
      <div style={{ background: "#1a1000", border: "1px solid #78350f", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>☎️</div>
        <div style={{ fontWeight: 700, color: "#fcd34d", fontSize: "1.1rem", marginBottom: "0.25rem" }}>National Health Helpline</div>
        <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "1rem" }}>General health information & referrals</div>
        <a
          href="tel:1800-180-1104"
          style={{ display: "block", background: "#d97706", color: "#fff", borderRadius: "8px", padding: "0.75rem", fontWeight: 700, fontSize: "1.1rem", textDecoration: "none", letterSpacing: "1px" }}
        >
          1800-180-1104
        </a>
      </div>
    </div>
  );
}

export default function CitizensPage() {
  const [activeTab, setActiveTab] = useState("hospitals");

  return (
    <div style={{ backgroundColor: "#070f1e", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ borderBottom: "1px solid #1e3a5f", padding: "2rem 1.5rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.6rem" }}>🏥</span>
          <h1 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: 0 }}>
            Citizens Health Centre
          </h1>
        </div>
        <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
          Find Ayushman Bharat empanelled hospitals across India · Emergency helplines · Secure health document locker
        </p>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e3a5f", maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", gap: "0", overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.85rem 1.25rem", border: "none", background: "transparent",
                color: activeTab === tab.id ? "#93c5fd" : "#64748b",
                borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        {activeTab === "hospitals" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 600, margin: "0 0 0.3rem" }}>
                Ayushman Bharat Hospital Finder
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.82rem", margin: 0 }}>
                Search from 36 state lists of AB-PMJAY empanelled hospitals. Filter by district and medical speciality. Nearest district is shown first when location is allowed.
              </p>
            </div>
            <HospitalFinder />
          </div>
        )}

        {activeTab === "emergency" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 600, margin: "0 0 0.3rem" }}>
                Emergency Connect
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.82rem", margin: 0 }}>
                Tap any card to call immediately.
              </p>
            </div>
            <EmergencyConnect />
          </div>
        )}

        {activeTab === "locker" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 600, margin: "0 0 0.3rem" }}>
                Health Locker
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.82rem", margin: 0 }}>
                Securely store prescriptions, lab reports, vaccination certificates and health cards. Access them anytime from any device.
              </p>
            </div>
            <HealthLocker />
          </div>
        )}
      </div>
    </div>
  );
}
