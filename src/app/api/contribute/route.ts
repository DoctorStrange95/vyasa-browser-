import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fsAdd } from "@/lib/firestore";
import * as XLSX from "xlsx";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const client = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

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

    if (!client) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured — contact admin." }, { status: 503 });
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext    = file.name.split(".").pop()?.toLowerCase() ?? "";

    /* ── Extract text / send to Claude ────────────────────────── */
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
      const b64 = buffer.toString("base64");
      extractedData = await extractWithPDF(b64, description);

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

async function extractWithText(text: string, description: string) {
  const msg = await client!.messages.create({
    model:      "claude-opus-4-7",
    max_tokens: 2048,
    thinking:   { type: "adaptive" },
    messages: [{
      role: "user",
      content: `${EXTRACT_PROMPT}\n\nUser description: ${description}\n\nDocument content:\n${text}`,
    }],
  });
  return parseExtracted(msg.content);
}

async function extractWithImage(b64: string, mime: string, description: string) {
  const msg = await client!.messages.create({
    model:      "claude-opus-4-7",
    max_tokens: 2048,
    thinking:   { type: "adaptive" },
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mime as "image/jpeg", data: b64 } },
        { type: "text",  text: `${EXTRACT_PROMPT}\n\nUser description: ${description}` },
      ],
    }],
  });
  return parseExtracted(msg.content);
}

async function extractWithPDF(b64: string, description: string) {
  const msg = await client!.messages.create({
    model:      "claude-opus-4-7",
    max_tokens: 2048,
    thinking:   { type: "adaptive" },
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } } as never,
        { type: "text",     text: `${EXTRACT_PROMPT}\n\nUser description: ${description}` },
      ],
    }],
  });
  return parseExtracted(msg.content);
}

function parseExtracted(content: Anthropic.ContentBlock[]): object {
  const text = content.find(b => b.type === "text");
  if (!text || text.type !== "text") return {};
  try {
    const clean = text.text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { raw: (text as { text: string }).text.slice(0, 2000) };
  }
}
