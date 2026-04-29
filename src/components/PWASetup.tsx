"use client";

import { useEffect } from "react";

export default function PWASetup() {
  useEffect(() => {
    // Register service worker for offline caching — suppress the install banner
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    // Suppress the browser's built-in install prompt (address bar handles it)
    const suppress = (e: Event) => e.preventDefault();
    window.addEventListener("beforeinstallprompt", suppress);
    return () => window.removeEventListener("beforeinstallprompt", suppress);
  }, []);

  return null;
}
