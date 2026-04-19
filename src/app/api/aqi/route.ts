import { NextRequest, NextResponse } from "next/server";
import { fetchAQI } from "@/lib/api";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  if (!city) return NextResponse.json({ error: "city required" }, { status: 400 });
  const data = await fetchAQI(city);
  if (!data) return NextResponse.json({ error: "no data" }, { status: 404 });
  return NextResponse.json(data);
}
