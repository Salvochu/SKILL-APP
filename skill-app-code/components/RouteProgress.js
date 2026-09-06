"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// A thin bar across the very top that appears the moment an internal link
// is tapped and completes when the new route commits, so a slow
// navigation always shows that something is happening. Catches any <a>
// (Link, TapLink) via a capturing click listener; same-page and external
// links are ignored.
export default function RouteProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState("idle"); // idle | loading | done

  // Route committed -> finish the bar.
  useEffect(() => {
    function settle() {
      setPhase((p) => (p === "loading" ? "done" : "idle"));
    }
    settle();
  }, [pathname]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => setPhase("idle"), 400);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download")) return;
      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setPhase("loading");
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[60] h-[3px] bg-accent ${
        phase === "loading"
          ? "w-[88%] opacity-100 transition-[width] duration-[6000ms] ease-out"
          : phase === "done"
            ? "w-full opacity-0 transition-all duration-300"
            : "w-0 opacity-0"
      }`}
      style={{ boxShadow: phase === "idle" ? "none" : "0 0 8px var(--color-accent)" }}
    />
  );
}
