/** @type {import('next').NextConfig} */
// Sent with every response. HTTPS only; no other site may show the app
// in a frame (clickjacking); browsers must trust the declared content
// type; links to other sites don't carry the full URL; the app has no
// use for the camera stream, microphone or location. The CSP sticks to
// directives that can't break scripts, styles, Supabase or the Loom
// embeds.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
];

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
    // Server Actions default to a 1MB body, too small for a profile
    // photo straight off a phone camera. saveProfile still rejects
    // anything over 5MB itself (see app/(app)/profile/actions.js).
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
