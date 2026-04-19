import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export interface CustomHospital {
  id: string;
  name: string;
  type: "PHC" | "CHC" | "District Hospital" | "Sub-Centre" | "Other";
  address: string;
  district: string;
  state: string;
  stateSlug: string;
  pincode?: string;
  phone?: string;
  phone2?: string;
  lat?: number;
  lng?: number;
  services: string[];
  beds?: number;
  doctors?: number;
  openHours?: string;
  website?: string;
  addedBy: string;
  addedAt: string;
  verified: boolean;
  notes?: string;
}

const hospitals: CustomHospital[] = [];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stateSlug = searchParams.get("state");
  const result = stateSlug ? hospitals.filter((h) => h.stateSlug === stateSlug) : hospitals;
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const hospital: CustomHospital = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: body.name,
    type: body.type ?? "PHC",
    address: body.address,
    district: body.district,
    state: body.state,
    stateSlug: body.stateSlug,
    pincode: body.pincode,
    phone: body.phone,
    phone2: body.phone2,
    lat: body.lat ? Number(body.lat) : undefined,
    lng: body.lng ? Number(body.lng) : undefined,
    services: Array.isArray(body.services) ? body.services : (body.services ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
    beds: body.beds ? Number(body.beds) : undefined,
    doctors: body.doctors ? Number(body.doctors) : undefined,
    openHours: body.openHours,
    website: body.website,
    addedBy: body.addedBy ?? "Admin",
    addedAt: new Date().toISOString(),
    verified: true,
    notes: body.notes,
  };
  hospitals.push(hospital);
  return NextResponse.json({ ok: true, hospital });
}

export async function DELETE(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const idx = hospitals.findIndex((h) => h.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  hospitals.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
