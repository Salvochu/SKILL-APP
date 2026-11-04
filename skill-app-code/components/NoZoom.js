"use client";

import { useEffect } from "react";

// Safari on iPhone ignores the viewport's "no zooming" setting for
// pinches, so the pinch itself is cancelled here. These gesture events
// only exist in Safari; elsewhere this does nothing (the viewport setting
// in app/layout.js already covers Android). The phone's own Zoom and
// text size settings in Accessibility still work.
export default function NoZoom() {
  useEffect(() => {
    const stop = (e) => e.preventDefault();
    const events = ["gesturestart", "gesturechange", "gestureend"];
    events.forEach((name) => document.addEventListener(name, stop, { passive: false }));
    return () => events.forEach((name) => document.removeEventListener(name, stop));
  }, []);
  return null;
}
