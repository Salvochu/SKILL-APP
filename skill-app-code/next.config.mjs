/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables the Cache Components model (required for the auth pattern
  // used in lib/auth.js — 'use cache: private' session reads behind
  // <Suspense>, DAL-cached session-derived data, etc).
  cacheComponents: true,
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
