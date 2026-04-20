import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Public web config — safe to commit (security enforced by Firestore rules)
const config = {
  apiKey:            "REMOVED_ROTATE_THIS_KEY",
  authDomain:        "vyasa-2b84a.firebaseapp.com",
  projectId:         "vyasa-2b84a",
  storageBucket:     "vyasa-2b84a.firebasestorage.app",
  messagingSenderId: "159542704035",
  appId:             "1:159542704050:web:e32543ae54511b2b634c16",
};

export function getDb() {
  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
    return getFirestore(app);
  } catch {
    return null;
  }
}

export const FIREBASE_AVAILABLE = true;
