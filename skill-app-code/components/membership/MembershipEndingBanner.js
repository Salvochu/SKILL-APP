import { getMembershipEndingSoon } from "@/lib/data/membershipEnding";
import { formatEndDate } from "@/lib/membershipEnd";

// The dashboard's reminder in the last few days of a cancelled
// membership: when access stops, and a one-tap way to keep it (Stripe's
// billing page, where "Renew plan" undoes the cancellation).
export default async function MembershipEndingBanner() {
  const endsAt = await getMembershipEndingSoon(3);
  if (!endsAt) return null;
  return (
    <a
      href="/membership/manage"
      className="flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3.5 transition-transform active:scale-[0.99]"
    >
      <span className="min-w-0 flex-1 text-[15px] leading-snug text-fg">
        Your membership ends on {formatEndDate(endsAt, { weekday: true })}.
      </span>
      <span className="shrink-0 text-[15px] font-semibold text-accent">Keep it</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </a>
  );
}
