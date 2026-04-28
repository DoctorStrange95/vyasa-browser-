import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { fsGet, fsSet } from "@/lib/firestore";

const COLLECTION = "feedback";

export interface FeedbackItem {
  id: string;
  mode: "feedback" | "report";
  type: "wrong_data" | "missing_data" | "new_hospital" | "general";
  rating?: number;
  page: string;
  // Report issue fields
  field?: string;
  message: string;
  currentValue?: string;
  suggestedValue?: string;
  // Submitter info
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  wantsToJoin?: "yes" | "maybe" | "no" | "";
  timestamp: string;
  status: "open" | "reviewed" | "resolved";
  adminNote?: string;
}

// In-memory fallback (resets on cold start)
const memStore: FeedbackItem[] = [];

async function loadAll(): Promise<FeedbackItem[]> {
  try {
    const doc = await fsGet(COLLECTION, "all") as { items: FeedbackItem[] } | null;
    return doc?.items ?? memStore;
  } catch {
    return memStore;
  }
}

async function saveAll(items: FeedbackItem[]) {
  try {
    await fsSet(COLLECTION, "all", { items } as unknown as Record<string, unknown>);
  } catch {
    // fallback: keep in memStore
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const item: FeedbackItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    mode: body.mode === "report" ? "report" : "feedback",
    type: body.type ?? "general",
    rating: body.rating ? Number(body.rating) : undefined,
    page: body.page ?? "",
    field: body.field || undefined,
    message: body.message ?? "",
    currentValue: body.currentValue || undefined,
    suggestedValue: body.suggestedValue || undefined,
    submitterName: body.submitterName || body.name || undefined,
    submitterEmail: body.submitterEmail || body.email || undefined,
    submitterPhone: body.phone || undefined,
    wantsToJoin: body.wantsToJoin || undefined,
    timestamp: new Date().toISOString(),
    status: "open",
  };

  const all = await loadAll();
  all.push(item);
  memStore.push(item);
  await saveAll(all);

  return NextResponse.json({ ok: true, id: item.id });
}

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await loadAll();
  return NextResponse.json(all.slice().reverse());
}

export async function PATCH(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status, adminNote } = await req.json();
  const all = await loadAll();
  const item = all.find((f) => f.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (status) item.status = status;
  if (adminNote !== undefined) item.adminNote = adminNote;
  await saveAll(all);
  return NextResponse.json({ ok: true, item });
}
