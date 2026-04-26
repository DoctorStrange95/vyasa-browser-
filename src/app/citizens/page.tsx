"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import HospitalFinder from "./HospitalFinder";
import HealthLocker from "./HealthLocker";
import CitizenAuthBar, { CitizenUser } from "./CitizenAuthBar";

const TABS = [
  { id: "hospitals", label: "🏥 Find Hospital" },
  { id: "stats",     label: "📊 My State" },
  { id: "ayushman",  label: "🛡️ Ayushman Card" },
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

interface LocationCtx {
  city: string; district: string; state: string;
  lat: number; lon: number;
}

interface IDSPOutbreak {
  state: string; district: string; disease: string;
  cases: number; deaths: number; status: string; week: number; year: number;
}

interface IntelItem {
  title: string; summary: string; disease: string; date: string;
  source: string; sourceUrl?: string;
  location: { state: string; district: string; village: string };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function weekToDateRange(week: number, year: number): string {
  const w = week > 0 ? week : (() => {
    const now = new Date();
    const jan4 = new Date(now.getFullYear(), 0, 4);
    const w1 = new Date(jan4);
    w1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    return Math.ceil((now.getTime() - w1.getTime()) / (7 * 86400000)) + 1;
  })();
  const y = week > 0 ? year : new Date().getFullYear();
  const jan4 = new Date(y, 0, 4);
  const w1 = new Date(jan4);
  w1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(w1);
  start.setDate(w1.getDate() + (w - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `W${w} · ${fmt(start)}–${fmt(end)}`;
}

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
    <div style={{ background: "#060e1c", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "0.85rem 1rem" }}>
      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, letterSpacing: "0.04em", marginBottom: "0.35rem", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e2e8f0", lineHeight: 1.15 }}>
        {value != null ? value : "—"}
        {value != null && unit && <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "3px" }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.25rem" }}>{sub}</div>}
    </div>
  );
}

const PINNED_STATS_KEY = "citizens_pinned_states_v1";

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
  const [pinnedSlugs,    setPinnedSlugs]    = useState<string[]>([]);
  const [pinnedStats,    setPinnedStats]    = useState<StateStat[]>([]);
  const [locationCtx,    setLocationCtx]    = useState<LocationCtx | null>(null);
  const [localOutbreaks, setLocalOutbreaks] = useState<IDSPOutbreak[]>([]);
  const [localIntel,     setLocalIntel]     = useState<IntelItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/citizens/hospitals?states=true").then(r => r.json()),
      fetch("/api/citizens/state-stats").then(r => r.json()),
      fetch("/api/citizens/me").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([ayush, stats, me]) => {
      const statsList: StateStat[] = Array.isArray(stats) ? stats : [];
      setAyushmanStates(Array.isArray(ayush) ? ayush : []);
      setAllStats(statsList);
      // Auto-fill state from profile place (same logic as HospitalFinder)
      if (me?.place && statsList.length) {
        const parts = (me.place as string).split(",").map((p: string) => p.trim()).reverse();
        let match: StateStat | undefined;
        for (const part of parts) {
          const low = part.toLowerCase();
          match = statsList.find(s =>
            s.name.toLowerCase().includes(low.split(" ")[0]) ||
            low.includes(s.name.toLowerCase().split(" ")[0])
          );
          if (match) break;
        }
        if (match) {
          fetch(`/api/citizens/state-stats?state=${match.slug}`)
            .then(r => r.json())
            .then(d => setDetected(d))
            .catch(() => {});
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Load pinned slugs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINNED_STATS_KEY);
      if (saved) setPinnedSlugs(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Fetch stats for pinned states when allStats is ready
  useEffect(() => {
    if (!pinnedSlugs.length || !allStats.length) return;
    const missing = pinnedSlugs.filter(slug => !pinnedStats.find(s => s.slug === slug));
    if (!missing.length) return;
    Promise.all(
      missing.map(slug => fetch(`/api/citizens/state-stats?state=${slug}`).then(r => r.json()).catch(() => null))
    ).then(results => {
      setPinnedStats(prev => [...prev, ...(results.filter(Boolean) as StateStat[])]);
    });
  }, [pinnedSlugs, allStats]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch IDSP outbreaks + intel feed filtered by detected location
  useEffect(() => {
    if (!locationCtx) return;
    const stateLow = locationCtx.state.toLowerCase().split(" ")[0];
    const keywords = [locationCtx.city, locationCtx.district, locationCtx.state]
      .map(s => s.toLowerCase().trim()).filter(s => s.length > 3);

    fetch("/api/idsp-weekly")
      .then(r => r.json())
      .then(d => {
        const filtered: IDSPOutbreak[] = (d.outbreaks ?? []).filter((o: IDSPOutbreak) =>
          o.state.toLowerCase().includes(stateLow)
        );
        setLocalOutbreaks(filtered.slice(0, 8));
      }).catch(() => {});

    fetch("/api/ph-intelligence")
      .then(r => r.json())
      .then(d => {
        const items: IntelItem[] = d.items ?? [];
        const filtered = items.filter(item => {
          const haystack = [
            item.title, item.summary,
            item.location?.state, item.location?.district, item.location?.village,
          ].join(" ").toLowerCase();
          return keywords.some(k => haystack.includes(k));
        });
        setLocalIntel(filtered.slice(0, 6));
      }).catch(() => {});
  }, [locationCtx]); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePin(slug: string) {
    setPinnedSlugs(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
      try { localStorage.setItem(PINNED_STATS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      if (!prev.includes(slug)) {
        // Load stats for newly pinned state
        fetch(`/api/citizens/state-stats?state=${slug}`)
          .then(r => r.json())
          .then(data => setPinnedStats(p => [...p.filter(s => s.slug !== slug), data]))
          .catch(() => {});
      } else {
        setPinnedStats(p => p.filter(s => s.slug !== slug));
      }
      return next;
    });
  }

  const detectState = useCallback(() => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("detecting");
    setLocalOutbreaks([]);
    setLocalIntel([]);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en&zoom=14`,
            { headers: { "User-Agent": "HealthForIndia/2.0" } }
          ).then(r => r.json());

          const addr         = geo?.address ?? {};
          const rawState     = addr.state ?? "";
          const rawDistrict  = (addr.county ?? addr.state_district ?? addr.district ?? "")
            .replace(/\s+district$/i, "").trim();
          const rawCity      = addr.city ?? addr.town ?? addr.suburb ?? addr.village ?? addr.hamlet ?? "";

          const matchStat = allStats.find(s =>
            s.name.toLowerCase().includes(rawState.toLowerCase().split(" ")[0]) ||
            rawState.toLowerCase().includes(s.name.toLowerCase().split(" ")[0])
          );
          if (!matchStat) { setGeoStatus("done"); return; }

          // Store full location context for personalized feed
          setLocationCtx({ city: rawCity, district: rawDistrict, state: rawState, lat, lon });

          const params = new URLSearchParams({ state: matchStat.slug });
          if (rawDistrict) params.set("district", rawDistrict);
          const detail: StateStat = await fetch(`/api/citizens/state-stats?${params}`).then(r => r.json());
          setDetected(detail);
          setGeoStatus("done");
        } catch { setGeoStatus("error"); }
      },
      () => setGeoStatus("error"),
      { timeout: 15000, maximumAge: 0, enableHighAccuracy: true }  // GPS-grade accuracy
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

  // Build a resilient ayush lookup: keyed by raw slug, normalised slug, and normalised name
  function normKey(s: string) {
    return s.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  const ayushMap: Record<string, number> = {};
  ayushmanStates.forEach(a => {
    ayushMap[a.stateSlug]          = a.count;
    ayushMap[normKey(a.stateSlug)] = a.count;
    ayushMap[normKey(a.stateName)] = a.count;
  });
  function getAyush(slug: string, name?: string): number {
    return ayushMap[slug] ?? ayushMap[normKey(slug)] ?? (name ? ayushMap[normKey(name)] : undefined) ?? 0;
  }

  const totalHospitals = ayushmanStates.reduce((acc, s) => acc + s.count, 0);

  const merged = allStats.map(s => ({ ...s, ayushCount: getAyush(s.slug, s.name) }));
  const filtered = merged.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const sorted   = [...filtered].sort((a, b) => a.rank - b.rank);

  const orderedPinned = pinnedSlugs
    .map(slug => pinnedStats.find(s => s.slug === slug))
    .filter(Boolean) as StateStat[];

  return (
    <div>

      {/* ── My States Comparison ────────────────────────────────────────── */}
      {orderedPinned.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <div style={{ fontWeight: 700, color: "#fbbf24", fontSize: "0.88rem" }}>📌 My States Dashboard</div>
            <span style={{ fontSize: "0.65rem", color: "#334155" }}>Pin states to compare</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(orderedPinned.length, 3)}, 1fr)`, gap: "0.65rem" }}>
            {orderedPinned.map(s => (
              <div
                key={s.slug}
                style={{ background: "#071428", border: `1px solid ${s.slug === detected?.slug ? "#3b82f680" : "#1e3a5f"}`, borderRadius: "12px", padding: "0.9rem 1rem", cursor: "pointer", position: "relative" }}
                onClick={() => setDetected(s)}
              >
                <button
                  onClick={e => { e.stopPropagation(); togglePin(s.slug); }}
                  style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.75rem", padding: "0.1rem 0.3rem" }}
                  title="Remove from dashboard"
                >✕</button>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: `3px solid ${scoreColor(s.healthScore)}`, display: "flex", alignItems: "center", justifyContent: "center", background: "#060e1c", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 800, color: scoreColor(s.healthScore) }}>{s.healthScore}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0", lineHeight: 1.1 }}>{s.name}</div>
                    <div style={{ fontSize: "0.62rem", color: "#475569" }}>Rank #{s.rank}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem" }}>
                  {s.imr != null && (
                    <div style={{ background: "#060e1c", borderRadius: "6px", padding: "0.3rem 0.5rem" }}>
                      <div style={{ fontSize: "0.6rem", color: "#475569" }}>IMR</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0" }}>{s.imr}</div>
                    </div>
                  )}
                  {s.vaccinationPct != null && (
                    <div style={{ background: "#060e1c", borderRadius: "6px", padding: "0.3rem 0.5rem" }}>
                      <div style={{ fontSize: "0.6rem", color: "#475569" }}>Vacc.</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0" }}>{s.vaccinationPct}%</div>
                    </div>
                  )}
                  {s.stuntingPct != null && (
                    <div style={{ background: "#060e1c", borderRadius: "6px", padding: "0.3rem 0.5rem" }}>
                      <div style={{ fontSize: "0.6rem", color: "#475569" }}>Stunting</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0" }}>{s.stuntingPct}%</div>
                    </div>
                  )}
                  {s.birthRate2023 != null && (
                    <div style={{ background: "#060e1c", borderRadius: "6px", padding: "0.3rem 0.5rem" }}>
                      <div style={{ fontSize: "0.6rem", color: "#475569" }}>Birth Rate</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0" }}>{s.birthRate2023}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    onClick={() => togglePin(detected.slug)}
                    style={{
                      fontSize: "0.72rem", fontWeight: 600,
                      color: pinnedSlugs.includes(detected.slug) ? "#fbbf24" : "#64748b",
                      background: pinnedSlugs.includes(detected.slug) ? "#1a1200" : "#0f2040",
                      border: `1px solid ${pinnedSlugs.includes(detected.slug) ? "#fbbf2440" : "#1e3a5f"}`,
                      borderRadius: "5px", padding: "0.2rem 0.55rem", cursor: "pointer",
                    }}
                  >
                    {pinnedSlugs.includes(detected.slug) ? "📌 Pinned" : "📌 Pin to Dashboard"}
                  </button>
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
                <div style={{ fontSize: "0.72rem", color: "#92400e", fontWeight: 600, letterSpacing: "0.04em" }}>🛡️ AYUSHMAN EMPANELLED</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#f59e0b", marginTop: "0.25rem" }}>
                  {getAyush(detected.slug, detected.name).toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.15rem" }}>hospitals in {detected.name}</div>
              </div>

              {detected.district && (
                <Link href={`/district/${detected.district.slug}`} style={{ flex: 1, minWidth: "140px", background: "#060e1c", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.65rem 0.85rem", textDecoration: "none", display: "block" }}>
                  <div style={{ fontSize: "0.72rem", color: "#475569", fontWeight: 600, letterSpacing: "0.04em" }}>📍 YOUR DISTRICT</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#e2e8f0", marginTop: "0.25rem" }}>{detected.district.name}</div>
                  {detected.district.aqi != null && (
                    <div style={{ fontSize: "0.75rem", color: aqiColor(detected.district.aqiLabel), marginTop: "0.2rem" }}>
                      AQI {detected.district.aqi} · {detected.district.aqiLabel}
                    </div>
                  )}
                  <div style={{ fontSize: "0.75rem", color: "#3b82f6", marginTop: "0.35rem" }}>View district dashboard →</div>
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
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fbbf24" }}>{totalHospitals.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>Total AB-PMJAY empanelled across India</div>
          </div>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#60a5fa" }}>{allStats.length || "36"}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>States &amp; Union Territories</div>
          </div>
        </div>
      </div>

      {/* ── Personalised Location Feed ─────────────────────────────────── */}
      {locationCtx && (
        <div style={{ marginBottom: "1.25rem" }}>

          {/* Location breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", background: "#071428", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "0.75rem 1rem" }}>
            <span style={{ fontSize: "1rem" }}>📍</span>
            <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
              {locationCtx.city && (
                <>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#e2e8f0" }}>{locationCtx.city}</span>
                  <span style={{ color: "#1e3a5f" }}>·</span>
                </>
              )}
              {locationCtx.district && (
                <>
                  <span style={{ fontSize: "0.88rem", color: "#94a3b8" }}>{locationCtx.district}</span>
                  <span style={{ color: "#1e3a5f" }}>·</span>
                </>
              )}
              <span style={{ fontSize: "0.88rem", color: "#94a3b8" }}>{locationCtx.state}</span>
            </div>
            <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "#334155", background: "#0a1628", borderRadius: "4px", padding: "0.15rem 0.5rem", border: "1px solid #1e3a5f" }}>GPS</span>
          </div>

          {/* IDSP Disease Surveillance */}
          {localOutbreaks.length > 0 && (
            <div style={{ background: "#071428", border: "1px solid #ef444440", borderRadius: "12px", padding: "1.1rem 1.25rem", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                <span style={{ fontSize: "1rem" }}>🦠</span>
                <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: "0.88rem" }}>Disease Surveillance · {locationCtx.state}</div>
                <span style={{ marginLeft: "auto", fontSize: "0.6rem", color: "#64748b", background: "#0a1628", borderRadius: "4px", padding: "0.1rem 0.4rem", border: "1px solid #1e3a5f" }}>IDSP</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {localOutbreaks.map((o, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "#060e1c", borderRadius: "8px", padding: "0.6rem 0.85rem", borderLeft: "3px solid #ef444460" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fca5a5" }}>{o.disease}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.15rem" }}>
                        {o.district ? `${o.district}, ` : ""}{o.state} &nbsp;·&nbsp; {weekToDateRange(o.week, o.year)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fca5a5" }}>{o.cases} cases</div>
                      {o.deaths > 0 && <div style={{ fontSize: "0.68rem", color: "#ef4444" }}>{o.deaths} deaths</div>}
                      <div style={{ fontSize: "0.6rem", color: o.status === "active" ? "#fbbf24" : "#22c55e", marginTop: "0.1rem", textTransform: "capitalize" }}>{o.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health Intelligence Feed */}
          {localIntel.length > 0 && (
            <div style={{ background: "#071428", border: "1px solid #3b82f640", borderRadius: "12px", padding: "1.1rem 1.25rem", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                <span style={{ fontSize: "1rem" }}>📡</span>
                <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: "0.88rem" }}>Health Intelligence Near You</div>
                <span style={{ marginLeft: "auto", fontSize: "0.6rem", color: "#64748b", background: "#0a1628", borderRadius: "4px", padding: "0.1rem 0.4rem", border: "1px solid #1e3a5f" }}>LIVE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {localIntel.map((item, i) => (
                  <div key={i} style={{ background: "#060e1c", borderRadius: "8px", padding: "0.7rem 0.9rem", borderLeft: "3px solid #3b82f660" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", justifyContent: "space-between" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#93c5fd", lineHeight: 1.3, marginBottom: "0.25rem" }}>{item.title}</div>
                        {item.summary && (
                          <div style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {item.summary}
                          </div>
                        )}
                        <div style={{ fontSize: "0.65rem", color: "#334155", marginTop: "0.35rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {item.disease && <span style={{ color: "#fbbf2480" }}>{item.disease}</span>}
                          {item.location?.district && <span>{item.location.district}</span>}
                          {item.date && <span>{item.date}</span>}
                          {item.source && <span style={{ color: "#475569" }}>· {item.source}</span>}
                        </div>
                      </div>
                      {item.sourceUrl && (
                        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, fontSize: "0.7rem", color: "#475569", marginLeft: "0.5rem", textDecoration: "none" }}>↗</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* District deep-link */}
          {locationCtx.district && (
            <Link
              href={`/district/${locationCtx.district.toLowerCase().trim().replace(/\s+/g, "-")}`}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#071428", border: "1px solid #1e3a5f", borderRadius: "9px", padding: "0.65rem 1rem", textDecoration: "none", marginBottom: "0.85rem" }}
            >
              <span style={{ fontSize: "0.9rem" }}>🗺️</span>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>View {locationCtx.district} District Dashboard</div>
                <div style={{ fontSize: "0.68rem", color: "#475569", marginTop: "0.1rem" }}>AQI, local health data, nearby facilities</div>
              </div>
              <span style={{ marginLeft: "auto", color: "#3b82f6", fontSize: "0.8rem" }}>→</span>
            </Link>
          )}

          {localOutbreaks.length === 0 && localIntel.length === 0 && (
            <div style={{ background: "#071428", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "0.85rem 1rem", fontSize: "0.82rem", color: "#475569" }}>
              No active outbreaks or health alerts found for {locationCtx.state}. Your region looks clear.
            </div>
          )}
        </div>
      )}

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
        <div style={{ color: "#475569", textAlign: "center", padding: "2.5rem 1rem" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
          <div style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "0.25rem" }}>Please wait, fetching state health data…</div>
          <div style={{ fontSize: "0.72rem", color: "#334155" }}>Loading NFHS-5 · SRS 2023 · AB-PMJAY data for all 36 states &amp; UTs</div>
        </div>
      ) : (() => {
        const PREVIEW = 12;
        const isSearching = search.trim().length > 0;
        const visible = isSearching || showAll ? sorted : sorted.slice(0, PREVIEW);
        return (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
              {visible.map(s => {
                const isPinned = pinnedSlugs.includes(s.slug);
                return (
                  <div
                    key={s.slug}
                    style={{
                      background: s.slug === detected?.slug ? "#0f2040" : "#080f1e",
                      border: `1px solid ${isPinned ? "#fbbf2440" : s.slug === detected?.slug ? "#3b82f6" : "#1e3a5f"}`,
                      borderRadius: "9px", padding: "0.65rem 0.85rem",
                      display: "flex", alignItems: "center", gap: "0.6rem",
                      position: "relative",
                    }}
                  >
                    <Link href={`/state/${s.slug}`} style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, minWidth: 0, textDecoration: "none" }}>
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
                    <button
                      onClick={() => togglePin(s.slug)}
                      title={isPinned ? "Remove from My States" : "Add to My States Dashboard"}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", color: isPinned ? "#fbbf24" : "#334155", padding: "0.15rem", flexShrink: 0 }}
                    >
                      {isPinned ? "📌" : "⊕"}
                    </button>
                  </div>
                );
              })}
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
      <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#475569", lineHeight: 1.5 }}>
        Health score: weighted composite of IMR, vaccination, institutional births, stunting & anaemia · Source: NFHS-5, SRS 2023, NHA AB-PMJAY
      </div>
    </div>
  );
}

// ── Ayushman Card tab ────────────────────────────────────────────────────────
function AyushmanCardInfo() {
  return (
    <div>
      <div style={{ background: "#071428", border: "1px solid #fbbf2440", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "2rem" }}>🛡️</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#fbbf24" }}>Ayushman Bharat PM-JAY Card</h2>
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>Pradhan Mantri Jan Arogya Yojana — ₹5 lakh annual health cover</div>
          </div>
        </div>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>
          Ayushman Bharat PM-JAY is India&apos;s flagship public health insurance scheme providing free secondary and tertiary healthcare coverage of up to <strong style={{ color: "#fbbf24" }}>₹5 lakh per family per year</strong> at any empanelled government or private hospital. It covers over <strong style={{ color: "#e2e8f0" }}>1,929 procedures</strong> including surgeries, medical treatments, and day-care procedures.
        </p>
      </div>

      {/* Eligibility */}
      <div style={{ background: "#071428", border: "1px solid #1e3a5f", borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: "0.95rem", marginBottom: "0.85rem" }}>✅ Who Is Eligible?</div>
        <ul style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 2, paddingLeft: "1.25rem", margin: 0 }}>
          <li>Families listed in <strong style={{ color: "#e2e8f0" }}>SECC 2011 database</strong> (Socio-Economic Caste Census)</li>
          <li>Active <strong style={{ color: "#e2e8f0" }}>RSBY beneficiaries</strong></li>
          <li>Beneficiaries identified by <strong style={{ color: "#e2e8f0" }}>state government schemes</strong> (varies by state)</li>
          <li>No cap on family size or age</li>
          <li>Coverage is <strong style={{ color: "#e2e8f0" }}>portable</strong> across India — use at any empanelled hospital nationwide</li>
        </ul>
      </div>

      {/* Steps */}
      <div style={{ background: "#071428", border: "1px solid #1e3a5f", borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: "0.95rem", marginBottom: "0.85rem" }}>📋 Steps to Get Your Card</div>
        <ol style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 2.1, paddingLeft: "1.25rem", margin: 0 }}>
          <li><strong style={{ color: "#e2e8f0" }}>Check eligibility</strong> on the official portal using your mobile number, Aadhaar, or ration card</li>
          <li><strong style={{ color: "#e2e8f0" }}>Visit your nearest Common Service Centre (CSC)</strong>, empanelled hospital, or Ayushman Mitra</li>
          <li>Carry <strong style={{ color: "#e2e8f0" }}>Aadhaar card</strong> and one family ID (ration card / voter ID)</li>
          <li>Get <strong style={{ color: "#e2e8f0" }}>e-KYC done</strong> (biometric or OTP-based) at the centre</li>
          <li><strong style={{ color: "#e2e8f0" }}>Download or print</strong> your Ayushman Bharat card (PM-JAY Health Card)</li>
          <li>Show the card at any <strong style={{ color: "#e2e8f0" }}>AB-PMJAY empanelled hospital</strong> to avail cashless treatment</li>
        </ol>
      </div>

      {/* Official links */}
      <div style={{ background: "#071428", border: "1px solid #1e3a5f", borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: "0.95rem", marginBottom: "0.85rem" }}>🔗 Official Links</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <a href="https://beneficiary.nha.gov.in" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "9px", padding: "0.75rem 1rem", textDecoration: "none", color: "#93c5fd" }}>
            <span style={{ fontSize: "1.1rem" }}>🔍</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>beneficiary.nha.gov.in</div>
              <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.1rem" }}>Check your eligibility by mobile / Aadhaar / ration card</div>
            </div>
            <span style={{ marginLeft: "auto", color: "#475569", fontSize: "0.8rem" }}>↗</span>
          </a>
          <a href="https://pmjay.gov.in" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "9px", padding: "0.75rem 1rem", textDecoration: "none", color: "#93c5fd" }}>
            <span style={{ fontSize: "1.1rem" }}>🏛️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>pmjay.gov.in</div>
              <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.1rem" }}>Official PM-JAY portal — scheme details, news, empanelled hospitals</div>
            </div>
            <span style={{ marginLeft: "auto", color: "#475569", fontSize: "0.8rem" }}>↗</span>
          </a>
          <a href="https://hospitals.pmjay.gov.in" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "9px", padding: "0.75rem 1rem", textDecoration: "none", color: "#93c5fd" }}>
            <span style={{ fontSize: "1.1rem" }}>🏥</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>hospitals.pmjay.gov.in</div>
              <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.1rem" }}>Find empanelled hospitals near you by state / district</div>
            </div>
            <span style={{ marginLeft: "auto", color: "#475569", fontSize: "0.8rem" }}>↗</span>
          </a>
        </div>
      </div>

      {/* Helpline */}
      <div style={{ background: "#071428", border: "1px solid #22c55e30", borderRadius: "14px", padding: "1.25rem" }}>
        <div style={{ fontWeight: 700, color: "#4ade80", fontSize: "0.95rem", marginBottom: "0.65rem" }}>📞 Helpline</div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ background: "#0f2040", border: "1px solid #22c55e20", borderRadius: "9px", padding: "0.75rem 1.25rem" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4ade80", fontFamily: "monospace" }}>14555</div>
            <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.2rem" }}>PM-JAY Toll Free — 24×7</div>
          </div>
          <div style={{ background: "#0f2040", border: "1px solid #22c55e20", borderRadius: "9px", padding: "0.75rem 1.25rem" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4ade80", fontFamily: "monospace" }}>1800-111-565</div>
            <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.2rem" }}>NHA Helpline — Toll Free</div>
          </div>
        </div>
        <div style={{ marginTop: "0.85rem", background: "#0d1f3c", borderRadius: "8px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>🔔</span>
          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
            <strong style={{ color: "#94a3b8" }}>HealthForIndia Helpline — Coming Soon.</strong> We&apos;re building a dedicated citizen helpline to guide you through the Ayushman card process in your local language.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function CitizensPage() {
  const [user, setUser]           = useState<CitizenUser | null | "loading">("loading");
  const [activeTab, setActiveTab] = useState("hospitals");

  useEffect(() => {
    // Read ?tab= from URL on mount without useSearchParams (avoids Suspense requirement)
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab && TABS.find(t => t.id === tab)) setActiveTab(tab);
    }
  }, []);

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
      <div className="citizens-body" style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        <CitizenAuthBar user={user} onAuthChange={setUser} />

        {activeTab === "hospitals" && <HospitalFinder isLoggedIn={isLoggedIn} />}
        {activeTab === "stats"     && <CitizenStats />}
        {activeTab === "ayushman"  && <AyushmanCardInfo />}
        {activeTab === "locker"    && <HealthLocker user={isLoggedIn ? (user as CitizenUser) : null} />}
      </div>
    </div>
  );
}
