import { Suspense } from "react";
import NavBar from "@/components/NavBar";
import StreakBadge from "@/components/StreakBadge";
import { getMembership } from "@/lib/data/profile";
import { getProfileRow, getSessionUser } from "@/lib/data/session";
import SentryUser from "@/components/SentryUser";

// Server wrapper: reads whether this is a challenge account (which adds
// the Challenge tab) and hands NavBar the streak chip and avatar photo.
export default async function NavBarShell() {
  const [membership, profile, user] = await Promise.all([getMembership(), getProfileRow(), getSessionUser()]);
  return (
    <>
    <SentryUser id={user?.id ?? null} />
    <NavBar
      challenge={membership === "challenge"}
      avatarUrl={profile?.avatar_url ?? null}
      streak={
        <Suspense fallback={null}>
          <StreakBadge />
        </Suspense>
      }
    />
    </>
  );
}
