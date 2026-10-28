import { Suspense } from "react";
import Link from "next/link";
import { getNotificationPrefs } from "@/lib/data/notifications";
import { getBeginnerContext } from "@/lib/data/profile";
import NotificationSettings from "@/components/notifications/NotificationSettings";
import TrainingModeSetting from "@/components/settings/TrainingModeSetting";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <Link
          href="/menu"
          className="-ml-1 mb-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Menu
        </Link>
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Settings</h1>
        <p className="text-[15px] text-muted">Notifications, the rest timer, and how the app behaves.</p>
      </header>

      <Suspense fallback={<SettingsSkeleton />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const [prefs, beginner] = await Promise.all([
    getNotificationPrefs(),
    getBeginnerContext(),
  ]);
  return (
    <div className="flex flex-col gap-7">
      <TrainingModeSetting
        initialAdvanced={beginner.advanced}
        isExplicit={beginner.advancedIsExplicit}
      />
      <NotificationSettings initialPrefs={prefs} />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-7">
      <div className="h-24 rounded-2xl skeleton bg-surface-2" />
      <div className="h-28 rounded-2xl skeleton bg-surface-2" />
      <div className="h-72 rounded-2xl skeleton bg-surface-2" />
    </div>
  );
}
