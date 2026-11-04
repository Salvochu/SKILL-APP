"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { expectPreloads } from "@/lib/preloadGate";

// Loads pages in full (data included) in the background as soon as the
// app starts, while the opening logo is still up (it waits for them, see
// lib/preloadGate.js), so the first tap on them opens straight away even
// if their button isn't on screen yet. `kind: "full"` is the same full load a
// <Link prefetch> does (router.prefetch in Next 16.4,
// next/dist/client/components/prefetch.js); if a later Next ignores it,
// this just falls back to its lighter default.
export default function Preload({ hrefs }) {
  const router = useRouter();
  const key = hrefs.join("\n");

  useEffect(() => {
    if (!key) return;
    const hrefs = key.split("\n");
    expectPreloads(hrefs);
    hrefs.forEach((href) => router.prefetch(href, { kind: "full" }));
  }, [key, router]);

  return null;
}
