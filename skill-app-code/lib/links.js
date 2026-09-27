// External destinations that live in GHL, set per environment. Fallbacks
// point at the main site so a missing var never produces a dead link.
export const KEEP_TRAINING_URL =
  process.env.NEXT_PUBLIC_KEEP_TRAINING_URL || "https://www.salvadorskfitness.com";

export const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL || "https://www.salvadorskfitness.com";

// 1:1 coaching's direct Stripe checkout, for someone who's already decided
// and doesn't need the call first (the VSL's "already sure" path).
export const COACHING_PAYMENT_URL =
  process.env.NEXT_PUBLIC_COACHING_PAYMENT_URL ||
  "https://buy.stripe.com/bJe00j8DE0uqcIH1ZugrS00";

// Stripe's hosted Customer Portal: a paying member manages or cancels
// their own SKILL App Membership subscription here directly, no need to
// email in. A cancellation here changes the same Stripe subscription
// object the "SKILL App Cancellation" GHL workflow already watches, so
// it should reach it the same way any other cancellation does.
export const MANAGE_MEMBERSHIP_URL =
  process.env.NEXT_PUBLIC_MANAGE_MEMBERSHIP_URL ||
  "https://billing.stripe.com/p/login/bJe00j8DE0uqcIH1ZugrS00";
