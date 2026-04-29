/**
 * Firebase Admin SDK helper — bypasses Firestore security rules.
 * Used only in server-side admin API routes (protected by JWT middleware).
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string or base64-encoded JSON).
 */

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let _app: App | null = null;
let _db: Firestore | null = null;

function getAdminDb(): Firestore {
  if (_db) return _db;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "";
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Get it from Firebase Console → Project Settings → Service Accounts → Generate new private key.");

  // Support plain JSON string or base64-encoded JSON
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY must be a valid JSON string or base64-encoded JSON.");
    }
  }

  // Vercel env vars double-escape \n as \\n — fix the private key so JWT signing works
  if (typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  const existingApps = getApps();
  if (existingApps.length === 0) {
    _app = initializeApp({ credential: cert(parsed as Parameters<typeof cert>[0]) });
  } else {
    _app = existingApps[0];
  }

  _db = getFirestore(_app);
  return _db;
}

export function getAdminApp(): App {
  getAdminDb(); // ensures initialization
  if (!_app) throw new Error("Firebase Admin app not initialized");
  return _app;
}

export async function adminGet(
  col: string,
  id: string,
): Promise<(Record<string, unknown> & { _id: string }) | null> {
  const db  = getAdminDb();
  const doc = await db.collection(col).doc(id).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as Record<string, unknown>), _id: doc.id };
}

export async function adminList(
  col: string,
  maxItems = 200,
): Promise<Array<Record<string, unknown> & { _id: string }>> {
  const db   = getAdminDb();
  const snap = await db.collection(col).limit(maxItems).get();
  return snap.docs.map(d => ({ ...(d.data() as Record<string, unknown>), _id: d.id }));
}

export async function adminQuery(
  col: string,
  field: string,
  value: unknown,
  maxItems = 200,
): Promise<Array<Record<string, unknown> & { _id: string }>> {
  const db   = getAdminDb();
  const snap = await db.collection(col).where(field, "==", value).limit(maxItems).get();
  return snap.docs.map(d => ({ ...(d.data() as Record<string, unknown>), _id: d.id }));
}

export async function adminSet(
  col: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const db = getAdminDb();
  await db.collection(col).doc(id).set(data);
}

export async function adminUpdate(
  col: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const db = getAdminDb();
  await db.collection(col).doc(id).update(data);
}

export async function adminBatchUpdate(
  col: string,
  ids: string[],
  data: Record<string, unknown>,
): Promise<void> {
  if (!ids.length) return;
  const db    = getAdminDb();
  const batch = db.batch();
  for (const id of ids) {
    batch.update(db.collection(col).doc(id), data);
  }
  await batch.commit();
}

export async function adminAdd(
  col: string,
  data: Record<string, unknown>,
): Promise<string> {
  const db  = getAdminDb();
  const ref = await db.collection(col).add(data);
  return ref.id;
}

export async function adminDelete(col: string, id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(col).doc(id).delete();
}

export async function adminSetSubcollection(
  col: string,
  id: string,
  subCol: string,
  subId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const db = getAdminDb();
  await db.collection(col).doc(id).collection(subCol).doc(subId).set(data);
}

export async function adminListSubcollection(
  col: string,
  id: string,
  subCol: string,
  maxItems = 1000,
): Promise<Array<Record<string, unknown> & { _id: string }>> {
  const db   = getAdminDb();
  const snap = await db.collection(col).doc(id).collection(subCol).limit(maxItems).get();
  return snap.docs.map(d => ({ ...(d.data() as Record<string, unknown>), _id: d.id }));
}

export { getAdminDb };
