import { NextResponse } from "next/server";
import national from "@/data/national.json";

export async function GET() {
  return NextResponse.json(national);
}
