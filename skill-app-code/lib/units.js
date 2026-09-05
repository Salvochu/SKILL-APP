// Weights are always stored in kg. These convert to and from the unit a
// user has chosen for display and input. Pure, safe on server and client.

export const LB_PER_KG = 2.2046226218;

export function toKg(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return n;
  return unit === "lb" ? n / LB_PER_KG : n;
}

export function fromKg(kg, unit) {
  const n = Number(kg);
  if (!Number.isFinite(n)) return n;
  return unit === "lb" ? n * LB_PER_KG : n;
}

export function unitLabel(unit) {
  return unit === "lb" ? "lb" : "kg";
}

// A weight (stored kg) shown in the user's unit. `decimals` defaults to
// one for load weights; pass 0 for volume-style big numbers.
export function formatWeight(kg, unit, { decimals = 1, withUnit = true } = {}) {
  const v = fromKg(kg, unit);
  if (!Number.isFinite(v)) return withUnit ? `0 ${unitLabel(unit)}` : "0";
  const rounded = Number(v.toFixed(decimals));
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
  return withUnit ? `${text} ${unitLabel(unit)}` : text;
}

// Rounds a converted value for prefilling an input field, so a lb user
// re-doing a workout sees e.g. "135", not "134.9987".
export function roundForInput(kg, unit) {
  const v = fromKg(kg, unit);
  if (!Number.isFinite(v)) return "";
  const step = unit === "lb" ? 1 : 0.5;
  return String(Math.round(v / step) * step);
}
