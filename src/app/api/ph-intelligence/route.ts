import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/firebase";
import {
  collection, query, where, getDocs, doc, getDoc, setDoc, limit,
} from "firebase/firestore";

const CACHE_FILE = path.join(process.cwd(), "src/data/ph-intelligence-cache.json");
const TTL_HOURS  = 48;

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

// Stable doc ID from item content
function itemDocId(item: PHItem): string {
  const raw = `${item.type}::${item.disease ?? item.program ?? ""}::${item.location.state}::${item.title.slice(0, 40)}`;
  return Buffer.from(raw).toString("base64").replace(/[/+=]/g, "_").slice(0, 100);
}

// Save newly scraped items to Firestore as "pending" — skip existing docs
async function saveToFirestore(items: PHItem[]) {
  const db = getDb();
  if (!db || !items.length) return;
  try {
    const col = collection(db, "ph_intelligence");
    for (const item of items) {
      const docId = itemDocId(item);
      const ref   = doc(col, docId);
      const snap  = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...item, status: "pending", scrapedAt: new Date().toISOString() });
      }
    }
  } catch { /* Firebase is optional — silent */ }
}

// Read approved (live) items from Firestore
async function readLiveFromFirestore(): Promise<PHItem[] | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const q    = query(collection(db, "ph_intelligence"), where("status", "==", "live"), limit(60));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => d.data() as PHItem);
    return items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";

  // 1. Serve approved items from Firestore
  if (!forceRefresh) {
    const liveItems = await readLiveFromFirestore();
    if (liveItems !== null && liveItems.length > 0) {
      return NextResponse.json({
        refreshedAt: new Date().toISOString(),
        items: liveItems,
        sources: ["Firestore (admin-approved)"],
        errors: [],
        fromCache: true,
        fromFirestore: true,
      });
    }
  }

  // 2. Fall back to JSON cache if fresh
  const cache = readJsonCache();
  const ageH  = cacheAgeHours(cache.refreshedAt);
  if (!forceRefresh && ageH < TTL_HOURS && cache.items.length > 0) {
    return NextResponse.json({ ...cache, fromCache: true, cacheAgeHours: Math.round(ageH * 10) / 10 });
  }

  // 3. Fetch fresh data from sources
  try {
    const { collectPHIntelligence } = await import("@/lib/phIntelligence");
    const result  = await collectPHIntelligence();

    // Save new items to Firestore as pending (admin approves before going live)
    await saveToFirestore(result.items);

    const payload = {
      refreshedAt: new Date().toISOString(),
      items:   result.items,
      sources: result.sources,
      errors:  result.errors,
    };
    writeJsonCache(payload);

    return NextResponse.json({ ...payload, fromCache: false, cacheAgeHours: 0 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ...cache, fromCache: true, fetchError: msg }, { status: 200 });
  }
}
