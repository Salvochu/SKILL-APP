import Link from "next/link";

export const metadata = { title: "Menu" };

const ITEMS = [
  { href: "/notifications", label: "Notifications", body: "Reminders and alerts", icon: IconBell, tint: "#fc7605" },
  { href: "/calendar", label: "Calendar", body: "Every training day, at a glance", icon: IconCalendar, tint: "#3987e5" },
  { href: "/progress", label: "Progress", body: "Strength and volume over time", icon: IconProgress, tint: "#1faa77" },
  { href: "/body", label: "Body", body: "Weight, body fat and photos", icon: IconBody, tint: "#d55181" },
  { href: "/library", label: "Library", body: "Exercises, stretching and lessons", icon: IconLibrary, tint: "#9085e9" },
  { href: "/history", label: "Workout History", body: "Every session you have logged", icon: IconHistory, tint: "#cf8a1f" },
];

export default function MenuPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header>
        <h1 className="text-2xl font-bold text-fg">Menu</h1>
      </header>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border">
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="block transition-colors hover:bg-surface-2 active:bg-accent-soft"
          >
            <MenuRow label={it.label} body={it.body} icon={it.icon} tint={it.tint} />
          </Link>
        ))}
        <a
          href="/api/export"
          className="block transition-colors hover:bg-surface-2 active:bg-accent-soft"
        >
          <MenuRow
            label="Export training log"
            body="Download every set you have logged as a CSV"
            icon={IconDownload}
            tint="#3fb6a8"
          />
        </a>
      </div>
    </div>
  );
}

function MenuRow({ label, body, icon: Icon, tint }) {
  return (
    <div className="flex items-center gap-3 bg-surface px-4 py-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{
          color: tint,
          backgroundColor: `color-mix(in srgb, ${tint} 16%, transparent)`,
        }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-fg">{label}</span>
        <span className="truncate text-xs text-dim">{body}</span>
      </div>
      <IconChevron className="h-3.5 w-3.5 shrink-0 text-dim" />
    </div>
  );
}

function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
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
function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconBody(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7h16M4 7v3M20 7v3M4 17h16M4 17v-3M20 17v-3M9 12h6" />
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
function IconHistory(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
function IconDownload(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
