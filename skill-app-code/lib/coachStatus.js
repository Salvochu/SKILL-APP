// The first thing a coach wants to know about a client: where they are.
// On the 14-day challenge (and which day), a paying member, or lapsed.
export function clientStatus(c) {
  const p = c.activeProgram;
  if (c.membership === "challenge") {
    if (p?.kind === "challenge" && p.challengeDay) {
      return {
        tone: "accent",
        label:
          p.challengeDay > p.challengeDays
            ? "Challenge finished"
            : `Challenge · Day ${p.challengeDay} of ${p.challengeDays}`,
      };
    }
    return { tone: "accent", label: "Challenge · getting ready" };
  }
  if (c.membership === "member") return { tone: "good", label: "Member" };
  if (c.membership === "lapsed") return { tone: "danger", label: "Lapsed" };
  return null;
}

export const STATUS_TONE = {
  accent: "bg-accent-soft text-accent",
  good: "bg-good/15 text-good",
  danger: "bg-danger/15 text-danger",
};

// Whole calendar days between a date and today, so something from late
// last night reads "yesterday", not "today" (a plain 24-hour count would
// say today until the same time tomorrow).
export function calendarDaysAgo(iso, now = new Date()) {
  if (!iso) return null;
  const d = new Date(iso);
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(0, Math.round((a - b) / 86400000));
}
