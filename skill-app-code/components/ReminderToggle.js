"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function ReminderToggle() {
  const [state, setState] = useState("loading"); // loading | unsupported | off | on | busy
  const [error, setError] = useState(null);

  useEffect(() => {
    async function check() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !VAPID_PUBLIC_KEY
      ) {
        setState("unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "on" : "off");
      } catch {
        setState("unsupported");
      }
    }
    check();
  }, []);

  async function turnOn() {
    setState("busy");
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications are blocked. Allow them in your browser settings, then try again.");
        setState("off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error("save failed");
      setState("on");
    } catch (e) {
      setError("Could not turn on reminders. Try again.");
      setState("off");
    }
  }

  async function turnOff() {
    setState("busy");
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setError("Could not turn off reminders.");
      setState("on");
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  const on = state === "on";
  const busy = state === "busy";

  return (
    <div className="flex items-center gap-3 bg-surface px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
        <IconBell className="h-[18px] w-[18px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-fg">Training reminders</span>
        <span className="truncate text-xs text-dim">
          {error || (on ? "On. A nudge if you go a few days without training." : "Off")}
        </span>
      </div>
      <button
        type="button"
        onClick={on ? turnOff : turnOn}
        disabled={busy}
        className={`shrink-0 rounded-field border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
          on
            ? "border-border text-muted hover:text-fg"
            : "border-accent/40 bg-accent-soft text-accent hover:bg-accent hover:text-black"
        }`}
      >
        {busy ? "..." : on ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}

function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
