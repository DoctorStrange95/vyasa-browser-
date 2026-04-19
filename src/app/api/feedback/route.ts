import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export interface FeedbackItem {
  id: string;
  type: "wrong_data" | "missing_data" | "new_hospital" | "general";
  page: string;
  field?: string;
  message: string;
  currentValue?: string;
  suggestedValue?: string;
  submitterName?: string;
  submitterEmail?: string;
  timestamp: string;
  status: "open" | "reviewed" | "resolved";
  adminNote?: string;
}

// In production: replace with Vercel KV / Supabase / Neon
// For now: in-memory store (resets on cold start, sufficient for dev + preview)
const store: FeedbackItem[] = [];

export async function POST(req: Request) {
  const body = await req.json();
  const item: FeedbackItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: body.type ?? "general",
    page: body.page ?? "",
    field: body.field,
    message: body.message ?? "",
    currentValue: body.currentValue,
    suggestedValue: body.suggestedValue,
    submitterName: body.submitterName,
    submitterEmail: body.submitterEmail,
    timestamp: new Date().toISOString(),
    status: "open",
  };
  store.push(item);
  return NextResponse.json({ ok: true, id: item.id });
}

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(store.slice().reverse()); // newest first
}

export async function PATCH(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status, adminNote } = await req.json();
  const item = store.find((f) => f.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (status) item.status = status;
  if (adminNote !== undefined) item.adminNote = adminNote;
  return NextResponse.json({ ok: true, item });
}
