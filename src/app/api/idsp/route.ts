import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { refreshAllHealthData } from "@/lib/idsp";

const CACHE = path.join(process.cwd(), "src/data/idsp-cache.json");
const TTL_MS = 48 * 3600 * 1000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "1";

  try {
    const cached = JSON.parse(await readFile(CACHE, "utf-8"));
    const age = cached.refreshedAt ? Date.now() - new Date(cached.refreshedAt).getTime() : Infinity;
    if (!forceRefresh && age < TTL_MS) {
      return NextResponse.json({ ...cached, fromCache: true, cacheAgeHours: Math.round(age / 3600000) });
    }
  } catch { /* no cache yet */ }

  const data = await refreshAllHealthData();
  try {
    await writeFile(CACHE, JSON.stringify(data, null, 2));
  } catch { /* write may fail in serverless — that's ok */ }

  return NextResponse.json({ ...data, fromCache: false });
}
