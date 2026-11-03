// Shared by the loading cues (components/RouteProgress.js,
// components/NavigationOverlay.js) and the links that can cancel a tap.

// Fired on window when a tapped link decides not to navigate after all
// (GuardedStartLink asking about an unsaved workout first).
export const NAV_CANCEL = "skill:nav-cancel";

// One route as a string, in useSearchParams' encoding ("Full+Gym", not
// "Full%20Gym"), so the screen on show and an address compare equal.
export function routeKey(pathname, search) {
  const q = search?.toString() ?? "";
  return pathname + (q ? `?${q}` : "");
}

export function urlKey(url) {
  return routeKey(url.pathname, new URLSearchParams(url.search));
}
