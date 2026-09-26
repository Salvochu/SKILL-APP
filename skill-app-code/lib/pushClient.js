"use client";

// Browser-side half of push notifications: request permission, subscribe,
// save the subscription server-side. Shared by NotificationSettings.js
// (Settings) and ChallengeWelcome.js (the onboarding prompt) - previously
// only lived inline in the Settings component.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

export async function getPushSubscription() {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

// Must be called from a user gesture (a click) - the permission prompt
// will not appear otherwise. Returns { ok: true } or
// { ok: false, error: "unsupported" | "denied" | "save-failed" }.
export async function subscribeToPush() {
  if (!pushSupported()) return { ok: false, error: "unsupported" };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "denied" };
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
  if (!res.ok) return { ok: false, error: "save-failed" };
  return { ok: true };
}

export async function unsubscribeFromPush() {
  const sub = await getPushSubscription();
  if (!sub) return { ok: true };
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
  return { ok: true };
}
