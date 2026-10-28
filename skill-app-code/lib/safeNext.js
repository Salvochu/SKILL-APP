// Where to send someone after they sign in, taken from a ?next= value
// that anyone can put in a link. Only a path on this site is allowed: a
// full URL, "//host", or "/\host" and "/<tab>/host" (browsers read both
// as "//host") would land a person who just typed their password on
// someone else's page, which is a classic way to phish it a second time.
// Anything else falls back to the dashboard.
export function safeNext(value, fallback = "/dashboard") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  const base = "https://app.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
