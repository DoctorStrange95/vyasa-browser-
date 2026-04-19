import { notFound } from "next/navigation";
import Link from "next/link";
import states from "@/data/states.json";
import cities from "@/data/cities.json";
import { fetchHealthCentres } from "@/lib/api";
import { readFile } from "fs/promises";
import path from "path";
import CityCard from "@/components/CityCard";
import NearbyHealthCentres from "@/components/NearbyHealthCentres";
import HealthCategories from "@/components/HealthCategories";
import type { OutbreakAlert, IDSPRecord, HospitalBedsRecord } from "@/lib/idsp";

export async function generateStaticParams() {
  return states.map((s) => ({ slug: s.slug }));
}

async function getIDSPCache() {
  try {
    const raw = await readFile(path.join(process.cwd(), "src/data/idsp-cache.json"), "utf-8");
    return JSON.parse(raw);
  } catch { return null; }
}

export default async function StatePage({ params }: { params: { slug: string } }) {
  const state = states.find((s) => s.slug === params.slug);
  if (!state) notFound();

  const stateCities = cities.filter((c) => c.stateSlug === state.slug);

  const [liveHospitals, idspCache] = await Promise.all([
    fetchHealthCentres(state.phcStateName),
    getIDSPCache(),
  ]);

  // Filter IDSP outbreaks to this state (case-insensitive)
  const stateOutbreaks: OutbreakAlert[] = (idspCache?.outbreaks ?? []).filter(
    (a: OutbreakAlert) => a.state.toLowerCase().includes(state.name.toLowerCase().slice(0, 6))
  );
  const allOutbreaks: OutbreakAlert[] = stateOutbreaks.length > 0 ? stateOutbreaks : (idspCache?.nhpAlerts ?? []).slice(0, 4);
  const diseaseRecords: IDSPRecord[] = (idspCache?.diseaseRecords ?? []).filter(
    (r: IDSPRecord) => r.state.toLowerCase().includes(state.name.toLowerCase().slice(0, 6))
  );
  const stateBeds = (idspCache?.hospitalBeds ?? []).find(
    (b: HospitalBedsRecord) => b.state.toLowerCase().includes(state.name.toLowerCase().slice(0, 6))
  );

  return (
    <div className="section-pad" style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
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
              State Health Dashboard · SRS 2023 + NFHS-5 · IDSP Surveillance
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {liveHospitals && (
              <>
                <InfoBadge label="PHCs" value={String(liveHospitals.phcTotal)} live />
                <InfoBadge label="CHCs" value={String(liveHospitals.chcTotal)} live />
              </>
            )}
            <InfoBadge label="Cities" value={String(stateCities.length)} live={false} />
            {idspCache?.refreshedAt && (
              <InfoBadge label="IDSP" value="Live" live />
            )}
          </div>
        </div>
      </div>

      {/* Data source pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
        {[
          { l: "SRS 2023", c: "#0d9488" },
          { l: "NFHS-5 2019–21", c: "#6366f1" },
          { l: "NHP RHS (Live)", c: "#2dd4bf" },
          { l: "IDSP Surveillance", c: "#eab308" },
          { l: "CPCB / Google AQI", c: "#f97316" },
        ].map(s => (
          <span key={s.l} style={{ fontSize: "0.65rem", color: s.c, backgroundColor: `${s.c}18`, border: `1px solid ${s.c}40`, borderRadius: "4px", padding: "0.15rem 0.5rem", fontFamily: "'IBM Plex Mono', monospace" }}>
            {s.l}
          </span>
        ))}
      </div>

      {/* Categorized health indicators */}
      <HealthCategories
        level="state"
        stateName={state.name}
        imrSRS2023={state.imr}
        imrNFHS5={state.imrNFHS5}
        imrRural={state.imrRural2023 ?? null}
        imrUrban={state.imrUrban2023 ?? null}
        neonatalMR={state.neonatalMR ?? null}
        under5MR={state.under5MR ?? null}
        birthRate={state.birthRate2023 ?? null}
        deathRate={state.deathRate2023 ?? null}
        outbreaks={allOutbreaks}
        diseaseRecords={diseaseRecords}
        anaemiaPct={state.anaemiaPct ?? null}
        womenAnaemiaPct={state.womenAnaemiaPct ?? null}
        vaccinationPct={state.vaccinationPct ?? null}
        instBirthsPct={state.institutionalBirthsPct ?? null}
        stuntingPct={state.stuntingPct ?? null}
        wastingPct={state.wastingPct ?? null}
        underweightPct={state.underweightPct ?? null}
        phcTotal={liveHospitals?.phcTotal}
        chcTotal={liveHospitals?.chcTotal}
        hospitalBeds={stateBeds?.totalBeds}
      />

      {/* Cities / Districts with AQI */}
      <section style={{ marginTop: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>
            Districts &amp; Cities
          </h2>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            {stateCities.length} CPCB monitoring stations
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
        {idspCache?.refreshedAt && (
          <span style={{ fontSize: "0.75rem", color: "#334155", marginLeft: "auto" }}>
            IDSP last refreshed: {new Date(idspCache.refreshedAt).toLocaleDateString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoBadge({ label, value, live }: { label: string; value: string; live: boolean }) {
  return (
    <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.5rem 0.85rem", textAlign: "center" }}>
      <div style={{ fontSize: "0.6rem", color: live ? "#2dd4bf" : "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {live && "● "}{label}
      </div>
      <div className="font-data" style={{ fontSize: "1.1rem", fontWeight: 600, color: "#e2e8f0" }}>{value}</div>
    </div>
  );
}
