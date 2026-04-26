import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getAdminDb } from "@/lib/firestore-admin";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getAdminDb();
    // Fetch last 14 days of analytics docs
    const days: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10).replace(/-/g, ""));
    }

    const docs = await Promise.all(
      days.map(day => db.collection("analytics").doc(`pv_${day}`).get())
    );

    const daily: { date: string; views: number }[] = [];
    const pathCounts: Record<string, number> = {};

    for (const doc of docs) {
      if (!doc.exists) continue;
      const data = doc.data() as Record<string, number | string>;
      const dateStr = String(data.date ?? "");
      const views   = Number(data.views ?? 0);
      // Format date for display: "20260426" → "Apr 26"
      const y = dateStr.slice(0, 4);
      const m = dateStr.slice(4, 6);
      const dd = dateStr.slice(6, 8);
      const label = new Date(`${y}-${m}-${dd}`).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      daily.push({ date: label, views });

      // Aggregate per-path counts
      for (const [k, v] of Object.entries(data)) {
        if (!k.startsWith("path_")) continue;
        const path = k.slice(5).replace(/_/g, "/").replace(/\/\//g, "//");
        pathCounts[path] = (pathCounts[path] ?? 0) + Number(v);
      }
    }

    // Top 10 paths by visits
    const topPages = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, views]) => ({ path: path.startsWith("/") ? path : "/" + path, views }));

    const totalViews = daily.reduce((s, d) => s + d.views, 0);

    return NextResponse.json({
      totalViews,
      daily: daily.reverse(), // chronological order
      topPages,
    });
  } catch (e) {
    console.error("analytics error", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
