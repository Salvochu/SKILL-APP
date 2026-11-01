// Error reports from the browser, passed on to Sentry. Only accepts
// reports for this app's own Sentry project (the server DSN), so it can't
// be used to relay anything anywhere else.
export { POST } from "@sentry/nextjs/tunnel";
