// External destinations that live in GHL, set per environment. Fallbacks
// point at the main site so a missing var never produces a dead link.
export const KEEP_TRAINING_URL =
  process.env.NEXT_PUBLIC_KEEP_TRAINING_URL || "https://www.salvadorskfitness.com";

export const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL || "https://www.salvadorskfitness.com";
