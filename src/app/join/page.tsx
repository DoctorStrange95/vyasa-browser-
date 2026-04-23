import WaitlistForm from "@/components/WaitlistForm";

export const metadata = {
  title: "Join Vyasa — Early Access Waitlist",
  description: "Join the Vyasa intelligent health network. Built for doctors, hospitals, labs and pharmacies across India.",
};

export default function JoinPage() {
  return (
    <div style={{ backgroundColor: "#070f1e", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "3.5rem 1.5rem 3rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#0d948820", border: "1px solid #0d948840", borderRadius: "6px", padding: "0.3rem 0.9rem", marginBottom: "1.25rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2dd4bf", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "0.7rem", color: "#2dd4bf", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Early Access · Limited Seats</span>
          </div>

          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: "1rem" }}>
            Join the Vyasa<br />Intelligent Health Network
          </h1>

          <p style={{ fontSize: "0.95rem", color: "#64748b", lineHeight: 1.8, marginBottom: "1.75rem", maxWidth: "580px", margin: "0 auto 1.75rem" }}>
            We&apos;re building India&apos;s first connected clinical operating system — digital prescriptions, live lab integration, AI analytics, and public health surveillance — all in one platform. No clipboards. No phone calls.
          </p>

          {/* Floor previews */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem", marginBottom: "0" }}>
            {[
              { icon: "🏥", label: "Hospital" },
              { icon: "👨‍⚕️", label: "Doctor" },
              { icon: "👩‍⚕️", label: "Nurse" },
              { icon: "🧪", label: "Lab" },
              { icon: "💊", label: "Pharmacy" },
              { icon: "📡", label: "Surveillance" },
            ].map(f => (
              <span key={f.label} style={{ fontSize: "0.78rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", color: "#94a3b8", borderRadius: "7px", padding: "0.35rem 0.85rem" }}>
                {f.icon} {f.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why join callouts ── */}
      <section style={{ borderBottom: "1px solid #1e3a5f" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {[
              { icon: "✍️", title: "Kill paper prescriptions", desc: "Digital Rx with drug-interaction alerts, auto-history fill, one-tap send to pharmacy." },
              { icon: "📊", title: "Real analytics, not guesswork", desc: "AI summaries of patient trends, ward occupancy, and public health signals in your district." },
              { icon: "🔗", title: "Everything connected", desc: "Lab results reach doctors in seconds. Pharmacy confirms dispensing. Billing auto-populates." },
              { icon: "🗺️", title: "Public health intelligence", desc: "Outbreak alerts, IDSP feeds, and NCD burden data for your state — all in one dashboard." },
            ].map(c => (
              <div key={c.title} style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "1.1rem 1.25rem" }}>
                <div style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>{c.icon}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.4rem" }}>{c.title}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.55 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form ── */}
      <section style={{ padding: "2.5rem 1.5rem 5rem" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.75rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", margin: 0 }}>Tell us about yourself</h2>
            <span style={{ fontSize: "0.62rem", backgroundColor: "#6366f120", color: "#818cf8", border: "1px solid #6366f140", borderRadius: "4px", padding: "0.15rem 0.5rem", fontWeight: 700 }}>2 min</span>
          </div>
          <WaitlistForm />
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
