"use client";

import { useEffect } from "react";

// Fades out the first-paint splash (#skill-splash, rendered in the root
// layout) once the app has mounted. Kept brief: a couple of heartbeats,
// then gone. Only toggles a class (opacity 0 + pointer-events none) so
// the node stays in React's tree and nothing can reconcile it back.
export default function SplashGate() {
  useEffect(() => {
    const el = document.getElementById("skill-splash");
    if (!el) return;
    const t = setTimeout(() => el.classList.add("skill-splash-gone"), 650);
    return () => clearTimeout(t);
  }, []);

  return null;
}
