"use client";
import { useState } from "react";

const ROLES = [
  "Doctor / Physician",
  "Hospital Administrator",
  "Nurse / Nursing Staff",
  "Lab Technician / Pathologist",
  "Pharmacist",
  "Government Health Official",
  "Public Health Researcher",
  "Medical College Faculty",
  "Health IT Professional",
  "Other",
];

const DOCTOR_SPECIALIZATIONS = [
  "General Medicine / Family Medicine",
  "Paediatrics",
  "Gynaecology & Obstetrics",
  "Cardiology",
  "Neurology",
  "Orthopaedics",
  "Surgery",
  "Dermatology",
  "ENT",
  "Psychiatry",
  "Radiology / Imaging",
  "Anaesthesiology",
  "Ophthalmology",
  "Oncology",
  "Emergency Medicine",
  "Other",
];

const INTERESTS = [
  { id: "prescriptions",  label: "Digital Prescriptions & EMR",         icon: "📝" },
  { id: "analytics",      label: "AI Clinical Analytics & Insights",      icon: "📊" },
  { id: "patients",       label: "Patient Management & Tracking",         icon: "👤" },
  { id: "lab",            label: "Lab Integration & Results",             icon: "🧪" },
  { id: "pharmacy",       label: "Pharmacy & Dispensing",                 icon: "💊" },
  { id: "compliance",     label: "NABH / NABL Compliance Tools",          icon: "✅" },
  { id: "surveillance",   label: "Disease Outbreak Surveillance",         icon: "📡" },
  { id: "community",      label: "Community & Public Health Reporting",   icon: "🏘️" },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand",
  "West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
  "Andaman & Nicobar Islands","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep",
];

type Status = "idle" | "submitting" | "success" | "error";

export default function WaitlistForm() {
  const [name,               setName]               = useState("");
  const [email,              setEmail]              = useState("");
  const [phone,              setPhone]              = useState("");
  const [role,               setRole]               = useState("");
  const [specialization,     setSpecialization]     = useState("");
  const [prescriptionBoring, setPrescriptionBoring] = useState("");
  const [interests,          setInterests]          = useState<string[]>([]);
  const [city,               setCity]               = useState("");
  const [state,              setState]              = useState("");
  const [referral,           setReferral]           = useState("");
  const [status,             setStatus]             = useState<Status>("idle");
  const [errMsg,             setErrMsg]             = useState("");

  const isDoctor = role.startsWith("Doctor");

  function toggleInterest(id: string) {
    setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !role) {
      setErrMsg("Please fill in all required fields."); return;
    }
    setStatus("submitting"); setErrMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, role, specialization, prescriptionBoring, interests, city, state, referral }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? "Submission failed."); setStatus("error"); return; }
      setStatus("success");
    } catch {
      setErrMsg("Network error. Please try again."); setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center", padding: "3rem 1.5rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>You&apos;re on the list!</h2>
        <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          We&apos;ll reach out soon with early access. We&apos;re rolling out by specialization and region to keep quality high — thank you for joining the Vyasa network.
        </p>
        <div style={{ backgroundColor: "#0a1628", border: "1px solid #0d948840", borderRadius: "12px", padding: "1.25rem", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7 }}>
          Meanwhile, explore India&apos;s public health data on <a href="/" style={{ color: "#2dd4bf", textDecoration: "none" }}>HealthForIndia →</a>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", backgroundColor: "#080f1e", border: "1px solid #1e3a5f",
    borderRadius: "8px", color: "#e2e8f0", fontSize: "0.85rem",
    padding: "0.6rem 0.85rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.4rem",
  };
  const reqStyle: React.CSSProperties = { color: "#f87171", marginLeft: "2px" };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Personal details ── */}
      <div style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div style={{ fontSize: "0.7rem", color: "#2dd4bf", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Your Details</div>

        <div>
          <label style={labelStyle}>Full Name <span style={reqStyle}>*</span></label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Ananya Sharma" required />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Email <span style={reqStyle}>*</span></label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label style={labelStyle}>Phone <span style={reqStyle}>*</span></label>
            <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>City</label>
            <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" />
          </div>
          <div>
            <label style={labelStyle}>State</label>
            <select style={inputStyle} value={state} onChange={e => setState(e.target.value)}>
              <option value="">Select state…</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Role & specialization ── */}
      <div style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div style={{ fontSize: "0.7rem", color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Your Role</div>

        <div>
          <label style={labelStyle}>Role / Designation <span style={reqStyle}>*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.5rem" }}>
            {ROLES.map(r => (
              <button
                key={r} type="button"
                onClick={() => { setRole(r); if (!r.startsWith("Doctor")) setSpecialization(""); }}
                style={{
                  padding: "0.55rem 0.85rem", fontSize: "0.78rem", textAlign: "left",
                  backgroundColor: role === r ? "#0f2040" : "#060d1a",
                  border: `1px solid ${role === r ? "#6366f1" : "#1e3a5f"}`,
                  borderRadius: "8px", color: role === r ? "#a5b4fc" : "#64748b",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: role === r ? 600 : 400,
                  transition: "border-color 0.15s",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {isDoctor && (
          <div>
            <label style={labelStyle}>Specialization</label>
            <select style={inputStyle} value={specialization} onChange={e => setSpecialization(e.target.value)}>
              <option value="">Select specialization…</option>
              {DOCTOR_SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {!isDoctor && role && (
          <div>
            <label style={labelStyle}>Department / Area (optional)</label>
            <input style={inputStyle} value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="e.g. ICU, Oncology, Paediatrics…" />
          </div>
        )}
      </div>

      {/* ── Pain points ── */}
      <div style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div style={{ fontSize: "0.7rem", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Your Workflow</div>

        <div>
          <label style={labelStyle}>Does writing prescriptions on paper feel boring or inefficient?</label>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {[
              { val: "yes",       label: "Yes — very much",           color: "#f87171" },
              { val: "somewhat",  label: "Somewhat",                  color: "#f59e0b" },
              { val: "no",        label: "No, paper works fine",      color: "#4ade80" },
            ].map(opt => (
              <button
                key={opt.val} type="button"
                onClick={() => setPrescriptionBoring(opt.val)}
                style={{
                  padding: "0.5rem 1rem", fontSize: "0.8rem",
                  backgroundColor: prescriptionBoring === opt.val ? `${opt.color}20` : "#060d1a",
                  border: `1px solid ${prescriptionBoring === opt.val ? opt.color : "#1e3a5f"}`,
                  borderRadius: "8px", color: prescriptionBoring === opt.val ? opt.color : "#64748b",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: prescriptionBoring === opt.val ? 700 : 400,
                  transition: "border-color 0.15s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Interests ── */}
      <div style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.75rem" }}>What Interests You Most?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
            {INTERESTS.map(opt => {
              const selected = interests.includes(opt.id);
              return (
                <button
                  key={opt.id} type="button"
                  onClick={() => toggleInterest(opt.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.6rem 0.85rem", fontSize: "0.78rem", textAlign: "left",
                    backgroundColor: selected ? "#0a1f10" : "#060d1a",
                    border: `1px solid ${selected ? "#22c55e" : "#1e3a5f"}`,
                    borderRadius: "8px", color: selected ? "#4ade80" : "#64748b",
                    cursor: "pointer", fontFamily: "inherit", fontWeight: selected ? 600 : 400,
                    transition: "border-color 0.15s",
                  }}
                >
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>{opt.icon}</span>
                  <span style={{ lineHeight: 1.3 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>How did you hear about Vyasa? (optional)</label>
          <input style={inputStyle} value={referral} onChange={e => setReferral(e.target.value)} placeholder="Colleague, LinkedIn, conference, news article…" />
        </div>
      </div>

      {/* ── Submit ── */}
      {errMsg && (
        <div style={{ fontSize: "0.8rem", color: "#f87171", backgroundColor: "#ef444415", border: "1px solid #ef444430", borderRadius: "8px", padding: "0.7rem 1rem" }}>
          {errMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        style={{
          backgroundColor: status === "submitting" ? "#0a3030" : "#0d9488",
          color: "#fff", border: "none", borderRadius: "10px",
          padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 700,
          cursor: status === "submitting" ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "background 0.15s",
        }}
      >
        {status === "submitting" ? "Joining…" : "Join the Vyasa Waitlist →"}
      </button>

      <p style={{ fontSize: "0.7rem", color: "#334155", textAlign: "center", margin: 0 }}>
        No spam. We&apos;ll contact you only for early access invites and important updates.
      </p>
    </form>
  );
}
