import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SourcesSheet from "./SourcesSheet";

export default async function SourcesPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>
      <div style={{
        backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f",
        padding: "0 2rem", height: "60px",
        display: "flex", alignItems: "center", gap: "1rem",
      }}>
        <Link href="/admin" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.82rem" }}>← Dashboard</Link>
        <span style={{ color: "#1e3a5f" }}>|</span>
        <span style={{ color: "#fff", fontWeight: 700 }}>Sources & Data Sheets</span>
      </div>
      <SourcesSheet />
    </div>
  );
}
