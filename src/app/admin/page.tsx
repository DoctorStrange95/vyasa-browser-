import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLogout from "./AdminLogout";
import VyasaLogo from "@/components/VyasaLogo";

const MENU = [
  { href: "/admin/intelligence",  icon: "🛰", label: "Intelligence Review",    desc: "Approve or reject scraped PH alerts before they go live" },
  { href: "/admin/feedback",     icon: "💬", label: "Feedback & Reports",    desc: "View data correction requests and user reports" },
  { href: "/admin/hospitals",    icon: "🏥", label: "Manage Health Centres", desc: "Add PHCs, CHCs, hospitals with address & services" },
  { href: "/admin/data",         icon: "📊", label: "Upload Health Data",     desc: "Update state/district statistics before going live" },
  { href: "/admin/contributors", icon: "👥", label: "Contributors & Sponsors", desc: "Manage data authors, sponsors, acknowledgements" },
  { href: "/sources",            icon: "📚", label: "Data Sources (public)",   desc: "View live public-facing data sources page" },
  { href: "/",                   icon: "🌐", label: "View Live Site",          desc: "Open the public-facing HealthForIndia portal" },
];

export default async function AdminDashboard() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e", padding: "0" }}>
      {/* Top bar */}
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <VyasaLogo size={32} />
          <span className="font-display" style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Admin Panel</span>
          <span style={{ backgroundColor: "#0d948820", border: "1px solid #0d948840", borderRadius: "4px", padding: "0.1rem 0.5rem", fontSize: "0.65rem", color: "#2dd4bf", fontFamily: "'IBM Plex Mono', monospace" }}>MASTER</span>
        </div>
        <AdminLogout />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "0.4rem" }}>
            Dashboard
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem" }}>
            Manage HealthForIndia data, feedback, health centres and contributors.
          </p>
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {[
            { label: "States covered", value: "36", color: "#2dd4bf" },
            { label: "Cities monitored", value: "213", color: "#2dd4bf" },
            { label: "Data source", value: "SRS 2023", color: "#6366f1" },
            { label: "Last cron run", value: "Daily 2AM", color: "#eab308" },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.68rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.3rem" }}>{s.label}</div>
              <div className="font-data" style={{ fontSize: "1.4rem", fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Menu grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {MENU.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div className="admin-menu-card">
                <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{item.icon}</div>
                <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "1rem", marginBottom: "0.3rem" }}>{item.label}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Cron status */}
        <div style={{ marginTop: "2.5rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "0.25rem" }}>Daily Data Refresh</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                Runs at 02:00 UTC daily via Vercel Cron · Refreshes AQI, PHC/CHC counts, checks data.gov.in for updates
              </div>
            </div>
            <a href="/api/cron/refresh" target="_blank" rel="noreferrer"
              style={{ backgroundColor: "#0d9488", color: "#fff", textDecoration: "none", borderRadius: "7px", padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap" }}>
              Trigger Now ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
