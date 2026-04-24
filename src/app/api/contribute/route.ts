import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { fsAdd } from "@/lib/firestore";
import * as XLSX from "xlsx";

const GROQ_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY }) : null;

const EXTRACT_PROMPT = `You are a public health data analyst. Extract ALL structured health metrics from the provided document.

Return ONLY valid JSON (no markdown, no explanation) with this exact shape:
{
  "state": "state name (if mentioned)",
  "district": "district name (if mentioned)",
  "year": "data year or range",
  "metrics": [
    {
      "name": "metric name (e.g. IMR, vaccination_coverage, stunting, institutional_births, under5_mortality, neonatal_mortality, anaemia_children, anaemia_women, underweight, wasting, birth_rate, death_rate, total_fertility_rate, maternal_mortality_ratio, ncd_prevalence, diabetes_prevalence, hypertension_prevalence, tuberculosis_incidence, dengue_cases, malaria_cases, facility_count, doctor_count, bed_count)",
      "value": numeric_value_only,
      "unit": "unit (%, /1000 LB, /lakh, count, etc.)",
      "confidence": "high|medium|low",
      "note": "brief context or source line from doc"
    }
  ],
  "summary": "2-sentence plain-English summary of what this document is about"
}

If a metric cannot be confidently extracted, omit it. Focus on India public health metrics.`;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file        = form.get("file") as File | null;
    const state       = (form.get("state")       as string) ?? "";
    const district    = (form.get("district")    as string) ?? "";
    const description = (form.get("description") as string) ?? "";
    const name        = (form.get("name")        as string) ?? "Anonymous";
    const email       = (form.get("email")       as string) ?? "";

    if (!groq) return NextResponse.json({ error: "GROQ_API_KEY not configured — contact admin." }, { status: 503 });
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext    = file.name.split(".").pop()?.toLowerCase() ?? "";

    /* ── Extract text / send to Groq ───────────────────────────── */
    let extractedData: object = {};
    let rawText = "";

    const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
    const docTypes   = ["pdf"];
    const csvTypes   = ["csv"];
    const xlsTypes   = ["xlsx", "xls", "ods"];

    if (csvTypes.includes(ext)) {
      rawText = buffer.toString("utf-8").slice(0, 20000);
      extractedData = await extractWithText(rawText, description);

    } else if (xlsTypes.includes(ext)) {
      const wb  = XLSX.read(buffer, { type: "buffer" });
      const csv = wb.SheetNames.map(n => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join("\n\n");
      rawText = csv.slice(0, 20000);
      extractedData = await extractWithText(rawText, description);

    } else if (imageTypes.includes(ext)) {
      const b64 = buffer.toString("base64");
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg"
                 : ext === "png" ? "image/png"
                 : ext === "gif" ? "image/gif"
                 : "image/webp";
      extractedData = await extractWithImage(b64, mime, description);

    } else if (docTypes.includes(ext)) {
      // Extract text from PDF, then send to Groq
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as never) as { default: (buf: Buffer) => Promise<{ text: string }> }).default;
      const parsed = await pdfParse(buffer);
      rawText = parsed.text.slice(0, 20000);
      extractedData = await extractWithText(rawText, description);

    } else {
      return NextResponse.json({ error: "Unsupported file type. Allowed: PDF, CSV, XLSX, PNG, JPG" }, { status: 400 });
    }

    /* ── Save to Firestore ─────────────────────────────────────── */
    const id = await fsAdd("pendingSubmissions", {
      submitterName:  name,
      submitterEmail: email,
      state,
      district,
      description,
      fileName:       file.name,
      fileType:       ext,
      fileSize:       file.size,
      extractedData:  JSON.stringify(extractedData),
      rawTextPreview: rawText.slice(0, 500),
      status:         "pending",
      submittedAt:    new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id, extractedData });

  } catch (err) {
    console.error("contribute error:", err);
    return NextResponse.json({ error: "Processing failed. Please try again." }, { status: 500 });
  }
}

async function extractWithText(text: string, description: string): Promise<object> {
  const res = await groq!.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 2048,
    messages: [
      { role: "system", content: "You are a public health data analyst. Return only valid JSON." },
      { role: "user",   content: `${EXTRACT_PROMPT}\n\nUser description: ${description}\n\nDocument content:\n${text}` },
    ],
  });
  return parseExtracted(res.choices[0]?.message?.content ?? "");
}

async function extractWithImage(b64: string, mime: string, description: string): Promise<object> {
  const res = await groq!.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
        { type: "text",      text: `${EXTRACT_PROMPT}\n\nUser description: ${description}` },
      ] as never,
    }],
  });
  return parseExtracted(res.choices[0]?.message?.content ?? "");
}

function parseExtracted(text: string): object {
  try {
    const clean = text.replace(/```json\n?|```/g, "").trim();
    // Find first { to last } in case of extra text
    const start = clean.indexOf("{");
    const end   = clean.lastIndexOf("}");
    if (start === -1 || end === -1) return { raw: text.slice(0, 2000) };
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return { raw: text.slice(0, 2000) };
  }
}
