"use client";

import { useEffect } from "react";

// Registers the offline-fallback service worker (public/sw.js). Silently
// does nothing on browsers without support, or if registration fails, so
// this can never break the normal (online) app.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
