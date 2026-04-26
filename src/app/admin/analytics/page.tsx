"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DayViews  { date: string; views: number; }
interface PageViews { path: string; views: number; }
interface Analytics {
  totalViews: number;
  daily: DayViews[];
  topPages: PageViews[];
}

export default function AnalyticsPage() {
  const [data,    setData]    = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxViews = data ? Math.max(...data.daily.map(d => d.views), 1) : 1;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>

      {/* Top bar */}
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "56px", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/admin" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>← Admin</Link>
        <span style={{ color: "#fff", fontWeight: 700 }}>Site Analytics</span>
        <span style={{ backgroundColor: "#0d948820", border: "1px solid #0d948840", borderRadius: "4px", padding: "0.1rem 0.5rem", fontSize: "0.65rem", color: "#2dd4bf", fontFamily: "'IBM Plex Mono', monospace" }}>LAST 14 DAYS</span>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 2rem" }}>

        {loading && (
          <div style={{ color: "#475569", textAlign: "center", padding: "4rem", fontSize: "0.9rem" }}>Loading analytics…</div>
        )}

        {!loading && !data && (
          <div style={{ color: "#ef4444", textAlign: "center", padding: "4rem", fontSize: "0.9rem" }}>Failed to load analytics. Make sure Firebase is connected.</div>
        )}

        {!loading && data && (
          <>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <StatCard label="Total Page Views (14d)" value={data.totalViews.toLocaleString("en-IN")} color="#2dd4bf" />
              <StatCard label="Today's Views" value={(data.daily[data.daily.length - 1]?.views ?? 0).toLocaleString("en-IN")} color="#60a5fa" />
              <StatCard label="Yesterday" value={(data.daily[data.daily.length - 2]?.views ?? 0).toLocaleString("en-IN")} color="#a78bfa" />
              <StatCard label="Daily Avg" value={data.daily.length ? Math.round(data.totalViews / data.daily.length).toLocaleString("en-IN") : "—"} color="#fbbf24" />
            </div>

            {/* Bar chart */}
            <div style={{ background: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.75rem" }}>
              <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: "0.9rem", marginBottom: "1.25rem" }}>📈 Daily Page Views</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "140px" }}>
                {data.daily.map((d, i) => {
                  const pct = maxViews > 0 ? (d.views / maxViews) * 100 : 0;
                  const isToday = i === data.daily.length - 1;
                  return (
                    <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                        <div
                          title={`${d.date}: ${d.views} views`}
                          style={{
                            width: "100%",
                            height: `${Math.max(pct, 3)}%`,
                            backgroundColor: isToday ? "#2dd4bf" : "#1e4080",
                            borderRadius: "3px 3px 0 0",
                            transition: "height 0.3s ease",
                            cursor: "default",
                          }}
                        />
                      </div>
                      <div style={{ fontSize: "0.52rem", color: isToday ? "#2dd4bf" : "#334155", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", textAlign: "center" }}>
                        {d.date.split(" ")[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
                {data.daily.slice(-3).reverse().map(d => (
                  <div key={d.date} style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {d.date}: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{d.views.toLocaleString("en-IN")}</span> views
                  </div>
                ))}
              </div>
            </div>

            {/* Top pages */}
            <div style={{ background: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "14px", padding: "1.5rem" }}>
              <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: "0.9rem", marginBottom: "1.25rem" }}>🔝 Top Pages (14d)</div>
              {data.topPages.length === 0 ? (
                <div style={{ color: "#475569", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem 0" }}>No page-level data yet. Visit a few pages to populate this.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {data.topPages.map((p, i) => {
                    const maxP = data.topPages[0].views;
                    const pct  = maxP > 0 ? (p.views / maxP) * 100 : 0;
                    return (
                      <div key={p.path} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "20px", textAlign: "right", fontSize: "0.72rem", color: "#334155", flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "3px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.path}
                            </span>
                            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#2dd4bf", flexShrink: 0 }}>
                              {p.views.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div style={{ height: "4px", background: "#0a1628", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? "#2dd4bf" : "#1e4080", borderRadius: "2px", transition: "width 0.4s ease" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1.25rem" }}>
      <div style={{ fontSize: "0.68rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.35rem" }}>{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
    </div>
  );
}
