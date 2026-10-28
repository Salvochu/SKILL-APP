import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

// Any URL that doesn't exist. Signed-out visitors never get here (the
// proxy sends them to /login first), so the way back is the dashboard.
export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <AuthShell title="Page not found" subtitle="This link is broken or the page has moved.">
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-muted">Your training is all still there. Head back and pick up where you left off.</p>
        <Link
          href="/dashboard"
          className="btn-shine rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black shadow-[0_10px_30px_-10px_rgba(252,118,5,0.7)] transition-transform active:scale-[0.98]"
        >
          Back to the app
        </Link>
      </div>
    </AuthShell>
  );
}
