"use client";

import { useEffect, useState, useCallback } from "react";
import { AB_SPECIALITIES, ABSpeciality } from "@/data/ab-specialities";

interface StateItem { stateSlug: string; stateName: string; count: number; }
interface HospitalRow {
  name: string; district: string; specialities: string;
  address: string; phone: string; type: string; status: string;
}
interface SearchResult {
  hospitals: HospitalRow[]; districts: string[];
  total: number; page: number; pages: number;
  stateName?: string; importedAt?: string;
}

const PINNED_KEY = "hf_pinned_states_v1";

function readPinned(): string[] {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) ?? "[]"); } catch { return []; }
}
function writePinned(slugs: string[]) {
  try { localStorage.setItem(PINNED_KEY, JSON.stringify(slugs)); } catch {}
}

const CATEGORY_COLORS: Record<ABSpeciality["category"], string> = {
  Surgical:       "#3b82f6",
  Medical:        "#14b8a6",
  Investigations: "#8b5cf6",
  Other:          "#64748b",
};

function SpecialityBadge({ code }: { code: string }) {
  const clean = code.trim().toUpperCase();
  const sp = AB_SPECIALITIES.find((s) => s.code === clean);
  const color = sp ? CATEGORY_COLORS[sp.category] : "#64748b";
  return (
    <span style={{ background: color + "18", color, border: `1px solid ${color}44`, fontSize: "0.72rem", padding: "3px 8px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
      <span style={{ fontWeight: 600, letterSpacing: "0.02em" }}>{clean}</span>
      {sp && <span style={{ opacity: 0.85, fontWeight: 400 }}>{sp.name}</span>}
    </span>
  );
}

function parseSpecialities(raw: string): string[] {
  if (!raw) return [];
  return raw.split(/[,;\s\/]+/).map((s) => s.trim()).filter(Boolean);
}

// Try to extract a state slug from a free-text place string like "Patna, Bihar" or "Mumbai"
function matchStateFromText(text: string, states: StateItem[]): StateItem | null {
  if (!text) return null;
  const parts = text.split(",").map(p => p.trim()).reverse(); // last part first — most likely the state
  for (const part of parts) {
    if (!part) continue;
    const low = part.toLowerCase();
    const match = states.find(s =>
      s.stateName.toLowerCase().includes(low.split(" ")[0]) ||
      low.includes(s.stateName.toLowerCase().split(" ")[0])
    );
    if (match) return match;
  }
  return null;
}

export default function HospitalFinder({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [states,           setStates]           = useState<StateItem[]>([]);
  const [selectedState,    setSelectedState]    = useState("");
  const [districts,        setDistricts]        = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSpec,     setSelectedSpec]     = useState("");
  const [searchText,       setSearchText]       = useState("");
  const [result,           setResult]           = useState<SearchResult | null>(null);
  const [loading,          setLoading]          = useState(false);
  const [page,             setPage]             = useState(0);
  const [geoStatus,        setGeoStatus]        = useState<"idle"|"loading"|"done"|"error">("idle");
  const [pinnedSlugs,      setPinnedSlugs]      = useState<string[]>([]);
  const [autoSource,       setAutoSource]       = useState<"profile"|"pinned"|"geo"|null>(null);

  // Load states + auto-detect from profile (if logged in) on mount
  useEffect(() => {
    fetch("/api/citizens/hospitals?states=true")
      .then(r => r.json())
      .then(async (data: StateItem[]) => {
        if (!Array.isArray(data)) return;
        setStates(data);
        setPinnedSlugs(readPinned());

        if (isLoggedIn) {
          try {
            const user = await fetch("/api/citizens/me").then(r => r.ok ? r.json() : null);
            if (user?.place) {
              const match = matchStateFromText(user.place, data);
              if (match) {
                setSelectedState(match.stateSlug);
                setAutoSource("profile");
                return;
              }
            }
          } catch { /* ignore */ }
        }

        // Fall back to first pinned state if available
        const pinned = readPinned();
        if (pinned.length > 0 && data.find(s => s.stateSlug === pinned[0])) {
          setSelectedState(pinned[0]);
          setAutoSource("pinned");
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const doSearch = useCallback(async (state: string, district: string, spec: string, q: string, pg: number) => {
    if (!state) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ state, page: String(pg) });
      if (district) params.set("district", district);
      if (spec)     params.set("speciality", spec);
      if (q)        params.set("q", q);
      const r = await fetch(`/api/citizens/hospitals?${params}`);
      const data: SearchResult = await r.json();
      setResult(data);
      if (pg === 0 && data.districts) setDistricts(data.districts);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedState) { setResult(null); setDistricts([]); return; }
    const t = setTimeout(() => doSearch(selectedState, selectedDistrict, selectedSpec, searchText, page), 300);
    return () => clearTimeout(t);
  }, [selectedState, selectedDistrict, selectedSpec, searchText, page, doSearch]);

  const handleStateChange = (slug: string) => {
    setSelectedState(slug);
    setSelectedDistrict("");
    setSelectedSpec("");
    setPage(0);
    setDistricts([]);
    setResult(null);
    setAutoSource(null);
  };

  function togglePin(slug: string) {
    const current = readPinned();
    const next = current.includes(slug)
      ? current.filter(s => s !== slug)
      : [slug, ...current].slice(0, 5);
    writePinned(next);
    setPinnedSlugs(next);
  }

  const handleNearby = () => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
            { headers: { "User-Agent": "HealthForIndia/2.0" } }
          ).then(r => r.json());
          const rawState    = geo?.address?.state ?? "";
          const rawDistrict = (geo?.address?.county ?? geo?.address?.state_district ?? "").replace(/\s+district$/i, "").trim();
          const matchState  = states.find(s =>
            s.stateName.toLowerCase().includes(rawState.toLowerCase().split(" ")[0]) ||
            rawState.toLowerCase().includes(s.stateName.toLowerCase().split(" ")[0])
          );
          if (matchState) {
            setSelectedState(matchState.stateSlug);
            setAutoSource("geo");
            if (rawDistrict) {
              const r = await fetch(`/api/citizens/hospitals?state=${matchState.stateSlug}`);
              const data: SearchResult = await r.json();
              if (data.districts) {
                setDistricts(data.districts);
                const matchDist = data.districts.find(d =>
                  d.toLowerCase().includes(rawDistrict.toLowerCase().split(" ")[0]) ||
                  rawDistrict.toLowerCase().includes(d.toLowerCase().split(" ")[0])
                );
                if (matchDist) setSelectedDistrict(matchDist);
              }
            }
          }
          setGeoStatus("done");
        } catch { setGeoStatus("error"); }
      },
      () => setGeoStatus("error"),
      { timeout: 8000, maximumAge: 30000 }
    );
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px",
    border: "1px solid #1e3a5f", background: "#0d1f3c", color: "#e2e8f0",
    fontSize: "0.88rem", outline: "none", fontFamily: "inherit",
  };

  const selectedStateName = states.find(s => s.stateSlug === selectedState)?.stateName;
  const isPinned = pinnedSlugs.includes(selectedState);

  return (
    <div>
      {/* My States quick-chips */}
      {pinnedSlugs.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#475569", flexShrink: 0 }}>📌 My States:</span>
          {pinnedSlugs.map(slug => {
            const st = states.find(s => s.stateSlug === slug);
            if (!st) return null;
            return (
              <button
                key={slug}
                onClick={() => handleStateChange(slug)}
                style={{
                  background: selectedState === slug ? "#0d9488" : "#0a1628",
                  border: `1px solid ${selectedState === slug ? "#0d9488" : "#1e3a5f"}`,
                  color: selectedState === slug ? "#fff" : "#94a3b8",
                  borderRadius: "20px", padding: "0.2rem 0.75rem",
                  fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {st.stateName}
              </button>
            );
          })}
        </div>
      )}

      {/* Auto-source label */}
      {autoSource && selectedState && (
        <div style={{ marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", color: autoSource === "profile" ? "#22c55e" : autoSource === "pinned" ? "#0d9488" : "#60a5fa", background: autoSource === "profile" ? "#14532d30" : autoSource === "pinned" ? "#0d948820" : "#1e3a5f30", borderRadius: "4px", padding: "0.15rem 0.5rem" }}>
            {autoSource === "profile" ? "✓ State auto-filled from your profile" : autoSource === "pinned" ? "📌 Loaded from My States" : "📍 Location detected"}
          </span>
          <button
            onClick={() => togglePin(selectedState)}
            style={{ fontSize: "0.7rem", color: isPinned ? "#f97316" : "#475569", background: "transparent", border: "1px solid #1e3a5f", borderRadius: "4px", padding: "0.15rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}
          >
            {isPinned ? "📌 Pinned" : "📌 Pin this state"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "0.3rem" }}>STATE</label>
          <select style={inp} value={selectedState} onChange={e => handleStateChange(e.target.value)}>
            <option value="">Select state…</option>
            {states.map(s => (
              <option key={s.stateSlug} value={s.stateSlug}>{s.stateName} ({s.count})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "0.3rem" }}>DISTRICT</label>
          <select style={inp} value={selectedDistrict} onChange={e => { setSelectedDistrict(e.target.value); setPage(0); }} disabled={!selectedState}>
            <option value="">All districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "0.3rem" }}>SPECIALITY</label>
          <select style={inp} value={selectedSpec} onChange={e => { setSelectedSpec(e.target.value); setPage(0); }}>
            <option value="">All specialities</option>
            {AB_SPECIALITIES.map(s => (
              <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "0.3rem" }}>SEARCH</label>
          <input
            style={inp}
            placeholder="Hospital name…"
            value={searchText}
            onChange={e => { setSearchText(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {/* Nearby button + pin helper */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button
          onClick={handleNearby}
          disabled={geoStatus === "loading"}
          style={{ background: "#1e3a5f", color: "#93c5fd", border: "1px solid #2563eb44", borderRadius: "8px", padding: "0.45rem 1rem", fontSize: "0.82rem", cursor: geoStatus === "loading" ? "wait" : "pointer", fontFamily: "inherit" }}
        >
          {geoStatus === "loading" ? "Detecting…" : "📍 Use my location"}
        </button>

        {!isLoggedIn && (
          <span style={{ fontSize: "0.75rem", color: "#475569" }}>
            Sign in to auto-fill state from your profile
          </span>
        )}
        {isLoggedIn && !selectedState && (
          <span style={{ fontSize: "0.75rem", color: "#475569" }}>
            Update your <strong style={{ color: "#60a5fa" }}>place</strong> in Profile settings to auto-detect state
          </span>
        )}

        {geoStatus === "error" && (
          <span style={{ fontSize: "0.78rem", color: "#f87171" }}>
            Could not detect location. Please select manually.
          </span>
        )}
        {geoStatus === "done" && (
          <span style={{ fontSize: "0.78rem", color: "#4ade80" }}>
            Location detected ✓
          </span>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div style={{ color: "#64748b", padding: "2rem 0", textAlign: "center", fontSize: "0.88rem" }}>
          Searching hospitals…
        </div>
      )}

      {!loading && result && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                {result.total} hospital{result.total !== 1 ? "s" : ""} found
                {result.stateName ? ` in ${result.stateName}` : ""}
                {result.page > 0 ? ` (page ${result.page + 1}/${result.pages})` : ""}
              </span>
              {/* Pin button in results area too */}
              {selectedState && !autoSource && (
                <button
                  onClick={() => togglePin(selectedState)}
                  style={{ fontSize: "0.7rem", color: isPinned ? "#f97316" : "#475569", background: "transparent", border: "1px solid #1e3a5f", borderRadius: "4px", padding: "0.15rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {isPinned ? "📌 Pinned" : `📌 Pin ${selectedStateName}`}
                </button>
              )}
            </div>
            {result.pages > 1 && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button disabled={result.page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid #1e3a5f", background: "#0d1f3c", color: "#93c5fd", fontSize: "0.78rem", cursor: result.page === 0 ? "default" : "pointer", fontFamily: "inherit" }}>← Prev</button>
                <button disabled={result.page >= result.pages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid #1e3a5f", background: "#0d1f3c", color: "#93c5fd", fontSize: "0.78rem", cursor: result.page >= result.pages - 1 ? "default" : "pointer", fontFamily: "inherit" }}>Next →</button>
              </div>
            )}
          </div>

          {result.hospitals.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#475569", fontSize: "0.88rem", border: "1px solid #1e3a5f", borderRadius: "10px" }}>
              No hospitals found for the selected filters.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {result.hospitals.map((h, i) => (
                <div key={i} style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "0.9rem 1.1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.92rem", marginBottom: "0.25rem" }}>
                        {h.name || "—"}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.35rem" }}>
                        {[h.district, h.address].filter(Boolean).join(" · ")}
                      </div>
                      {h.specialities && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "0.35rem" }}>
                          {parseSpecialities(h.specialities).slice(0, 20).map(code => (
                            <SpecialityBadge key={code} code={code} />
                          ))}
                          {parseSpecialities(h.specialities).length > 20 && (
                            <span style={{ fontSize: "0.65rem", color: "#64748b" }}>
                              +{parseSpecialities(h.specialities).length - 20} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
                      {h.type && <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{h.type}</span>}
                      {h.phone && isLoggedIn ? (
                        <a href={`tel:${h.phone.replace(/[\s\-]/g, "")}`}
                          style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#166534", color: "#4ade80", border: "1px solid #15803d", borderRadius: "7px", padding: "0.4rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
                          📞 Register: {h.phone}
                        </a>
                      ) : h.phone && !isLoggedIn ? (
                        <span style={{ fontSize: "0.75rem", color: "#475569", border: "1px dashed #1e3a5f", borderRadius: "6px", padding: "0.35rem 0.6rem" }}>
                          Sign in to call & register
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.importedAt && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "#334155" }}>
              Data imported {new Date(result.importedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · Source: NHA AB-PMJAY
            </div>
          )}
        </>
      )}

      {!loading && !result && !selectedState && (
        <div style={{ padding: "3rem", textAlign: "center", color: "#475569", fontSize: "0.88rem", border: "1px dashed #1e3a5f", borderRadius: "10px" }}>
          {isLoggedIn
            ? "Add your city/state in Profile → Edit Profile to auto-load your state here"
            : "Select a state above to find Ayushman Bharat empanelled hospitals"}
        </div>
      )}
    </div>
  );
}
