import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { adminQuery, adminDelete, getAdminDb } from "@/lib/firestore-admin";

// Health Locker — list, download, delete endpoints.
// Files are stored in `health_locker_files` Firestore collection.
// Each document: { uid, name, mimeType, size, data (base64), uploadedAt }

export async function GET(req: NextRequest) {
  void req;
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  try {
    const files = await adminQuery("health_locker_files", "uid", session.uid, 200);
    return NextResponse.json({
      files: files.map(({ data: _data, ...meta }) => meta),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Download a single file — returns base64 data + mimeType
export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const db  = getAdminDb();
    const doc = await db.collection("health_locker_files").doc(body.id).get();
    if (!doc.exists || (doc.data() as Record<string, unknown>).uid !== session.uid) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const { data, mimeType, name } = doc.data() as Record<string, unknown>;
    return NextResponse.json({ data, mimeType, name });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const db  = getAdminDb();
    const doc = await db.collection("health_locker_files").doc(body.id).get();
    if (!doc.exists || (doc.data() as Record<string, unknown>).uid !== session.uid) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    await adminDelete("health_locker_files", body.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
