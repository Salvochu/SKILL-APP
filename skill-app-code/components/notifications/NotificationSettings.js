"use client";

import { useEffect, useState } from "react";
import { saveNotificationPrefs } from "@/app/(app)/settings/actions";
import { pushSupported, getPushSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/pushClient";
import { Group } from "@/components/ui/Grouped";
import Switch from "@/components/ui/Switch";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Keep the client-read prefs in localStorage so the workout logger,
// RestTimer and the unfinished-workout prompt can check them without a
// round trip.
function mirror(prefs) {
  try {
    localStorage.setItem("notif:restTimerDone", prefs.restTimerDone ? "on" : "off");
    localStorage.setItem("notif:unfinished", prefs.unfinishedWorkout ? "on" : "off");
    localStorage.setItem("pref:restTimer", prefs.restTimerEnabled ? "on" : "off");
    localStorage.setItem("pref:restSeconds", String(prefs.defaultRestSeconds ?? 90));
  } catch {
    // storage unavailable is fine
  }
}

const REST_PRESETS = [30, 45, 60, 90, 120, 150, 180];

export default function NotificationSettings({ initialPrefs }) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [push, setPush] = useState("loading"); // loading | unsupported | off | on | busy
  const [error, setError] = useState(null);

  useEffect(() => {
    mirror(initialPrefs);
    async function check() {
      if (!pushSupported()) {
        setPush("unsupported");
        return;
      }
      const sub = await getPushSubscription();
      setPush(sub ? "on" : "off");
    }
    check();
  }, [initialPrefs]);

  async function patch(next) {
    const updated = { ...prefs, ...next };
    setPrefs(updated);
    mirror(updated);
    const res = await saveNotificationPrefs(next);
    if (res?.error) setError(res.error);
  }

  async function enablePush() {
    setPush("busy");
    setError(null);
    const res = await subscribeToPush();
    if (!res.ok) {
      setError(
        res.error === "denied"
          ? "Notifications are blocked. Allow them in your browser settings, then try again."
          : "Could not turn on notifications. Try again.",
      );
      setPush("off");
      return;
    }
    setPush("on");
  }

  async function disablePush() {
    setPush("busy");
    setError(null);
    try {
      await unsubscribeFromPush();
      setPush("off");
    } catch {
      setError("Could not turn off notifications.");
      setPush("on");
    }
  }

  const pushOn = push === "on";
  const pushBusy = push === "busy";
  const gated = !pushOn; // most toggles need push working

  return (
    <div className="flex flex-col gap-7">
      <Group
        title="Notifications"
        footer={
          <>
            {error ? <span className="mb-1 block text-danger">{error}</span> : null}
            On iPhone, add SKILL to your Home Screen first, then open it from there to allow notifications.
          </>
        }
      >
        <div className="flex min-h-[56px] items-center justify-between gap-4 px-4 py-2.5">
          <span className="flex min-w-0 flex-col">
            <span className="text-[16px] text-fg">On this device</span>
            <span className="text-[13px] leading-snug text-dim">
              {push === "unsupported"
                ? "This browser cannot show notifications."
                : pushOn
                  ? "On. Alerts can reach you when the app is closed."
                  : "Off"}
            </span>
          </span>
          {push !== "unsupported" && push !== "loading" ? (
            <button
              type="button"
              onClick={pushOn ? disablePush : enablePush}
              disabled={pushBusy}
              className={`shrink-0 rounded-full px-4 py-1.5 text-[14px] font-semibold transition-[transform,opacity] active:scale-95 disabled:opacity-60 ${
                pushOn ? "bg-fg/10 text-fg" : "bg-accent text-black"
              }`}
            >
              {pushBusy ? "..." : pushOn ? "Turn off" : "Turn on"}
            </button>
          ) : null}
        </div>
      </Group>

      <Group title="Alerts" footer={gated ? "Turn on notifications above to choose your alerts." : null}>
        <ToggleRow
          label="Training nudge"
          body="If you go a few days without training"
          checked={prefs.quietDayNudge}
          disabled={gated}
          onChange={(v) => patch({ quietDayNudge: v })}
        />
        <div className="flex flex-col">
          <ToggleRow
            label="Scheduled reminders"
            body="A nudge on your training days"
            checked={prefs.scheduledEnabled}
            disabled={gated}
            onChange={(v) => patch({ scheduledEnabled: v })}
          />
          {prefs.scheduledEnabled ? (
            <div className="flex justify-between gap-1 px-4 pb-3.5">
              {DOW.map((d, i) => {
                const on = prefs.scheduledDays.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={gated}
                    aria-pressed={on}
                    aria-label={DAY_NAMES[i]}
                    onClick={() =>
                      patch({
                        scheduledDays: on
                          ? prefs.scheduledDays.filter((x) => x !== i)
                          : [...prefs.scheduledDays, i],
                      })
                    }
                    className={`h-9 w-9 rounded-full text-[13px] font-semibold transition-[background-color,color,transform] active:scale-90 disabled:opacity-40 ${
                      on ? "bg-accent text-black" : "bg-fg/10 text-muted hover:text-fg"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <ToggleRow
          label="Weekly recap"
          body="Every Monday, a summary of last week"
          checked={prefs.weeklyRecap}
          disabled={gated}
          onChange={(v) => patch({ weeklyRecap: v })}
        />
        <ToggleRow
          label="Streak at risk"
          body="When your weekly streak is about to break"
          checked={prefs.streakAtRisk}
          disabled={gated}
          onChange={(v) => patch({ streakAtRisk: v })}
        />
        <ToggleRow
          label="Rest timer done"
          body="When the rest timer finishes and the app is in the background"
          checked={prefs.restTimerDone}
          disabled={gated}
          onChange={(v) => patch({ restTimerDone: v })}
        />
      </Group>

      <Group title="Workout">
        <div className="flex flex-col">
          <ToggleRow
            label="Rest timer"
            body="Show a rest countdown after you log a set"
            checked={prefs.restTimerEnabled}
            onChange={(v) => patch({ restTimerEnabled: v })}
          />
          {prefs.restTimerEnabled ? (
            <div className="flex flex-col gap-2 px-4 pb-3.5">
              <span className="text-[13px] text-dim">Starts at</span>
              <div className="flex flex-wrap gap-1.5">
                {REST_PRESETS.map((s) => {
                  const on = (prefs.defaultRestSeconds ?? 90) === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={on}
                      onClick={() => patch({ defaultRestSeconds: s })}
                      className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold tabular-nums transition-colors ${
                        on ? "bg-fg text-bg" : "bg-fg/10 text-muted hover:text-fg"
                      }`}
                    >
                      {s}s
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
        <ToggleRow
          label="Form videos in the logger"
          body="Keep a small video next to each exercise while you log, instead of tapping to open it. Handy while you are still learning the lifts."
          checked={prefs.inlineVideos}
          onChange={(v) => patch({ inlineVideos: v })}
        />
        <ToggleRow
          label="Unfinished workout reminder"
          body="If a workout is still running 90 minutes after you started, prompt to finish or discard it next time you open the app"
          checked={prefs.unfinishedWorkout}
          onChange={(v) => patch({ unfinishedWorkout: v })}
        />
      </Group>
    </div>
  );
}

function ToggleRow({ label, body, checked, disabled = false, onChange }) {
  return (
    <div className="flex min-h-[56px] items-center justify-between gap-4 px-4 py-3">
      <span className={`flex min-w-0 flex-col ${disabled ? "opacity-45" : ""}`}>
        <span className="text-[16px] text-fg">{label}</span>
        <span className="text-[13px] leading-snug text-dim">{body}</span>
      </span>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}
