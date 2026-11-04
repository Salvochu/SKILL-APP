"use client";

// Lets the opening logo (components/SplashGate.js) stay up while the
// app's main screens load in the background, so the first taps after it
// fades are instant. Preload registers the pages it is fetching; a
// PerformanceObserver ticks each one off when its data lands; SplashGate
// waits for the lot, up to a cap. Next fetches a page at its own path
// with an _rsc query, in two parts: a tiny outline of the route (about
// 0.4 KB) and then the content itself, so only a response bigger than
// the outline counts. The signed-in app's layout carries data-skill-app;
// anywhere else (login and the like) the logo fades straight away.

// Bigger than a route outline, smaller than any real page's content.
const CONTENT_BYTES = 1024;

const pending = new Set();
let registered = false;
let observer = null;
let waiters = [];

function settle() {
  if (!registered || pending.size) return;
  waiters.forEach((done) => done());
  waiters = [];
}

function watch() {
  if (observer || typeof PerformanceObserver === "undefined") return;
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        try {
          const url = new URL(entry.name);
          const bytes = entry.encodedBodySize || entry.transferSize || 0;
          if (url.origin === window.location.origin && url.searchParams.has("_rsc") && bytes > CONTENT_BYTES) {
            pending.delete(url.pathname);
          }
        } catch {
          // not a URL we care about
        }
      }
      settle();
    });
    observer.observe({ type: "resource", buffered: true });
  } catch {
    observer = null;
  }
}

export function expectPreloads(hrefs) {
  registered = true;
  watch();
  // Without the observer there is no way to tell when they land, so
  // don't hold the logo up for them.
  if (observer) {
    for (const href of hrefs) {
      const path = href.split("?")[0];
      // The screen being opened is already loaded.
      if (path !== window.location.pathname) pending.add(path);
    }
  }
  settle();
}

// Resolves once every registered page has loaded, or after maxMs. In
// the signed-in app it also waits for the pages to be registered, which
// can happen a moment after the logo's own check.
export function whenPreloaded(maxMs) {
  const inApp = Boolean(document.querySelector("[data-skill-app]"));
  if (!inApp || (registered && !pending.size)) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, maxMs);
    waiters.push(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}
