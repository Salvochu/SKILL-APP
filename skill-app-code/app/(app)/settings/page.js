import { Suspense } from "react";
import { getNotificationPrefs } from "@/lib/data/notifications";
import { getBeginnerContext } from "@/lib/data/profile";
import NotificationSettings from "@/components/notifications/NotificationSettings";
import TrainingModeSetting from "@/components/settings/TrainingModeSetting";
import TwoFactorSetting from "@/components/settings/TwoFactorSetting";
import { getProfileRow } from "@/lib/data/session";
import BackLink from "@/components/ui/BackLink";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <BackLink />
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
  const [prefs, beginner, profile] = await Promise.all([
    getNotificationPrefs(),
    getBeginnerContext(),
    getProfileRow(),
  ]);
  return (
    <div className="flex flex-col gap-7">
      <TrainingModeSetting
        initialAdvanced={beginner.advanced}
        isExplicit={beginner.advancedIsExplicit}
      />
      <NotificationSettings initialPrefs={prefs} />
      {/* Coach only for now: that login opens every client's data. */}
      {profile?.role === "coach" ? <TwoFactorSetting /> : null}
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
