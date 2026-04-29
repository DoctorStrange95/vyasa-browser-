import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fsGet, fsSet } from "@/lib/firestore";
import { adminList, getAdminDb } from "@/lib/firestore-admin";

// ── Constants ──────────────────────────────────────────────────────────────────
const CACHE_FILE   = path.join(process.cwd(), "src/data/ph-intelligence-cache.json");
const TTL_HOURS    = 24;
const FS_CACHE_COL = "ph_cache";
const FS_CACHE_ID  = "intelligence";

type PHItem = import("@/lib/phIntelligence").PHIntelligenceItem;

interface CacheDoc {
  refreshedAt: string;
  items:       PHItem[];
  sources:     string[];
  errors:      string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function cacheAgeHours(ts: string | null | undefined): number {
  if (!ts) return Infinity;
  return (Date.now() - new Date(ts).getTime()) / 3_600_000;
}

/** Read from Firestore — the authoritative live cache (survives Vercel deploys) */
async function readFsCache(): Promise<CacheDoc | null> {
  try {
    const doc = await fsGet(FS_CACHE_COL, FS_CACHE_ID);
    if (!doc?.refreshedAt) return null;
    return doc as unknown as CacheDoc;
  } catch { return null; }
}

/** Write to Firestore — called after every successful scrape */
async function writeFsCache(data: CacheDoc): Promise<void> {
  try {
    await fsSet(FS_CACHE_COL, FS_CACHE_ID, data as unknown as Record<string, unknown>);
  } catch { /* silent — app continues without cache write */ }
}

/** Fallback: static JSON file baked into the build (read-only on Vercel) */
function readJsonFallback(): CacheDoc {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); }
  catch { return { refreshedAt: "", items: [], sources: [], errors: [] }; }
}

/** Save new items to ph_intelligence Firestore collection for admin review (admin SDK) */
async function saveItemsForReview(items: PHItem[]): Promise<number> {
  try {
    // Skip any item already in Firestore (any status/age) to avoid resetting reviewed items
    const existing    = await adminList("ph_intelligence", 2000);
    const existingIds = new Set(existing.map(d => d._id));
    const db = getAdminDb();
    let saved = 0;

    await Promise.allSettled(
      items.slice(0, 80).map(async item => {
        try {
          const urlPart = item.sourceUrl ? item.sourceUrl.replace(/[^a-zA-Z0-9]/g, "").slice(-40) : item.title.slice(40, 80);
          const raw = `${item.type}::${item.disease ?? item.program ?? ""}::${item.location.state}::${item.title.slice(0, 40)}::${urlPart}`;
          const id  = Buffer.from(raw).toString("base64").replace(/[/+=]/g, "_").slice(0, 100);
          if (!existingIds.has(id)) {
            await db.collection("ph_intelligence").doc(id).set({
              ...(item as unknown as Record<string, unknown>),
              status:    "pending",
              scrapedAt: new Date().toISOString(),
            });
            saved++;
          }
        } catch { /* silent */ }
      })
    );
    return saved;
  } catch { return 0; }
}

// ── GET handler ────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";

  // 1 — Try Firestore cache (primary, persists across Vercel deploys)
  if (!forceRefresh) {
    const fsCache = await readFsCache();
    if (fsCache && cacheAgeHours(fsCache.refreshedAt) < TTL_HOURS && fsCache.items.length > 0) {
      return NextResponse.json({
        ...fsCache,
        fromCache:      true,
        fromFirestore:  true,
        cacheAgeHours:  Math.round(cacheAgeHours(fsCache.refreshedAt) * 10) / 10,
      });
    }
  }

  // 2 — Cache is stale / missing / forced — run a fresh scrape
  try {
    const { collectPHIntelligence } = await import("@/lib/phIntelligence");
    const result = await collectPHIntelligence();

    const payload: CacheDoc = {
      refreshedAt: new Date().toISOString(),
      items:       result.items,
      sources:     result.sources,
      errors:      result.errors,
    };

    // Persist to Firestore (works on Vercel; JSON write is best-effort local only)
    await writeFsCache(payload);
    saveItemsForReview(result.items); // fire-and-forget, not awaited

    return NextResponse.json({ ...payload, fromCache: false, cacheAgeHours: 0 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // 3 — On scrape failure: serve whatever we have (Firestore stale or JSON fallback)
    const stale = (await readFsCache()) ?? readJsonFallback();
    return NextResponse.json({
      ...stale,
      fromCache:   true,
      fetchError:  msg,
      cacheAgeHours: Math.round(cacheAgeHours(stale.refreshedAt) * 10) / 10,
    });
  }
}
