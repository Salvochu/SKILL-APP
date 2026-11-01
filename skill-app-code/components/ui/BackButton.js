"use client";

import { useRouter } from "next/navigation";

// "‹ Back" for a screen with more than one way in (a workout opens from
// History, the Calendar, Progress or the coach view): goes back to
// wherever you came from, or to `fallback` when there is nowhere to go
// back to (opened from a link or a fresh launch).
export default function BackButton({ fallback = "/history", label = "Back" }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className="-ml-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m15 6-6 6 6 6" />
      </svg>
      {label}
    </button>
  );
}
