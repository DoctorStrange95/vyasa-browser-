const KEY = process.env.DATA_GOV_IN_API_KEY!;
const BASE = "https://api.data.gov.in/resource";

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
  source: "live";
}

export interface LiveHospitals {
  phcTotal: number;
  chcTotal: number;
  source: "live";
  stateName: string;
}

const RES_AQI = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";
const RES_PHC = "4e3c855c-c10c-479e-ae6e-187bfed35ac1";

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
    return { aqi: avg, label: aqiLabel(avg), lastUpdate: records[0]?.last_update ?? "", stationCount: vals.length, source: "live" };
  } catch { return null; }
}

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
