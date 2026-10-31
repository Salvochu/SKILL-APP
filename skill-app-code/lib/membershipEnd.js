// When a member's cancelled subscription stops, from the date saved on
// their account by the Stripe webhook (lib/membership.js
// recordMembershipEnd). Null when nothing is cancelled, or the date has
// already passed (the account pauses then anyway).
export function membershipEndDate(appMetadata, now = Date.now()) {
  const iso = appMetadata?.membership_ends_at;
  if (!iso) return null;
  const at = Date.parse(iso);
  return Number.isFinite(at) && at > now ? new Date(at) : null;
}

// "Saturday 30 November", in UK time like the rest of the business.
export function formatEndDate(date, { weekday = false } = {}) {
  return date.toLocaleDateString("en-GB", {
    ...(weekday ? { weekday: "long" } : {}),
    day: "numeric",
    month: "long",
    timeZone: "Europe/London",
  });
}
