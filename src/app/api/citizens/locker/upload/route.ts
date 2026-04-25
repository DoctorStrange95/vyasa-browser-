import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { adminAdd } from "@/lib/firestore-admin";

export const maxDuration = 30;

const MAX_BYTES     = 700 * 1024; // ~500 KB actual (base64 overhead ~33%)
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
];

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({
      error: "Only JPEG, PNG, WebP images and PDF documents are accepted.",
    }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({
      error: `File too large. Maximum size is 500 KB. Your file is ${Math.round(buffer.byteLength / 1024)} KB.`,
    }, { status: 400 });
  }

  const base64 = buffer.toString("base64");
  const id = await adminAdd("health_locker_files", {
    uid:        session.uid,
    name:       file.name,
    mimeType:   file.type,
    size:       buffer.byteLength,
    data:       base64,
    uploadedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id, name: file.name, size: buffer.byteLength });
}
