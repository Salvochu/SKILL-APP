"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Tags browser error reports with the signed-in account's id (not the
// name or email), so a report can be matched to a client on the coach's
// Clients screen.
export default function SentryUser({ id }) {
  useEffect(() => {
    Sentry.setUser(id ? { id } : null);
  }, [id]);
  return null;
}
