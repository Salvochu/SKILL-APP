// Shared chart helpers. Pure, no React.

export function compact(n) {
  const abs = Math.abs(n);
  if (abs >= 1000) return `${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
}

export function formatKg(n) {
  return `${compact(n)} kg`;
}

// "nice" axis ceiling + a handful of round ticks including 0.
export function niceScale(maxValue, tickCount = 4) {
  if (!(maxValue > 0)) return { max: 1, ticks: [0, 1] };
  const raw = maxValue / tickCount;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const max = Math.ceil(maxValue / step) * step;
  const ticks = [];
  for (let t = 0; t <= max + 1e-9; t += step) ticks.push(Math.round(t));
  return { max, ticks };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Locale-independent so server and client render identical text (no
// hydration mismatch). Expects a YYYY-MM-DD string.
export function shortDate(iso) {
  const [, m, d] = String(iso).split("-");
  return `${MONTHS[Number(m) - 1] ?? "?"} ${Number(d)}`;
}
