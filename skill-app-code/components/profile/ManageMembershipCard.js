import { MANAGE_MEMBERSHIP_URL } from "@/lib/links";

// Only ever rendered for membership === "member" (see profile/page.js).
// Links out to Stripe's own Customer Portal rather than building a
// custom billing UI - Stripe handles the actual card update/cancel flow.
export default function ManageMembershipCard() {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">Membership</h3>
      <p className="text-sm text-muted">Update your card or cancel your subscription directly with Stripe.</p>
      <a
        href={MANAGE_MEMBERSHIP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full rounded-field border border-border px-4 py-2.5 text-left text-sm font-medium text-fg hover:bg-surface-2"
      >
        Manage membership
      </a>
    </div>
  );
}
