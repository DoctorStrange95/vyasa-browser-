import { NextRequest, NextResponse } from "next/server";
import { fetchHealthCentres } from "@/lib/api";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");
  if (!state) return NextResponse.json({ error: "state required" }, { status: 400 });
  const data = await fetchHealthCentres(state);
  if (!data) return NextResponse.json({ error: "no data" }, { status: 404 });
  return NextResponse.json(data);
}
