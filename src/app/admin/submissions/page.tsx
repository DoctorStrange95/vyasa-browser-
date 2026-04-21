import { getAdminSession } from "@/lib/auth";
import { fsList } from "@/lib/firestore";
import { redirect } from "next/navigation";
import Link from "next/link";
import SubmissionReviewer from "./SubmissionReviewer";

export default async function SubmissionsPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const all = await fsList("pendingSubmissions", 200);
  const pending  = all.filter(s => s.status === "pending");
  const reviewed = all.filter(s => s.status !== "pending");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/admin" style={{ fontSize: "0.78rem", color: "#475569", textDecoration: "none" }}>← Dashboard</Link>
        <span style={{ color: "#1e3a5f" }}>|</span>
        <span className="font-display" style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Community Submissions</span>
        {pending.length > 0 && (
          <span style={{ backgroundColor: "#ef444420", border: "1px solid #ef444440", color: "#f87171", borderRadius: "20px", padding: "0.1rem 0.6rem", fontSize: "0.65rem", fontWeight: 700 }}>
            {pending.length} pending
          </span>
        )}
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <SubmissionReviewer pending={pending} reviewed={reviewed} />
      </div>
    </div>
  );
}
