"use client";
import { useEffect, useState } from "react";

interface LBEntry {
  uid: string;
  name: string;
  credits: number;
  state?: string;
  badge: string;
  symptomCount: number;
}

interface Props {
  stateFilter?: string;
  currentUid?: string;
  maxRows?: number;
}

export default function Leaderboard({ stateFilter, currentUid, maxRows = 10 }: Props) {
  const [entries, setEntries] = useState<LBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope]     = useState("india");
  const [tab, setTab]         = useState<"india" | "state">("india");

  useEffect(() => {
    async function load(st?: string) {
      setLoading(true);
      try {
        const url = st ? `/api/user/leaderboard?state=${encodeURIComponent(st)}` : "/api/user/leaderboard";
        const res = await fetch(url);
        const data = await res.json();
        setEntries(data.top ?? []);
        setScope(data.scope ?? "india");
      } catch { setEntries([]); }
      finally { setLoading(false); }
    }
    load(tab === "state" && stateFilter ? stateFilter : undefined);
  }, [tab, stateFilter]);

  const rows = entries.slice(0, maxRows);

  return (
    <div>
      {/* Tab switcher */}
      {stateFilter && (
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
          {(["india", "state"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                fontSize: "0.78rem", fontWeight: tab === t ? 700 : 400,
                backgroundColor: tab === t ? "#0d948820" : "transparent",
                border: `1px solid ${tab === t ? "#0d948840" : "#1e3a5f"}`,
                color: tab === t ? "#2dd4bf" : "#64748b",
                borderRadius: "6px", padding: "0.3rem 0.75rem",
                cursor: "pointer", fontFamily: "inherit",
              }}>
              {t === "india" ? "🇮🇳 India" : `🏛️ ${stateFilter}`}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: "48px", backgroundColor: "#0f2040", borderRadius: "8px", opacity: 0.4 }} />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#475569", fontSize: "0.85rem" }}>
          No contributors yet.{" "}
          <span style={{ color: "#2dd4bf" }}>Be the first — report your symptoms above!</span>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {rows.map((e, i) => {
            const isMe = e.uid === currentUid;
            const medals = ["🥇", "🥈", "🥉"];
            const rank = medals[i] ?? `#${i + 1}`;
            return (
              <div
                key={e.uid}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  backgroundColor: isMe ? "#0d948818" : "#0f2040",
                  border: `1px solid ${isMe ? "#0d948850" : "#1e3a5f"}`,
                  borderRadius: "8px", padding: "0.65rem 0.85rem",
                }}
              >
                <span style={{ fontSize: "1rem", width: "28px", textAlign: "center", flexShrink: 0 }}>{rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, color: isMe ? "#2dd4bf" : "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name.split(" ")[0]}{isMe ? " (You)" : ""}
                    </span>
                    <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{e.badge}</span>
                  </div>
                  {tab === "india" && e.state && (
                    <div style={{ fontSize: "0.68rem", color: "#475569" }}>{e.state}</div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fbbf24" }}>{e.credits.toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: "0.6rem", color: "#334155" }}>{e.symptomCount} reports</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.68rem", color: "#334155", textAlign: "center" }}>
          {scope === "india" ? "India-wide" : scope} · {rows.length} contributors
        </div>
      )}
    </div>
  );
}
