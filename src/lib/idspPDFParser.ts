/**
 * Parses IDSP Weekly Outbreak Report PDFs into structured data.
 * Primary: Groq LLM (llama-3.3-70b) for reliable extraction.
 * Fallback: regex parsing.
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

// ── Groq-based parser ─────────────────────────────────────────────────────────

async function parseWithGroq(text: string, week: number, year: number): Promise<IDSPOutbreak[] | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // Send only the outbreak detail pages (skip charts/graphs at top, ~2500 chars)
  const startIdx = text.indexOf("Unique ID");
  const relevant = startIdx > 0 ? text.slice(startIdx) : text;
  // Groq context limit: send up to 28,000 chars
  const snippet = relevant.slice(0, 28000);

  const prompt = `Extract all disease outbreak records from this IDSP Weekly Outbreak Report text.
Return ONLY a valid JSON array. Each element must have these exact fields:
- uid: the unique ID string (format like AP/EAS/2026/10/371)
- state: full state name
- district: district name
- disease: disease name exactly as written
- cases: integer number of cases
- deaths: integer number of deaths
- startDate: start date as DD-MM-YYYY string
- status: current status (e.g. "Under Surveillance")

Return [] if no outbreaks found. No markdown, no explanation, just the JSON array.

TEXT:
${snippet}`;

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 8000,
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!resp.ok) {
      console.error("Groq API error:", resp.status, await resp.text());
      return null;
    }
    const json = await resp.json() as { choices: { message: { content: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    // Extract JSON array from response
    const arrStart = raw.indexOf("[");
    const arrEnd = raw.lastIndexOf("]");
    if (arrStart === -1 || arrEnd === -1) return null;
    const arr = JSON.parse(raw.slice(arrStart, arrEnd + 1)) as IDSPOutbreak[];
    return arr.map(o => ({
      ...o,
      cases:  Number(o.cases)  || 0,
      deaths: Number(o.deaths) || 0,
      week:   week,
      year:   year,
      reportDate: o.reportDate ?? o.startDate ?? "",
    }));
  } catch (e) {
    console.error("Groq parse error:", e);
    return null;
  }
}

// ── Regex-based fallback parser ───────────────────────────────────────────────

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
].sort((a, b) => b.length - a.length);

function normalizeChunk(raw: string): string {
  return raw
    .replace(/([a-zA-Z])\n([a-zA-Z])/g, "$1$2")
    .replace(/([a-zA-Z])\n([a-zA-Z])/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function extractState(text: string): { state: string; rest: string } {
  for (const name of STATE_NAMES) {
    if (text.toLowerCase().startsWith(name.toLowerCase())) {
      return { state: name, rest: text.slice(name.length).trim() };
    }
  }
  const words = text.split(" ");
  const guessLen = words[1]?.match(/^[A-Z]/) ? 2 : 1;
  return { state: words.slice(0, guessLen).join(" "), rest: words.slice(guessLen).join(" ") };
}

function extractDisease(text: string): { disease: string; before: string; after: string } | null {
  for (const d of DISEASES) {
    const idx = text.toLowerCase().indexOf(d.toLowerCase());
    if (idx !== -1) {
      return { disease: d, before: text.slice(0, idx).trim(), after: text.slice(idx + d.length).trim() };
    }
  }
  return null;
}

function regexParseOutbreaks(rawText: string, week: number, year: number): IDSPOutbreak[] {
  const UID_RE = /\b([A-Z]{2}\/[A-Z]{2,6}\/\d{4}\/\d{1,2}\/\d{3,4})\b/g;
  const matches: { uid: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = UID_RE.exec(rawText)) !== null) {
    matches.push({ uid: m[1], index: m.index });
  }

  return matches.map(({ uid, index }, i) => {
    const end = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
    const chunk = normalizeChunk(rawText.slice(index + uid.length, end));
    const dis = extractDisease(chunk);
    if (!dis) return null;

    const { state, rest: districtRaw } = extractState(dis.before);
    const district = districtRaw.replace(/^[,\s]+/, "").trim();
    const numMatch = dis.after.match(/(\d+)\s+(\d+)/);
    const cases  = numMatch ? parseInt(numMatch[1]) : 0;
    const deaths = numMatch ? parseInt(numMatch[2]) : 0;
    const dates = [...dis.after.matchAll(/(\d{2}-\d{2}-\d{4})/g)].map(x => x[1]);
    const startDate  = dates[0] ?? "";
    const reportDate = dates[1] ?? dates[0] ?? "";
    const statusM = dis.after.match(/(Under Surveillance|Under Investigation|Ongoing|Closed|Active)/i);
    const status = statusM ? statusM[1] : "Under Surveillance";
    const parts = uid.split("/");
    return {
      uid, state, district, disease: dis.disease, cases, deaths, startDate, reportDate, status,
      week: parseInt(parts[3] ?? String(week)),
      year: parseInt(parts[2] ?? String(year)),
    } as IDSPOutbreak;
  }).filter(Boolean) as IDSPOutbreak[];
}

// ── Meta extraction ───────────────────────────────────────────────────────────

function extractMeta(rawText: string): { week: number; year: number; dateRange: string; reportingStates: number } {
  const weekMatch = rawText.match(/(\d{1,2})(?:st|nd|rd|th)\s+[Ww]eek\s+(\d{4})/);
  const week = weekMatch ? parseInt(weekMatch[1]) : 0;
  const year = weekMatch ? parseInt(weekMatch[2]) : new Date().getFullYear();
  const drm  = rawText.match(/(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})\s+to\s+(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})/i);
  const dateRange = drm ? `${drm[1]} – ${drm[2]}` : `Week ${week}, ${year}`;
  const rsm = rawText.match(/Submitted outbreak report[^0-9]*(\d{1,2})/);
  const reportingStates = rsm ? parseInt(rsm[1]) : 18;
  return { week, year, dateRange, reportingStates };
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Fetch a PDF, extract text, parse with Groq (or regex fallback). */
export async function fetchAndParseIDSPPdf(pdfUrl: string): Promise<IDSPParsedReport | null> {
  try {
    const resp = await fetch(pdfUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VyasaHealth/1.0)" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    const pdfParse = (await import("pdf-parse")).default;
    const parsed   = await pdfParse(buf);
    const rawText  = parsed.text;

    const { week, year, dateRange, reportingStates } = extractMeta(rawText);

    // Try Groq first, fall back to regex
    let outbreaks = await parseWithGroq(rawText, week, year);
    if (!outbreaks || outbreaks.length === 0) {
      console.log("Groq unavailable or returned 0, using regex fallback");
      outbreaks = regexParseOutbreaks(rawText, week, year);
    }

    return { week, year, dateRange, reportingStates, totalOutbreaks: outbreaks.length, outbreaks };
  } catch (e) {
    console.error("IDSP PDF parse error:", e);
    return null;
  }
}
