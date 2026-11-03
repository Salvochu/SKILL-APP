"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Loads pages in full (data included) in the background once the app has
// settled, so the first tap on them opens straight away even if their
// button isn't on screen yet. `kind: "full"` is the same full load a
// <Link prefetch> does (router.prefetch in Next 16.4,
// next/dist/client/components/prefetch.js); if a later Next ignores it,
// this just falls back to its lighter default.
export default function Preload({ hrefs }) {
  const router = useRouter();
  const key = hrefs.join("\n");

  useEffect(() => {
    if (!key) return;
    const run = () => key.split("\n").forEach((href) => router.prefetch(href, { kind: "full" }));
    // After the screen you opened has loaded, not competing with it.
    // Safari has no requestIdleCallback, so a short wait there.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 1200);
    return () => clearTimeout(id);
  }, [key, router]);

  return null;
}
