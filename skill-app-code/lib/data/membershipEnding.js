import "server-only";
import { getSessionUser, getAuthUserRecord } from "@/lib/data/session";
import { getMembership } from "@/lib/data/profile";
import { membershipEndDate } from "@/lib/membershipEnd";

const DAY = 86400000;

// When a cancelled membership stops, if that's within `withinDays`; else
// null. The token's copy of the end date decides cheaply whether to look
// at all; the fresh account record confirms it, so a renewal clears it
// straight away rather than when the token next refreshes.
export async function getMembershipEndingSoon(withinDays = 3) {
  const user = await getSessionUser();
  if (!user) return null;
  const now = Date.now();
  const soon = (date) => date && date.getTime() - now <= withinDays * DAY;
  if (!soon(membershipEndDate(user.appMetadata, now))) return null;
  if ((await getMembership()) !== "member") return null;
  const record = await getAuthUserRecord();
  const endsAt = membershipEndDate(record?.app_metadata, now);
  return soon(endsAt) ? endsAt : null;
}
