import { NextResponse } from "next/server";
import { fsGet, fsSet } from "@/lib/firestore";
import { fetchAndParseIDSPPdf } from "@/lib/idspPDFParser";
import type { IDSPParsedReport } from "@/lib/idspPDFParser";

const IDSP_LISTING = "https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3689";
const CACHE_COL    = "idsp_weekly";
const CACHE_ID     = "latest_v3";  // bumped to bust stale 2016 cache
const TTL_HOURS    = 24 * 7;

export interface IDSPWeeklyMeta extends IDSPParsedReport {
  pdfUrl:    string;
  fetchedAt: string;
  fromCache?: boolean;
  stale?: boolean;
}

function cacheAge(ts: string): number {
  return (Date.now() - new Date(ts).getTime()) / 3_600_000;
}

/** Pick the PDF with the highest week for the most recent year using <a title="Nth week of YYYY"> */
async function scrapeLatestPdfUrl(): Promise<{ url: string; week: number; year: number }> {
  const html = await fetch(IDSP_LISTING, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; VyasaHealth/1.0)" },
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 0 },
  }).then(r => r.text());

  // Each link has title="Nth week of YYYY" or "Nth Week of YYYY"
  const re = /<a[^>]*title="(\d{1,2})(?:st|nd|rd|th)\s+[Ww]eek\s+of\s+(\d{4})"[^>]*href="([^"]+\.pdf)"[^>]*>/gi;
  const entries: { week: number; year: number; url: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    entries.push({ week: parseInt(m[1]), year: parseInt(m[2]), url: m[3] });
  }

  if (entries.length === 0) throw new Error("No titled PDF links found on IDSP listing page");

  // Sort: highest year first, then highest week
  entries.sort((a, b) => b.year - a.year || b.week - a.week);
  const best = entries[0];
  const url = best.url.startsWith("http") ? best.url : `https://idsp.mohfw.gov.in${best.url}`;
  return { url, week: best.week, year: best.year };
}

export async function GET(req: Request) {
  const force = new URL(req.url).searchParams.get("force") === "1";

  // Serve Firestore cache if fresh
  if (!force) {
    const cached = await fsGet(CACHE_COL, CACHE_ID) as IDSPWeeklyMeta | null;
    if (cached?.fetchedAt && cacheAge(cached.fetchedAt) < TTL_HOURS && cached.pdfUrl && (cached.outbreaks?.length ?? 0) > 0) {
      return NextResponse.json({ ...cached, fromCache: true });
    }
  }

  try {
    const { url: pdfUrl, week: scraped_week, year: scraped_year } = await scrapeLatestPdfUrl();

    const parsed = await fetchAndParseIDSPPdf(pdfUrl);
    if (!parsed) throw new Error("PDF parse returned null");

    // Prefer meta from PDF itself; fall back to scraped values
    const fresh: IDSPWeeklyMeta = {
      ...parsed,
      week:  parsed.week  || scraped_week,
      year:  parsed.year  || scraped_year,
      pdfUrl,
      fetchedAt: new Date().toISOString(),
    };

    await fsSet(CACHE_COL, CACHE_ID, fresh as unknown as Record<string, unknown>);
    return NextResponse.json({ ...fresh, fromCache: false });
  } catch (err) {
    const cached = await fsGet(CACHE_COL, CACHE_ID) as IDSPWeeklyMeta | null;
    if (cached?.pdfUrl) return NextResponse.json({ ...cached, fromCache: true, stale: true });
    return NextResponse.json({
      week: 0, year: new Date().getFullYear(), dateRange: "", pdfUrl: IDSP_LISTING,
      reportingStates: 18, totalOutbreaks: 0, outbreaks: [],
      fetchedAt: new Date().toISOString(), error: String(err), fromCache: false,
    });
  }
}
