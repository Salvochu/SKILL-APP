"use client";

import { useHydrated } from "@/components/useHydrated";

// "Saturday 31 October" over the greeting, in the phone's own time zone,
// which the server can't know: it holds its line height until then so
// nothing below it jumps.
export default function TodayLabel() {
  const hydrated = useHydrated();
  return (
    <span className="block h-[18px] text-[13px] font-semibold uppercase leading-[18px] tracking-[0.06em] text-dim">
      {hydrated
        ? new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "")
        : null}
    </span>
  );
}
