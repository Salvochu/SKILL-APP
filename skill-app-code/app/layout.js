import { Inter, Archivo, JetBrains_Mono, Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";
import { themeInitScript } from "@/components/ThemeToggle";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SplashGate from "@/components/SplashGate";
import NoZoom from "@/components/NoZoom";

// Shown on first paint, before anything else loads: the logo with a
// heartbeat glow. SplashGate fades it out once the app is up.
const splashCss = `
#skill-splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#000;transition:opacity .35s ease}
#skill-splash.skill-splash-gone{opacity:0;pointer-events:none}
#skill-splash img{width:150px;height:auto;animation:skill-heartbeat 1.15s ease-in-out infinite}
@keyframes skill-heartbeat{
0%,100%{transform:scale(1);filter:drop-shadow(0 0 8px rgba(252,118,5,.45))}
14%{transform:scale(1.09);filter:drop-shadow(0 0 24px rgba(252,118,5,.95))}
28%{transform:scale(1);filter:drop-shadow(0 0 8px rgba(252,118,5,.45))}
42%{transform:scale(1.05);filter:drop-shadow(0 0 16px rgba(252,118,5,.7))}
56%{transform:scale(1);filter:drop-shadow(0 0 8px rgba(252,118,5,.45))}
}
@media (prefers-reduced-motion:reduce){#skill-splash img{animation:none}}
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Numbers: an athletic, slightly condensed face for stats, weights and
// reps. Its figures have tabular width, so columns still line up.
const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "SKILL",
    template: "%s | SKILL",
  },
  description:
    "Your plan, your workouts and your progress from SK Fitness, all in one app.",
  // Link previews (WhatsApp, Instagram DMs, iMessage) need absolute image
  // URLs; the image itself is app/opengraph-image.png.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://app.salvadorskfitness.com"),
  openGraph: {
    type: "website",
    siteName: "SKILL",
    title: "SKILL by SK Fitness",
    description: "Your plan, your workouts and your progress from SK Fitness, all in one app.",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    capable: true,
    title: "SKILL",
    statusBarStyle: "black-translucent",
  },
};

// Fixed at 100%: no pinch or double-tap zoom, and iPhones don't zoom in
// on a field when it's tapped. Safari ignores userScalable for pinching,
// so components/NoZoom.js stops that gesture itself.
export const viewport = {
  themeColor: "#000000",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      // Lets Next.js switch smooth scrolling off while it moves a new
      // screen to the top (globals.css turns it on for the page). Without
      // it the jump became a slow scroll that got cut short, so screens
      // opened partway down.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${archivo.variable} ${jetbrainsMono.variable} ${barlow.variable} h-full`}
    >
      <head>
        {/* Applies the saved theme before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style dangerouslySetInnerHTML={{ __html: splashCss }} />
        {/* Form videos come from Loom: look its servers up ahead of the
           first tap rather than during it. */}
        <link rel="dns-prefetch" href="https://www.loom.com" />
        <link rel="dns-prefetch" href="https://cdn.loom.com" />
        <link rel="dns-prefetch" href="https://luna.loom.com" />
      </head>
      <body className="min-h-full">
        <div id="skill-splash" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/skill-logo.png" alt="" width={520} height={199} />
        </div>
        {children}
        <SplashGate />
        <NoZoom />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
