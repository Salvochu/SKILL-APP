// Pure helpers for the Progress time-period filter. No server-only
// imports: safe in both Server and Client Components.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Preset ranges in the order the filter shows them. Kept short on
// purpose; the parser still understands the finer-grained tokens below
// if one arrives in a URL.
export const RANGE_PRESETS = [
  { token: "30d", label: "30 days" },
  { token: "8w", label: "8 weeks" },
  { token: "3m", label: "3 months" },
  { token: "6m", label: "6 months" },
  { token: "12m", label: "1 year" },
  { token: "all", label: "All time" },
];

export const DEFAULT_RANGE = "8w";

const DAY_TOKENS = { "7d": 7, "14d": 14, "30d": 30, "5w": 35, "8w": 56 };
const MONTH_TOKENS = { "3m": 3, "6m": 6, "12m": 12 };

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function pretty(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function isValidRangeToken(token) {
  if (!token) return false;
  if (token === "all" || token in DAY_TOKENS || token in MONTH_TOKENS) return true;
  return /^custom:\d{4}-\d{2}-\d{2}:\d{4}-\d{2}-\d{2}$/.test(token);
}

// token -> { token, sinceISO, untilISO, label, custom }. sinceISO is null
// for "all time" (no lower bound). `now` is injectable so a Server
// Component can keep render deterministic.
export function parseRange(raw, now = new Date()) {
  const token = isValidRangeToken(raw) ? raw : DEFAULT_RANGE;
  const until = endOfDay(now);

  const custom = token.match(/^custom:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/);
  if (custom) {
    const a = startOfDay(new Date(`${custom[1]}T00:00:00`));
    const b = startOfDay(new Date(`${custom[2]}T00:00:00`));
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    return {
      token,
      sinceISO: lo.toISOString(),
      untilISO: endOfDay(hi).toISOString(),
      label: `${pretty(lo)} to ${pretty(hi)}`,
      custom: { from: ymd(lo), to: ymd(hi) },
    };
  }

  if (token === "all") {
    return { token, sinceISO: null, untilISO: until.toISOString(), label: "All time", custom: null };
  }

  const since = new Date(now);
  if (token in DAY_TOKENS) since.setDate(since.getDate() - (DAY_TOKENS[token] - 1));
  else since.setMonth(since.getMonth() - MONTH_TOKENS[token]);

  const label = RANGE_PRESETS.find((p) => p.token === token)?.label ?? token;
  return { token, sinceISO: startOfDay(since).toISOString(), untilISO: until.toISOString(), label, custom: null };
}

// Whole weeks spanned by a resolved range. For "all time" pass the
// earliest data date as the lower bound.
export function weeksInRange({ sinceISO, untilISO }, earliestISO) {
  const lower = sinceISO || earliestISO || untilISO;
  const span = new Date(untilISO) - new Date(lower);
  return Math.max(1, Math.round(span / WEEK_MS));
}

export { WEEK_MS };
