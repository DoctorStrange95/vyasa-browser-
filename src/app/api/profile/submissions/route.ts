import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { adminQuery } from "@/lib/firestore-admin";

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const submissions = await adminQuery("pendingSubmissions", "submitterEmail", session.email, 50);
  return NextResponse.json({ submissions });
}
