import Link from "next/link";

// The small "‹ Menu" link above a page title: the way back up from a
// screen reached from another one, where the tab bar has no tab lit.
export default function BackLink({ href = "/menu", label = "Menu" }) {
  return (
    <Link
      href={href}
      className="-ml-1 mb-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m15 6-6 6 6 6" />
      </svg>
      {label}
    </Link>
  );
}
