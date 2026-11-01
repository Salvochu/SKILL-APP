import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentryOptions";

// Server side of error tracking (see lib/sentryOptions.js): pages,
// server actions and API routes that throw are reported to Sentry.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(sentryOptions);
  }
}

export const onRequestError = Sentry.captureRequestError;
