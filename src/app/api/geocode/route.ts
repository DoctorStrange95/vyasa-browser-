import { NextResponse } from "next/server";

const KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });
  if (!KEY) return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not configured", needsKey: true }, { status: 503 });

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q + ", India")}&key=${KEY}`;
    const res  = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { lat, lng } = data.results[0].geometry.location;
    return NextResponse.json({ lat, lng, formatted: data.results[0].formatted_address });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
