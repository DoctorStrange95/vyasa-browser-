import { notFound } from "next/navigation";
import Link from "next/link";
import cities from "@/data/cities.json";
import states from "@/data/states.json";
import DistrictCharts from "./DistrictCharts";
import HealthScoreCard from "@/components/HealthScoreCard";
import NearbyHealthCentres from "@/components/NearbyHealthCentres";
import { fetchAQI, fetchGoogleAQI, geocodeCity, fetchHealthCentres } from "@/lib/api";

function aqiColor(label: string): string {
  if (label === "Good") return "#22c55e";
  if (label === "Moderate") return "#eab308";
  if (label.includes("Sensitive")) return "#f97316";
  if (label === "Unhealthy") return "#ef4444";
  return "#a855f7";
}

function scoreBadge(value: number, good: number, bad: number, higherIsBetter: boolean) {
  const isGood = higherIsBetter ? value >= good : value <= good;
  const isBad  = higherIsBetter ? value <= bad  : value >= bad;
  const color  = isGood ? "#22c55e" : isBad ? "#ef4444" : "#eab308";
  const bg     = isGood ? "#22c55e18" : isBad ? "#ef444418" : "#eab30818";
  const label  = isGood ? "Good" : isBad ? "Needs Attention" : "Average";
  return { color, bg, label };
}

export async function generateStaticParams() {
  return cities.map((c) => ({ slug: c.slug }));
}

export default async function DistrictPage({ params }: { params: { slug: string } }) {
  const city = cities.find((c) => c.slug === params.slug);
  if (!city) notFound();

  const stateData = states.find((s) => s.slug === city.stateSlug);

  // AQI: CPCB + Google (parallel). PHC/CHC live (24hr). NFHS static.
  const coords = await geocodeCity(city.name, city.stateName);
  const [cpcbAQI, googleAQI, liveHospitals] = await Promise.all([
    fetchAQI(city.name),
    coords ? fetchGoogleAQI(coords.lat, coords.lng) : Promise.resolve(null),
    stateData ? fetchHealthCentres(stateData.phcStateName) : Promise.resolve(null),
  ]);

  // Prefer Google AQI (richer), fall back to CPCB, then static
  const liveAQI        = googleAQI ?? cpcbAQI;
  const aqi            = liveAQI?.aqi ?? city.aqi;
  const aqi_label      = liveAQI?.label ?? city.aqiLabel;
  const imr            = stateData?.imr ?? 27;
  const vaccPct        = stateData?.vaccinationPct ?? 76;
  const stuntingPct    = stateData?.stuntingPct ?? 35;
  const instBirths     = stateData?.institutionalBirthsPct ?? 88;
  const anaemia        = stateData?.anaemiaPct ?? 67;
  const neonatalMR     = stateData?.neonatalMR ?? null;
  const under5MR       = stateData?.under5MR ?? null;
  const underweightPct = stateData?.underweightPct ?? null;
  const wastingPct     = stateData?.wastingPct ?? null;
  const womenAnaemia   = stateData?.womenAnaemiaPct ?? null;

  const aqiCol    = aqiColor(aqi_label);
  const imrScore  = scoreBadge(imr, 20, 40, false);
  const vaccScore = scoreBadge(vaccPct, 85, 60, true);

  // Static trend approximations (NFHS rounds: 2005-06, 2015-16, 2019-21 + linear interpolation)
  const trendYears    = [2006, 2010, 2013, 2016, 2018, 2020, 2021, 2023];
  const imrTrend      = trendYears.map((_, i) => Math.round(imr * (1 + (7 - i) * 0.09)));
  const vaccTrend     = trendYears.map((_, i) => Math.round(vaccPct * (0.60 + i * 0.057)));
  const stuntingBase  = stuntingPct ?? 35;
  const stuntingTrend = trendYears.map((_, i) => Math.round(stuntingBase * (1 + (7 - i) * 0.06)));
  const u5Base        = under5MR ?? Math.round(imr * 1.3);
  const under5Trend   = trendYears.map((_, i) => Math.round(u5Base * (1 + (7 - i) * 0.09)));
  const chartDistrict = { imrTrend, vaccinationTrend: vaccTrend, stuntingTrend, under5Trend, trendYears };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
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
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {liveHospitals && (
              <Link href={`/state/${city.stateSlug}`} style={{ textDecoration: "none" }}>
                <MetaBadge label="PHCs (state)" value={String(liveHospitals.phcTotal)} live />
              </Link>
            )}
            {liveHospitals && (
              <Link href={`/state/${city.stateSlug}`} style={{ textDecoration: "none" }}>
                <MetaBadge label="CHCs (state)" value={String(liveHospitals.chcTotal)} live />
              </Link>
            )}
            {stateData && (
              <Link href={`/state/${city.stateSlug}`} style={{ textDecoration: "none" }}>
                <MetaBadge label="State data" value={stateData.name} live={false} link />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Live source banner */}
      {(liveAQI || stateData || liveHospitals) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.75rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live from:</span>
          {liveAQI && <LiveBadge label={`CPCB AQI · ${liveAQI.stationCount} stations · ${liveAQI.lastUpdate}`} />}
          {stateData && <LiveBadge label={`NFHS-5 · ${stateData.name} (state-level)`} />}
          {liveHospitals && <LiveBadge label={`NHP RHS 2020-21 · ${liveHospitals.stateName}`} />}
        </div>
      )}

      {/* Health Score */}
      <HealthScoreCard
        imr={imr}
        vaccinationPct={vaccPct}
        doctorsPer1000={2.0}
        aqi={aqi}
        malnutritionPct={stuntingPct}
        instBirthsPct={instBirths}
        neonatalMR={neonatalMR}
        womenAnaemiaPct={womenAnaemia}
      />

      {/* Key metrics */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>
          Key Health Indicators
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))", gap: "1rem" }}>
          {/* AQI card */}
          <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Air Quality Index</div>
              {liveAQI && (
                <LiveBadge label={liveAQI.source === "google" ? "Google AQI" : "CPCB Live"} small />
              )}
            </div>
            <div className="font-data" style={{ fontSize: "2rem", fontWeight: 600, color: aqiCol, marginBottom: "0.15rem" }}>{aqi}</div>
            <div style={{ fontSize: "0.78rem", color: aqiCol, backgroundColor: `${aqiCol}22`, display: "inline-block", padding: "0.15rem 0.6rem", borderRadius: "4px", marginBottom: "0.5rem" }}>
              {aqi_label}
            </div>
            {/* Pollutant breakdown from Google AQI */}
            {googleAQI?.pollutants && Object.keys(googleAQI.pollutants).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                {Object.entries(googleAQI.pollutants).slice(0, 4).map(([k, v]) => (
                  <span key={k} style={{ fontSize: "0.65rem", color: "#64748b", backgroundColor: "#1e3a5f40", borderRadius: "3px", padding: "0.1rem 0.35rem" }}>
                    {k.toUpperCase()}: {v}
                  </span>
                ))}
              </div>
            )}
            {/* Health recommendation */}
            {googleAQI?.healthRecommendation && (
              <div style={{ fontSize: "0.7rem", color: "#64748b", lineHeight: 1.45, marginTop: "0.3rem", borderTop: "1px solid #1e3a5f", paddingTop: "0.5rem" }}>
                {googleAQI.healthRecommendation.slice(0, 120)}{googleAQI.healthRecommendation.length > 120 ? "…" : ""}
              </div>
            )}
            {!googleAQI && (
              <div style={{ fontSize: "0.72rem", color: "#475569" }}>
                PM2.5 µg/m³{liveAQI && ` · ${liveAQI.stationCount} stations`}
              </div>
            )}
          </div>

          <MetricCard label="Infant Mortality Rate" value={String(imr)} unit="/1000 LB" sub="Deaths per 1000 live births · state" score={imrScore} live={!!stateData} />
          {neonatalMR !== null && <MetricCard label="Neonatal Mortality" value={String(neonatalMR)} unit="/1000 LB" sub="Deaths in first 28 days · state" score={scoreBadge(neonatalMR, 15, 30, false)} live={!!stateData} />}
          {under5MR !== null && <MetricCard label="Under-5 Mortality" value={String(under5MR)} unit="/1000 LB" sub="Child deaths before age 5 · state" score={scoreBadge(under5MR, 25, 50, false)} live={!!stateData} />}
          <MetricCard label="Vaccination Coverage" value={`${vaccPct}%`} sub="Fully immunized 12–23 months · state" score={vaccScore} live={!!stateData} />
          <MetricCard label="Institutional Births" value={`${instBirths}%`} sub="Delivered in health facility · state" score={scoreBadge(instBirths, 90, 70, true)} live={!!stateData} />
          <MetricCard label="Child Stunting" value={`${stuntingPct}%`} sub="Height-for-age below -2 SD · state" score={scoreBadge(stuntingPct, 20, 40, false)} live={!!stateData} />
          {underweightPct !== null && <MetricCard label="Child Underweight" value={`${underweightPct}%`} sub="Weight-for-age below -2 SD · state" score={scoreBadge(underweightPct, 20, 40, false)} live={!!stateData} />}
          {wastingPct !== null && <MetricCard label="Child Wasting" value={`${wastingPct}%`} sub="Acute malnutrition under 5 · state" score={scoreBadge(wastingPct, 10, 20, false)} live={!!stateData} />}
          <MetricCard label="Child Anaemia" value={`${anaemia}%`} sub="Children age 6–59 months · state" score={scoreBadge(anaemia, 40, 70, false)} live={!!stateData} />
          {womenAnaemia !== null && <MetricCard label="Women Anaemia" value={`${womenAnaemia}%`} sub="Women age 15–49 years · state" score={scoreBadge(womenAnaemia, 30, 55, false)} live={!!stateData} />}
        </div>
      </section>

      {/* Note about state-level data */}
      <div style={{ backgroundColor: "#0f204088", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.85rem 1.25rem", marginBottom: "2rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <span style={{ color: "#eab308", fontSize: "0.9rem", flexShrink: 0 }}>ℹ</span>
        <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
          Health indicators (IMR, vaccination, nutrition) reflect <strong style={{ color: "#94a3b8" }}>{city.stateName} state-level</strong> data from NFHS-5 (2019–21).
          District-level NFHS breakdowns are not yet available via public API.
          {stateData && <> <Link href={`/state/${city.stateSlug}`} style={{ color: "#0d9488" }}> View full state dashboard →</Link></>}
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

      {/* Data notes */}
      <section style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem 2rem" }}>
        <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>Data Sources</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {[
            ["AQI",      liveAQI ? `CPCB Real-time (${liveAQI.stationCount} stations, ${liveAQI.lastUpdate})` : "CPCB National AQI"],
            ["IMR",      stateData ? "NFHS-5 (2019–21) state-level via data.gov.in" : "NFHS-5 estimate"],
            ["Vaccination", stateData ? "NFHS-5 (2019–21) children 12–23 months" : "NFHS-5 estimate"],
            ["PHC/CHC",  liveHospitals ? "NHP Rural Health Statistics 2020-21" : "NHP 2023"],
          ].map(([metric, source]) => (
            <div key={metric} style={{ display: "flex", gap: "1rem", fontSize: "0.82rem" }}>
              <span className="font-data" style={{ color: "#2dd4bf", minWidth: "100px" }}>{metric}</span>
              <span style={{ color: "#64748b" }}>{source}</span>
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

function LiveBadge({ label, small = false }: { label: string; small?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      backgroundColor: "#0d948818", border: "1px solid #0d948840", borderRadius: "20px",
      padding: small ? "0.1rem 0.5rem" : "0.2rem 0.65rem",
      fontSize: small ? "0.65rem" : "0.72rem", color: "#2dd4bf",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#2dd4bf", display: "inline-block" }} />
      {label}
    </span>
  );
}

function MetricCard({ label, value, unit = "", sub, score, live = false }: {
  label: string; value: string; unit?: string; sub: string;
  score?: { color: string; bg: string; label: string }; live?: boolean;
}) {
  return (
    <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        {live && <LiveBadge label="Live" small />}
      </div>
      <div className="font-data" style={{ fontSize: "2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "0.25rem" }}>
        {value}{unit && <span style={{ fontSize: "1rem", color: "#64748b" }}> {unit}</span>}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#475569" }}>{sub}</div>
      {score && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: score.color, backgroundColor: score.bg, display: "inline-block", padding: "0.15rem 0.6rem", borderRadius: "4px" }}>
          {score.label}
        </div>
      )}
    </div>
  );
}

function MetaBadge({ label, value, live = false, link = false }: { label: string; value: string; live?: boolean; link?: boolean }) {
  return (
    <div style={{
      backgroundColor: "#0f2040", border: `1px solid ${link ? "#0d948850" : "#1e3a5f"}`,
      borderRadius: "8px", padding: "0.5rem 1rem", textAlign: "center",
      cursor: link ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
        <span style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        {live && <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#2dd4bf", display: "inline-block" }} />}
        {link && <span style={{ fontSize: "0.65rem", color: "#0d9488" }}>↗</span>}
      </div>
      <div className="font-data" style={{ fontSize: live || link ? "1rem" : "0.85rem", fontWeight: 600, color: link ? "#0d9488" : "#2dd4bf" }}>{value}</div>
    </div>
  );
}
