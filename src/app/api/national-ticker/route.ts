import { NextResponse } from "next/server";
import national from "@/data/national.json";

export async function GET() {
  return NextResponse.json(national, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
  });
}
