import { getUserSession } from "@/lib/userAuth";
import { fsQuery, fsGet } from "@/lib/firestore";
import { redirect } from "next/navigation";
import Link from "next/link";
import VyasaLogo from "@/components/VyasaLogo";
import UserLogout from "@/components/UserLogout";

export const metadata = { title: "My Profile — HealthForIndia" };

export default async function ProfilePage() {
  const session = await getUserSession();
  if (!session) redirect("/auth");

  const userRows = await fsGet("users", session.uid);
  const submissions = await fsQuery("pendingSubmissions", "submitterEmail", session.email, 50);
  const approved = submissions.filter(s => s.status === "approved").length;
  const pending  = submissions.filter(s => s.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#070f1e" }}>
      <div style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "0 2rem", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
          <VyasaLogo size={28} />
          <span className="font-display" style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>HealthForIndia</span>
        </Link>
        <UserLogout />
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        {/* Profile card */}
        <div style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "14px", padding: "1.75rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#0d948830", border: "1px solid #0d948860", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
              {session.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{session.name}</div>
              <div style={{ fontSize: "0.78rem", color: "#475569" }}>{session.email}</div>
              {userRows?.place ? <div style={{ fontSize: "0.72rem", color: "#334155", marginTop: "0.15rem" }}>📍 {String(userRows.place)}</div> : null}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[
              { label: "Submissions", value: submissions.length, color: "#2dd4bf" },
              { label: "Approved",    value: approved,            color: "#22c55e" },
              { label: "Pending",     value: pending,             color: "#eab308" },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderRadius: "9px", padding: "0.85rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
                <div style={{ fontSize: "0.65rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <Link href="/contribute" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", backgroundColor: "#0d9488", color: "#fff", textDecoration: "none", borderRadius: "9px", padding: "0.8rem", fontWeight: 700, fontSize: "0.88rem" }}>
            📎 Submit Data
          </Link>
          <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", color: "#94a3b8", textDecoration: "none", borderRadius: "9px", padding: "0.8rem", fontWeight: 600, fontSize: "0.88rem" }}>
            🌐 View Map
          </Link>
        </div>

        {/* Submissions history */}
        {submissions.length > 0 && (
          <div>
            <div style={{ fontSize: "0.72rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>My Submissions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {submissions.map(s => {
                const statusColor = s.status === "approved" ? "#22c55e" : s.status === "rejected" ? "#ef4444" : "#eab308";
                const parsed = (() => { try { return JSON.parse(s.extractedData as string); } catch { return {}; } })();
                return (
                  <div key={s._id} style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>{s.fileName as string}</div>
                        <div style={{ fontSize: "0.68rem", color: "#475569" }}>{s.state as string}{s.district ? ` · ${s.district}` : ""}</div>
                      </div>
                      <span style={{ fontSize: "0.62rem", backgroundColor: statusColor + "20", color: statusColor, borderRadius: "4px", padding: "0.15rem 0.5rem", fontWeight: 600, textTransform: "capitalize" }}>
                        {s.status as string}
                      </span>
                    </div>
                    {parsed.metrics?.length > 0 && (
                      <div style={{ fontSize: "0.68rem", color: "#334155" }}>{parsed.metrics.length} metrics extracted</div>
                    )}
                    {s.status === "rejected" && s.rejectionReason ? (
                      <div style={{ fontSize: "0.72rem", color: "#f87171", marginTop: "0.4rem", backgroundColor: "#ef444410", borderRadius: "5px", padding: "0.35rem 0.6rem" }}>
                        Reason: {String(s.rejectionReason)}
                      </div>
                    ) : null}
                    <div style={{ fontSize: "0.62rem", color: "#334155", marginTop: "0.35rem" }}>
                      Submitted {new Date(String(s.submittedAt)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
