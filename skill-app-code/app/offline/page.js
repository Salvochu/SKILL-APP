import Wordmark from "@/components/Wordmark";

// Fully static, no data fetching, no auth check. This is what sw.js
// serves when a real page navigation fails with no network at all, so it
// has to be servable from the service worker's cache with nothing else
// available: no Supabase, no per-user data, just this.
export const metadata = { title: "You are offline" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <Wordmark height="28px" />
      <h1 className="mt-2 text-xl font-bold text-fg">You are offline</h1>
      <p className="max-w-xs text-sm text-muted">
        This page needs a connection to load. If you were logging a workout, do not worry, it
        saved on this device and will sync automatically once you are back online.
      </p>
    </div>
  );
}
