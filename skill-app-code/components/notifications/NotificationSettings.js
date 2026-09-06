"use client";

import { useEffect, useState } from "react";
import { saveNotificationPrefs } from "@/app/(app)/settings/actions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// Keep the client-read prefs in localStorage so the workout logger,
// RestTimer and the unfinished-workout prompt can check them without a
// round trip.
function mirror(prefs) {
  try {
    localStorage.setItem("notif:restTimerDone", prefs.restTimerDone ? "on" : "off");
    localStorage.setItem("notif:unfinished", prefs.unfinishedWorkout ? "on" : "off");
    localStorage.setItem("pref:restTimer", prefs.restTimerEnabled ? "on" : "off");
  } catch {
    // storage unavailable is fine
  }
}

export default function NotificationSettings({ initialPrefs }) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [push, setPush] = useState("loading"); // loading | unsupported | off | on | busy
  const [error, setError] = useState(null);

  useEffect(() => {
    mirror(initialPrefs);
    async function check() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !VAPID_PUBLIC_KEY
      ) {
        setPush("unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setPush(sub ? "on" : "off");
      } catch {
        setPush("unsupported");
      }
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
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications are blocked. Allow them in your browser settings, then try again.");
        setPush("off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error("save failed");
      setPush("on");
    } catch {
      setError("Could not turn on notifications. Try again.");
      setPush("off");
    }
  }

  async function disablePush() {
    setPush("busy");
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
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
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-fg">Notifications on this device</span>
            <span className="text-xs text-dim">
              {push === "unsupported"
                ? "This browser cannot show notifications."
                : pushOn
                  ? "On. Alerts can reach you when the app is closed."
                  : "Off"}
            </span>
          </div>
          {push !== "unsupported" && push !== "loading" ? (
            <button
              type="button"
              onClick={pushOn ? disablePush : enablePush}
              disabled={pushBusy}
              className={`shrink-0 rounded-field border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                pushOn
                  ? "border-border text-muted hover:text-fg"
                  : "border-accent/40 bg-accent-soft text-accent hover:bg-accent hover:text-black"
              }`}
            >
              {pushBusy ? "..." : pushOn ? "Turn off" : "Turn on"}
            </button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <p className="text-[11px] text-dim">
          On iPhone, add SKILL to your Home Screen first, then open it from there to allow
          notifications.
        </p>
      </section>

      <section className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border">
        <Toggle
          label="Training nudge"
          body="If you go a few days without training"
          checked={prefs.quietDayNudge}
          disabled={gated}
          onChange={(v) => patch({ quietDayNudge: v })}
        />
        <div className="flex flex-col gap-2 bg-surface px-4 py-3.5">
          <ToggleRow
            label="Scheduled reminders"
            body="A nudge on your training days"
            checked={prefs.scheduledEnabled}
            disabled={gated}
            onChange={(v) => patch({ scheduledEnabled: v })}
          />
          {prefs.scheduledEnabled ? (
            <div className="flex gap-1.5 pl-0.5">
              {DOW.map((d, i) => {
                const on = prefs.scheduledDays.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={gated}
                    onClick={() =>
                      patch({
                        scheduledDays: on
                          ? prefs.scheduledDays.filter((x) => x !== i)
                          : [...prefs.scheduledDays, i],
                      })
                    }
                    className={`h-8 w-8 rounded-full border text-xs font-semibold transition-colors disabled:opacity-40 ${
                      on ? "border-accent bg-accent text-black" : "border-border text-muted hover:text-fg"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <Toggle
          label="Weekly recap"
          body="Every Monday, a summary of last week"
          checked={prefs.weeklyRecap}
          disabled={gated}
          onChange={(v) => patch({ weeklyRecap: v })}
        />
        <Toggle
          label="Streak at risk"
          body="When your weekly streak is about to break"
          checked={prefs.streakAtRisk}
          disabled={gated}
          onChange={(v) => patch({ streakAtRisk: v })}
        />
        <Toggle
          label="Rest timer done"
          body="When the rest timer finishes and the app is in the background"
          checked={prefs.restTimerDone}
          disabled={gated}
          onChange={(v) => patch({ restTimerDone: v })}
        />
      </section>

      <div className="flex flex-col gap-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-dim">Workout</h2>
        <section className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border">
          <Toggle
            label="Rest timer"
            body="Show a rest countdown after you log a set"
            checked={prefs.restTimerEnabled}
            onChange={(v) => patch({ restTimerEnabled: v })}
          />
          <Toggle
            label="Unfinished workout reminder"
            body="If a workout is still running 90 minutes after you started, prompt to finish or discard it next time you open the app"
            checked={prefs.unfinishedWorkout}
            onChange={(v) => patch({ unfinishedWorkout: v })}
          />
        </section>
      </div>
    </div>
  );
}

function Toggle({ label, body, checked, disabled, onChange }) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <ToggleRow label={label} body={body} checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function ToggleRow({ label, body, checked, disabled, onChange }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? "opacity-45" : ""}`}>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-fg">{label}</span>
        <span className="text-xs text-dim">{body}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed ${
          checked ? "border-accent bg-accent" : "border-border bg-surface-2"
        }`}
      >
        <span
          className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  );
}
