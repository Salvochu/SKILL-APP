import { Inter, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { themeInitScript } from "@/components/ThemeToggle";

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
      className={`${inter.variable} ${archivo.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        {/* Applies the saved theme before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
