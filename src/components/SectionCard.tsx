import type { ReactNode } from "react";

export default function SectionCard({
  id, icon, title, badge, children, accent = "#1e3a5f",
}: {
  id?: string;
  icon: string;
  title: string;
  badge?: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <section
      id={id}
      style={{ backgroundColor: "#0a1628", border: `1px solid #1e3a5f`, borderTop: `3px solid ${accent}`, borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem", scrollMarginTop: "90px" }}
    >
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1.25rem", borderBottom: "1px solid #1e3a5f", backgroundColor: "#080f1e" }}>
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
        {badge && (
          <span style={{ marginLeft: "auto", fontSize: "0.6rem", backgroundColor: "#0d948820", color: "#2dd4bf", border: "1px solid #0d948840", borderRadius: "4px", padding: "0.1rem 0.4rem", fontFamily: "monospace" }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </section>
  );
}
