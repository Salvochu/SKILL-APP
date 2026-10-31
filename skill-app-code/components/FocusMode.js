"use client";

import { useLayoutEffect } from "react";

// How many focus screens are showing (normally one; briefly two while the
// loading skeleton hands over to the logger).
let showing = 0;

// Puts the app in workout focus mode while this is on screen: the top bar
// and tab bar slide away (globals.css, html.focus-mode). A layout effect,
// so it lands before the first paint of a client navigation, and it is
// undone whenever the screen goes, including when Next hides it to keep
// it for a quick return.
export default function FocusMode() {
  useLayoutEffect(() => {
    showing += 1;
    document.documentElement.classList.add("focus-mode");
    return () => {
      showing = Math.max(0, showing - 1);
      if (showing === 0) document.documentElement.classList.remove("focus-mode");
    };
  }, []);
  return null;
}
