import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/firebase";

const CACHE_FILE = path.join(process.cwd(), "src/data/ph-intelligence-cache.json");
const TTL_HOURS  = 48;

function readJsonCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); }
  catch { return { refreshedAt: null, items: [], sources: [], errors: [] }; }
}
function writeJsonCache(data: object) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2)); } catch { /* read-only on Vercel */ }
}
function cacheAgeHours(refreshedAt: string | null): number {
  if (!refreshedAt) return Infinity;
  return (Date.now() - new Date(refreshedAt).getTime()) / 3_600_000;
}

// Save newly scraped items to Firestore as "pending" (skip existing docs)
async function saveToFirestore(items: import("@/lib/phIntelligence").PHIntelligenceItem[]) {
  const db = getDb();
  if (!db || !items.length) return;
  try {
    const batch = db.batch();
    let writes = 0;
    for (const item of items) {
      const raw  = `${item.type}::${item.disease ?? item.program ?? ""}::${item.location.state}::${item.title.slice(0, 40)}`;
      const docId = Buffer.from(raw).toString("base64").replace(/[/+=]/g, "_").slice(0, 100);
      const ref   = db.collection("ph_intelligence").doc(docId);
      const snap  = await ref.get();
      if (!snap.exists) {
        batch.set(ref, { ...item, status: "pending", scrapedAt: new Date().toISOString() });
        writes++;
      }
    }
    if (writes > 0) await batch.commit();
  } catch { /* silent — Firebase is optional */ }
}

// Read approved (live) items from Firestore
async function readLiveFromFirestore(): Promise<import("@/lib/phIntelligence").PHIntelligenceItem[] | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await db.collection("ph_intelligence")
      .where("status", "==", "live")
      .orderBy("date", "desc")
      .limit(60)
      .get();
    return snap.docs.map(d => d.data() as import("@/lib/phIntelligence").PHIntelligenceItem);
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";

  // 1. Try to serve live items from Firestore
  if (!forceRefresh) {
    const liveItems = await readLiveFromFirestore();
    if (liveItems !== null && liveItems.length > 0) {
      return NextResponse.json({
        refreshedAt: null,
        items: liveItems,
        sources: ["Firestore (approved items)"],
        errors: [],
        fromCache: true,
        fromFirestore: true,
      });
    }
  }

  // 2. Check JSON cache freshness (fallback for dev / pre-Firebase)
  const cache  = readJsonCache();
  const ageH   = cacheAgeHours(cache.refreshedAt);
  const stale  = ageH >= TTL_HOURS || cache.items.length === 0;

  if (!forceRefresh && !stale) {
    return NextResponse.json({ ...cache, fromCache: true, cacheAgeHours: Math.round(ageH * 10) / 10 });
  }

  // 3. Fetch fresh data
  try {
    const { collectPHIntelligence } = await import("@/lib/phIntelligence");
    const result = await collectPHIntelligence();

    // Save newly scraped items to Firestore as pending (admin must approve)
    await saveToFirestore(result.items);

    // Update JSON cache as fallback
    const payload = {
      refreshedAt: new Date().toISOString(),
      items:   result.items,
      sources: result.sources,
      errors:  result.errors,
    };
    writeJsonCache(payload);

    // Serve from JSON cache immediately (Firestore items need approval first)
    return NextResponse.json({ ...payload, fromCache: false, cacheAgeHours: 0 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ...cache, fromCache: true, cacheAgeHours: Math.round(ageH * 10) / 10, fetchError: msg },
      { status: 200 }
    );
  }
}
