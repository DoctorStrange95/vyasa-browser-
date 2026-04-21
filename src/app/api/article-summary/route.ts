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
  } = body;

  const articleText = await fetchArticleText(sourceUrl);

  const locationStr =
    [location.state, location.district, location.village].filter(Boolean).join(", ") || "India";

  const contextBlock = articleText
    ? `Article content (extracted):\n${articleText}`
    : `Available metadata only — article content could not be fetched.`;

  const prompt = `You are a public health intelligence analyst for India. Analyse the following ${
    category === "ncd" ? "non-communicable disease (NCD)" : "communicable disease / outbreak"
  } news item and provide a concise, structured briefing.

---
**Title:** ${title}
**Source:** ${source}
**Disease / Condition:** ${disease || program || "Not specified"}
**Location:** ${locationStr}
**Reported cases:** ${cases || "not specified"}
**Reported deaths:** ${deaths || "not specified"}
**Existing summary:** ${summary || "—"}

${contextBlock}
---

Provide your briefing in this exact structure (use markdown):

## 🔍 Intelligence Summary
[2–3 sentence plain-language summary of what happened / what this means]

## 🦠 Disease / Condition
[Name, category (communicable / NCD), and a one-line clinical note]

## 📍 Geographic Spread
[Specific states, districts, or cities affected — with severity if known]

## 📊 Epidemiological Figures
[Cases, deaths, CFR if calculable, trend direction if inferable]

## ⚠️ Public Health Significance
[Why this matters — risk level (High / Medium / Low / Monitoring), population at risk, any concerning signals]

## ✅ Recommended Actions
[Bullet list: surveillance steps, preventive measures, or next-watch items relevant to India's health system]

Keep the entire response under 350 words. Be factual — do not speculate beyond what the article supports.`;

  const client = new Groq({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const groqStream = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1024,
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
