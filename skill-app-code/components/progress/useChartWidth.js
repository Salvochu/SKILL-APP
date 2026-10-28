"use client";

import { useCallback, useState } from "react";

// The width of a chart's container, so the SVG can be drawn in real CSS
// pixels. With a fixed viewBox the whole drawing scales with the card,
// which shrank the axis labels to about 5px on a phone and blew them up
// on a desktop; drawn at the measured width they stay the size they say.
// Measured the moment the chart mounts (so the first paint is already
// right), then kept in step by a ResizeObserver: rotating the phone, or
// opening a folded card the chart was hidden in. `fallback` is only for
// the server render.
export function useChartWidth(fallback = 640) {
  const [width, setWidth] = useState(fallback);

  const ref = useCallback((el) => {
    if (!el) return;
    const measure = (w) => {
      const next = Math.round(w);
      if (next > 0) setWidth(next);
    };
    measure(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}
