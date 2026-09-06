import { Suspense } from "react";
import Link from "next/link";
import { getNotificationPrefs } from "@/lib/data/notifications";
import NotificationSettings from "@/components/notifications/NotificationSettings";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <Link href="/menu" className="flex items-center gap-1 text-xs font-medium text-dim hover:text-fg">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Menu
        </Link>
        <h1 className="text-2xl font-bold text-fg">Settings</h1>
        <p className="text-sm text-muted">Notifications, the rest timer, and how the app behaves.</p>
      </header>

      <Suspense fallback={<div className="h-64 rounded-card bg-surface" />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const prefs = await getNotificationPrefs();
  return <NotificationSettings initialPrefs={prefs} />;
}
