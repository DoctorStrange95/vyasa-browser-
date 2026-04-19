import { NextResponse } from "next/server";

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;

export interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now: boolean; weekday_text?: string[] };
  types: string[];
  geometry: { location: { lat: number; lng: number } };
  website?: string;
  distance_m?: number;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat    = searchParams.get("lat");
  const lng    = searchParams.get("lng");
  const radius = searchParams.get("radius") ?? "10000";
  const type   = searchParams.get("type") ?? "all"; // phc | chc | bloodbank | all

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  if (!GOOGLE_KEY) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not configured", needsKey: true }, { status: 503 });
  }

  try {
    const isBloodBank = type === "bloodbank";
    const keywords = type === "phc"
      ? "primary health centre"
      : type === "chc"
      ? "community health centre"
      : isBloodBank
      ? "blood bank"
      : "primary health centre OR community health centre OR government hospital";

    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("radius", radius);
    url.searchParams.set("keyword", keywords);
    url.searchParams.set("type", isBloodBank ? "establishment" : "health");
    url.searchParams.set("key", GOOGLE_KEY);

    const res  = await fetch(url.toString(), { next: { revalidate: 3600 } });
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({ error: data.status, results: [] }, { status: 502 });
    }

    const rawResults: PlaceResult[] = (data.results ?? []).slice(0, 12);

    // Fetch details (phone, hours, address) for top 8 results
    const detailed = await Promise.all(
      rawResults.slice(0, 8).map(async (place) => {
        try {
          const detailUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
          detailUrl.searchParams.set("place_id", place.place_id);
          detailUrl.searchParams.set("fields", "name,formatted_phone_number,international_phone_number,formatted_address,opening_hours,website,rating,user_ratings_total,types");
          detailUrl.searchParams.set("key", GOOGLE_KEY);
          const dr = await fetch(detailUrl.toString(), { next: { revalidate: 86400 } });
          const dd = await dr.json();
          return { ...place, ...dd.result } as PlaceResult;
        } catch {
          return place;
        }
      })
    );

    return NextResponse.json({ results: detailed, status: "ok" });
  } catch (e) {
    return NextResponse.json({ error: "fetch failed", results: [] }, { status: 500 });
  }
}
