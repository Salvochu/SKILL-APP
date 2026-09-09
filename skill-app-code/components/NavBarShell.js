import { Suspense } from "react";
import NavBar from "@/components/NavBar";
import StreakBadge from "@/components/StreakBadge";
import { getMembership } from "@/lib/data/profile";

// Server wrapper: reads whether this is a challenge account (which adds
// the Challenge tab) and hands NavBar the streak chip.
export default async function NavBarShell() {
  const membership = await getMembership();
  return (
    <NavBar
      challenge={membership === "challenge"}
      streak={
        <Suspense fallback={null}>
          <StreakBadge />
        </Suspense>
      }
    />
  );
}
