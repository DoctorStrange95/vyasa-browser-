import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let initialized = false;

function init() {
  if (initialized || getApps().length > 0) { initialized = true; return; }
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return;
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  initialized = true;
}

export function getDb() {
  try {
    init();
    if (!getApps().length) return null;
    return getFirestore();
  } catch {
    return null;
  }
}

export const FIREBASE_AVAILABLE = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);
