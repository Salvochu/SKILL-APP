"use client";

import { useEffect } from "react";
import { whenPreloaded } from "@/lib/preloadGate";

// Fades out the first-paint splash (#skill-splash, rendered in the root
// layout) as soon as the app has mounted. No minimum display time: on a
// fast load it's barely seen, and it only lingers when loading is
// genuinely slow. Only toggles a class (opacity 0 + pointer-events none)
// so the node stays in React's tree and nothing can reconcile it back.
//
// In the signed-in app it first waits for the main screens to finish
// loading in the background (lib/preloadGate.js), at most 2.5 seconds,
// so everything is instant once the logo goes.
export default function SplashGate() {
  useEffect(() => {
    const el = document.getElementById("skill-splash");
    if (!el) return;
    let raf = 0;
    let cancelled = false;
    whenPreloaded(2500).then(() => {
      if (cancelled) return;
      // One frame so the page underneath has painted before the fade starts.
      raf = requestAnimationFrame(() => {
        el.classList.add("skill-splash-gone");
        // So "how long until the app is usable" can be read from the
        // browser's performance timeline.
        performance.mark?.("skill-splash-gone");
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
