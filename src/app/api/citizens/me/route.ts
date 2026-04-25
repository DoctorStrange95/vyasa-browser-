import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  return NextResponse.json({ name: session.name, email: session.email });
}
