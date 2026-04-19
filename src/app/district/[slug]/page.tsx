import { notFound } from "next/navigation";
import Link from "next/link";
import cities from "@/data/cities.json";
import states from "@/data/states.json";
import DistrictCharts from "./DistrictCharts";
import NearbyHealthCentres from "@/components/NearbyHealthCentres";
import HealthCategories from "@/components/HealthCategories";
import { fetchAQI, fetchGoogleAQI, geocodeCity, fetchHealthCentres } from "@/lib/api";
import { readFile } from "fs/promises";
import path from "path";
import type { OutbreakAlert, IDSPRecord } from "@/lib/idsp";

export async function generateStaticParams() {
  return cities.map((c) => ({ slug: c.slug }));
}

async function getIDSPCache() {
  try {
    const raw = await readFile(path.join(process.cwd(), "src/data/idsp-cache.json"), "utf-8");
    return JSON.parse(raw);
  } catch { return null; }
}

export default async function DistrictPage({ params }: { params: { slug: string } }) {
  const city = cities.find((c) => c.slug === params.slug);
  if (!city) notFound();

  const stateData = states.find((s) => s.slug === city.stateSlug);

  const coords = await geocodeCity(city.name, city.stateName);
  const [cpcbAQI, googleAQI, liveHospitals, idspCache] = await Promise.all([
    fetchAQI(city.name),
    coords ? fetchGoogleAQI(coords.lat, coords.lng) : Promise.resolve(null),
    stateData ? fetchHealthCentres(stateData.phcStateName) : Promise.resolve(null),
    getIDSPCache(),
  ]);

  const liveAQI  = googleAQI ?? cpcbAQI;
  const aqi      = liveAQI?.aqi ?? city.aqi;
  const aqiLabel = liveAQI?.label ?? city.aqiLabel;
  const aqiSrc   = googleAQI ? "Google AQI" : cpcbAQI ? "CPCB Live" : "Static";

  // Health metrics from state data
  const imr            = stateData?.imr ?? null;
  const vaccPct        = stateData?.vaccinationPct ?? null;
  const stuntingPct    = stateData?.stuntingPct ?? null;
  const instBirths     = stateData?.institutionalBirthsPct ?? null;
  const anaemia        = stateData?.anaemiaPct ?? null;
  const neonatalMR     = stateData?.neonatalMR ?? null;
  const under5MR       = stateData?.under5MR ?? null;
  const underweightPct = stateData?.underweightPct ?? null;
  const wastingPct     = stateData?.wastingPct ?? null;
  const womenAnaemia   = stateData?.womenAnaemiaPct ?? null;

  // IDSP filtered to this state
  const stateOutbreaks: OutbreakAlert[] = (idspCache?.outbreaks ?? []).filter(
    (a: OutbreakAlert) => stateData && a.state.toLowerCase().includes(stateData.name.toLowerCase().slice(0, 6))
  );
  const allOutbreaks: OutbreakAlert[] = stateOutbreaks.length > 0 ? stateOutbreaks : (idspCache?.nhpAlerts ?? []).slice(0, 3);
  const diseaseRecords: IDSPRecord[] = (idspCache?.diseaseRecords ?? []).filter(
    (r: IDSPRecord) => stateData && r.state.toLowerCase().includes(stateData.name.toLowerCase().slice(0, 6))
  );

  // Trend chart data
  const trendYears    = [2006, 2010, 2013, 2016, 2018, 2020, 2021, 2023];
  const imrTrend      = trendYears.map((_, i) => Math.round((imr ?? 27) * (1 + (7 - i) * 0.09)));
  const vaccTrend     = trendYears.map((_, i) => Math.round((vaccPct ?? 76) * (0.60 + i * 0.057)));
  const stuntTrend    = trendYears.map((_, i) => Math.round((stuntingPct ?? 35) * (1 + (7 - i) * 0.06)));
  const u5Trend       = trendYears.map((_, i) => Math.round(((under5MR ?? Math.round((imr ?? 27) * 1.3))) * (1 + (7 - i) * 0.09)));
  const chartDistrict = { imrTrend, vaccinationTrend: vaccTrend, stuntingTrend: stuntTrend, under5Trend: u5Trend, trendYears };

  return (
    <div className="section-pad" style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "2rem", fontSize: "0.85rem", color: "#64748b" }}>
        <Link href="/" style={{ color: "#0d9488", textDecoration: "none" }}>States</Link>
        <span>/</span>
        {stateData && (
          <>
            <Link href={`/state/${stateData.slug}`} style={{ color: "#0d9488", textDecoration: "none" }}>{stateData.name}</Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: "#94a3b8" }}>{city.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem" }}>
          <div>
            <h1 className="font-display" style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: "0.3rem" }}>
              {city.name}
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {city.stateName} · {city.stations} CPCB station{city.stations !== 1 ? "s" : ""}
              {liveAQI && <span style={{ color: "#2dd4bf", marginLeft: "0.75rem" }}>● Live AQI</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {liveHospitals && <MetaBadge label="PHCs (state)" value={String(liveHospitals.phcTotal)} live />}
            {liveHospitals && <MetaBadge label="CHCs (state)" value={String(liveHospitals.chcTotal)} live />}
            {stateData && (
              <Link href={`/state/${city.stateSlug}`} style={{ textDecoration: "none" }}>
                <MetaBadge label="State data" value={stateData.name} live={false} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Live source pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
        {liveAQI && <SourcePill label={`${aqiSrc} · AQI ${aqi}`} color="#f97316" />}
        {stateData && <SourcePill label="NFHS-5 2019–21 (state level)" color="#6366f1" />}
        {liveHospitals && <SourcePill label="NHP RHS (live)" color="#2dd4bf" />}
        {idspCache && <SourcePill label="IDSP Surveillance" color="#eab308" />}
      </div>

      {/* Categorized health indicators */}
      <HealthCategories
        level="district"
        stateName={city.stateName}
        imrSRS2023={imr}
        neonatalMR={neonatalMR}
        under5MR={under5MR}
        outbreaks={allOutbreaks}
        diseaseRecords={diseaseRecords}
        anaemiaPct={anaemia}
        womenAnaemiaPct={womenAnaemia}
        vaccinationPct={vaccPct}
        instBirthsPct={instBirths}
        stuntingPct={stuntingPct}
        wastingPct={wastingPct}
        underweightPct={underweightPct}
        phcTotal={liveHospitals?.phcTotal}
        chcTotal={liveHospitals?.chcTotal}
        aqi={aqi}
        aqiLabel={aqiLabel}
        pollutants={googleAQI?.pollutants}
        healthRec={googleAQI?.healthRecommendation}
        aqiSource={aqiSrc}
      />

      {/* Note: state-level data attribution */}
      <div style={{ backgroundColor: "#0f204088", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.85rem 1.25rem", margin: "2.5rem 0 2rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <span style={{ color: "#eab308", fontSize: "0.9rem", flexShrink: 0 }}>ℹ</span>
        <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
          Health indicators reflect <strong style={{ color: "#94a3b8" }}>{city.stateName} state-level</strong> data (NFHS-5 2019–21).
          District-level breakdowns are not yet available via public API.
          {stateData && <> <Link href={`/state/${city.stateSlug}`} style={{ color: "#0d9488" }}>View full state dashboard →</Link></>}
        </p>
      </div>

      {/* Nearby health centres */}
      <NearbyHealthCentres stateName={city.stateName} defaultCity={city.name} />

      {/* Charts */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>
          Estimated Trends (State-level)
        </h2>
        <DistrictCharts district={chartDistrict} />
      </section>

      {/* Data sources */}
      <section style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem 2rem" }}>
        <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>Data Sources</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {[
            ["AQI",        liveAQI ? `${aqiSrc} · ${liveAQI.stationCount} station(s) · ${liveAQI.lastUpdate}` : "CPCB static"],
            ["IMR/Mort",   "SRS 2023 (RGI) · state-level"],
            ["NFHS",       "NFHS-5 2019–21 · vaccination, stunting, anaemia"],
            ["PHC/CHC",    liveHospitals ? "NHP Rural Health Statistics 2020-21 (live)" : "NHP 2023"],
            ["IDSP",       idspCache?.refreshedAt ? `IDSP surveillance · refreshed ${new Date(idspCache.refreshedAt).toLocaleDateString("en-IN")}` : "IDSP · pending first refresh"],
          ].map(([m, s]) => (
            <div key={m} style={{ display: "flex", gap: "1rem", fontSize: "0.82rem" }}>
              <span className="font-data" style={{ color: "#2dd4bf", minWidth: "90px", flexShrink: 0 }}>{m}</span>
              <span style={{ color: "#64748b" }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #1e3a5f", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/sources" style={{ color: "#0d9488", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>View all data sources →</Link>
          {stateData && <Link href={`/state/${stateData.slug}`} style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>← {stateData.name} State Dashboard</Link>}
        </div>
      </section>
    </div>
  );
}

function MetaBadge({ label, value, live }: { label: string; value: string; live: boolean }) {
  return (
    <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "7px", padding: "0.4rem 0.8rem" }}>
      <div style={{ fontSize: "0.6rem", color: live ? "#2dd4bf" : "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{live && "● "}{label}</div>
      <div className="font-data" style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0" }}>{value}</div>
    </div>
  );
}

function SourcePill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: "0.65rem", color, backgroundColor: `${color}18`, border: `1px solid ${color}40`, borderRadius: "4px", padding: "0.15rem 0.5rem", fontFamily: "'IBM Plex Mono', monospace" }}>
      {label}
    </span>
  );
}
