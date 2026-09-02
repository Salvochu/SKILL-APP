"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";
import Wordmark from "@/components/Wordmark";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: IconHome },
  { href: "/library", label: "Library", icon: IconLibrary },
  { href: "/programs", label: "Programs", icon: IconPrograms },
  { href: "/progress", label: "Progress", icon: IconProgress },
];

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavBar() {
  const pathname = usePathname() ?? "";

  return (
    <>
      {/* Top bar. On desktop this is the whole nav; on mobile it is just
          the wordmark and sign out, with the tabs pinned to the bottom. */}
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-border bg-bg/90 backdrop-blur md:h-16">
        <div className="mx-auto flex h-full w-full max-w-2xl items-center gap-6 px-4 md:max-w-5xl md:px-6">
          <Link href="/dashboard" aria-label="SKILL home">
            <Wordmark className="text-lg" />
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
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <form action={signOut} className="ml-auto md:ml-0">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-field px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              <IconSignOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Bottom tab bar, mobile only. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {TABS.map((tab) => {
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

/* Icons: 24x24 viewBox, 1.75 stroke, inherit color. */

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
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      <circle cx="4" cy="6" r="0.5" fill="currentColor" />
      <circle cx="4" cy="12" r="0.5" fill="currentColor" />
      <circle cx="4" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}

function IconPrograms(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v3" />
      <path d="M16 3v3" />
      <path d="M7.5 13h4" />
      <path d="M7.5 16.5h9" />
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

function IconSignOut(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
