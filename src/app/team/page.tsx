import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Our Team — Vyasa · Built from the Ward",
  description: "Meet the clinicians, technologists, and operators building Vyasa — India's clinical coordination system. Founded by Dr. Nilanjan Roy, MD (AIIMS Patna).",
};

const CREDENTIALS = [
  { label: "AIIMS Patna",         sub: "MD Community & Family Medicine" },
  { label: "AIIMS Rishikesh",     sub: "Senior Resident (Clinical Practice)" },
  { label: "Burdwan Medical",     sub: "MBBS 2019 · 5+ Years Clinical" },
  { label: "Harvard HSIL 2025",   sub: "Hackathon Selected · IIT Patna Hub" },
];

const EXPERTISE = [
  "Public health surveillance & IDSP workflow",
  "Primary, secondary & tertiary care delivery",
  "PHC app design & community health programs",
  "Disease burden analytics — NCD & communicable",
  "Clinical coordination across ward settings",
  "Health data governance & MoHFW protocols",
];

const TIMELINE = [
  { year: "2019",      label: "MBBS",                   desc: "Burdwan Medical College — graduated with clinical honors" },
  { year: "2019–22",   label: "MD Community Medicine",   desc: "AIIMS Patna — population-level health, IDSP surveillance, PHC system design" },
  { year: "2022–24",   label: "Senior Resident",         desc: "AIIMS Rishikesh — advanced clinical practice, tertiary care workflows" },
  { year: "2024",      label: "PHC App",                 desc: "Built & deployed proof-of-concept at AIIMS — first clinical digital tool" },
  { year: "2025",      label: "Harvard HSIL Hackathon",  desc: "Selected participant at IIT Patna India Hub — validated product-market fit" },
  { year: "Jan 2026",  label: "Vyasa Founded",           desc: "Incorporated Vyasa Integrated Healthcare Pvt Ltd (CIN: U86909WR2026PT*29280)" },
];

const TEAM = [
  {
    name:     "Roshni Basu",
    role:     "Co-Director · Operations & Strategy",
    avatar:   "/team/roshni.jpg",
    initials: "RB",
    color:    "#a855f7",
    degree:   "MSc Forensic Sciences",
    links: [
      { label: "LinkedIn", href: "https://linkedin.com/in/roshni-basu-a950b3256/" },
      { label: "Email",    href: "mailto:roshni.basu97@gmail.com" },
    ],
    bullets: [
      "Strategic partner in business development",
      "Operations & compliance co-lead",
      "Brings complementary forensic-science lens to healthcare data governance",
    ],
  },
  {
    name:     "Yashvardhan Shaktawat",
    role:     "Tech Co-Founder · Engineering",
    avatar:   "/team/yashvardhan.jpg",
    initials: "YS",
    color:    "#3b82f6",
    degree:   "Economics · IIT Patna",
    links: [
      { label: "LinkedIn", href: "https://linkedin.com/in/yashvardhan-shaktawat/" },
      { label: "Email",    href: "mailto:yashvardhansingh012@gmail.com" },
    ],
    bullets: [
      "Full-stack: Node.js, APIs, real-time systems, databases",
      "Built a complete clinical app on React Native end-to-end",
      "Product design, backend architecture & real-time data handling",
    ],
  },
];

function Avatar({ src, initials, size, color }: { src: string; initials: string; size: number; color: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: `3px solid ${color}40`, flexShrink: 0, position: "relative", backgroundColor: `${color}20` }}>
      <Image
        src={src}
        alt={initials}
        width={size}
        height={size}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
        onError={undefined}
      />
      {/* Fallback initials rendered via CSS if image fails */}
    </div>
  );
}

export default function TeamPage() {
  return (
    <div style={{ backgroundColor: "#070f1e", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section style={{ backgroundColor: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "4rem 1.5rem 3.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ fontSize: "0.65rem", color: "#2dd4bf", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.75rem" }}>
            The Team
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: "0.85rem", letterSpacing: "-0.02em" }}>
            Built from the ward,<br />not the boardroom.
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#64748b", lineHeight: 1.8, maxWidth: "580px", margin: 0 }}>
            Every feature in Vyasa comes from a real frustration lived inside an Indian hospital — not a product manager&apos;s spreadsheet. We are clinicians, engineers, and operators who decided to fix it ourselves.
          </p>
        </div>
      </section>

      {/* ── FOUNDER — Dr. Nilanjan Roy ── */}
      <section style={{ borderBottom: "1px solid #1e3a5f", padding: "3.5rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Tag */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#0d948815", border: "1px solid #0d948840", borderRadius: "5px", padding: "0.2rem 0.75rem", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.6rem", color: "#2dd4bf", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Founder & CEO</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "flex-start" }}>

            {/* Photo + name block */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
              <div style={{
                width: "160px", height: "160px", borderRadius: "50%",
                border: "3px solid #0d948860", overflow: "hidden",
                position: "relative", backgroundColor: "#0f2040",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Image
                  src="/team/nilanjan.jpg"
                  alt="Dr. Nilanjan Roy"
                  width={160} height={160}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>Dr. Nilanjan Roy</div>
                <div style={{ fontSize: "0.75rem", color: "#2dd4bf", marginTop: "0.2rem" }}>MD (AIIMS Patna)</div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", justifyContent: "center" }}>
                  <a href="https://linkedin.com/in/dr-nilanjan-roy-516403a8/" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "0.7rem", backgroundColor: "#0a1e3d", border: "1px solid #1e3a5f", color: "#60a5fa", borderRadius: "5px", padding: "0.3rem 0.7rem", textDecoration: "none", fontWeight: 600 }}>
                    LinkedIn
                  </a>
                  <a href="mailto:nilanjan1995@gmail.com"
                    style={{ fontSize: "0.7rem", backgroundColor: "#0a1e3d", border: "1px solid #1e3a5f", color: "#94a3b8", borderRadius: "5px", padding: "0.3rem 0.7rem", textDecoration: "none", fontWeight: 600 }}>
                    Email
                  </a>
                </div>
              </div>
            </div>

            {/* Credentials + story */}
            <div style={{ flex: 1, minWidth: "280px" }}>

              {/* Credential badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {CREDENTIALS.map(c => (
                  <div key={c.label} style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "0.55rem 0.9rem" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e2e8f0" }}>{c.label}</div>
                    <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: "0.1rem" }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Story paragraph */}
              <div style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderLeft: "3px solid #0d9488", borderRadius: "10px", padding: "1.25rem 1.4rem", marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.8, margin: 0 }}>
                  &ldquo;I spent years watching doctors handwrite prescriptions that nurses couldn&apos;t read, seeing patients deteriorate because a lab result sat in a fax queue for two hours, and watching billing teams manually re-enter every clinical action at end of shift. Vyasa is the system I wanted on every ward I worked — built for Indian hospitals as they actually are, not as a textbook imagines them.&rdquo;
                </p>
                <div style={{ fontSize: "0.7rem", color: "#334155", marginTop: "0.75rem" }}>— Dr. Nilanjan Roy, Founder & CEO</div>
              </div>

              {/* Expertise list */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "0.45rem" }}>
                {EXPERTISE.map(e => (
                  <div key={e} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
                    <span style={{ color: "#0d9488", flexShrink: 0, marginTop: "1px" }}>▸</span>
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Clinical Journey ── */}
      <section style={{ backgroundColor: "#060e1c", borderBottom: "1px solid #1e3a5f", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>Clinical Journey</div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", marginBottom: "2rem" }}>From ward to founder — 7 years of building this in his head</h2>

          <div style={{ position: "relative", paddingLeft: "1.75rem" }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: "6px", top: "8px", bottom: "8px", width: "2px", backgroundColor: "#1e3a5f" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {TIMELINE.map((t, i) => (
                <div key={i} style={{ position: "relative", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                  {/* Dot */}
                  <div style={{ position: "absolute", left: "-1.75rem", top: "4px", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#0d9488", border: "2px solid #060e1c", flexShrink: 0 }} />
                  <div style={{ flex: 1, backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "9px", padding: "0.9rem 1.1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem", alignItems: "baseline" }}>
                    <span style={{ fontSize: "0.68rem", color: "#0d9488", fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>{t.year}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0" }}>{t.label}</span>
                    <span style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5, flex: "1 1 100%" }}>{t.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Rest of team ── */}
      <section style={{ borderBottom: "1px solid #1e3a5f", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>Co-Founders</div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", marginBottom: "2rem" }}>The team behind the platform</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1.25rem" }}>
            {TEAM.map(m => (
              <div key={m.name} style={{ backgroundColor: "#080f1e", border: "1px solid #1e3a5f", borderTop: `3px solid ${m.color}`, borderRadius: "12px", padding: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1rem" }}>
                  {/* Avatar */}
                  <div style={{
                    width: "60px", height: "60px", borderRadius: "50%",
                    border: `2px solid ${m.color}50`, overflow: "hidden",
                    backgroundColor: `${m.color}20`, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem", fontWeight: 700, color: m.color,
                  }}>
                    <Image src={m.avatar} alt={m.name} width={60} height={60} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#e2e8f0" }}>{m.name}</div>
                    <div style={{ fontSize: "0.72rem", color: m.color, marginTop: "0.15rem" }}>{m.role}</div>
                    <div style={{ fontSize: "0.68rem", color: "#475569", marginTop: "0.15rem" }}>{m.degree}</div>
                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                      {m.links.map(l => (
                        <a key={l.label} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                          style={{ fontSize: "0.65rem", backgroundColor: "#0a1628", border: "1px solid #1e3a5f", color: "#64748b", borderRadius: "4px", padding: "0.2rem 0.55rem", textDecoration: "none" }}>
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {m.bullets.map(b => (
                    <div key={b} style={{ display: "flex", gap: "0.5rem", fontSize: "0.78rem", color: "#64748b", alignItems: "flex-start" }}>
                      <span style={{ color: m.color, flexShrink: 0 }}>▸</span><span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Validation strip ── */}
      <section style={{ backgroundColor: "#060e1c", borderBottom: "1px solid #1e3a5f", padding: "2rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
            {[
              { icon: "🏛️", title: "AIIMS Patna",           sub: "MD + PHC App Deployment" },
              { icon: "🏛️", title: "AIIMS Rishikesh",       sub: "Senior Residency — Tertiary Care" },
              { icon: "🎓", title: "IIT Patna",              sub: "Tech Co-Founder · Economics" },
              { icon: "🌐", title: "Harvard HSIL 2025",      sub: "Hackathon Selected Participant" },
              { icon: "🏢", title: "Incorporated 2026",      sub: "Vyasa Integrated Healthcare Pvt Ltd" },
            ].map(v => (
              <div key={v.title} style={{ backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "9px", padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.3rem" }}>{v.icon}</span>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>{v.title}</div>
                  <div style={{ fontSize: "0.65rem", color: "#475569" }}>{v.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "3rem 1.5rem 4rem", textAlign: "center" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>
            We&apos;re building with the first 100 clinicians
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            If you&apos;ve felt the same frustrations in your ward, clinic, or hospital — we want you on the platform before it ships.
          </p>
          <Link href="/join" style={{ backgroundColor: "#0d9488", color: "#fff", padding: "0.85rem 2rem", borderRadius: "10px", textDecoration: "none", fontSize: "0.95rem", fontWeight: 700, display: "inline-block" }}>
            Request Early Access →
          </Link>
        </div>
      </section>
    </div>
  );
}
