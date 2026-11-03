import { getSplitIds } from "@/lib/data/splits";
import { getBeginnerContext, getMembership } from "@/lib/data/profile";
import Preload from "@/components/Preload";

// Pages to load in the background as soon as the app opens: Profile, a
// blank workout, and everything one tap away on Train (each program and
// the Strength Check), including programs further down that list. The
// tabs themselves and any button on screen preload on their own
// (NavBar, TapLink, GuardedStartLink).
export default async function AppPreload() {
  const [splits, beginner, membership] = await Promise.all([
    getSplitIds(),
    getBeginnerContext(),
    getMembership(),
  ]);
  const hrefs = ["/profile", "/log"];
  // A challenge account's programs are locked until it has a membership.
  if (membership !== "challenge") {
    if (beginner.showStrengthCheck) hrefs.push("/splits/strength-check");
    for (const s of splits) {
      if (s.section !== "benchmark" && s.section !== "foundations" && s.section !== "challenge") {
        hrefs.push(`/splits/${s.id}`);
      }
    }
  }
  return <Preload hrefs={hrefs} />;
}
