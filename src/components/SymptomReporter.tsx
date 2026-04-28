"use client";
import { useState } from "react";

const CATEGORIES = [
  {
    id: "fever-rash",
    label: "Fever + Rash",
    icon: "🌡️",
    subTypes: [
      { id: "measles",    label: "Measles",    hint: "fever + rash, koplik spots" },
      { id: "rubella",    label: "Rubella",    hint: "mild fever + rash" },
      { id: "chickenpox", label: "Chickenpox", hint: "itchy vesicular rash" },
    ],
  },
  {
    id: "acute-fever",
    label: "Acute Fever",
    icon: "🦟",
    subTypes: [
      { id: "malaria",      label: "Malaria",       hint: "chills, rigor, sweating" },
      { id: "dengue",       label: "Dengue",         hint: "high fever, behind-eye pain, bleeding" },
      { id: "chikungunya",  label: "Chikungunya",    hint: "joint pain, fever" },
      { id: "scrub-typhus", label: "Scrub Typhus",   hint: "eschar, rash, fever" },
    ],
  },
  {
    id: "respiratory",
    label: "Respiratory",
    icon: "🫁",
    subTypes: [
      { id: "influenza",   label: "Influenza",     hint: "cough, sore throat, myalgia" },
      { id: "pneumonia",   label: "Pneumonia",     hint: "breathlessness, chest pain" },
      { id: "tb",          label: "TB",            hint: "chronic cough ≥2 weeks, haemoptysis" },
    ],
  },
  {
    id: "diarrhea",
    label: "Diarrhea",
    icon: "🦠",
    subTypes: [
      { id: "cholera",         label: "Cholera",         hint: "rice-water stools, severe dehydration" },
      { id: "acute-diarrhea",  label: "Acute Diarrhea",  hint: "loose stools, vomiting" },
    ],
  },
  {
    id: "neuro",
    label: "Neurological",
    icon: "🧠",
    subTypes: [
      { id: "encephalitis", label: "Encephalitis", hint: "fever + seizures + altered consciousness" },
      { id: "meningitis",   label: "Meningitis",   hint: "fever + neck stiffness + photophobia" },
    ],
  },
  {
    id: "zoonotic",
    label: "Zoonotic",
    icon: "🐀",
    subTypes: [
      { id: "rabies",        label: "Rabies",        hint: "hydrophobia, animal bite history" },
      { id: "leptospirosis", label: "Leptospirosis", hint: "jaundice, fever, waterlogging exposure" },
      { id: "anthrax",       label: "Anthrax",       hint: "painless ulcer, animal contact" },
    ],
  },
  {
    id: "vector",
    label: "Vector-borne",
    icon: "🪲",
    subTypes: [
      { id: "kala-azar",  label: "Kala-azar",  hint: "prolonged fever, splenomegaly" },
      { id: "filariasis", label: "Filariasis", hint: "limb swelling, lymphoedema" },
    ],
  },
  {
    id: "vaccine-preventable",
    label: "Vaccine-Preventable",
    icon: "💉",
    subTypes: [
      { id: "diphtheria", label: "Diphtheria", hint: "throat membrane, bull neck" },
      { id: "pertussis",  label: "Pertussis",  hint: "whooping cough paroxysms" },
      { id: "tetanus",    label: "Tetanus",    hint: "lockjaw, muscle spasms" },
    ],
  },
  {
    id: "hemorrhagic",
    label: "Hemorrhagic",
    icon: "🩸",
    subTypes: [
      { id: "severe-dengue", label: "Severe Dengue", hint: "platelet drop, bleeding tendencies" },
    ],
  },
  {
    id: "skin",
    label: "Skin",
    icon: "🔬",
    subTypes: [
      { id: "scabies", label: "Scabies",     hint: "intense itching, burrows" },
      { id: "fungal",  label: "Fungal Rash", hint: "ring-shaped rash, scaling" },
    ],
  },
];

interface Props {
  userState?: string;
  userDistrict?: string;
  onSubmitted?: (credits: number, total: number, badge: string) => void;
}

export default function SymptomReporter({ userState, userDistrict, onSubmitted }: Props) {
  const [step, setStep]           = useState<"category" | "subtype" | "done">("category");
  const [selectedCat, setSelectedCat] = useState<typeof CATEGORIES[0] | null>(null);
  const [selectedSub, setSelectedSub] = useState<string>("");
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);
  const [result, setResult]           = useState<{ credits: number; total: number; badge: string } | null>(null);
  const [error, setError]             = useState<string | null>(null);

  async function submit() {
    if (!selectedCat) return;
    setSaving(true);
    setError(null);
    try {
      const sub = selectedCat.subTypes.find(s => s.id === selectedSub);
      const res = await fetch("/api/user/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCat.id,
          subType:  sub?.label ?? null,
          symptoms: [selectedCat.label, sub?.label].filter(Boolean),
          state:    userState ?? null,
          district: userDistrict ?? null,
          notes:    notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Submit failed"); return; }
      setResult({ credits: data.creditsAwarded, total: data.totalCredits, badge: data.badge });
      setStep("done");
      onSubmitted?.(data.creditsAwarded, data.totalCredits, data.badge);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setStep("category"); setSelectedCat(null); setSelectedSub(""); setNotes(""); setResult(null); setError(null);
  }

  if (step === "done" && result) {
    return (
      <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{result.badge}</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#4ade80", marginBottom: "0.25rem" }}>
          +{result.credits} credits earned!
        </div>
        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem" }}>
          Total: {result.total} credits · Thank you for helping IDSP surveillance
        </div>
        <button onClick={reset} style={{ fontSize: "0.82rem", backgroundColor: "#0d9488", color: "#fff", border: "none", borderRadius: "8px", padding: "0.55rem 1.25rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          Report Another
        </button>
      </div>
    );
  }

  return (
    <div>
      {step === "category" && (
        <>
          <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem", lineHeight: 1.5 }}>
            Report symptoms you or a household member are currently experiencing. Your report helps IDSP track disease trends in your area.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.5rem" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCat(cat); setSelectedSub(""); setStep("subtype"); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                  backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px",
                  padding: "0.85rem 0.5rem", cursor: "pointer", fontFamily: "inherit",
                  transition: "border-color 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#0d9488")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e3a5f")}
              >
                <span style={{ fontSize: "1.5rem" }}>{cat.icon}</span>
                <span style={{ fontSize: "0.72rem", color: "#e2e8f0", fontWeight: 600, textAlign: "center" }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "subtype" && selectedCat && (
        <div>
          <button onClick={() => setStep("category")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.8rem", marginBottom: "1rem", fontFamily: "inherit", padding: 0 }}>
            ← Back
          </button>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem" }}>
            {selectedCat.icon} {selectedCat.label} — Select type (optional)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
            {selectedCat.subTypes.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSub(sub.id === selectedSub ? "" : sub.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left",
                  backgroundColor: selectedSub === sub.id ? "#0d948820" : "#0f2040",
                  border: `1px solid ${selectedSub === sub.id ? "#0d9488" : "#1e3a5f"}`,
                  borderRadius: "8px", padding: "0.65rem 0.85rem",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${selectedSub === sub.id ? "#0d9488" : "#1e3a5f"}`, backgroundColor: selectedSub === sub.id ? "#0d9488" : "transparent", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>{sub.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#475569" }}>{sub.hint}</div>
                </div>
                {selectedSub === sub.id && <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "#2dd4bf", fontWeight: 700 }}>+5 credits</span>}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", color: "#64748b", marginBottom: "0.35rem" }}>Additional notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Duration, severity, any travel history…"
              rows={2}
              style={{ width: "100%", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "8px", color: "#e2e8f0", padding: "0.6rem 0.75rem", fontSize: "0.82rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          {userState && (
            <div style={{ fontSize: "0.75rem", color: "#475569", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.5rem 0.75rem", marginBottom: "0.75rem" }}>
              📍 Reporting from {[userDistrict, userState].filter(Boolean).join(", ")}
              {userDistrict && <span style={{ color: "#2dd4bf", marginLeft: "0.4rem" }}>+3 credits</span>}
            </div>
          )}

          {error && <div style={{ fontSize: "0.78rem", color: "#f87171", marginBottom: "0.5rem" }}>{error}</div>}

          <button
            onClick={submit}
            disabled={saving}
            style={{
              width: "100%", backgroundColor: saving ? "#0a4f4a" : "#0d9488",
              color: "#fff", border: "none", borderRadius: "10px",
              padding: "0.75rem", fontSize: "0.9rem", fontWeight: 700,
              cursor: saving ? "wait" : "pointer", fontFamily: "inherit",
            }}
          >
            {saving ? "Submitting…" : `Submit Report · +${10 + (selectedSub ? 5 : 0) + (userDistrict ? 3 : 0)} credits`}
          </button>
        </div>
      )}
    </div>
  );
}
