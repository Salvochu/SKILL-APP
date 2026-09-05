"use client";

import { useEffect, useState } from "react";

// Renders a timestamp in the viewer's own locale and timezone. The
// localized string is only computed after mount, so server and client
// never disagree on it (SSR shows the plain fallback, which is
// timezone-independent). Workouts saved before real times were captured,
// and backdated ones, sit exactly on 12:00 UTC: those show date only.
function fallback(iso) {
  const [, m, d] = String(iso).slice(0, 10).split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(m) - 1] ?? "?"} ${Number(d)}`;
}

function hasRealTime(d) {
  return !(d.getUTCHours() === 12 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0);
}

export default function LoggedAt({ iso, withYear = false }) {
  const [text, setText] = useState(null);

  useEffect(() => {
    function localize() {
      const d = new Date(iso);
      const datePart = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(withYear ? { year: "numeric" } : {}),
      });
      if (!hasRealTime(d)) {
        setText(datePart);
        return;
      }
      const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      setText(`${datePart}, ${timePart}`);
    }
    localize();
  }, [iso, withYear]);

  return <span suppressHydrationWarning>{text ?? fallback(iso)}</span>;
}
