import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { getAdminDb } from "@/lib/firestore-admin";
import { FieldValue } from "firebase-admin/firestore";

const CREDITS_PER_REPORT = 10;
const CREDITS_SUBTYPE    = 5;   // bonus for specifying sub-type
const CREDITS_LOCATION   = 3;   // bonus for providing district
const DAILY_CAP          = 40;

function badge(credits: number): string {
  if (credits >= 1000) return "⭐";
  if (credits >= 500)  return "🥇";
  if (credits >= 200)  return "🥈";
  if (credits >= 50)   return "🥉";
  return "🌱";
}

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminDb();
  const snap = await db.collection("symptom_reports")
    .where("uid", "==", session.uid)
    .orderBy("submittedAt", "desc")
    .limit(30)
    .get();

  const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const userDoc = await db.collection("users").doc(session.uid).get();
  const userData = userDoc.data() ?? {};

  return NextResponse.json({
    reports,
    credits: userData.credits ?? 0,
    badge: badge(userData.credits ?? 0),
    symptomCount: userData.symptomCount ?? 0,
  });
}

export async function POST(req: Request) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, subType, symptoms, state, district, notes } = body as {
    category: string;
    subType?: string;
    symptoms: string[];
    state?: string;
    district?: string;
    notes?: string;
  };

  if (!category || !symptoms?.length) {
    return NextResponse.json({ error: "category and symptoms required" }, { status: 400 });
  }

  const db = getAdminDb();

  // Check daily cap
  const today = new Date().toISOString().slice(0, 10);
  const todaySnap = await db.collection("symptom_reports")
    .where("uid", "==", session.uid)
    .where("date", "==", today)
    .get();

  const todayCredits = todaySnap.docs.reduce((sum, d) => sum + ((d.data().creditsAwarded as number) ?? 0), 0);
  if (todayCredits >= DAILY_CAP) {
    return NextResponse.json({ error: "Daily credit limit reached (40). Come back tomorrow!", limitReached: true }, { status: 429 });
  }

  let creditsAwarded = CREDITS_PER_REPORT;
  if (subType)  creditsAwarded += CREDITS_SUBTYPE;
  if (district) creditsAwarded += CREDITS_LOCATION;
  creditsAwarded = Math.min(creditsAwarded, DAILY_CAP - todayCredits);

  // Save report
  const reportId = await db.collection("symptom_reports").add({
    uid:       session.uid,
    name:      session.name,
    category,
    subType:   subType ?? null,
    symptoms,
    state:     state ?? null,
    district:  district ?? null,
    notes:     notes ?? null,
    date:      today,
    submittedAt: FieldValue.serverTimestamp(),
    creditsAwarded,
  });

  // Update user credits
  await db.collection("users").doc(session.uid).set({
    credits:      FieldValue.increment(creditsAwarded),
    symptomCount: FieldValue.increment(1),
    name:    session.name,
    email:   session.email,
    state:   state ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Update leaderboard (fire-and-forget)
  updateLeaderboard(db, session.uid, session.name, state ?? null).catch(() => {});

  const userDoc = await db.collection("users").doc(session.uid).get();
  const total = (userDoc.data()?.credits as number) ?? creditsAwarded;

  return NextResponse.json({
    ok: true,
    reportId: reportId.id,
    creditsAwarded,
    totalCredits: total,
    badge: badge(total),
  });
}

async function updateLeaderboard(
  db: FirebaseFirestore.Firestore,
  uid: string,
  name: string,
  state: string | null,
) {
  // Fetch updated user to get fresh credits
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.data() ?? {};
  const credits = (userData.credits as number) ?? 0;
  const userEntry = {
    uid, name, credits,
    state:  userData.state ?? state ?? null,
    badge:  badge(credits),
    symptomCount: userData.symptomCount ?? 0,
  };

  // India-wide leaderboard
  const indiaRef = db.collection("leaderboard").doc("india");
  await db.runTransaction(async (tx) => {
    const indiaDoc = await tx.get(indiaRef);
    const existing: Record<string, unknown>[] = (indiaDoc.data()?.top ?? []) as Record<string, unknown>[];
    const filtered = existing.filter((u) => u.uid !== uid);
    const merged = [...filtered, userEntry].sort((a, b) => (b.credits as number) - (a.credits as number)).slice(0, 20);
    tx.set(indiaRef, { updatedAt: FieldValue.serverTimestamp(), top: merged }, { merge: true });
  });

  // State leaderboard
  if (state) {
    const slug = state.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const stateRef = db.collection("leaderboard").doc(slug);
    await db.runTransaction(async (tx) => {
      const stateDoc = await tx.get(stateRef);
      const existing: Record<string, unknown>[] = (stateDoc.data()?.top ?? []) as Record<string, unknown>[];
      const filtered = existing.filter((u) => u.uid !== uid);
      const merged = [...filtered, userEntry].sort((a, b) => (b.credits as number) - (a.credits as number)).slice(0, 10);
      tx.set(stateRef, { updatedAt: FieldValue.serverTimestamp(), top: merged, state }, { merge: true });
    });
  }
}
