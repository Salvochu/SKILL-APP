import { getWorkoutSummary } from "@/lib/data/workouts";
import { getJourney } from "@/lib/data/journey";
import { getMuscleTrainingTotals } from "@/lib/data/volume";
import { getUnitPreference } from "@/lib/data/profile";
import { fromKg } from "@/lib/units";
import { BOOKING_URL } from "@/lib/links";
import CheckoutButton from "@/components/membership/CheckoutButton";
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
      <section className="paused-hero relative overflow-hidden rounded-3xl p-6">
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

        <div className="relative flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
            SKILL Membership
          </span>
          <h1 className="text-balance font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-fg">
            Your membership is paused
          </h1>
          <p className="text-[15px] leading-relaxed text-muted">
            Nothing is lost. Your history, your level and every number below are exactly where you
            left them, waiting for you. Resubscribe to pick straight back up.
          </p>
        </div>

        <div className="relative mt-6 grid grid-cols-3 [&>*+*]:border-l [&>*+*]:border-border/70">
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
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
              Most trained
            </span>
            {top.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-[14px] font-semibold text-fg">
                  {m.label}
                </span>
                <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-fg/10">
                  <span
                    className="bar-fill absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${Math.max(8, Math.round((m.sets / maxSets) * 100))}%`,
                      background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
                    }}
                  />
                </span>
                <span className="tabular w-10 shrink-0 text-right text-[13px] text-muted">
                  {m.sets}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="relative mt-6 flex flex-col gap-2.5">
          <CheckoutButton className="btn-shine flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]">
            Keep training for &pound;7.99/mo
          </CheckoutButton>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-2xl bg-accent-soft px-4 py-4 text-[17px] font-semibold text-accent transition-transform active:scale-[0.98]"
          >
            Or work with Salvador 1:1
          </a>
        </div>
      </section>

      <form action={signOut} className="self-center">
        <button
          type="submit"
          className="rounded-lg px-2 py-1 text-[14px] font-medium text-muted transition-colors hover:text-fg"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Stat({ value, label, accent }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 px-2 text-center">
      <span
        className="tabular max-w-full truncate text-[26px] font-bold leading-none"
        style={{ color: accent || "var(--color-fg)" }}
      >
        {value}
      </span>
      <span className="text-[12px] font-medium text-muted">{label}</span>
    </div>
  );
}
