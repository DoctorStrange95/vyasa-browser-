import { NextResponse } from "next/server";
import { fsGet, fsSet } from "@/lib/firestore";
import { fetchAndParseIDSPPdf } from "@/lib/idspPDFParser";
import type { IDSPParsedReport } from "@/lib/idspPDFParser";

const IDSP_LISTING = "https://idsp.mohfw.gov.in/index4.php?lang=1&level=0&linkid=406&lid=3689";
const CACHE_COL    = "idsp_weekly";
const CACHE_ID     = "latest";
const TTL_HOURS    = 24 * 7; // refresh weekly

export interface IDSPWeeklyMeta extends IDSPParsedReport {
  pdfUrl:    string;
  fetchedAt: string;
  fromCache?: boolean;
  stale?: boolean;
}

function cacheAge(ts: string): number {
  return (Date.now() - new Date(ts).getTime()) / 3_600_000;
}

async function scrapeLatestPdfUrl(): Promise<string> {
  const html = await fetch(IDSP_LISTING, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; VyasaHealth/1.0)" },
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 0 },
  }).then(r => r.text());

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

  const uniq = [...new Set(pdfs)];
  const weekly = uniq.filter(u => /wk|week|outbr|weekly/i.test(u));
  const candidates = weekly.length ? weekly : uniq;

  candidates.sort((a, b) => {
    const ya = parseInt(a.match(/20(\d{2})/)?.[1] ?? "0");
    const yb = parseInt(b.match(/20(\d{2})/)?.[1] ?? "0");
    if (ya !== yb) return yb - ya;
    const wa = parseInt(a.match(/(\d+)th_wk|(\d+)wk|week(\d+)/i)?.[1] ?? "0");
    const wb = parseInt(b.match(/(\d+)th_wk|(\d+)wk|week(\d+)/i)?.[1] ?? "0");
    return wb - wa;
  });

  return candidates[0] ?? "";
}

export async function GET() {
  // Serve Firestore cache if fresh
  const cached = await fsGet(CACHE_COL, CACHE_ID) as IDSPWeeklyMeta | null;
  if (cached?.fetchedAt && cacheAge(cached.fetchedAt) < TTL_HOURS && cached.pdfUrl) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const pdfUrl = await scrapeLatestPdfUrl();
    if (!pdfUrl) throw new Error("No PDF URL found on IDSP listing page");

    const parsed = await fetchAndParseIDSPPdf(pdfUrl);
    if (!parsed) throw new Error("PDF parse returned null");

    const fresh: IDSPWeeklyMeta = {
      ...parsed,
      pdfUrl,
      fetchedAt: new Date().toISOString(),
    };

    await fsSet(CACHE_COL, CACHE_ID, fresh as unknown as Record<string, unknown>);
    return NextResponse.json({ ...fresh, fromCache: false });
  } catch (err) {
    if (cached?.pdfUrl) return NextResponse.json({ ...cached, fromCache: true, stale: true });
    return NextResponse.json({
      week: 0, year: new Date().getFullYear(), dateRange: "", pdfUrl: IDSP_LISTING,
      reportingStates: 18, totalOutbreaks: 0, outbreaks: [],
      fetchedAt: new Date().toISOString(), error: String(err), fromCache: false,
    });
  }
}
