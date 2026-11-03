import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
// Sent with every response. HTTPS only; no other site may show the app
// in a frame (clickjacking); browsers must trust the declared content
// type; links to other sites don't carry the full URL; the app has no
// use for the camera stream, microphone or location; a page this app
// opens in a new tab can't reach back into it (and the other way round).
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
];

// The app may only load and send data to itself, Supabase (data,
// sign-in, photos) and Loom (form videos). If a script ever got injected
// it could not call home to another server or pull in more code. Ran as
// Report-Only on the live app first, with nothing reported. Inline
// scripts stay allowed because Next.js writes its page data as inline
// scripts. A new outside service (an embed, analytics, a CDN) has to be
// added here or the browser will block it.
function contentSecurityPolicy() {
  let supabase = "https://*.supabase.co";
  try {
    supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  } catch {}
  // next dev needs eval (fast refresh) and a websocket to the dev server.
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabase}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase}${dev ? " ws: wss:" : ""}`,
    `media-src 'self' blob: ${supabase}`,
    "frame-src https://www.loom.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    // The Keep training button's form ends up on Stripe's checkout.
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Enables the Cache Components model (required for the auth pattern
  // used in lib/auth.js — 'use cache: private' session reads behind
  // <Suspense>, DAL-cached session-derived data, etc).
  cacheComponents: true,
  // Next 16.4 asks for this to be set either way. Off keeps the prefetch
  // behaviour this app was built and tested with on 16.3; turning it on
  // is a separate change to try and measure on its own.
  partialPrefetching: false,
  experimental: {
    // Keep each visited page in the phone's memory for 5 minutes, so
    // going back to a tab shows it straight away instead of a skeleton
    // while the server re-renders it. Anything the user saves through a
    // Server Action (revalidatePath / refresh) or router.refresh() clears
    // this, so their own changes always show; only outside changes (a
    // reply from the coach, the next challenge day) can wait up to 5
    // minutes, or until the app is reopened.
    staleTimes: {
      dynamic: 300,
    },
    // Server Actions default to a 1MB body, too small for a profile
    // photo straight off a phone camera. saveProfile still rejects
    // anything over 5MB itself (see app/(app)/profile/actions.js).
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

// Error tracking (Sentry). Browser reports arrive via /api/monitoring on
// this domain, so the CSP above needs no new host. Readable stack traces
// need SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT at build time;
// the source maps are uploaded to Sentry and deleted from the build, so
// they are never served to browsers. Without the token the build still
// works, just with minified traces.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/api/monitoring",
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
});
