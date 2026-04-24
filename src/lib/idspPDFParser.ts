/**
 * Parses IDSP Weekly Outbreak Report PDFs into structured data.
 * Handles PDF text extraction quirks: word-wrap splits, multi-line cells.
 */

export interface IDSPOutbreak {
  uid: string;
  state: string;
  district: string;
  disease: string;
  cases: number;
  deaths: number;
  startDate: string;
  reportDate: string;
  status: string;
  week: number;
  year: number;
}

export interface IDSPParsedReport {
  week: number;
  year: number;
  dateRange: string;
  reportingStates: number;
  totalOutbreaks: number;
  outbreaks: IDSPOutbreak[];
}

// ── Known disease names (longest first so multi-word match first) ──────────────
const DISEASES = [
  "Acute Diarrhoeal Disease",
  "Acute Diarrheal Disease",
  "Acute Encephalitis Syndrome",
  "Acute Flaccid Paralysis",
  "Acute Gastroenteritis",
  "Acute Hepatitis",
  "Japanese Encephalitis",
  "Suspected Food Poisoning",
  "Suspected Typhoid",
  "Scrub Typhus",
  "Food Poisoning",
  "Hepatitis A",
  "Hepatitis B",
  "Hepatitis E",
  "Leptospirosis",
  "Chikungunya",
  "Chickenpox",
  "Cholera",
  "Dengue",
  "Malaria",
  "Measles",
  "Mpox",
  "Mumps",
  "Typhoid",
  "Fever",
];

// ── Known Indian state name variants ─────────────────────────────────────────
const STATE_NAMES = [
  "Andaman and Nicobar Islands",
  "Andaman Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli",
  "Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jammu Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
].sort((a, b) => b.length - a.length); // longest first for greedy match

/** Fix word-wrap breaks in PDF text, then normalize whitespace. */
function normalizeChunk(raw: string): string {
  return raw
    .replace(/([a-zA-Z])\n([a-zA-Z])/g, "$1$2") // join split words
    .replace(/([a-zA-Z])\n([a-zA-Z])/g, "$1$2") // second pass for edge cases
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract state name from the front of a text chunk. */
function extractState(text: string): { state: string; rest: string } {
  for (const name of STATE_NAMES) {
    if (text.toLowerCase().startsWith(name.toLowerCase())) {
      return { state: name, rest: text.slice(name.length).trim() };
    }
  }
  // Fallback: take first 1–3 words as state
  const words = text.split(" ");
  const guessLen = words[1]?.match(/^[A-Z]/) ? 2 : 1;
  return { state: words.slice(0, guessLen).join(" "), rest: words.slice(guessLen).join(" ") };
}

/** Find first matching disease name in the text. */
function extractDisease(text: string): { disease: string; before: string; after: string } | null {
  for (const d of DISEASES) {
    const idx = text.toLowerCase().indexOf(d.toLowerCase());
    if (idx !== -1) {
      return {
        disease: d,
        before: text.slice(0, idx).trim(),
        after: text.slice(idx + d.length).trim(),
      };
    }
  }
  return null;
}

/** Parse the week-10 style number from header text. */
function parseWeekFromText(text: string): number {
  const m = text.match(/(\d{1,2})(?:st|nd|rd|th)\s+[Ww]eek/);
  if (m) return parseInt(m[1]);
  const m2 = text.match(/[Ww]eek\s+(\d{1,2})/);
  if (m2) return parseInt(m2[1]);
  return 0;
}

/** Main parser. */
export function parseIDSPReport(rawText: string): IDSPParsedReport {
  // ── Header meta ─────────────────────────────────────────────────────────
  const weekMatch = rawText.match(/(\d{1,2})(?:st|nd|rd|th)\s+[Ww]eek\s+(\d{4})/);
  const week = weekMatch ? parseInt(weekMatch[1]) : parseWeekFromText(rawText);
  const year = weekMatch ? parseInt(weekMatch[2]) : new Date().getFullYear();

  // Date range: "2nd March 2026 to 8th March 2026"
  const drm = rawText.match(
    /(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})\s+to\s+(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})/i
  );
  const dateRange = drm ? `${drm[1]} – ${drm[2]}` : `Week ${week}, ${year}`;

  // Reporting states count
  const rsm = rawText.match(/Submitted outbreak report[^0-9]*(\d{1,2})/);
  const reportingStates = rsm ? parseInt(rsm[1]) : 18;

  // ── Parse individual outbreaks by Unique ID anchors ──────────────────────
  const UID_RE = /\b([A-Z]{2}\/[A-Z]{2,6}\/\d{4}\/\d{1,2}\/\d{3,4})\b/g;
  const matches: { uid: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = UID_RE.exec(rawText)) !== null) {
    matches.push({ uid: m[1], index: m.index });
  }

  const outbreaks: IDSPOutbreak[] = [];

  for (let i = 0; i < matches.length; i++) {
    const { uid, index } = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
    const chunk = normalizeChunk(rawText.slice(index + uid.length, end));

    // Extract disease
    const dis = extractDisease(chunk);
    if (!dis) continue;

    // State + district from text before disease
    const { state, rest: districtRaw } = extractState(dis.before);
    const district = districtRaw.replace(/^[,\s]+/, "").trim();

    // Cases + deaths from text after disease (first two numbers)
    const numMatch = dis.after.match(/(\d+)\s+(\d+)/);
    const cases  = numMatch ? parseInt(numMatch[1]) : 0;
    const deaths = numMatch ? parseInt(numMatch[2]) : 0;

    // Dates: DD-MM-YYYY
    const dates = [...dis.after.matchAll(/(\d{2}-\d{2}-\d{4})/g)].map(x => x[1]);
    const startDate  = dates[0] ?? "";
    const reportDate = dates[1] ?? dates[0] ?? "";

    // Status
    const statusM = dis.after.match(/(Under Surveillance|Under Investigation|Ongoing|Closed|Active)/i);
    const status = statusM ? statusM[1] : "Under Surveillance";

    // Week/year from UID (e.g. AP/EAS/2026/10/371)
    const uidParts = uid.split("/");
    const uidYear = parseInt(uidParts[2] ?? String(year));
    const uidWeek = parseInt(uidParts[3] ?? String(week));

    outbreaks.push({ uid, state, district, disease: dis.disease, cases, deaths, startDate, reportDate, status, week: uidWeek, year: uidYear });
  }

  return { week, year, dateRange, reportingStates, totalOutbreaks: outbreaks.length, outbreaks };
}

/** Fetch a PDF buffer and parse it. Requires pdf-parse@1.1.1. */
export async function fetchAndParseIDSPPdf(pdfUrl: string): Promise<IDSPParsedReport | null> {
  try {
    const resp = await fetch(pdfUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VyasaHealth/1.0)" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    // Dynamic import to avoid edge-runtime issues
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buf);
    return parseIDSPReport(parsed.text);
  } catch (e) {
    console.error("IDSP PDF parse error:", e);
    return null;
  }
}
