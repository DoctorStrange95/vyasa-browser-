import { getAdminDb } from "./firestore-admin";

export interface UIConfig {
  header: {
    showForDoctors: boolean;
  };
  sidebar: {
    showFindNearby: boolean;
    showSignInCTA: boolean;
    showJoinProfessional: boolean;
    showAbout: boolean;
    showHomeSections: boolean;
  };
  mobile: {
    showFAB: boolean;
  };
  content: {
    showIDSPSection: boolean;
    showIntelFeed: boolean;
    showAyushmanTab: boolean;
    showHealthLockerTab: boolean;
    idspMaxItems: number;
    intelMaxItems: number;
  };
}

export const DEFAULT_UI_CONFIG: UIConfig = {
  header:  { showForDoctors: true },
  sidebar: { showFindNearby: true, showSignInCTA: true, showJoinProfessional: true, showAbout: true, showHomeSections: true },
  mobile:  { showFAB: true },
  content: { showIDSPSection: true, showIntelFeed: true, showAyushmanTab: true, showHealthLockerTab: true, idspMaxItems: 20, intelMaxItems: 6 },
};

// Merge stored partial config over defaults so adding new keys is non-breaking
export function mergeConfig(stored: Partial<UIConfig>): UIConfig {
  return {
    header:  { ...DEFAULT_UI_CONFIG.header,  ...(stored.header  ?? {}) },
    sidebar: { ...DEFAULT_UI_CONFIG.sidebar, ...(stored.sidebar ?? {}) },
    mobile:  { ...DEFAULT_UI_CONFIG.mobile,  ...(stored.mobile  ?? {}) },
    content: { ...DEFAULT_UI_CONFIG.content, ...(stored.content ?? {}) },
  };
}

let _cache: { config: UIConfig; at: number } | null = null;
const CACHE_TTL = 60_000; // 1 minute

export async function getSiteConfig(): Promise<UIConfig> {
  if (_cache && Date.now() - _cache.at < CACHE_TTL) return _cache.config;
  try {
    const db  = getAdminDb();
    const doc = await db.collection("config").doc("site_ui").get();
    const stored = doc.exists ? (doc.data() as Partial<UIConfig>) : {};
    const config = mergeConfig(stored);
    _cache = { config, at: Date.now() };
    return config;
  } catch {
    return DEFAULT_UI_CONFIG;
  }
}
