import { Inter, Archivo, JetBrains_Mono, Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";
import { themeInitScript } from "@/components/ThemeToggle";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SplashGate from "@/components/SplashGate";

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
  description: "SK Fitness training tracker",
  appleWebApp: {
    capable: true,
    title: "SKILL",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${archivo.variable} ${jetbrainsMono.variable} ${barlow.variable} h-full`}
    >
      <head>
        {/* Applies the saved theme before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style dangerouslySetInnerHTML={{ __html: splashCss }} />
      </head>
      <body className="min-h-full">
        <div id="skill-splash" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/skill-logo.png" alt="" width={266} height={108} />
        </div>
        {children}
        <SplashGate />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
