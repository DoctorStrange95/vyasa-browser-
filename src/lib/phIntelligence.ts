/**
 * Public Health Intelligence — Master Orchestrator
 *
 * Delegates to two specialised agents and merges their output:
 *   • agentIDSP  — all 34 IDSP / IHIP communicable diseases
 *   • agentNCD   — cardiovascular, cancer, diabetes, COPD, CKD, NAFLD
 *
 * The shared PHIntelligenceItem type is defined here and imported by
 * both agents so the whole system uses one canonical shape.
 */

export interface PHIntelligenceItem {
  /** Communicable disease outbreak | NCD report | Programme | Policy | Infrastructure */
  type:       "Outbreak" | "NCD" | "Program" | "Policy" | "Infrastructure";
  /** High-level category separating communicable from non-communicable */
  category?:  "communicable" | "ncd" | "general";
  title:      string;
  disease?:   string;
  program?:   string;
  location:   { state: string; district: string; village: string };
  summary:    string;
  cases:      string;
  deaths:     string;
  date:       string;
  source:     string;
  sourceUrl?: string;
  confidence: "High" | "Medium" | "Low";
}

// ── Deduplication across both agents ─────────────────────────────────────────
function dedup(items: PHIntelligenceItem[]): PHIntelligenceItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.type}::${item.category ?? ""}::${item.disease ?? item.program ?? ""}::${item.location.state}::${item.title.slice(0, 45).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Master collection ─────────────────────────────────────────────────────────
export async function collectPHIntelligence(): Promise<{
  items:       PHIntelligenceItem[];
  sources:     string[];
  errors:      string[];
  refreshedAt: string;
}> {
  const [idspResult, ncdResult] = await Promise.allSettled([
    import("./agentIDSP").then(m => m.runIDSPAgent()),
    import("./agentNCD").then(m => m.runNCDAgent()),
  ]);

  const allItems:  PHIntelligenceItem[] = [];
  const allSources: string[] = [];
  const allErrors:  string[] = [];

  if (idspResult.status === "fulfilled") {
    allItems.push(...idspResult.value.items);
    allSources.push(...idspResult.value.sources.map(s => `[IDSP] ${s}`));
    allErrors.push(...idspResult.value.errors.map(e => `[IDSP] ${e}`));
  } else {
    allErrors.push(`IDSP Agent failed: ${idspResult.reason}`);
  }

  if (ncdResult.status === "fulfilled") {
    allItems.push(...ncdResult.value.items);
    allSources.push(...ncdResult.value.sources.map(s => `[NCD] ${s}`));
    allErrors.push(...ncdResult.value.errors.map(e => `[NCD] ${e}`));
  } else {
    allErrors.push(`NCD Agent failed: ${ncdResult.reason}`);
  }

  // Sort: Outbreaks > NCD > Programs > Policies; High confidence first; newest date
  const confScore = { High: 3, Medium: 2, Low: 1 } as const;
  const typeScore: Record<string, number> = {
    Outbreak: 5, NCD: 4, Program: 3, Policy: 2, Infrastructure: 1,
  };

  const sorted = dedup(allItems).sort((a, b) => {
    const c = (confScore[b.confidence] ?? 0) - (confScore[a.confidence] ?? 0);
    if (c !== 0) return c;
    const t = (typeScore[b.type] ?? 0) - (typeScore[a.type] ?? 0);
    if (t !== 0) return t;
    return (b.date ?? "").localeCompare(a.date ?? "");
  });

  return {
    items:       sorted.slice(0, 80),
    sources:     allSources,
    errors:      allErrors,
    refreshedAt: new Date().toISOString(),
  };
}
