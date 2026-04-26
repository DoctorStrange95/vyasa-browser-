"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Never track admin routes
    if (pathname.startsWith("/admin")) return;

    // Only track if user accepted cookies
    let consent: string | null = null;
    try { consent = localStorage.getItem("cookie_consent"); } catch { /* blocked */ }
    if (consent !== "accepted") return;

    // Track each path only once per browser session (prevents refresh inflation)
    const sessionKey = `tracked_${pathname}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, "1");
    } catch { /* sessionStorage may be blocked */ }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
