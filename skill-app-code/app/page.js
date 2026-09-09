import { redirect } from "next/navigation";
import { getMembership } from "@/lib/data/profile";

// Reads the session cookie to route challenge accounts to their tab, so
// it cannot be prerendered.
export const instant = false;

// Anyone reaching "/" is already authenticated - proxy.js sends every
// signed-out request to /login before it gets here - so this just routes
// on to the real home screen. Challenge accounts land on their 14-day
// challenge tab instead of the dashboard.
export default async function Home() {
  const membership = await getMembership().catch(() => null);
  redirect(membership === "challenge" ? "/challenge" : "/dashboard");
}
