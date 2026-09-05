import { Suspense } from "react";
import NavBar from "@/components/NavBar";
import OfflineQueueSync from "@/components/OfflineQueueSync";
import ActiveWorkoutBar from "@/components/log/ActiveWorkoutBar";

// Shared chrome for every signed-in screen. NavBar reads the current path
// (usePathname), which suspends while the static shell is generated for
// routes with dynamic params below, so it sits behind its own boundary.
export default function AppLayout({ children }) {
  return (
    <div className="min-h-full">
      <Suspense fallback={<div className="fixed inset-x-0 top-0 z-40 h-14 border-b border-border bg-bg md:h-16" />}>
        <NavBar />
      </Suspense>
      {/* Mounted once, app-wide, so a workout queued offline on the Log
         screen still syncs even if the user has since moved on to
         another tab. */}
      <OfflineQueueSync />
      {/* Same idea: visible on every screen except /log itself, so
         leaving an in-progress workout is never a dead end. */}
      <ActiveWorkoutBar />
      <main className="mx-auto w-full max-w-2xl px-4 pt-14 pb-[calc(5rem+env(safe-area-inset-bottom))] md:max-w-5xl md:px-6 md:pt-16 md:pb-16">
        {children}
      </main>
    </div>
  );
}
