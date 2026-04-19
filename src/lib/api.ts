const KEY  = process.env.DATA_GOV_IN_API_KEY!;
const BASE = "https://api.data.gov.in/resource";
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;

export function aqiLabel(v: number): string {
  if (v <= 50)  return "Good";
  if (v <= 100) return "Moderate";
  if (v <= 150) return "Unhealthy for Sensitive";
  if (v <= 200) return "Unhealthy";
  if (v <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export interface LiveAQI {
  aqi: number;
  label: string;
  lastUpdate: string;
  stationCount: number;
  source: "live" | "google";
  pollutants?: Record<string, number>;
  healthRecommendation?: string;
  dominantPollutant?: string;
}

export interface LiveHospitals {
  phcTotal: number;
  chcTotal: number;
  source: "live";
  stateName: string;
}

const RES_AQI = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";
const RES_PHC = "4e3c855c-c10c-479e-ae6e-187bfed35ac1";

// ── CPCB AQI (city-level, PM2.5) ─────────────────────────────────────────────
export async function fetchAQI(city: string): Promise<LiveAQI | null> {
  try {
    const url = `${BASE}/${RES_AQI}?api-key=${KEY}&format=json&filters[city]=${encodeURIComponent(city)}&filters[pollutant_id]=PM2.5&limit=50`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const records: Record<string, string>[] = json.records ?? [];
    const vals = records.map((r) => parseFloat(r.avg_value)).filter((v) => !isNaN(v));
    if (!vals.length) return null;
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    return {
      aqi: avg, label: aqiLabel(avg),
      lastUpdate: records[0]?.last_update ?? "",
      stationCount: vals.length, source: "live",
    };
  } catch { return null; }
}

// ── Google Air Quality API (coordinate-based, richer data) ───────────────────
export interface GoogleAQI extends LiveAQI {
  aqiCode: string;
  color: { red: number; green: number; blue: number };
  category: string;
  pollutants: Record<string, number>;
}

export async function fetchGoogleAQI(lat: number, lng: number): Promise<GoogleAQI | null> {
  if (!GOOGLE_KEY) return null;
  try {
    const res = await fetch(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: { latitude: lat, longitude: lng },
          extraComputations: ["HEALTH_RECOMMENDATIONS", "POLLUTANT_ADDITIONAL_INFO", "LOCAL_AQI", "POLLUTANT_CONCENTRATION"],
          languageCode: "en",
        }),
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();

    const indexes: Array<{ aqiDisplay: string; aqi: number; category: string; dominantPollutant: string; color: { red: number; green: number; blue: number }; code: string }> =
      data.indexes ?? [];

    // Prefer "uaqi" (Universal AQI) then first available
    const idx = indexes.find((i) => i.code === "uaqi") ?? indexes[0];
    if (!idx) return null;

    const pollutants: Record<string, number> = {};
    for (const p of data.pollutants ?? []) {
      if (p.concentration?.value != null) {
        pollutants[p.code] = Math.round(p.concentration.value * 10) / 10;
      }
    }

    const pm25 = pollutants["pm25"] ?? idx.aqi;
    return {
      aqi: idx.aqi,
      label: idx.category ?? aqiLabel(idx.aqi),
      lastUpdate: new Date().toISOString().split("T")[0],
      stationCount: 1,
      source: "google",
      aqiCode: idx.code,
      color: idx.color ?? { red: 0.5, green: 0.5, blue: 0.5 },
      category: idx.category,
      pollutants,
      dominantPollutant: idx.dominantPollutant,
      healthRecommendation: data.healthRecommendations?.generalPopulation ?? "",
    };
  } catch { return null; }
}

// ── Geocode city name → lat/lng ───────────────────────────────────────────────
export async function geocodeCity(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_KEY) return null;
  try {
    const q = encodeURIComponent(`${city}, ${state}, India`);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${GOOGLE_KEY}`,
      { next: { revalidate: 2592000 } } // cache 30 days (city coords don't change)
    );
    if (!res.ok) return null;
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch { return null; }
}

// ── PHC/CHC counts ────────────────────────────────────────────────────────────
export async function fetchHealthCentres(stateName: string): Promise<LiveHospitals | null> {
  try {
    const url = `${BASE}/${RES_PHC}?api-key=${KEY}&format=json&limit=40`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = await res.json();
    const records: Record<string, string | number>[] = json.records ?? [];
    const r = records.find((rec) => String(rec.state_ut ?? "").toLowerCase() === stateName.toLowerCase());
    if (!r) return null;
    return { phcTotal: Number(r.phcs___total) || 0, chcTotal: Number(r.chcs___total) || 0, source: "live", stateName };
  } catch { return null; }
}
