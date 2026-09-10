import MembershipPaused from "@/components/membership/MembershipPaused";
import Wordmark from "@/components/Wordmark";

export const metadata = { title: "Membership paused" };

// Request-time: reads the signed-in user's training totals.
export const instant = false;

// The lock screen for a lapsed paid membership. The proxy redirects
// every other in-app route here; a member or challenge account that
// lands here is redirected back to the dashboard.
export default function PausedPage() {
  return (
    <div className="min-h-full bg-bg">
      <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
        <Wordmark height="1.75rem" className="self-center opacity-90" />
        <MembershipPaused />
      </main>
    </div>
  );
}
