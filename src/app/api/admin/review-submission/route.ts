import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { fsUpdate } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, reason } = await req.json() as { id: string; action: "approve" | "reject"; reason?: string };
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  await fsUpdate("pendingSubmissions", id, {
    status:          action === "approve" ? "approved" : "rejected",
    rejectionReason: reason ?? "",
    reviewedAt:      new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
