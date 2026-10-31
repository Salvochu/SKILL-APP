import "server-only";

// A thin Stripe REST client (no SDK, same as the webhooks). Parameters
// are sent the way Stripe expects them: nested objects and arrays become
// keys like line_items[0][price]. Throws with Stripe's own message on
// any error.
export async function stripe(method, path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");

  const query = params ? new URLSearchParams(flatten(params)).toString() : "";
  const isGet = method === "GET";
  const res = await fetch(`https://api.stripe.com/v1${path}${isGet && query ? `?${query}` : ""}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(isGet ? {} : { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    body: isGet ? undefined : query,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Stripe responded ${res.status}`);
  return data;
}

function flatten(value, prefix = "", out = []) {
  if (value == null) return out;
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}[${k}]` : k, out);
  } else {
    out.push([prefix, String(value)]);
  }
  return out;
}
