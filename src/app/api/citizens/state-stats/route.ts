import { NextResponse } from "next/server";
import states from "@/data/states.json";
import cities from "@/data/cities.json";

type State = typeof states[number];

function healthScore(s: State): number {
  const imrS   = s.imr                    != null ? Math.max(0, 100 - (s.imr / 55) * 100)             : 50;
  const vaccS  = s.vaccinationPct         != null ? s.vaccinationPct                                   : 50;
  const ibS    = s.institutionalBirthsPct != null ? s.institutionalBirthsPct                           : 50;
  const stuntS = s.stuntingPct            != null ? Math.max(0, 100 - (s.stuntingPct / 50) * 100)     : 50;
  const anaemS = s.womenAnaemiaPct        != null ? Math.max(0, 100 - (s.womenAnaemiaPct / 75) * 100) : 50;
  return Math.round(imrS * 0.30 + vaccS * 0.25 + ibS * 0.20 + stuntS * 0.15 + anaemS * 0.10);
}

const ranked = [...states]
  .map(s => ({ slug: s.slug, score: healthScore(s) }))
  .sort((a, b) => b.score - a.score);

const rankMap = Object.fromEntries(ranked.map((s, i) => [s.slug, i + 1]));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stateSlug   = searchParams.get("state");
  const rawDistrict = searchParams.get("district") ?? "";

  // Full list mode
  if (!stateSlug) {
    const list = states.map(s => ({
      slug:                   s.slug,
      name:                   s.name,
      healthScore:            healthScore(s),
      rank:                   rankMap[s.slug],
      imr:                    s.imr,
      vaccinationPct:         s.vaccinationPct,
      institutionalBirthsPct: s.institutionalBirthsPct,
      stuntingPct:            s.stuntingPct,
      birthRate2023:          (s as Record<string, unknown>).birthRate2023 ?? null,
      deathRate2023:          (s as Record<string, unknown>).deathRate2023 ?? null,
    }));
    return NextResponse.json(list, { headers: { "Cache-Control": "public, max-age=3600" } });
  }

  // Single-state mode
  const s = states.find(st => st.slug === stateSlug);
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Match district from cities.json
  let district: { slug: string; name: string; aqi?: number; aqiLabel?: string } | null = null;
  if (rawDistrict) {
    const norm = (t: string) => t.toLowerCase().replace(/[^a-z]/g, "");
    const raw  = norm(rawDistrict);
    const match = (cities as { slug: string; name: string; stateSlug: string; aqi?: number; aqiLabel?: string }[]).find(
      c => c.stateSlug === stateSlug && (norm(c.name).includes(raw) || raw.includes(norm(c.name)))
    );
    if (match) district = { slug: match.slug, name: match.name, aqi: match.aqi, aqiLabel: match.aqiLabel };
  }

  return NextResponse.json({
    slug:                   s.slug,
    name:                   s.name,
    healthScore:            healthScore(s),
    rank:                   rankMap[s.slug],
    totalStates:            states.length,
    imr:                    s.imr,
    vaccinationPct:         s.vaccinationPct,
    institutionalBirthsPct: s.institutionalBirthsPct,
    stuntingPct:            s.stuntingPct,
    womenAnaemiaPct:        s.womenAnaemiaPct,
    birthRate2023:          (s as Record<string, unknown>).birthRate2023 ?? null,
    deathRate2023:          (s as Record<string, unknown>).deathRate2023 ?? null,
    neonatalMR:             s.neonatalMR,
    under5MR:               s.under5MR,
    district,
  }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
