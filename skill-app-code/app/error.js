"use client";

import { useEffect } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

// Shown when a page crashes while rendering, instead of Next's default
// error text. "Try again" re-renders the route; most failures here are a
// dropped connection mid-load, so a retry usually just works.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AuthShell title="Something went wrong" subtitle="That page didn't load properly.">
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-muted">
          Nothing you logged has been lost. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="btn-shine rounded-field bg-accent px-4 py-3 font-bold text-black shadow-[0_10px_30px_-10px_rgba(252,118,5,0.7)] transition-transform active:scale-[0.99]"
        >
          Try again
        </button>
        <Link href="/dashboard" className="text-sm font-semibold text-muted underline-offset-4 hover:underline">
          Back to the dashboard
        </Link>
      </div>
    </AuthShell>
  );
}
