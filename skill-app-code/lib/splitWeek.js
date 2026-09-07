// Pure. Places a split's ordered training days onto a Mon-to-Sun week as
// a suggested rhythm. Honors explicit weekday labels (MON..., "DAY 3")
// when every day has a distinct one; otherwise spreads N sessions across
// the week on a fixed, sensible pattern. Safe on server and client.

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_NAME_TO_INDEX = {
  mon: 0, monday: 0,
  tue: 1, tues: 1, tuesday: 1,
  wed: 2, weds: 2, wednesday: 2,
  thu: 3, thur: 3, thurs: 3, thursday: 3,
  fri: 4, friday: 4,
  sat: 5, saturday: 5,
  sun: 6, sunday: 6,
};

// Fixed spreads: key = sessions per week, value = weekday indexes.
const SPREADS = {
  1: [2],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

function weekdayFromLabel(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return null;
  const dayN = s.match(/^day\s*([1-7])\b/);
  if (dayN) return Number(dayN[1]) - 1;
  const word = s.match(/^([a-z]+)/);
  if (word && DAY_NAME_TO_INDEX[word[1]] != null) return DAY_NAME_TO_INDEX[word[1]];
  return null;
}

// Drop a leading "MON . " / "DAY 1 - " style prefix from a focus string.
export function cleanFocus(raw) {
  return String(raw || "")
    .replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*[.\-·]\s*/i, "")
    .replace(/^day\s*\d+\s*[.\-·]\s*/i, "")
    .trim();
}

// Sessions a week this split implies. A single template with a
// "2-3x per week" cadence repeats; otherwise it is one per day.
export function sessionsPerWeekFor(split) {
  const days = split.days ?? [];
  const m = String(split.cadence || "").match(
    /(\d+)\s*(?:-\s*(\d+))?\s*x?\s*(?:per|\/)\s*week/i,
  );
  if (days.length <= 1 && m) return Math.min(7, Math.max(1, Number(m[2] || m[1])));
  return Math.min(7, Math.max(0, days.length));
}

// -> [{ weekday, day | null }] of length 7.
export function weekLayout(split) {
  const days = [...(split.days ?? [])].sort((a, b) => a.position - b.position);
  const slots = WEEKDAYS.map((weekday) => ({ weekday, day: null }));
  if (days.length === 0) return slots;

  const explicit = days.map(
    (d) => weekdayFromLabel(d.label) ?? weekdayFromLabel(d.template?.name),
  );
  if (explicit.every((i) => i != null) && new Set(explicit).size === days.length) {
    days.forEach((d, i) => {
      slots[explicit[i]].day = d;
    });
    return slots;
  }

  const n = sessionsPerWeekFor(split);
  const spread = SPREADS[Math.min(7, Math.max(1, n))] ?? SPREADS[3];
  spread.forEach((wd, i) => {
    slots[wd].day = days[i % days.length];
  });
  return slots;
}
