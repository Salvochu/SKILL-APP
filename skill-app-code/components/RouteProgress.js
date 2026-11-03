"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_CANCEL, routeKey, urlKey } from "@/lib/navSignals";

// A thin bar across the very top that shows the moment a navigation
// starts and finishes when the new route commits, so nothing in the app
// ever feels like a dead tap. It catches:
//   - clicks on internal <a> (Link, TapLink)
//   - router.push / router.replace (via history.pushState/replaceState)
//   - browser back / forward (popstate)
// and completes on a pathname or query-string change, with a safety
// timeout so it can never get stuck.
//
// A signal for the screen already on show never starts it. Next calls
// pushState when a navigation commits, so with pages preloaded that call
// can arrive after the new screen is up; starting then left the bar
// crawling over a loaded page until the safety timeout.
export default function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [phase, setPhase] = useState("idle"); // idle | loading | done
  const safety = useRef(null);
  // The screen actually on show, in useSearchParams' encoding.
  const shown = useRef("");
  // Bumped when a tap is called off, so a start still waiting in its
  // microtask (below) knows not to go ahead.
  const cancels = useRef(0);

  function start(target) {
    if (target === shown.current) return;
    const ticket = cancels.current;
    // Deferred: start() is invoked synchronously from the patched
    // history.pushState/replaceState (see below), and Next's App Router
    // sometimes calls pushState/replaceState from inside its own
    // useInsertionEffect. Calling setPhase in that same tick trips React's
    // "useInsertionEffect must not schedule updates" guard, so push the
    // update to a microtask, safely outside that call stack.
    queueMicrotask(() => {
      if (target === shown.current || ticket !== cancels.current) return;
      setPhase((p) => (p === "loading" ? p : "loading"));
      // Back / forward to a screen still in memory can be on show before
      // any route change reaches the effect below: check next frame.
      requestAnimationFrame(() => {
        if (shown.current === target) setPhase((p) => (p === "loading" ? "done" : p));
      });
    });
  }

  // Route (or query) committed -> finish.
  useEffect(() => {
    function settle() {
      shown.current = routeKey(pathname, search);
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
      start(urlKey(url));
    }

    const { pushState, replaceState } = window.history;
    function wrap(fn) {
      return function (...args) {
        const nextUrl = args[2];
        if (nextUrl != null) {
          try {
            start(urlKey(new URL(String(nextUrl), window.location.href)));
          } catch {
            /* ignore */
          }
        }
        return fn.apply(this, args);
      };
    }
    window.history.pushState = wrap(pushState);
    window.history.replaceState = wrap(replaceState);

    function onPopState() {
      start(urlKey(window.location));
    }
    // A tap that ends up not navigating (GuardedStartLink asking first).
    function onCancel() {
      cancels.current += 1;
      setPhase((p) => (p === "loading" ? "idle" : p));
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener(NAV_CANCEL, onCancel);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener(NAV_CANCEL, onCancel);
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
