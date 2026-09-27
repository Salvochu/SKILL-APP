import { getMembership } from "@/lib/data/profile";
import ManageMembershipCard from "@/components/profile/ManageMembershipCard";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import SignOutCard from "@/components/profile/SignOutCard";
import DangerZone from "@/components/profile/DangerZone";

// Everything account-level - billing, password, session, deletion - in
// one place instead of four separate cards down the page. Collapsed by
// default (details, not open): these are occasional actions, not
// something to look at on every visit.
export default async function AccountCard() {
  const isMember = (await getMembership()) === "member";
  return (
    <details className="group rounded-card border border-border bg-surface [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Account</h2>
        <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-90" />
      </summary>
      <div className="flex flex-col divide-y divide-border border-t border-border">
        {isMember ? (
          <div className="p-4">
            <ManageMembershipCard />
          </div>
        ) : null}
        <div className="p-4">
          <ChangePasswordForm />
        </div>
        <div className="p-4">
          <SignOutCard />
        </div>
        <div className="p-4">
          <DangerZone />
        </div>
      </div>
    </details>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
