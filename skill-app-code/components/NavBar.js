"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import ThemeToggle from "@/components/ThemeToggle";
import GuardedStartLink from "@/components/log/GuardedStartLink";

const DESKTOP_TABS = [
  { href: "/dashboard", label: "Dashboard", icon: IconHome },
  { href: "/library", label: "Library", icon: IconLibrary },
  { href: "/splits", label: "Splits", icon: IconSplits },
  { href: "/progress", label: "Progress", icon: IconProgress },
];

// The mobile bottom bar stays to 3 tabs so it does not get cramped.
// Everything else (Profile, Progress, Library, Workout History) lives
// behind Menu instead.
const MOBILE_TABS = [
  { href: "/dashboard", label: "Dashboard", icon: IconHome },
  { href: "/splits", label: "Splits", icon: IconSplits },
  { href: "/menu", label: "Menu", icon: IconMenu },
];

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavBar() {
  const pathname = usePathname() ?? "";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-border bg-bg/90 backdrop-blur md:h-16">
        <div className="mx-auto flex h-full w-full max-w-2xl items-center gap-6 px-4 md:max-w-5xl md:px-6">
          <Link href="/dashboard" aria-label="SKILL home" className="shrink-0">
            <Wordmark height="22px" />
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {DESKTOP_TABS.map((tab) => {
              const active = isActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-field px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-accent-soft text-accent" : "text-muted hover:text-fg"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <GuardedStartLink
              href="/log"
              className="hidden items-center gap-1.5 rounded-field bg-accent px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-accent-2 md:inline-flex"
            >
              <IconPlus className="h-4 w-4" />
              Log
            </GuardedStartLink>
            <ThemeToggle />
            <Link
              href="/profile"
              aria-label="Profile"
              aria-current={isActive(pathname, "/profile") ? "page" : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                isActive(pathname, "/profile") ? "bg-accent-soft text-accent" : "text-muted hover:text-fg"
              }`}
            >
              <IconUser className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom tab bar, mobile only. Padding goes past the reported
          safe-area inset on purpose: right at that boundary, a tap can
          still land in iOS's own home-indicator gesture strip instead of
          the link under it. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-3">
          {MOBILE_TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-accent" : "text-dim hover:text-muted"
                }`}
              >
                {active ? (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-accent" />
                ) : null}
                <Icon className="h-[22px] w-[22px]" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/* Icons: 24x24 viewBox, inherit color. */
function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}
function IconLibrary(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconSplits(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 18 9 5 9-5" opacity="0.5" />
    </svg>
  );
}
function IconProgress(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4v16h16" />
      <path d="m7 14 3.5-4 3 2.5L20 6" />
    </svg>
  );
}
function IconMenu(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconUser(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}
