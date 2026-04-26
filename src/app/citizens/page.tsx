"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import HospitalFinder from "./HospitalFinder";
import HealthLocker from "./HealthLocker";
import CitizenAuthBar, { CitizenUser } from "./CitizenAuthBar";

const TABS = [
  { id: "hospitals", label: "🏥 Find Hospital" },
  { id: "stats",     label: "📊 My State" },
  { id: "locker",    label: "🔐 Health Locker" },
];

// ── Types ───────────────────────────────────────────────────────────────────
interface AyushmanState { stateSlug: string; stateName: string; count: number; }

interface StateStat {
  slug: string; name: string; healthScore: number; rank: number;
  imr: number | null; vaccinationPct: number | null;
  institutionalBirthsPct: number | null; stuntingPct: number | null;
  birthRate2023: number | null; deathRate2023: number | null;
  womenAnaemiaPct?: number | null; neonatalMR?: number | null; under5MR?: number | null;
  totalStates?: number;
  district?: { slug: string; name: string; aqi?: number; aqiLabel?: string } | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function scoreColor(v: number) {
  if (v >= 80) return "#22c55e";
  if (v >= 65) return "#84cc16";
  if (v >= 50) return "#eab308";
  if (v >= 35) return "#f97316";
  return "#ef4444";
}

function aqiColor(label?: string) {
  if (!label) return "#64748b";
  const l = label.toLowerCase();
  if (l.includes("good"))       return "#22c55e";
  if (l.includes("satisf"))     return "#84cc16";
  if (l.includes("moderate"))   return "#eab308";
  if (l.includes("poor"))       return "#f97316";
  if (l.includes("very poor") || l.includes("severe")) return "#ef4444";
  return "#64748b";
}

function Metric({ label, value, unit, sub }: { label: string; value: string | number | null | undefined; unit?: string; sub?: string }) {
  return (
    <div style={{ background: "#060e1c", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
      <div style={{ fontSize: "0.58rem", color: "#475569", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e2e8f0" }}>
        {value != null ? value : "—"}
        {value != null && unit && <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: "2px" }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: "0.6rem", color: "#334155", marginTop: "0.1rem" }}>{sub}</div>}
    </div>
  );
}

// ── Citizen Stats ───────────────────────────────────────────────────────────
function CitizenStats() {
  const [ayushmanStates, setAyushmanStates] = useState<AyushmanState[]>([]);
  const [allStats,       setAllStats]       = useState<StateStat[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [detected,       setDetected]       = useState<StateStat | null>(null);
  const [geoStatus,      setGeoStatus]      = useState<"idle"|"detecting"|"done"|"error">("idle");
  const [search,         setSearch]         = useState("");
  const [showAll,        setShowAll]        = useState(false);
  const [manualState,    setManualState]    = useState("");
  const [manualSuggestions, setManualSuggestions] = useState<StateStat[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/citizens/hospitals?states=true").then(r => r.json()),
      fetch("/api/citizens/state-stats").then(r => r.json()),
    ]).then(([ayush, stats]) => {
      setAyushmanStates(Array.isArray(ayush) ? ayush : []);
      setAllStats(Array.isArray(stats) ? stats : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const detectState = useCallback(() => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
            { headers: { "User-Agent": "HealthForIndia/2.0" } }
          ).then(r => r.json());

          const rawState    = geo?.address?.state ?? "";
          const rawDistrict = (geo?.address?.county ?? geo?.address?.state_district ?? geo?.address?.district ?? "")
            .replace(/\s+district$/i, "").trim();

          const matchStat = allStats.find(s =>
            s.name.toLowerCase().includes(rawState.toLowerCase().split(" ")[0]) ||
            rawState.toLowerCase().includes(s.name.toLowerCase().split(" ")[0])
          );
          if (!matchStat) { setGeoStatus("done"); return; }

          const params = new URLSearchParams({ state: matchStat.slug });
          if (rawDistrict) params.set("district", rawDistrict);
          const detail: StateStat = await fetch(`/api/citizens/state-stats?${params}`).then(r => r.json());
          setDetected(detail);
          setGeoStatus("done");
        } catch { setGeoStatus("error"); }
      },
      () => setGeoStatus("error"),
      { timeout: 8000, maximumAge: 30000 }
    );
  }, [allStats]);

  // Manual state lookup
  function handleManualInput(val: string) {
    setManualState(val);
    if (val.length < 2) { setManualSuggestions([]); return; }
    const lower = val.toLowerCase();
    setManualSuggestions(allStats.filter(s => s.name.toLowerCase().includes(lower)).slice(0, 6));
  }

  async function selectManualState(s: StateStat) {
    setManualState("");
    setManualSuggestions([]);
    const detail: StateStat = await fetch(`/api/citizens/state-stats?state=${s.slug}`).then(r => r.json());
    setDetected(detail);
  }

  const ayushMap = Object.fromEntries(ayushmanStates.map(s => [s.stateSlug, s.count]));
  const totalHospitals = ayushmanStates.reduce((acc, s) => acc + s.count, 0);

  const merged = allStats.map(s => ({ ...s, ayushCount: ayushMap[s.slug] ?? 0 }));
  const filtered = merged.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const sorted   = [...filtered].sort((a, b) => a.rank - b.rank);

  return (
    <div>
      {/* ── Detected State Card ─────────────────────────────────────────── */}
      <div style={{ background: "#071428", border: "1px solid #1e3a5f", borderRadius: "14px", padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: "0.95rem" }}>📍 My State &amp; District</div>
          {geoStatus !== "detecting" && (
            <button
              onClick={detectState}
              disabled={loading}
              style={{ background: "#0f2040", color: "#60a5fa", border: "1px solid #1e3a5f", borderRadius: "7px", padding: "0.3rem 0.85rem", fontSize: "0.78rem", cursor: loading ? "wait" : "pointer" }}
            >
              {detected ? "🔄 Re-detect" : "📍 Detect my location"}
            </button>
          )}
          {geoStatus === "detecting" && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Detecting location…</span>}
        </div>

        {detected ? (
          <>
            {/* State header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{detected.name}</div>
                  <button
                    onClick={() => setDetected(null)}
                    style={{ fontSize: "0.65rem", color: "#475569", background: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "4px", padding: "0.1rem 0.45rem", cursor: "pointer" }}
                  >
                    ✎ Not your state?
                  </button>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.2rem" }}>STATE HEALTH DASHBOARD · INDIA</div>
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.62rem", color: "#22c7bb", border: "1px solid #22c7bb40", borderRadius: "4px", padding: "0.1rem 0.4rem" }}>SRS 2023</span>
                  <span style={{ fontSize: "0.62rem", color: "#60a5fa", border: "1px solid #60a5fa40", borderRadius: "4px", padding: "0.1rem 0.4rem" }}>NFHS-5 2019–21</span>
                  <span style={{ fontSize: "0.62rem", color: "#f59e0b", border: "1px solid #f59e0b40", borderRadius: "4px", padding: "0.1rem 0.4rem" }}>AB-PMJAY</span>
                </div>
              </div>
              {/* Health score ring */}
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", border: `4px solid ${scoreColor(detected.healthScore)}`, display: "flex", alignItems: "center", justifyContent: "center", background: "#060e1c" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 800, color: scoreColor(detected.healthScore) }}>{detected.healthScore}</span>
                </div>
                <div style={{ fontSize: "0.6rem", color: "#475569", marginTop: "0.3rem" }}>Health Score</div>
                <div style={{ fontSize: "0.6rem", color: "#64748b" }}>Rank #{detected.rank} / {detected.totalStates ?? allStats.length}</div>
              </div>
            </div>

            {/* Key metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <Metric label="IMR (SRS 2023)" value={detected.imr} unit="/1k LB" sub="Infant Mortality Rate" />
              <Metric label="VACCINATION" value={detected.vaccinationPct != null ? `${detected.vaccinationPct}%` : null} sub="Full coverage" />
              <Metric label="INST. BIRTHS" value={detected.institutionalBirthsPct != null ? `${detected.institutionalBirthsPct}%` : null} sub="Facility deliveries" />
              <Metric label="STUNTING" value={detected.stuntingPct != null ? `${detected.stuntingPct}%` : null} sub="Children" />
              <Metric label="BIRTH RATE" value={detected.birthRate2023} unit="/1k pop" sub="SRS 2023" />
              <Metric label="DEATH RATE" value={detected.deathRate2023} unit="/1k pop" sub="SRS 2023" />
            </div>

            {/* Ayushman + district row */}
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "140px", background: "#060e1c", border: "1px solid #f59e0b40", borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
                <div style={{ fontSize: "0.58rem", color: "#92400e", fontWeight: 600, letterSpacing: "0.05em" }}>🛡️ AYUSHMAN EMPANELLED</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f59e0b", marginTop: "0.2rem" }}>
                  {(ayushMap[detected.slug] ?? 0).toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.6rem", color: "#334155" }}>hospitals in {detected.name}</div>
              </div>

              {detected.district && (
                <Link href={`/district/${detected.district.slug}`} style={{ flex: 1, minWidth: "140px", background: "#060e1c", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.65rem 0.85rem", textDecoration: "none", display: "block" }}>
                  <div style={{ fontSize: "0.58rem", color: "#475569", fontWeight: 600, letterSpacing: "0.05em" }}>📍 YOUR DISTRICT</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", marginTop: "0.2rem" }}>{detected.district.name}</div>
                  {detected.district.aqi != null && (
                    <div style={{ fontSize: "0.68rem", color: aqiColor(detected.district.aqiLabel), marginTop: "0.15rem" }}>
                      AQI {detected.district.aqi} · {detected.district.aqiLabel}
                    </div>
                  )}
                  <div style={{ fontSize: "0.6rem", color: "#3b82f6", marginTop: "0.3rem" }}>View district dashboard →</div>
                </Link>
              )}
            </div>

            {/* Full dashboard CTA */}
            <Link
              href={`/state/${detected.slug}`}
              style={{ display: "block", marginTop: "0.85rem", textAlign: "center", background: "#0f2040", border: "1px solid #3b82f660", color: "#93c5fd", borderRadius: "8px", padding: "0.55rem", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}
            >
              View full {detected.name} health dashboard →
            </Link>
          </>
        ) : (
          <div>
            <div style={{ fontSize: "0.85rem", color: "#475569", padding: "0.35rem 0 0.75rem" }}>
              {geoStatus === "error"
                ? "Could not auto-detect. Type your state below."
                : "Tap 'Detect my location' or type your state name below."}
            </div>
            {/* Manual state input */}
            <div style={{ position: "relative" }}>
              <input
                value={manualState}
                onChange={e => handleManualInput(e.target.value)}
                placeholder="Type state name, e.g. Kerala, Maharashtra…"
                style={{ width: "100%", background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "7px", color: "#e2e8f0", fontSize: "0.82rem", padding: "0.45rem 0.75rem", outline: "none", boxSizing: "border-box" }}
              />
              {manualSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, background: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "7px", zIndex: 20, overflow: "hidden", boxShadow: "0 4px 12px #00000060" }}>
                  {manualSuggestions.map(s => (
                    <button
                      key={s.slug}
                      onMouseDown={() => selectManualState(s)}
                      style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", textAlign: "left", padding: "0.5rem 0.85rem", fontSize: "0.82rem", color: "#94a3b8", background: "transparent", border: "none", cursor: "pointer", borderBottom: "1px solid #0a1628", fontFamily: "inherit" }}
                    >
                      <span style={{ width: "28px", height: "28px", borderRadius: "50%", border: `2px solid ${scoreColor(s.healthScore)}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, color: scoreColor(s.healthScore), flexShrink: 0 }}>{s.healthScore}</span>
                      <span>{s.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "#334155" }}>Rank #{s.rank}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* India totals */}
        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #1e3a5f", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fbbf24" }}>{totalHospitals.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "0.62rem", color: "#475569" }}>Total AB-PMJAY empanelled across India</div>
          </div>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#60a5fa" }}>{allStats.length || "36"}</div>
            <div style={{ fontSize: "0.62rem", color: "#475569" }}>States &amp; Union Territories</div>
          </div>
        </div>
      </div>

      {/* ── All States grid ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
        <div style={{ fontWeight: 600, color: "#94a3b8", fontSize: "0.78rem", letterSpacing: "0.06em" }}>ALL STATES &amp; UNION TERRITORIES</div>
        <span style={{ fontSize: "0.65rem", color: "#334155" }}>sorted by health rank</span>
      </div>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setShowAll(false); }}
        placeholder="Search state or UT…"
        style={{ width: "100%", background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "7px", color: "#e2e8f0", fontSize: "0.82rem", padding: "0.45rem 0.75rem", outline: "none", marginBottom: "0.65rem", boxSizing: "border-box" }}
      />

      {loading ? (
        <div style={{ color: "#475569", textAlign: "center", padding: "2rem", fontSize: "0.88rem" }}>Loading…</div>
      ) : (() => {
        const PREVIEW = 12;
        const isSearching = search.trim().length > 0;
        const visible = isSearching || showAll ? sorted : sorted.slice(0, PREVIEW);
        return (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
              {visible.map(s => (
                <Link
                  key={s.slug}
                  href={`/state/${s.slug}`}
                  style={{
                    background: s.slug === detected?.slug ? "#0f2040" : "#080f1e",
                    border: `1px solid ${s.slug === detected?.slug ? "#3b82f6" : "#1e3a5f"}`,
                    borderRadius: "9px", padding: "0.65rem 0.85rem",
                    textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem",
                  }}
                >
                  <div style={{ flexShrink: 0, width: "34px", height: "34px", borderRadius: "50%", border: `2px solid ${scoreColor(s.healthScore)}`, display: "flex", alignItems: "center", justifyContent: "center", background: "#060e1c" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: scoreColor(s.healthScore) }}>{s.healthScore}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", color: s.slug === detected?.slug ? "#93c5fd" : "#e2e8f0", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "0.63rem", color: "#475569", marginTop: "0.1rem" }}>
                      Rank #{s.rank} · 🛡️ {(s.ayushCount ?? 0).toLocaleString("en-IN")} hospitals
                    </div>
                  </div>
                </Link>
              ))}
              {sorted.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#475569", fontSize: "0.85rem", padding: "1.5rem" }}>
                  No states match &quot;{search}&quot;
                </div>
              )}
            </div>

            {/* Show all / collapse toggle */}
            {!isSearching && sorted.length > PREVIEW && (
              <button
                onClick={() => setShowAll(v => !v)}
                style={{ display: "block", width: "100%", marginTop: "0.75rem", background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "8px", color: "#60a5fa", fontSize: "0.82rem", fontWeight: 600, padding: "0.55rem", cursor: "pointer", fontFamily: "inherit" }}
              >
                {showAll
                  ? "▲ Show fewer states"
                  : `▼ View all ${sorted.length} States & Union Territories`}
              </button>
            )}
          </>
        );
      })()}
      <div style={{ marginTop: "0.75rem", fontSize: "0.68rem", color: "#334155" }}>
        Health score: weighted composite of IMR, vaccination, institutional births, stunting & anaemia · Source: NFHS-5, SRS 2023, NHA AB-PMJAY
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function CitizensPage() {
  const [user, setUser]           = useState<CitizenUser | null | "loading">("loading");
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
      <div style={{ borderBottom: "1px solid #1e3a5f", padding: "2.5rem 1.5rem 2rem", background: "linear-gradient(180deg, #071830 0%, #070f1e 100%)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "2rem" }}>🏥</span>
            <h1 className="font-display" style={{ fontSize: "2.2rem", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.15 }}>
              Citizens Health Centre
            </h1>
          </div>
          <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "0 0 0 2.85rem", lineHeight: 1.6 }}>
            Find Ayushman Bharat empanelled hospitals · State &amp; district health stats · Secure health locker
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e3a5f", backgroundColor: "#060d1b" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "1rem 1.5rem", border: "none", background: "transparent",
              color: activeTab === tab.id ? "#93c5fd" : "#64748b",
              borderBottom: activeTab === tab.id ? "3px solid #3b82f6" : "3px solid transparent",
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: "0.95rem", cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "inherit", minHeight: "54px", letterSpacing: activeTab === tab.id ? "-0.01em" : "0",
              transition: "color 0.15s",
            }}>
              {tab.label}
              {tab.id === "locker" && !isLoggedIn && (
                <span style={{ marginLeft: "6px", fontSize: "0.7rem", color: "#475569" }}>🔒</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        <CitizenAuthBar user={user} onAuthChange={setUser} />

        {activeTab === "hospitals" && <HospitalFinder isLoggedIn={isLoggedIn} />}
        {activeTab === "stats"     && <CitizenStats />}
        {activeTab === "locker"    && <HealthLocker user={isLoggedIn ? (user as CitizenUser) : null} />}
      </div>
    </div>
  );
}
