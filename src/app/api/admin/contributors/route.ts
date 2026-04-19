import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import contributorsData from "@/data/contributors.json";

// Mutable copy
const store = {
  contributors: [...contributorsData.contributors] as Array<{ name: string; role: string; org?: string; url?: string }>,
  sponsors:     [...contributorsData.sponsors] as Array<{ name: string; tier: string; url?: string; logo?: string }>,
  dataAuthors:  [...contributorsData.dataAuthors] as Array<{ name: string; dataset: string; year: string }>,
};

export async function GET() {
  return NextResponse.json(store);
}

export async function POST(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { section, item } = await req.json();
  if (!section || !item) return NextResponse.json({ error: "section and item required" }, { status: 400 });
  if (section === "contributors") store.contributors.push(item);
  else if (section === "sponsors")    store.sponsors.push(item);
  else if (section === "dataAuthors") store.dataAuthors.push(item);
  else return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  return NextResponse.json({ ok: true, store });
}

export async function DELETE(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { section, index } = await req.json();
  if (section === "contributors") store.contributors.splice(index, 1);
  else if (section === "sponsors")    store.sponsors.splice(index, 1);
  else if (section === "dataAuthors") store.dataAuthors.splice(index, 1);
  return NextResponse.json({ ok: true });
}
