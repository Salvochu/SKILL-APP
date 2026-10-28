import "server-only";
import webpush from "web-push";

// VAPID identifies this app to the push services. Public key is also
// exposed to the browser as NEXT_PUBLIC_VAPID_PUBLIC_KEY (same value).
let configured = false;
function configure() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@salvadorskfitness.com",
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

// The push services browsers actually use: Chrome, Android, Opera and
// Samsung (Google), Firefox (Mozilla), Safari and iPhone (Apple), Edge
// (Microsoft). The server POSTs to whatever endpoint is saved, so
// anything else would let a signed-in person point it at any address
// they like.
const PUSH_SERVICE_HOST =
  /^(fcm\.googleapis\.com|android\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)$/;

export function isPushServiceEndpoint(endpoint) {
  if (typeof endpoint !== "string" || endpoint.length > 2048) return false;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !url.port && PUSH_SERVICE_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

// Send one notification. Returns { ok } or { gone } when the push
// service reports the subscription is dead (404/410), or the endpoint
// is not a push service at all, so the caller can delete it.
export async function sendPush(subscription, payload) {
  if (!configure()) return { ok: false, error: "push not configured" };
  if (!isPushServiceEndpoint(subscription.endpoint)) return { ok: false, gone: true };
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (err) {
    const status = err?.statusCode;
    if (status === 404 || status === 410) return { ok: false, gone: true };
    return { ok: false, error: err?.message || "send failed" };
  }
}

export function pushConfigured() {
  return configure();
}
