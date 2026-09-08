"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// A dim + blur veil with a spinner that drops over the whole app while a
// navigation is in flight, so a slow page load reads as "loading", not
// "broken". It waits a beat first (fast navigations never flash it) and
// clears the moment the new route commits, with a safety timeout so it
// can never get stuck. RouteProgress draws the thin top bar; this is the
// heavier cue for the ones that actually take a moment.
export default function NavigationOverlay() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [visible, setVisible] = useState(false);
  const delay = useRef(null);
  const safety = useRef(null);

  function start() {
    clearTimeout(delay.current);
    delay.current = setTimeout(() => {
      setVisible(true);
      clearTimeout(safety.current);
      safety.current = setTimeout(() => setVisible(false), 8000);
    }, 180);
  }
  function stop() {
    clearTimeout(delay.current);
    clearTimeout(safety.current);
    setVisible((v) => (v ? false : v));
  }

  // Route (or query) committed -> done.
  useEffect(() => {
    function settle() {
      stop();
    }
    settle();
  }, [pathname, search]);

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

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="nav-veil fixed inset-0 z-[65] flex items-center justify-center bg-bg/55 backdrop-blur-[2px]"
    >
      <span className="h-8 w-8 rounded-full border-2 border-border border-t-accent motion-safe:animate-spin" />
    </div>
  );
}
