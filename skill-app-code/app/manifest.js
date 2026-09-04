// Special Next.js file: served at /manifest.webmanifest and linked in
// <head> automatically. Makes "Add to Home Screen" install SKILL as a
// standalone app instead of a browser bookmark.
export default function manifest() {
  return {
    name: "SKILL, SK Fitness training tracker",
    short_name: "SKILL",
    description: "Log workouts, follow your training split, and track your progress.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
