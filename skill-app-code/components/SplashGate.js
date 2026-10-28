"use client";

import { useEffect } from "react";

// Fades out the first-paint splash (#skill-splash, rendered in the root
// layout) as soon as the app has mounted. No minimum display time: on a
// fast load it's barely seen, and it only lingers when loading is
// genuinely slow. Only toggles a class (opacity 0 + pointer-events none)
// so the node stays in React's tree and nothing can reconcile it back.
export default function SplashGate() {
  useEffect(() => {
    const el = document.getElementById("skill-splash");
    if (!el) return;
    // One frame so the page underneath has painted before the fade starts.
    const raf = requestAnimationFrame(() => el.classList.add("skill-splash-gone"));
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
