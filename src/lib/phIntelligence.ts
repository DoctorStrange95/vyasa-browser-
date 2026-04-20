/**
 * Public Health Intelligence Engine
 * Collects, extracts, and structures health alerts from:
 *   1. PIB (Press Information Bureau) RSS — official govt press releases
 *   2. MoHFW press releases page
 *   3. NHP disease surveillance page
 *   4. data.gov.in IDSP datasets (disease burden, outbreaks)
 *   5. NCDC / IDSP weekly bulletins
 */

const GOV_KEY = process.env.DATA_GOV_IN_API_KEY!;
const BASE    = "https://api.data.gov.in/resource";

// ── Disease keyword dictionary ───────────────────────────────────────────────
const DISEASE_DICT: Record<string, string> = {
  dengue:        "Dengue",      malaria:       "Malaria",
  typhoid:       "Typhoid",     cholera:       "Cholera",
  covid:         "COVID-19",    coronavirus:   "COVID-19",
  "sars-cov":    "COVID-19",    nipah:         "Nipah",
  influenza:     "Influenza",   "h3n2":        "H3N2 Influenza",
  "h1n1":        "H1N1 Influenza", "swine flu":"H1N1 Influenza",
  "bird flu":    "Avian Influenza","avian":     "Avian Influenza",
  measles:       "Measles",     polio:         "Polio",
  tuberculosis:  "TB",          " tb ":        "TB",
  "hiv/aids":    "HIV/AIDS",    hiv:           "HIV",
  hepatitis:     "Hepatitis",   rabies:        "Rabies",
  leptospirosis: "Leptospirosis","scrub typhus":"Scrub Typhus",
  "japanese encephalitis": "Japanese Encephalitis",
  "j.e.":        "Japanese Encephalitis",
  chikungunya:   "Chikungunya", zika:          "Zika",
  monkeypox:     "Mpox",        plague:        "Plague",
  anthrax:       "Anthrax",     diphtheria:    "Diphtheria",
  pertussis:     "Whooping Cough",
  "kyasanur":    "KFD",         "kfd":         "KFD",
  "acute encephalitis": "AES",  "aes":         "AES",
  "acute diarrhoeal":   "ADD",  "acute diarrheal": "ADD",
  "viral fever": "Viral Fever", pneumonia:     "Pneumonia",
  meningitis:    "Meningitis",  encephalitis:  "Encephalitis",
  "hand foot":   "Hand Foot Mouth Disease",
};

// National health program keywords
const PROGRAM_DICT: Record<string, string> = {
  "ayushman bharat": "Ayushman Bharat PMJAY",
  pmjay:           "PMJAY",
  "national health mission": "NHM",
  nhm:             "NHM",
  "tb elimination": "TB Elimination Mission",
  nikshay:         "Nikshay TB Program",
  "pulse polio":   "Pulse Polio",
  "polio":         "Polio Immunization",
  "immunization":  "Universal Immunization Programme",
  "vaccination drive": "Vaccination Drive",
  "janani suraksha": "Janani Suraksha Yojana",
  "jssk":          "JSSK",
  "poshan abhiyaan": "POSHAN Abhiyaan",
  "anemia mukt":   "Anaemia Mukt Bharat",
  "mission indradhanush": "Mission Indradhanush",
  "health mission": "National Health Mission",
  "rch":           "Reproductive & Child Health Program",
  "pmay":          "PMAY",
  "swachh bharat": "Swachh Bharat Mission",
  "jal jeevan":    "Jal Jeevan Mission",
};

// State name → normalized form
const INDIA_STATES: string[] = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu and Kashmir","Ladakh","Chandigarh","Puducherry",
  "Andaman and Nicobar","Dadra and Nagar Haveli","Lakshadweep",
];

export interface PHIntelligenceItem {
  type:       "Outbreak" | "Program" | "Policy" | "Infrastructure";
  title:      string;
  disease?:   string;
  program?:   string;
  location: { state: string; district: string; village: string };
  summary:    string;
  cases:      string;
  deaths:     string;
  date:       string;
  source:     string;
  sourceUrl?: string;
  confidence: "High" | "Medium" | "Low";
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}

function detectDisease(text: string): string {
  const lower = ` ${text.toLowerCase()} `;
  for (const [kw, name] of Object.entries(DISEASE_DICT)) {
    if (lower.includes(kw)) return name;
  }
  return "";
}

function detectProgram(text: string): string {
  const lower = text.toLowerCase();
  for (const [kw, name] of Object.entries(PROGRAM_DICT)) {
    if (lower.includes(kw)) return name;
  }
  return "";
}

function detectState(text: string): string {
  for (const state of INDIA_STATES) {
    if (text.toLowerCase().includes(state.toLowerCase())) return state;
  }
  return "";
}

function extractNumber(text: string, patterns: string[]): string {
  const lower = text.toLowerCase();
  for (const pat of patterns) {
    const idx = lower.indexOf(pat);
    if (idx === -1) continue;
    const segment = lower.slice(Math.max(0, idx - 60), idx + 60);
    const m = segment.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:cases?|deaths?|patients?|persons?|people|infected|confirmed|positive)/i)
           || segment.match(/(\d[\d,]*)\s+(?:new|total|reported|fresh)/i);
    if (m) return m[1].replace(/,/g, "");
  }
  return "";
}

function classifyType(text: string, disease: string, program: string): PHIntelligenceItem["type"] {
  const lower = text.toLowerCase();
  if (disease) return "Outbreak";
  if (program) return "Program";
  if (/policy|guideline|circular|notification|act|bill|budget|scheme launch|minister/.test(lower)) return "Policy";
  if (/hospital|clinic|centre|aiims|phc|chc|dispensary|facility|infrastructure|bed|equipment|ambulance/.test(lower)) return "Infrastructure";
  if (/mission|campaign|drive|program|programme|initiative|scheme|yojana/.test(lower)) return "Program";
  return "Policy";
}

function extractSummary(text: string, maxLen = 250): string {
  const clean = stripHtml(text);
  if (clean.length <= maxLen) return clean;
  const cut = clean.lastIndexOf(". ", maxLen);
  return cut > 80 ? clean.slice(0, cut + 1) : clean.slice(0, maxLen) + "…";
}

// ── Source 1: PIB RSS (Press Information Bureau — Ministry of Health) ────────
async function fetchPIBFeed(): Promise<PHIntelligenceItem[]> {
  const items: PHIntelligenceItem[] = [];
  try {
    // PIB health ministry RSS
    const res = await fetch(
      "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
      { headers: { "User-Agent": "HealthForIndia/1.0" }, next: { revalidate: 0 } }
    );
    if (!res.ok) return items;
    const xml = await res.text();

    const itemRE = /<item>([\s\S]*?)<\/item>/gi;
    let m: RegExpExecArray | null;
    while ((m = itemRE.exec(xml)) !== null) {
      const block = m[1];
      const title   = stripHtml(block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ?? block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const desc    = stripHtml(block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ?? block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "");
      const link    = (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "").trim();
      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";

      if (!title) continue;
      const combined = `${title} ${desc}`;
      const disease  = detectDisease(combined);
      const program  = detectProgram(combined);
      if (!disease && !program && !/health|medical|hospital|vaccine|nutrition|sanitation/.test(combined.toLowerCase())) continue;

      const state  = detectState(combined);
      const type   = classifyType(combined, disease, program);
      const cases  = extractNumber(combined, ["cases", "patients", "infected", "positive", "confirmed"]);
      const deaths = extractNumber(combined, ["deaths", "died", "fatalities", "killed"]);

      items.push({
        type, title: title.slice(0, 120),
        disease: disease || undefined,
        program: program || undefined,
        location: { state, district: "", village: "" },
        summary: desc ? extractSummary(desc) : extractSummary(title),
        cases, deaths,
        date: pubDate ? new Date(pubDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        source: "PIB (Press Information Bureau)",
        sourceUrl: link || undefined,
        confidence: "High",
      });
    }
  } catch { /* silent */ }
  return items.slice(0, 20);
}

// ── Source 2: MoHFW website press releases ────────────────────────────────────
async function fetchMoHFWAlerts(): Promise<PHIntelligenceItem[]> {
  const items: PHIntelligenceItem[] = [];
  try {
    const res = await fetch(
      "https://www.mohfw.gov.in/",
      { headers: { "User-Agent": "HealthForIndia/1.0" }, next: { revalidate: 0 } }
    );
    if (!res.ok) return items;
    const html = await res.text();

    // Extract news/alert headlines from MoHFW homepage
    const newsRE = /<li[^>]*class="[^"]*(?:news|alert|update|notice)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    const linkRE = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

    const headlines: { text: string; link: string }[] = [];
    let m: RegExpExecArray | null;

    // Try to find news links
    while ((m = linkRE.exec(html)) !== null) {
      const text = stripHtml(m[2]);
      const href = m[1];
      if (text.length < 20 || text.length > 300) continue;
      if (/health|disease|outbreak|vaccine|program|mission|scheme/.test(text.toLowerCase())) {
        headlines.push({ text, link: href.startsWith("http") ? href : `https://www.mohfw.gov.in${href}` });
      }
    }

    for (const h of headlines.slice(0, 10)) {
      const disease = detectDisease(h.text);
      const program = detectProgram(h.text);
      const state   = detectState(h.text);
      const type    = classifyType(h.text, disease, program);
      items.push({
        type, title: h.text.slice(0, 120),
        disease: disease || undefined,
        program: program || undefined,
        location: { state, district: "", village: "" },
        summary: h.text,
        cases: "", deaths: "",
        date: new Date().toISOString().split("T")[0],
        source: "MoHFW (Ministry of Health)",
        sourceUrl: h.link,
        confidence: "High",
      });
    }
  } catch { /* silent */ }
  return items;
}

// ── Source 3: data.gov.in IDSP disease surveillance ─────────────────────────
async function fetchDataGovIDSP(): Promise<PHIntelligenceItem[]> {
  const items: PHIntelligenceItem[] = [];
  const resources = [
    { id: "9ef84268-d588-465a-a308-a864a43d0070", label: "IDSP Weekly" },
    { id: "2b4e3be5-18c0-4a95-98f6-57c4285ea9aa", label: "IDSP Annual" },
  ];
  for (const { id, label } of resources) {
    try {
      const url = `${BASE}/${id}?api-key=${GOV_KEY}&format=json&limit=30`;
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) continue;
      const data = await res.json();
      const records: Record<string, string>[] = data.records ?? [];
      if (!records.length) continue;

      for (const r of records.slice(0, 15)) {
        const disease = r.disease ?? r.disease_name ?? r.name ?? "";
        const state   = r.state ?? r.state_ut ?? r.state_name ?? "";
        const cases   = String(r.cases ?? r.total_cases ?? r.human_cases ?? "");
        const deaths  = String(r.deaths ?? r.total_deaths ?? r.human_deaths ?? "");
        const year    = r.year ?? r.report_year ?? "";
        if (!disease || !state) continue;

        const normalizedDisease = detectDisease(disease) || disease;
        const casesNum  = parseInt(cases) || 0;
        const deathsNum = parseInt(deaths) || 0;

        items.push({
          type: "Outbreak",
          title: `${normalizedDisease} surveillance report — ${state}`,
          disease: normalizedDisease,
          location: { state, district: r.district ?? "", village: "" },
          summary: `IDSP surveillance: ${casesNum.toLocaleString()} cases${deathsNum > 0 ? `, ${deathsNum} deaths` : ""} of ${normalizedDisease} reported in ${state}${year ? ` (${year})` : ""}.`,
          cases: casesNum > 0 ? String(casesNum) : "",
          deaths: deathsNum > 0 ? String(deathsNum) : "",
          date: year ? `${year}-01-01` : new Date().toISOString().split("T")[0],
          source: `IDSP / data.gov.in (${label})`,
          confidence: "High",
        });
      }
      if (items.length) break;
    } catch { continue; }
  }
  return items;
}

// ── Source 4: NHP disease surveillance / NCDC alerts ────────────────────────
async function fetchNHPAlerts(): Promise<PHIntelligenceItem[]> {
  const items: PHIntelligenceItem[] = [];
  const urls = [
    { url: "https://nhp.gov.in/disease-surveillance_pg.htm", src: "NHP Disease Surveillance" },
    { url: "https://nhp.gov.in/healthnotification_pg.htm",   src: "NHP Health Notification" },
  ];
  for (const { url, src } of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "HealthForIndia/1.0" }, next: { revalidate: 0 } });
      if (!res.ok) continue;
      const html = await res.text();

      // Extract table rows or list items containing disease info
      const rowRE = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const cellRE = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let m: RegExpExecArray | null;
      let rowIdx = 0;

      while ((m = rowRE.exec(html)) !== null) {
        rowIdx++;
        if (rowIdx < 2) continue;
        const cells: string[] = [];
        let cm: RegExpExecArray | null;
        const cr = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        while ((cm = cr.exec(m[1])) !== null) {
          cells.push(stripHtml(cm[1]));
        }
        if (cells.length < 2) continue;
        const rowText = cells.join(" ");
        const disease = detectDisease(rowText);
        const state   = detectState(rowText);
        if (!disease && !state) continue;

        items.push({
          type: "Outbreak",
          title: `${disease || "Disease Alert"} — ${state || "India"}`,
          disease: disease || undefined,
          location: { state, district: cells[1] ?? "", village: "" },
          summary: rowText.slice(0, 240),
          cases:  cells.find(c => /^\d+$/.test(c.trim())) ?? "",
          deaths: "",
          date:   new Date().toISOString().split("T")[0],
          source: src,
          confidence: "Medium",
        });
        if (items.length >= 8) break;
      }
      if (items.length) break;
    } catch { continue; }
  }
  return items;
}

// ── Deduplication ─────────────────────────────────────────────────────────────
function dedup(items: PHIntelligenceItem[]): PHIntelligenceItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.disease ?? item.program ?? ""}::${item.location.state}::${item.title.slice(0, 40).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Master collection ─────────────────────────────────────────────────────────
export async function collectPHIntelligence(): Promise<{
  items: PHIntelligenceItem[];
  sources: string[];
  errors: string[];
  refreshedAt: string;
}> {
  const errors: string[] = [];
  const sources: string[] = [];

  const [pib, mohfw, idsp, nhp] = await Promise.allSettled([
    fetchPIBFeed(),
    fetchMoHFWAlerts(),
    fetchDataGovIDSP(),
    fetchNHPAlerts(),
  ]);

  const all: PHIntelligenceItem[] = [];

  if (pib.status === "fulfilled")   { all.push(...pib.value);   if (pib.value.length)   sources.push(`PIB (${pib.value.length} items)`); }
  else errors.push(`PIB: ${pib.reason}`);

  if (mohfw.status === "fulfilled") { all.push(...mohfw.value); if (mohfw.value.length) sources.push(`MoHFW (${mohfw.value.length} items)`); }
  else errors.push(`MoHFW: ${mohfw.reason}`);

  if (idsp.status === "fulfilled")  { all.push(...idsp.value);  if (idsp.value.length)  sources.push(`IDSP data.gov.in (${idsp.value.length} items)`); }
  else errors.push(`IDSP: ${idsp.reason}`);

  if (nhp.status === "fulfilled")   { all.push(...nhp.value);   if (nhp.value.length)   sources.push(`NHP (${nhp.value.length} items)`); }
  else errors.push(`NHP: ${nhp.reason}`);

  // Sort: High confidence first, then Outbreaks, then by date desc
  const sorted = dedup(all).sort((a, b) => {
    const confScore = { High: 3, Medium: 2, Low: 1 };
    const typeScore = { Outbreak: 4, Program: 3, Policy: 2, Infrastructure: 1 };
    const cs = confScore[b.confidence] - confScore[a.confidence];
    if (cs !== 0) return cs;
    const ts = typeScore[b.type] - typeScore[a.type];
    if (ts !== 0) return ts;
    return b.date.localeCompare(a.date);
  });

  return {
    items: sorted.slice(0, 60),
    sources,
    errors,
    refreshedAt: new Date().toISOString(),
  };
}
