"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import ThemeToggle from "@/components/ThemeToggle";

// Same three primary tabs on both layouts. Progress, Library, Profile
// and Workout History all live behind Menu, so the bottom bar on mobile
// stays uncrowded and desktop matches it. Challenge accounts get a
// fourth tab, first, for the 14-day challenge home.
const BASE_TABS = [
  { href: "/dashboard", label: "Dashboard", icon: IconHome },
  { href: "/splits", label: "Train", icon: IconSplits },
  { href: "/menu", label: "Menu", icon: IconMenu },
];
const CHALLENGE_TAB = { href: "/challenge", label: "Challenge", icon: IconFlag };

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavBar({ streak = null, challenge = false, avatarUrl = null }) {
  const pathname = usePathname() ?? "";
  const TABS = challenge ? [CHALLENGE_TAB, ...BASE_TABS] : BASE_TABS;
  const gridCols = TABS.length === 4 ? "grid-cols-4" : "grid-cols-3";
  const activeIndex = TABS.findIndex((tab) => isActive(pathname, tab.href));

  return (
    <>
      <header className="glass-bar fixed inset-x-0 top-0 z-40 h-14 md:h-16">
        <div className="mx-auto flex h-full w-full max-w-2xl items-center gap-6 px-4 md:max-w-5xl md:px-6">
          <Link href="/dashboard" aria-label="SKILL home" className="shrink-0">
            <Wordmark height="22px" />
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {TABS.map((tab) => {
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

          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            {streak}
            <ThemeToggle />
            <Link
              href="/profile"
              aria-label="Profile"
              aria-current={isActive(pathname, "/profile") ? "page" : undefined}
              className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors ${
                isActive(pathname, "/profile") ? "ring-2 ring-accent" : "text-muted hover:text-fg"
              }`}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary remote host
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <IconUser className="h-5 w-5" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom tab bar, mobile only: a floating glass capsule with the
          content scrolling underneath (iOS style). It always sits at
          least 2.75rem (44px) off the bottom edge: the page doesn't use
          viewport-fit=cover, so iOS reports a safe-area inset of 0 and
          the bar would otherwise land in the home-indicator swipe zone,
          where taps get eaten by the system gesture. Floating bars that
          stack above it (rest timer, workout pill, sticky Save/Finish)
          use matching offsets. The wrapper lets taps beside the capsule
          through to the page. */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(2.75rem,calc(env(safe-area-inset-bottom)+0.75rem))] md:hidden">
        <div className={`glass pointer-events-auto relative mx-auto grid max-w-md rounded-full p-1.5 ${gridCols}`}>
          {/* One shared pill that glides between tabs, instead of a
              separate highlight per tab that pops in/out on navigation. */}
          <span
            aria-hidden="true"
            className="absolute inset-y-1.5 rounded-full bg-accent-soft transition-[left,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              width: `calc((100% - 0.75rem) / ${TABS.length})`,
              left: `calc(0.375rem + ((100% - 0.75rem) / ${TABS.length}) * ${Math.max(activeIndex, 0)})`,
              opacity: activeIndex === -1 ? 0 : 1,
            }}
          />
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-semibold transition-colors [-webkit-tap-highlight-color:transparent] ${
                  active ? "text-accent" : "text-muted hover:text-fg"
                }`}
              >
                <Icon className="h-[22px] w-[22px] transition-transform duration-100 group-active:scale-90" />
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
function IconSplits(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10" />
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
function IconFlag(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 21V4M5 4l4-1 6 2 4-1v10l-4 1-6-2-4 1" />
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
