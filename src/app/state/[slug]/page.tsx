import { notFound } from "next/navigation";
import Link from "next/link";
import states from "@/data/states.json";
import cities from "@/data/cities.json";
import { fetchHealthCentres } from "@/lib/api";
import CityCard from "@/components/CityCard";
import NearbyHealthCentres from "@/components/NearbyHealthCentres";

export async function generateStaticParams() {
  return states.map((s) => ({ slug: s.slug }));
}

function aqiColor(label: string) {
  if (label === "Good") return "#22c55e";
  if (label === "Moderate") return "#eab308";
  if (label.includes("Sensitive")) return "#f97316";
  if (label === "Unhealthy") return "#ef4444";
  return "#a855f7";
}

function scoreColor(v: number, best: number, worst: number, higher: boolean) {
  const good = higher ? v >= best : v <= best;
  const bad  = higher ? v <= worst : v >= worst;
  return good ? "#22c55e" : bad ? "#ef4444" : "#eab308";
}

export default async function StatePage({ params }: { params: { slug: string } }) {
  const state = states.find((s) => s.slug === params.slug);
  if (!state) notFound();

  const stateCities = cities.filter((c) => c.stateSlug === state.slug);

  // PHC/CHC is small (36 rows) — safe to fetch live. NFHS uses static states.json.
  const liveHospitals = await fetchHealthCentres(state.phcStateName);

  const imr            = state.imr;
  const vaccPct        = state.vaccinationPct;
  const stuntingPct    = state.stuntingPct;
  const instBirths     = state.institutionalBirthsPct;
  const anaemia        = state.anaemiaPct;
  const neonatalMR     = state.neonatalMR;
  const underweightPct = state.underweightPct;
  const wastingPct     = state.wastingPct;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "2rem", fontSize: "0.85rem", color: "#64748b" }}>
        <Link href="/" style={{ color: "#0d9488", textDecoration: "none" }}>States</Link>
        <span>/</span>
        <span style={{ color: "#94a3b8" }}>{state.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
          <div>
            <h1 className="font-display" style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: "0.3rem" }}>
              {state.name}
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.88rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              State Health Dashboard · NFHS-5 (2019–21)
              {false && <span style={{ color: "#2dd4bf", marginLeft: "0.75rem" }}>● Live</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {liveHospitals && (
              <>
                <Link href="/sources" style={{ textDecoration: "none" }}>
                  <InfoBadge label="PHCs" value={String(liveHospitals.phcTotal)} />
                </Link>
                <Link href="/sources" style={{ textDecoration: "none" }}>
                  <InfoBadge label="CHCs" value={String(liveHospitals.chcTotal)} />
                </Link>
              </>
            )}
            <InfoBadge label="Cities monitored" value={String(stateCities.length)} />
          </div>
        </div>
      </div>

      {/* Key health indicators */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>
          Key Health Indicators
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {imr !== null && <StatCard label="Infant Mortality Rate" value={String(imr)} unit="/1000 LB" color={scoreColor(imr, 20, 40, false)} desc="Deaths per 1000 live births" />}
          {neonatalMR !== null && <StatCard label="Neonatal Mortality" value={String(neonatalMR)} unit="/1000 LB" color={scoreColor(neonatalMR, 15, 30, false)} desc="Deaths in first 28 days" />}
          {state.under5MR !== null && <StatCard label="Under-5 Mortality" value={`${state.under5MR}`} unit="/1000 LB" color={scoreColor(state.under5MR!, 25, 50, false)} desc="Deaths before age 5" />}
          {vaccPct !== null && <StatCard label="Vaccination Coverage" value={`${vaccPct}%`} color={scoreColor(vaccPct, 85, 60, true)} desc="Children fully immunized 12–23 m" />}
          {instBirths !== null && <StatCard label="Institutional Births" value={`${instBirths}%`} color={scoreColor(instBirths, 90, 70, true)} desc="Delivered in health facility" />}
          {stuntingPct !== null && <StatCard label="Child Stunting" value={`${stuntingPct}%`} color={scoreColor(stuntingPct, 20, 40, false)} desc="Height-for-age below -2 SD (under 5)" />}
          {underweightPct !== null && <StatCard label="Child Underweight" value={`${underweightPct}%`} color={scoreColor(underweightPct, 20, 40, false)} desc="Weight-for-age below -2 SD" />}
          {wastingPct !== null && <StatCard label="Child Wasting" value={`${wastingPct}%`} color={scoreColor(wastingPct, 10, 20, false)} desc="Acute malnutrition under 5" />}
          {anaemia !== null && <StatCard label="Child Anaemia" value={`${anaemia}%`} color={scoreColor(anaemia, 40, 70, false)} desc="Children age 6–59 months" />}
          {state.womenAnaemiaPct !== null && <StatCard label="Women Anaemia" value={`${state.womenAnaemiaPct}%`} color={scoreColor(state.womenAnaemiaPct!, 30, 55, false)} desc="Women age 15–49 years" />}
        </div>
      </section>

      {/* Cities / Districts with AQI */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>
            Districts &amp; Cities
          </h2>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            {stateCities.length} monitoring stations · CPCB live AQI
          </span>
        </div>

        {stateCities.length === 0 ? (
          <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "2rem", textAlign: "center", color: "#475569" }}>
            No CPCB monitoring stations in this state/UT.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {stateCities.map((city) => <CityCard key={city.slug} city={city} />)}
          </div>
        )}
      </section>

      {/* PHC / CHC finder */}
      <NearbyHealthCentres stateName={state.name} />

      {/* Back + sources */}
      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #1e3a5f", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/" style={{ color: "#0d9488", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>← All States</Link>
        <Link href="/sources" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.875rem" }}>Data Sources</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit = "", color, desc = "" }: {
  label: string; value: string; unit?: string; color: string; desc?: string;
}) {
  return (
    <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1.25rem" }}>
      <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.4rem" }}>{label}</div>
      <div className="font-data" style={{ fontSize: "1.75rem", fontWeight: 600, color }}>
        {value}
        {unit && <span style={{ fontSize: "0.9rem", color: "#64748b", marginLeft: "3px" }}>{unit}</span>}
      </div>
      {desc && <div style={{ fontSize: "0.68rem", color: "#475569", marginTop: "0.4rem", lineHeight: 1.4 }}>{desc}</div>}
    </div>
  );
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.5rem 1rem", textAlign: "center" }}>
      <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div className="font-data" style={{ fontSize: "1rem", fontWeight: 600, color: "#2dd4bf" }}>{value}</div>
    </div>
  );
}
