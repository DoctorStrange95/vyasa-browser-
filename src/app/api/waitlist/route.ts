import { NextRequest, NextResponse } from "next/server";
import { fsAdd } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { name, email, phone, role, specialization, prescriptionBoring, interests, city, state, referral } = body as Record<string, string | string[]>;

  if (!name || !email || !phone || !role) {
    return NextResponse.json({ error: "Name, email, phone and role are required." }, { status: 400 });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  try {
    const id = await fsAdd("waitlist", {
      name:               String(name).trim(),
      email:              String(email).trim().toLowerCase(),
      phone:              String(phone).trim(),
      role:               String(role),
      specialization:     specialization ? String(specialization).trim() : "",
      prescriptionBoring: String(prescriptionBoring ?? ""),
      interests:          Array.isArray(interests) ? interests : [],
      city:               city  ? String(city).trim()  : "",
      state:              state ? String(state).trim() : "",
      referral:           referral ? String(referral).trim() : "",
      joinedAt:           new Date().toISOString(),
      status:             "waitlisted",
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Waitlist save error:", err);
    return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  }
}
