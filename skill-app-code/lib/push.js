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

// Send one notification. Returns { ok } or { gone } when the push
// service reports the subscription is dead (404/410) so the caller can
// delete it.
export async function sendPush(subscription, payload) {
  if (!configure()) return { ok: false, error: "push not configured" };
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
