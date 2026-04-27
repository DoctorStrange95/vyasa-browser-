"use client";
import { useEffect, useState } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
  return arr.buffer;
}

type Status = "unsupported" | "default" | "granted" | "denied" | "loading";

export default function PushNotificationSetup({ state }: { state?: string }) {
  const [status, setStatus] = useState<Status>("default");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !VAPID_PUBLIC) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as Status);
  }, []);

  async function subscribe() {
    if (!VAPID_PUBLIC) return;
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), action: "subscribe", state: state ?? null }),
      });

      setStatus("granted");
    } catch {
      setStatus(Notification.permission as Status);
    }
  }

  async function unsubscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON(), action: "unsubscribe" }),
        });
        await sub.unsubscribe();
      }
      setStatus("default");
    } catch {
      setStatus("granted");
    }
  }

  if (status === "unsupported") return null;

  if (status === "granted") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "0.75rem 1rem" }}>
        <span style={{ fontSize: "1.1rem" }}>🔔</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>Push Alerts Active</div>
          <div style={{ fontSize: "0.72rem", color: "#475569" }}>You&apos;ll be notified on new outbreak alerts{state ? ` in ${state}` : ""}</div>
        </div>
        <button
          onClick={unsubscribe}
          style={{ fontSize: "0.72rem", color: "#475569", background: "none", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.3rem 0.6rem", cursor: "pointer", fontFamily: "inherit" }}
        >
          Turn off
        </button>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={{ fontSize: "0.78rem", color: "#475569", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "0.75rem 1rem" }}>
        🔕 Notifications blocked — enable them in browser settings to receive outbreak alerts.
      </div>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === "loading"}
      style={{
        display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
        backgroundColor: "#0d948815", border: "1px solid #0d948840",
        borderRadius: "10px", padding: "0.85rem 1rem",
        cursor: status === "loading" ? "wait" : "pointer",
        fontFamily: "inherit", textAlign: "left",
      }}
    >
      <span style={{ fontSize: "1.25rem" }}>🔔</span>
      <div>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2dd4bf" }}>
          {status === "loading" ? "Setting up…" : "Enable outbreak alerts"}
        </div>
        <div style={{ fontSize: "0.72rem", color: "#475569" }}>
          Get push notifications for IDSP disease outbreaks{state ? ` in ${state}` : " near you"}
        </div>
      </div>
    </button>
  );
}
