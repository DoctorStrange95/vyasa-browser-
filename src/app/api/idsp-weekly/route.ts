import { NextResponse } from "next/server";
import { fsGet, fsSet } from "@/lib/firestore";

const IDSP_LISTING = "https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3689";
const CACHE_COL = "idsp_weekly";
const CACHE_ID  = "latest";
const TTL_HOURS = 24 * 7; // refresh weekly

export interface IDSPWeeklyMeta {
  week:      number;
  year:      number;
  dateRange: string;
  pdfUrl:    string;
  totalAlerts: number;
  reportingStates: number;
  fetchedAt: string;
}

function cacheAge(ts: string): number {
  return (Date.now() - new Date(ts).getTime()) / 3_600_000;
}

async function scrapeLatest(): Promise<IDSPWeeklyMeta> {
  const html = await fetch(IDSP_LISTING, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; VyasaHealth/1.0)" },
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 0 },
  }).then(r => r.text());

  // Collect all PDF hrefs — two common patterns on this site
  const pdfs: string[] = [];
  const re1 = /href=["']([^"']*\.pdf)["']/gi;
  const re2 = /["'](\/WriteReadData\/[^"']+\.pdf)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re1.exec(html)) !== null) {
    const raw = m[1];
    pdfs.push(raw.startsWith("http") ? raw : `https://idsp.mohfw.gov.in/${raw.replace(/^\//, "")}`);
  }
  while ((m = re2.exec(html)) !== null) {
    pdfs.push(`https://idsp.mohfw.gov.in${m[1]}`);
  }

  // Deduplicate and prefer weekly outbreak report PDFs
  const uniq = [...new Set(pdfs)];
  const weekly = uniq.filter(u => /wk|week|outbr|weekly/i.test(u));
  const candidates = weekly.length ? weekly : uniq;

  // Sort: prefer those with highest week number / most recent year
  candidates.sort((a, b) => {
    const ya = parseInt(a.match(/20(\d{2})/)?.[1] ?? "0");
    const yb = parseInt(b.match(/20(\d{2})/)?.[1] ?? "0");
    if (ya !== yb) return yb - ya;
    const wa = parseInt(a.match(/(\d+)th_wk|(\d+)wk|week(\d+)/i)?.[1] ?? "0");
    const wb = parseInt(b.match(/(\d+)th_wk|(\d+)wk|week(\d+)/i)?.[1] ?? "0");
    return wb - wa;
  });

  const pdfUrl = candidates[0] ?? "";

  // Extract week number from URL or fall back to current week of year
  const wm = pdfUrl.match(/(\d{1,2})th_wk|_w(\d{1,2})_|week[_\s]?(\d{1,2})/i);
  const week = wm ? parseInt(wm[1] ?? wm[2] ?? wm[3]) : Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604_800_000);
  const ym = pdfUrl.match(/20(\d{2})/);
  const year = ym ? 2000 + parseInt(ym[1]) : new Date().getFullYear();

  // Try to pull date range from page text near week number
  const drm = html.match(/(\d+(?:st|nd|rd|th)\s+\w+\s+\d{4})\s+to\s+(\d+(?:st|nd|rd|th)\s+\w+\s+\d{4})/i);
  const dateRange = drm ? `${drm[1]} – ${drm[2]}` : `Week ${week}, ${year}`;

  return {
    week,
    year,
    dateRange,
    pdfUrl,
    totalAlerts: 0,      // filled by component from ph-intelligence
    reportingStates: 18, // last known default from PDF
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET() {
  // Serve Firestore cache if fresh
  const cached = await fsGet(CACHE_COL, CACHE_ID) as IDSPWeeklyMeta | null;
  if (cached?.fetchedAt && cacheAge(cached.fetchedAt) < TTL_HOURS && cached.pdfUrl) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const fresh = await scrapeLatest();
    await fsSet(CACHE_COL, CACHE_ID, fresh as unknown as Record<string, unknown>);
    return NextResponse.json({ ...fresh, fromCache: false });
  } catch (err) {
    if (cached?.pdfUrl) return NextResponse.json({ ...cached, fromCache: true, stale: true });
    return NextResponse.json({
      week: 0, year: new Date().getFullYear(), dateRange: "",
      pdfUrl: "https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3689",
      totalAlerts: 0, reportingStates: 18, fetchedAt: new Date().toISOString(),
      error: String(err), fromCache: false,
    });
  }
}
