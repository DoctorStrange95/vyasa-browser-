import { NextResponse } from "next/server";
import { adminGet } from "@/lib/firestore-admin";

export const revalidate = 60; // cache for 60 seconds

export async function GET() {
  try {
    const doc = await adminGet("team_page", "config");
    return NextResponse.json(doc ?? {}, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({});
  }
}
