import { redirect } from "next/navigation";

// Self-signup is disabled. Every account is created through the GHL
// purchase webhook: the free 14-day challenge form or a paid payment
// link. "Allow new users to sign up" is also off in Supabase, so the
// public signup API is blocked regardless. This route stays only so old
// links land somewhere sensible instead of a 404.
export const instant = false;

export default function SignUpPage() {
  redirect("/login");
}
