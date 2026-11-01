// Shared Sentry settings for the browser, the server and the edge runtime.
// Errors only: no performance tracing, no session replay (this is health
// data), and no IP addresses or cookies attached (sendDefaultPii off).
// Nothing is sent until NEXT_PUBLIC_SENTRY_DSN is set in Vercel, and
// never from local development.
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) && process.env.NODE_ENV === "production",
  environment: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || "production",
  tracesSampleRate: 0,
  sendDefaultPii: false,
  // Noise that isn't a bug in the app: a dropped connection mid-request,
  // an old tab after a deploy, browser extensions.
  ignoreErrors: [
    "Failed to fetch",
    "Load failed",
    "NetworkError when attempting to fetch resource.",
    "ChunkLoadError",
    /^Loading chunk \d+ failed/,
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications.",
  ],
};
