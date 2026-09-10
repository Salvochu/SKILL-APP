import { getWorkoutSummary } from "@/lib/data/workouts";
import { getJourney } from "@/lib/data/journey";
import { getMuscleTrainingTotals } from "@/lib/data/volume";
import { getUnitPreference } from "@/lib/data/profile";
import { fromKg } from "@/lib/units";
import { KEEP_TRAINING_URL, BOOKING_URL } from "@/lib/links";
import { signOut } from "@/app/actions";

// The whole app for a lapsed paid membership (subscription ended, or
// dunning gave up). The proxy sends every in-app route here. It shows
// what they built, then the one way back in - resubscribe. Nothing else
// in the app is reachable until they do.
export default async function MembershipPaused() {
  const [summary, journey, muscles, unit] = await Promise.all([
    getWorkoutSummary(),
    getJourney(),
    getMuscleTrainingTotals(),
    getUnitPreference(),
  ]);

  const workouts = summary?.workouts ?? 0;
  const volume = Math.round(fromKg(summary?.volumeKg ?? 0, unit));
  const top = (muscles ?? []).slice(0, 3);
  const maxSets = Math.max(1, ...top.map((m) => m.sets));

  return (
    <div className="flex flex-col gap-4">
      <section className="paused-hero relative overflow-hidden rounded-card border border-accent/30 p-6">
        <div
          aria-hidden="true"
          className="cc-bloom pointer-events-none absolute -left-24 -top-24 h-60 w-60 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--panel-glow)" }}
        />
        <div
          aria-hidden="true"
          className="cc-bloom cc-bloom-2 pointer-events-none absolute -bottom-28 -right-20 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--panel-glow)" }}
        />

        <div className="relative flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            SKILL Membership
          </span>
          <h1 className="font-display text-2xl font-bold text-fg">Your membership is paused</h1>
          <p className="text-sm text-muted">
            Nothing is lost. Your history, your level and every number below are exactly where you
            left them, waiting for you. Resubscribe to pick straight back up.
          </p>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2.5">
          <Stat value={workouts.toLocaleString("en-GB")} label="Sessions" />
          <Stat value={volume.toLocaleString("en-GB")} label={`${unit} lifted`} />
          <Stat
            value={journey ? journey.level : "1"}
            label={journey ? `${journey.tier} tier` : "Level"}
            accent={journey?.tierColor}
          />
        </div>

        {top.length > 0 ? (
          <div className="relative mt-5 flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
              Most trained
            </span>
            {top.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-xs font-semibold text-fg">
                  {m.label}
                </span>
                <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="bar-fill absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${Math.max(8, Math.round((m.sets / maxSets) * 100))}%`,
                      background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
                    }}
                  />
                </span>
                <span className="tabular w-10 shrink-0 text-right text-xs text-muted">
                  {m.sets}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="relative mt-6 flex flex-col gap-2.5">
          <a
            href={KEEP_TRAINING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-base font-bold text-black shadow-[0_10px_30px_-8px_rgba(252,118,5,0.65)] transition-transform active:scale-[0.99]"
          >
            Keep training for &pound;14.99/mo
          </a>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-field border border-accent/40 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            Or work with Salvador 1:1
          </a>
        </div>
      </section>

      <form action={signOut} className="self-center">
        <button
          type="submit"
          className="text-xs font-medium text-dim transition-colors hover:text-fg"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Stat({ value, label, accent }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-field border border-border/70 bg-bg/30 px-2 py-3 text-center">
      <span
        className="tabular text-2xl font-bold leading-none"
        style={{ color: accent || "var(--color-fg)" }}
      >
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-dim">{label}</span>
    </div>
  );
}
