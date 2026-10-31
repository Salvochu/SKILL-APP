import { Suspense } from "react";
import NavBarShell from "@/components/NavBarShell";
import RouteProgress from "@/components/RouteProgress";
import NavigationOverlay from "@/components/NavigationOverlay";
import OfflineQueueSync from "@/components/OfflineQueueSync";
import ActiveWorkoutBar from "@/components/log/ActiveWorkoutBar";
import UnfinishedWorkoutPrompt from "@/components/log/UnfinishedWorkoutPrompt";
import OnboardingGate from "@/components/onboarding/OnboardingGate";

// Shared chrome for every signed-in screen. NavBar reads the current path
// (usePathname), which suspends while the static shell is generated for
// routes with dynamic params below, so it sits behind its own boundary.
export default function AppLayout({ children }) {
  return (
    // isolate: its own stacking context, so the fixed ambient glow below
    // can sit behind the content but in front of the page background.
    <div className="relative isolate min-h-full">
      <div aria-hidden="true" className="app-ambient" />
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <Suspense fallback={null}>
        <NavigationOverlay />
      </Suspense>
      <Suspense fallback={<div className="app-topbar glass-bar fixed inset-x-0 top-0 z-40 h-14 md:h-16" />}>
        <NavBarShell />
      </Suspense>
      {/* Mounted once, app-wide, so a workout queued offline on the Log
         screen still syncs even if the user has since moved on to
         another tab. */}
      <OfflineQueueSync />
      {/* Same idea: visible on every screen except /log itself, so
         leaving an in-progress workout is never a dead end. It also
         reads usePathname (to hide on /log), so it needs the same
         Suspense boundary as NavBar above. */}
      <Suspense fallback={null}>
        <ActiveWorkoutBar />
      </Suspense>
      <Suspense fallback={null}>
        <UnfinishedWorkoutPrompt />
      </Suspense>
      {/* Checked once per layout mount (persists across client-side
         navigation between sibling pages), so a new account sees this
         at most once per fresh app load, not on every page. */}
      <Suspense fallback={null}>
        <OnboardingGate />
      </Suspense>
      <main className="mx-auto w-full max-w-2xl px-4 pt-14 pb-[max(8.5rem,calc(env(safe-area-inset-bottom)+6.5rem))] md:max-w-5xl md:px-6 md:pt-16 md:pb-16">
        {children}
      </main>
    </div>
  );
}
