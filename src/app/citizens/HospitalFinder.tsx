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
    <span
      style={{
        background: color + "18",
        color,
        border: `1px solid ${color}44`,
        fontSize: "0.72rem", padding: "3px 8px", borderRadius: "4px",
        display: "inline-flex", alignItems: "center", gap: "4px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontWeight: 600, letterSpacing: "0.02em" }}>{clean}</span>
      {sp && (
        <span style={{ opacity: 0.85, fontWeight: 400 }}>{sp.name}</span>
      )}
    </span>
  );
}

function parseSpecialities(raw: string): string[] {
  if (!raw) return [];
  return raw.split(/[,;\s\/]+/).map((s) => s.trim()).filter(Boolean);
}

export default function HospitalFinder() {
  const [states, setStates]       = useState<StateItem[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [searchText, setSearchText] = useState("");
  const [result, setResult]       = useState<SearchResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(0);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  // Load states on mount
  useEffect(() => {
    fetch("/api/citizens/hospitals?states=true")
      .then((r) => r.json())
      .then((data) => setStates(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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

  // Re-search when filters change
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
  };

  const handleNearby = () => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
          const geo = await fetch(url).then((r) => r.json());
          const rawState    = geo?.address?.state ?? "";
          const rawDistrict = geo?.address?.county ?? geo?.address?.state_district ?? "";
          // Find matching state slug
          const matchState = states.find(
            (s) => s.stateName.toLowerCase().includes(rawState.toLowerCase().split(" ")[0])
              || rawState.toLowerCase().includes(s.stateName.toLowerCase().split(" ")[0])
          );
          if (matchState) {
            setSelectedState(matchState.stateSlug);
            // Wait for districts to load, then match district
            if (rawDistrict) {
              const params = new URLSearchParams({ state: matchState.stateSlug });
              const r = await fetch(`/api/citizens/hospitals?${params}`);
              const data: SearchResult = await r.json();
              if (data.districts) {
                setDistricts(data.districts);
                const matchDist = data.districts.find(
                  (d) => d.toLowerCase().includes(rawDistrict.toLowerCase().split(" ")[0])
                    || rawDistrict.toLowerCase().includes(d.toLowerCase().split(" ")[0])
                );
                if (matchDist) setSelectedDistrict(matchDist);
              }
            }
          }
          setGeoStatus("done");
        } catch {
          setGeoStatus("error");
        }
      },
      () => setGeoStatus("error")
    );
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px",
    border: "1px solid #1e3a5f", background: "#0d1f3c", color: "#e2e8f0",
    fontSize: "0.88rem", outline: "none",
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "0.3rem" }}>STATE</label>
          <select style={inp} value={selectedState} onChange={(e) => handleStateChange(e.target.value)}>
            <option value="">Select state…</option>
            {states.map((s) => (
              <option key={s.stateSlug} value={s.stateSlug}>{s.stateName} ({s.count})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "0.3rem" }}>DISTRICT</label>
          <select style={inp} value={selectedDistrict} onChange={(e) => { setSelectedDistrict(e.target.value); setPage(0); }}
            disabled={!selectedState}>
            <option value="">All districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "0.3rem" }}>SPECIALITY</label>
          <select style={inp} value={selectedSpec} onChange={(e) => { setSelectedSpec(e.target.value); setPage(0); }}>
            <option value="">All specialities</option>
            {AB_SPECIALITIES.map((s) => (
              <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "0.3rem" }}>SEARCH</label>
          <input
            style={inp} placeholder="Hospital name…"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {/* Nearby button */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={handleNearby}
          disabled={geoStatus === "loading"}
          style={{
            background: "#1e3a5f", color: "#93c5fd", border: "1px solid #2563eb44",
            borderRadius: "8px", padding: "0.45rem 1rem", fontSize: "0.82rem",
            cursor: geoStatus === "loading" ? "wait" : "pointer",
          }}
        >
          {geoStatus === "loading" ? "Detecting location…" : "📍 Use my location"}
        </button>
        {geoStatus === "error" && (
          <span style={{ marginLeft: "0.75rem", fontSize: "0.78rem", color: "#f87171" }}>
            Could not detect location. Please select manually.
          </span>
        )}
        {geoStatus === "done" && (
          <span style={{ marginLeft: "0.75rem", fontSize: "0.78rem", color: "#4ade80" }}>
            Location detected — check your state/district selection above.
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
              {result.total} hospital{result.total !== 1 ? "s" : ""} found
              {result.stateName ? ` in ${result.stateName}` : ""}
              {result.page > 0 ? ` (page ${result.page + 1}/${result.pages})` : ""}
            </span>
            {result.pages > 1 && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  disabled={result.page === 0}
                  onClick={() => setPage(p => p - 1)}
                  style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid #1e3a5f", background: "#0d1f3c", color: "#93c5fd", fontSize: "0.78rem", cursor: result.page === 0 ? "default" : "pointer" }}
                >← Prev</button>
                <button
                  disabled={result.page >= result.pages - 1}
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid #1e3a5f", background: "#0d1f3c", color: "#93c5fd", fontSize: "0.78rem", cursor: result.page >= result.pages - 1 ? "default" : "pointer" }}
                >Next →</button>
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
                          {parseSpecialities(h.specialities).slice(0, 20).map((code) => (
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
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {h.type && (
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>
                          {h.type}
                        </span>
                      )}
                      {h.phone && (
                        <a
                          href={`tel:${h.phone.replace(/\s/g, "")}`}
                          style={{ fontSize: "0.78rem", color: "#38bdf8", textDecoration: "none" }}
                        >
                          📞 {h.phone}
                        </a>
                      )}
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
          Select a state to find Ayushman Bharat empanelled hospitals
        </div>
      )}
    </div>
  );
}
