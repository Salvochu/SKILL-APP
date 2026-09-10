"use client";

import { useEffect, useRef } from "react";

// Holds a screen wake lock while `active` is true, so the phone does not
// hit its idle auto-lock mid-workout. iOS releases the lock whenever the
// tab is hidden, so it is re-requested on visibilitychange. The hardware
// lock button still works; this only defeats the timeout.
export function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return undefined;
    }
    let cancelled = false;

    async function acquire() {
      if (cancelled || lockRef.current || document.visibilityState !== "visible") return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        lockRef.current = lock;
        lock.addEventListener?.("release", () => {
          lockRef.current = null;
        });
      } catch {
        // Not permitted right now (e.g. low battery mode); retry on the
        // next visibility change.
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") acquire();
    }

    acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lockRef.current?.release?.().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
