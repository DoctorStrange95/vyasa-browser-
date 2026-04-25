"use client";

import { useEffect, useState, useRef } from "react";

interface FileItem {
  _id: string; name: string; mimeType: string;
  size: number; uploadedAt: string; uid: string;
}
interface Session { name: string; email: string; }

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf") return <span>📄</span>;
  if (mimeType.startsWith("image/")) return <span>🖼️</span>;
  return <span>📎</span>;
}

export default function HealthLocker() {
  const [session, setSession]   = useState<Session | null | "loading">("loading");
  const [files, setFiles]       = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [toast, setToast]       = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // LoginForm state
  const [mode, setMode]         = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw]   = useState("");
  const [regName, setRegName]   = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check session
  const checkSession = async () => {
    try {
      const r = await fetch("/api/citizens/me");
      if (r.ok) setSession(await r.json());
      else setSession(null);
    } catch { setSession(null); }
  };

  useEffect(() => { checkSession(); }, []);

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const r = await fetch("/api/citizens/locker");
      const d = await r.json();
      setFiles(d.files ?? []);
    } catch { } finally { setLoadingFiles(false); }
  };

  useEffect(() => {
    if (session && session !== "loading") loadFiles();
  }, [session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/user/login" : "/api/auth/user/register";
      const body = mode === "login"
        ? { email: loginEmail, password: loginPw }
        : { name: regName, email: loginEmail, password: loginPw };
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setAuthError(d.error ?? "Authentication failed."); return; }
      setSession({ name: d.name, email: d.email });
    } catch { setAuthError("Network error. Please try again."); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/user/logout", { method: "POST" });
    setSession(null);
    setFiles([]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 700 * 1024) {
      showToast("File too large (max 500 KB). Please compress and retry.", "err");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/citizens/locker/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) { showToast(d.error ?? "Upload failed.", "err"); return; }
      showToast(`${file.name} uploaded successfully.`);
      await loadFiles();
    } catch { showToast("Upload failed. Please try again.", "err"); }
    finally { setUploading(false); }
  };

  const handleDownload = async (f: FileItem) => {
    setDownloadId(f._id);
    try {
      const r = await fetch("/api/citizens/locker", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: f._id }) });
      const d = await r.json();
      if (!r.ok) { showToast(d.error ?? "Download failed.", "err"); return; }
      const dataUrl = `data:${d.mimeType};base64,${d.data}`;
      const a = document.createElement("a");
      a.href = dataUrl; a.download = d.name; a.click();
    } catch { showToast("Download failed.", "err"); }
    finally { setDownloadId(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const r = await fetch("/api/citizens/locker", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!r.ok) { const d = await r.json(); showToast(d.error ?? "Delete failed.", "err"); return; }
      showToast(`${name} deleted.`);
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch { showToast("Delete failed.", "err"); }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px",
    border: "1px solid #1e3a5f", background: "#0d1f3c", color: "#e2e8f0",
    fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
  };
  const btn: React.CSSProperties = {
    padding: "0.6rem 1.5rem", borderRadius: "8px", border: "none",
    background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: "0.88rem",
    cursor: "pointer", width: "100%",
  };

  // ── Loading ──
  if (session === "loading") {
    return <div style={{ color: "#64748b", padding: "2rem", textAlign: "center" }}>Loading…</div>;
  }

  // ── Not logged in ──
  if (!session) {
    return (
      <div style={{ maxWidth: "400px", margin: "0 auto", padding: "1rem 0" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔐</div>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Sign in to securely store your health documents — prescriptions, reports, vaccination certificates and health cards.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0", marginBottom: "1.25rem", border: "1px solid #1e3a5f", borderRadius: "8px", overflow: "hidden" }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "0.5rem", border: "none", fontSize: "0.85rem",
              background: mode === m ? "#1e3a5f" : "transparent",
              color: mode === m ? "#93c5fd" : "#64748b", cursor: "pointer",
            }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth}>
          {mode === "register" && (
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>FULL NAME</label>
              <input style={inp} required placeholder="Your name" value={regName} onChange={(e) => setRegName(e.target.value)} />
            </div>
          )}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>EMAIL</label>
            <input style={inp} type="email" required placeholder="your@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "0.3rem" }}>PASSWORD</label>
            <input style={inp} type="password" required minLength={8} placeholder="Min 8 characters" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} />
          </div>
          {authError && <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{authError}</p>}
          <button type="submit" style={{ ...btn, opacity: authLoading ? 0.6 : 1 }} disabled={authLoading}>
            {authLoading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    );
  }

  // ── Logged in ──
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
          background: toast.type === "ok" ? "#166534" : "#7f1d1d",
          color: "#fff", padding: "0.75rem 1.25rem", borderRadius: "8px",
          fontSize: "0.85rem", boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{session.name}</div>
          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{session.email}</div>
        </div>
        <button onClick={handleLogout} style={{ background: "transparent", color: "#64748b", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.78rem", cursor: "pointer" }}>
          Sign out
        </button>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: "2px dashed #1e3a5f", borderRadius: "10px", padding: "1.5rem",
          textAlign: "center", cursor: "pointer", marginBottom: "1.25rem",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e3a5f")}
      >
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleUpload} />
        <div style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>⬆️</div>
        <div style={{ color: "#93c5fd", fontWeight: 500, fontSize: "0.9rem" }}>
          {uploading ? "Uploading…" : "Upload a document"}
        </div>
        <div style={{ color: "#475569", fontSize: "0.78rem", marginTop: "0.25rem" }}>
          PDF, JPEG, PNG, WebP · Max 500 KB
        </div>
      </div>

      {/* File list */}
      {loadingFiles && <div style={{ color: "#64748b", textAlign: "center", fontSize: "0.88rem", padding: "1rem" }}>Loading files…</div>}

      {!loadingFiles && files.length === 0 && (
        <div style={{ color: "#475569", textAlign: "center", fontSize: "0.88rem", padding: "1.5rem", border: "1px dashed #1e3a5f", borderRadius: "10px" }}>
          No documents uploaded yet. Your prescriptions, reports and health cards will appear here.
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {files
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
            .map((f) => (
              <div key={f._id} style={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.2rem" }}><FileIcon mimeType={f.mimeType} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: "#e2e8f0", fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {fmtBytes(f.size)} · {new Date(f.uploadedAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(f)}
                  disabled={downloadId === f._id}
                  style={{ background: "#0f3460", color: "#93c5fd", border: "none", borderRadius: "6px", padding: "0.35rem 0.65rem", fontSize: "0.78rem", cursor: "pointer" }}
                >
                  {downloadId === f._id ? "…" : "⬇"}
                </button>
                <button
                  onClick={() => handleDelete(f._id, f.name)}
                  style={{ background: "transparent", color: "#64748b", border: "none", borderRadius: "6px", padding: "0.35rem 0.5rem", fontSize: "0.88rem", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            ))}
        </div>
      )}

      <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#050d1a", borderRadius: "8px", fontSize: "0.75rem", color: "#334155" }}>
        🔒 Your documents are stored privately and are only accessible with your account. Maximum 500 KB per file.
      </div>
    </div>
  );
}
