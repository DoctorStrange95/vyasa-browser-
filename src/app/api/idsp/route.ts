import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { refreshAllHealthData } from "@/lib/idsp";

const CACHE     = path.join(process.cwd(), "src/data/idsp-cache.json");
const CACHE_TMP = "/tmp/idsp-cache.json";
const TTL_MS    = 48 * 3600 * 1000;

async function readCache(): Promise<string> {
  try { return await readFile(CACHE_TMP, "utf-8"); } catch { /* no tmp */ }
  return readFile(CACHE, "utf-8");
}

async function writeCache(data: unknown) {
  const s = JSON.stringify(data, null, 2);
  try { await writeFile(CACHE, s); } catch { await writeFile(CACHE_TMP, s); }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "1";

  try {
    const cached = JSON.parse(await readCache());
    const age = cached.refreshedAt ? Date.now() - new Date(cached.refreshedAt).getTime() : Infinity;
    if (!forceRefresh && age < TTL_MS) {
      return NextResponse.json({ ...cached, fromCache: true, cacheAgeHours: Math.round(age / 3600000) });
    }
  } catch { /* no cache yet */ }

  const data = await refreshAllHealthData();
  await writeCache(data).catch(() => { /* silent on write failure */ });

  return NextResponse.json({ ...data, fromCache: false });
}
