"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWASetup() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }

    // Capture install prompt (Chrome / Android)
    const handler = (e: Event) => {
      e.preventDefault();
      // Don't show if user already dismissed this session
      const wasDismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!wasDismissed) setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "dismissed") {
      sessionStorage.setItem("pwa_install_dismissed", "1");
    }
    setInstallPrompt(null);
  }

  function handleDismiss() {
    sessionStorage.setItem("pwa_install_dismissed", "1");
    setDismissed(true);
    setInstallPrompt(null);
  }

  if (!installPrompt || dismissed) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "5rem",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9997,
      width: "min(420px, calc(100vw - 2rem))",
      backgroundColor: "#0a1628",
      border: "1px solid #0d9488",
      borderRadius: "14px",
      padding: "1rem 1.25rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      boxShadow: "0 8px 32px #00000080",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon.svg" alt="" width={40} height={40} style={{ borderRadius: "10px", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.15rem" }}>
          Add HealthForIndia to your home screen
        </div>
        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
          Works offline · Fast · No app store needed
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button onClick={handleDismiss}
          style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.1rem", padding: "0.25rem", lineHeight: 1 }}
          aria-label="Dismiss">✕</button>
        <button onClick={handleInstall}
          style={{ background: "#0d9488", border: "none", color: "#fff", borderRadius: "7px", padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          Install
        </button>
      </div>
    </div>
  );
}
