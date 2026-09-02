/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables the Cache Components model (required for the auth pattern
  // used in lib/auth.js — 'use cache: private' session reads behind
  // <Suspense>, DAL-cached session-derived data, etc).
  cacheComponents: true,
};

export default nextConfig;
