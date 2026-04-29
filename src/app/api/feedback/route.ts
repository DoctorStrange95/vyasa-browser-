import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getUserSession } from "@/lib/userAuth";
import { adminAdd, adminList, adminUpdate, adminGet } from "@/lib/firestore-admin";

const COLLECTION = "feedback";

export interface FeedbackItem {
  id: string;
  mode: "feedback" | "report";
  type: "wrong_data" | "missing_data" | "new_hospital" | "general";
  rating?: number;
  page: string;
  field?: string;
  message: string;
  currentValue?: string;
  suggestedValue?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  wantsToJoin?: "yes" | "maybe" | "no" | "";
  timestamp: string;
  status: "open" | "reviewed" | "resolved";
  adminNote?: string;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // Auto-populate submitter info from session for logged-in users
  const session = await getUserSession().catch(() => null);

  const item = {
    mode:           body.mode === "report" ? "report" : "feedback",
    type:           body.type ?? "general",
    rating:         body.rating ? Number(body.rating) : null,
    page:           body.page ?? "",
    field:          body.field || null,
    message:        body.message ?? "",
    currentValue:   body.currentValue || null,
    suggestedValue: body.suggestedValue || null,
    submitterName:  session?.name  || body.submitterName || body.name  || null,
    submitterEmail: session?.email || body.submitterEmail || body.email || null,
    submitterUid:   session?.uid   || null,
    submitterPhone: body.phone     || null,
    gender:         body.gender    || null,
    state:          body.state     || null,
    wantsToJoin:    body.wantsToJoin || null,
    timestamp:      new Date().toISOString(),
    status:         "open",
  };

  const id = await adminAdd(COLLECTION, item);
  return NextResponse.json({ ok: true, id });
}

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await adminList(COLLECTION, 500);
  // Sort newest first
  items.sort((a, b) => String(b.timestamp ?? "").localeCompare(String(a.timestamp ?? "")));
  return NextResponse.json(items);
}

export async function PATCH(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, adminNote } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (status)              update.status    = status;
  if (adminNote !== undefined) update.adminNote = adminNote;

  await adminUpdate(COLLECTION, id, update);

  const updated = await adminGet(COLLECTION, id);
  return NextResponse.json({ ok: true, item: updated });
}
