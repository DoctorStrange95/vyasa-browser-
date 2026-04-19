/**
 * Daily refresh cron job — runs every 24 hours via Vercel Cron.
 * Fetches latest data from:
 *   1. CPCB AQI (all 213 cities)
 *   2. NHP PHC/CHC counts
 *   3. SRS bulletin check (data.gov.in)
 * Stores results in Next.js revalidation cache by calling on-demand ISR.
 */

import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Verify secret so only Vercel Cron (or you) can call this
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];
  const start = Date.now();

  try {
    // 1. Revalidate national ticker
    revalidatePath("/api/national-ticker");
    log.push("✓ Revalidated national ticker");

    // 2. Revalidate all district pages (triggers fresh CPCB + Google AQI fetch)
    revalidatePath("/district/[slug]", "page");
    log.push("✓ Queued district pages revalidation (AQI refresh)");

    // 3. Revalidate all state pages (triggers fresh PHC/CHC fetch)
    revalidatePath("/state/[slug]", "page");
    log.push("✓ Queued state pages revalidation (PHC/CHC refresh)");

    // 4. Revalidate home page
    revalidatePath("/");
    log.push("✓ Revalidated home page");

    // 5. Check data.gov.in for latest SRS data availability
    const srsCheck = await checkSRSUpdate();
    log.push(srsCheck);

    const elapsed = Date.now() - start;
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsed,
      log,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), log }, { status: 500 });
  }
}

async function checkSRSUpdate(): Promise<string> {
  try {
    // Poll data.gov.in SRS resource for latest publication date
    const res = await fetch(
      "https://api.data.gov.in/resource/7c568619-b9b4-40bb-b563-68c28c27a6c1?api-key=" +
        process.env.DATA_GOV_IN_API_KEY +
        "&format=json&limit=1",
      { next: { revalidate: 0 } } // no cache — we want fresh
    );
    if (!res.ok) return `⚠ SRS check failed: ${res.status}`;
    const data = await res.json();
    const updated = data?.updated ?? data?.last_updated ?? "unknown";
    return `✓ SRS/NFHS data.gov.in last updated: ${updated}`;
  } catch {
    return "⚠ Could not reach data.gov.in for SRS update check";
  }
}
