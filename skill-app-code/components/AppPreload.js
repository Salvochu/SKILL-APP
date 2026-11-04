import { getSplitIds } from "@/lib/data/splits";
import { getBeginnerContext, getMembership } from "@/lib/data/profile";
import Preload from "@/components/Preload";

// Pages to load in the background as soon as the app opens that depend
// on the account: the Challenge tab, and everything one tap away on Train
// (each program and the Strength Check), including programs further down
// that list. The other tabs, Profile and a blank workout are in the app
// layout's START_PAGES; any button on screen preloads on its own
// (NavBar, TapLink, GuardedStartLink).
export default async function AppPreload() {
  const [splits, beginner, membership] = await Promise.all([
    getSplitIds(),
    getBeginnerContext(),
    getMembership(),
  ]);
  const hrefs = [];
  // A challenge account's programs are locked until it has a membership.
  if (membership === "challenge") {
    hrefs.push("/challenge");
  } else {
    if (beginner.showStrengthCheck) hrefs.push("/splits/strength-check");
    for (const s of splits) {
      if (s.section !== "benchmark" && s.section !== "foundations" && s.section !== "challenge") {
        hrefs.push(`/splits/${s.id}`);
      }
    }
  }
  return <Preload hrefs={hrefs} />;
}
