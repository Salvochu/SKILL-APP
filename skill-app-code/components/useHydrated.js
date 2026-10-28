"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False on the server and in the browser's first (hydrating) render, so
// both produce the same HTML; true straight after, and from the start on
// later client-side navigations. For anything that depends on the
// phone's clock or time zone, which the server can't know: render a
// time-zone-neutral version until this turns true.
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
