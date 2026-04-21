import { NextRequest } from "next/server";
import Groq from "groq-sdk";

// Strip HTML and clean extracted article text
function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .trim()
    .slice(0, 6000);
}

// Best-effort article fetch — returns empty string on any failure
async function fetchArticleText(url: string): Promise<string> {
  if (!url || url.startsWith("https://news.google.com")) return "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HealthForIndia/2.0; +https://healthforindia.in)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain") && !ct.includes("application/xhtml")) return "";
    const html = await res.text();
    return extractText(html);
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "GROQ_API_KEY not configured. Get a free key at https://console.groq.com and add it to .env.local.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const {
    title = "", summary = "", disease = "", program = "", source = "",
    sourceUrl = "", cases = "", deaths = "", location = {}, category = "",
    priority = "", date = "",
  } = body;

  const articleText = await fetchArticleText(sourceUrl);

  const state    = location.state    || "India";
  const district = location.district || "";
  const locationStr = [state, district, location.village].filter(Boolean).join(", ");

  const topic    = disease || program || title || "Not specified";
  const catNorm  = category.toLowerCase();
  const catLabel = catNorm === "ncd" ? "NCD"
                 : catNorm === "outbreak" || catNorm === "communicable" ? "OUTBREAK"
                 : catNorm === "program" || catNorm === "programme" ? "PROGRAM"
                 : catNorm === "policy" || catNorm === "guideline" ? "POLICY"
                 : "OUTBREAK";

  const articleBlock = articleText
    ? `\nARTICLE CONTENT (extracted):\n${articleText}`
    : `\nNote: Article content could not be fetched — use metadata only.`;

  /* ── Category-specific format blocks ─────────────────────────────── */
  const formatByCategory: Record<string, string> = {

    OUTBREAK: `FORMAT YOUR RESPONSE AS:
**${state}${district ? ", " + district : ""}** — ${topic} outbreak update

KEY FACTS:
- Confirmed cases: [number from source, or "Case count not disclosed in source"]
- Deaths: [number] | CFR: [calculate as (deaths/cases)×100 if both available]
- Affected area: [specific districts/blocks/radius if mentioned]
- Response measures: [culling, quarantine, vaccination campaign, contact tracing, etc.]
- Timeline: [first detection date, spread pattern if known]

CONTEXT:
Compare to baseline or flag if unusual timing/location (e.g., "First human case in this district in 5 years"). If no baseline available, state that.

PUBLIC HEALTH ACTIONS:
- Surveillance: [contact tracing priorities, sentinel sites, lab testing required]
- Prevention: [vaccination, vector control, food safety, water safety advisories]
- Resources: [PPE requirements, drugs needed, diagnostic kits]

AVOID vague statements. Use numbers. Only report confirmed data.`,

    NCD: `FORMAT YOUR RESPONSE AS:
${topic} burden update — ${locationStr}

EPIDEMIOLOGICAL DATA:
- Prevalence: [% in which population]
- Absolute numbers: [if available in source]
- High-risk groups: [age, gender, urban/rural, socioeconomic profile]
- Trend: ↑ ↓ → vs [previous year/national average — state the baseline used]

CLINICAL SIGNIFICANCE:
What does this mean for frontline doctors? Give a specific, actionable statement (e.g., "Screen all adults >40 for CKD in coastal Karnataka").

POLICY IMPLICATIONS:
- Screening program gaps identified
- Treatment access barriers
- Prevention opportunities (diet, exercise, awareness, early detection)

AVOID generic statements. Give specific, actionable insights only.`,

    PROGRAM: `FORMAT YOUR RESPONSE AS:
${topic} — ${source}

WHAT IT IS:
One sentence: what this program/initiative does.

RELEVANCE TO PUBLIC HEALTH:
- Problem addressed: [specific disease burden, surveillance gap, or infrastructure issue]
- Target population: [patients / health workers / researchers / administrators]
- Expected impact: [measurable outcomes if stated in source]

KEY DATES & ACTIONS:
- Application/registration deadline: [date or "not specified"]
- Implementation timeline: [start–end dates]
- Eligibility: [who can apply or participate]

FRONTLINE UTILITY:
Does this affect clinical practice, surveillance reporting, or resource availability?
If NO → state: "Administrative update — no immediate clinical impact."
If YES → state exactly what changes for PHC/district hospital staff.`,

    POLICY: `FORMAT YOUR RESPONSE AS:
${topic} — ${source}

WHAT CHANGED:
- Previous policy/guideline: [brief description, or "New guideline — no previous version"]
- New policy: [brief description of what changed]
- Effective date: [when it takes effect, or "not specified"]

IMPACT ON GROUND-LEVEL HEALTH WORKERS:
- Reporting requirements: [new forms, timelines, platforms affected]
- Treatment protocols: [drug changes, dosage updates, referral criteria]
- Surveillance obligations: [new diseases to report, notification timelines]

COMPLIANCE DEADLINES:
[When must hospitals/PHCs/doctors comply — or "No compliance deadline stated"]

AVOID quoting full policy text. Extract only what changes day-to-day practice.`,
  };

  const formatBlock = formatByCategory[catLabel] ?? formatByCategory.OUTBREAK;

  const prompt = `You are a public health intelligence analyst providing actionable briefings for Indian health officials.

ITEM METADATA:
Category: ${catLabel}
Disease/Topic: ${topic}
Title: ${title}
Source: ${source}
Location: ${locationStr}
Date: ${date || "Not specified"}
Priority: ${priority || "Standard"}
Reported cases: ${cases || "not disclosed"}
Reported deaths: ${deaths || "not disclosed"}
Existing summary: ${summary || "—"}
${articleBlock}

---

INSTRUCTIONS:
${formatBlock}

GENERAL RULES (apply to all categories):
1. Lead with location for outbreaks: **Kerala, Kozhikode** — H5N1 detected...
2. Use numbers, not adjectives: "450 cases" not "significant outbreak"
3. Calculate rates when possible: CFR = (deaths/cases) × 100
4. Flag data gaps explicitly: "Case count not disclosed in source"
5. No speculation — only report confirmed data from the source
6. Action-oriented language: "Screen all contacts" not "screening may be considered"
7. Compare to baselines when possible: "23% above 5-year average"
8. District-level specificity whenever the source provides it

Keep response under 400 words. Be factual, specific, and actionable.`;

  const client = new Groq({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const groqStream = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1500,
          stream: true,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Groq API error";
        controller.enqueue(encoder.encode(`\n\n**Error:** ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
