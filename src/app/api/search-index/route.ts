import { NextResponse } from "next/server";
import states from "@/data/states.json";
import cities from "@/data/cities.json";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "states") {
    return NextResponse.json(
      states.map(s => ({ type: "state", name: s.name, slug: s.slug, extra: `State · IMR ${(s as Record<string, unknown>).imr ?? "?"}` }))
    );
  }

  if (type === "districts") {
    return NextResponse.json(
      (cities as Array<{ name: string; slug: string; stateName?: string }>)
        .map(c => ({ type: "district", name: c.name, slug: c.slug, extra: c.stateName ?? "" }))
    );
  }

  return NextResponse.json({ error: "type=states|districts required" }, { status: 400 });
}
