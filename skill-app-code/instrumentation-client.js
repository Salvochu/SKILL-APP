import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentryOptions";

// Browser side of error tracking (see lib/sentryOptions.js). Reports go
// to /api/monitoring on the app's own domain (app/api/monitoring), which
// passes them on to Sentry, so ad blockers and the CSP don't drop them.
Sentry.init({ ...sentryOptions, tunnel: "/api/monitoring" });

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
