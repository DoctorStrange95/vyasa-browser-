import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fsQuery, fsExists, fsSet } from "@/lib/firestore";

const CACHE_FILE = path.join(process.cwd(), "src/data/ph-intelligence-cache.json");
const TTL_HOURS  = 24;

function readJsonCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); }
  catch { return { refreshedAt: null, items: [], sources: [], errors: [] }; }
}
function writeJsonCache(data: object) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2)); } catch { /* read-only on Vercel */ }
}
function cacheAgeHours(ts: string | null): number {
  if (!ts) return Infinity;
  return (Date.now() - new Date(ts).getTime()) / 3_600_000;
}

type PHItem = import("@/lib/phIntelligence").PHIntelligenceItem;

function itemDocId(item: PHItem): string {
  const raw = `${item.type}::${item.disease ?? item.program ?? ""}::${item.location.state}::${item.title.slice(0, 40)}`;
  return Buffer.from(raw).toString("base64").replace(/[/+=]/g, "_").slice(0, 100);
}

async function saveToFirestore(items: PHItem[]): Promise<void> {
  for (const item of items) {
    try {
      const id  = itemDocId(item);
      const exists = await fsExists("ph_intelligence", id);
      if (!exists) {
        await fsSet("ph_intelligence", id, {
          ...item as unknown as Record<string, unknown>,
          status: "pending",
          scrapedAt: new Date().toISOString(),
        });
      }
    } catch { /* silent — Firebase optional */ }
  }
}

async function readLiveFromFirestore(): Promise<PHItem[] | null> {
  try {
    const rows = await fsQuery("ph_intelligence", "status", "live", 60);
    if (!rows.length) return null;
    return (rows as unknown as PHItem[]).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";

  if (!forceRefresh) {
    const live = await readLiveFromFirestore();
    if (live && live.length > 0) {
      return NextResponse.json({ refreshedAt: new Date().toISOString(), items: live, sources: ["Firestore (admin-approved)"], errors: [], fromCache: true, fromFirestore: true });
    }
  }

  const cache = readJsonCache();
  const ageH  = cacheAgeHours(cache.refreshedAt);
  if (!forceRefresh && ageH < TTL_HOURS && cache.items.length > 0) {
    return NextResponse.json({ ...cache, fromCache: true, cacheAgeHours: Math.round(ageH * 10) / 10 });
  }

  try {
    const { collectPHIntelligence } = await import("@/lib/phIntelligence");
    const result  = await collectPHIntelligence();
    await saveToFirestore(result.items);
    const payload = { refreshedAt: new Date().toISOString(), items: result.items, sources: result.sources, errors: result.errors };
    writeJsonCache(payload);
    return NextResponse.json({ ...payload, fromCache: false, cacheAgeHours: 0 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ...cache, fromCache: true, fetchError: msg }, { status: 200 });
  }
}
