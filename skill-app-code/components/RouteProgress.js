"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// A thin bar across the very top that shows the moment a navigation
// starts and finishes when the new route commits, so nothing in the app
// ever feels like a dead tap. It catches:
//   - clicks on internal <a> (Link, TapLink)
//   - router.push / router.replace (via history.pushState/replaceState)
//   - browser back / forward (popstate)
// and completes on a pathname or query-string change, with a safety
// timeout so it can never get stuck.
export default function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [phase, setPhase] = useState("idle"); // idle | loading | done
  const safety = useRef(null);

  function start() {
    setPhase((p) => (p === "loading" ? p : "loading"));
  }

  // Route (or query) committed -> finish.
  useEffect(() => {
    function settle() {
      setPhase((p) => (p === "loading" ? "done" : "idle"));
    }
    settle();
  }, [pathname, search]);

  useEffect(() => {
    if (phase === "loading") {
      clearTimeout(safety.current);
      safety.current = setTimeout(() => setPhase("done"), 10000);
      return () => clearTimeout(safety.current);
    }
    if (phase === "done") {
      const t = setTimeout(() => setPhase("idle"), 400);
      return () => clearTimeout(t);
    }
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
      start();
    }

    const { pushState, replaceState } = window.history;
    function wrap(fn) {
      return function (...args) {
        const nextUrl = args[2];
        if (nextUrl != null) {
          try {
            const u = new URL(String(nextUrl), window.location.href);
            if (u.pathname !== window.location.pathname || u.search !== window.location.search) start();
          } catch {
            /* ignore */
          }
        }
        return fn.apply(this, args);
      };
    }
    window.history.pushState = wrap(pushState);
    window.history.replaceState = wrap(replaceState);

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[70] h-[3px] bg-accent ${
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
