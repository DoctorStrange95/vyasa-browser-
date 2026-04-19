import Link from "next/link";

export default function DistrictNotFound() {
  return (
    <div style={{ maxWidth: "600px", margin: "8rem auto", padding: "0 1.5rem", textAlign: "center" }}>
      <div className="font-data" style={{ fontSize: "4rem", color: "#1e3a5f", marginBottom: "1rem" }}>404</div>
      <h1 className="font-display" style={{ fontSize: "1.75rem", color: "#fff", marginBottom: "0.75rem" }}>
        District not found
      </h1>
      <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: 1.7 }}>
        We don&apos;t have data for this district yet. More districts are being added regularly.
      </p>
      <Link
        href="/"
        style={{
          backgroundColor: "#0d9488",
          color: "#fff",
          padding: "0.65rem 1.5rem",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "0.9rem",
        }}
      >
        ← Back to all districts
      </Link>
    </div>
  );
}
