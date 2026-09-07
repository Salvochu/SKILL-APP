import Link from "next/link";
import { tierColorFor } from "@/lib/strength";

function fmtDate(iso) {
  if (!iso) return "unknown";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function ago(iso) {
  if (!iso) return "never";
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 21) return `${d} days ago`;
  return `${Math.round(d / 7)} weeks ago`;
}

// One line the coach can act on: why this client is (or is not) a 1:1
// candidate right now.
function pitchLine(c) {
  const dir = c.strengthDir;
  if (c.sessions4w >= 6 && (dir === "flat" || dir === "down")) {
    return `Trained ${c.sessions4w} times in the last 4 weeks, but the strength score is ${
      dir === "down" ? "down" : "flat"
    }. Putting in the work without the payoff - a strong case for 1:1.`;
  }
  if (c.streak >= 3 && dir === "up") {
    return `On a ${c.streak}-week streak with strength climbing${
      c.strengthDelta ? ` (+${c.strengthDelta})` : ""
    }. Momentum is there - a good moment to offer more structure.`;
  }
  if (c.sessionsPrev4w >= 4 && c.sessions4w <= 1) {
    return `Trained ${c.sessionsPrev4w} times the previous month, then stopped. A personal check-in could bring them back.`;
  }
  if (c.joinedDaysAgo != null && c.joinedDaysAgo <= 14) {
    return `Joined ${c.joinedDaysAgo} days ago. Reaching out early sets the tone for coaching.`;
  }
  if (c.workoutsTotal === 0) {
    return "Has not logged a workout yet. A nudge to get started, then revisit.";
  }
  return `Last trained ${ago(c.lastWorkoutAt)}. Keep an eye on consistency and strength trend.`;
}

const DIR = {
  up: { sym: "↑", cls: "text-good", word: "climbing" },
  down: { sym: "↓", cls: "text-danger", word: "slipping" },
  flat: { sym: "→", cls: "text-dim", word: "flat" },
  none: { sym: "–", cls: "text-dim", word: "no data" },
};

export default function ClientDetail({ client: c }) {
  const dir = DIR[c.strengthDir] ?? DIR.none;
  const tested = (c.strengthPatterns ?? []).filter((p) => p.e1rm > 0);
  const labelByKey = new Map((c.patternLabels ?? []).map((p) => [p.key, p.label]));

  return (
    <div className="flex flex-col gap-5">
      <Link href="/clients" className="flex items-center gap-1 self-start text-xs font-medium text-dim hover:text-fg">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 6-6 6 6 6" />
        </svg>
        All clients
      </Link>

      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-fg">{c.name}</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          {c.email ? <span>{c.email}</span> : null}
          {c.phone ? <span>{c.phone}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {c.goal ? <Tag>{c.goal}</Tag> : null}
          {c.experience ? <Tag>{c.experience}</Tag> : null}
          <Tag>Joined {fmtDate(c.joinedAt)}</Tag>
          <Tag>{c.unit}</Tag>
        </div>
      </header>

      <section className="flex flex-col gap-2 rounded-card border border-accent/40 bg-accent-soft p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-accent">Worth a conversation?</h2>
        <p className="text-sm text-fg">{pitchLine(c)}</p>
        {c.flags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {c.flags.map((f) => (
              <span key={f.key} className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">
                {f.label}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-3">
        <Stat label="This week" value={c.sessionsThisWeek} />
        <Stat label="Week streak" value={c.streak} />
        <Stat label="Workouts" value={c.workoutsTotal} />
        <Stat label="Last workout" value={ago(c.lastWorkoutAt)} />
        <Stat
          label="Strength (6wk)"
          value={
            <span className={dir.cls}>
              {dir.sym} {c.strengthDelta != null && c.strengthDelta !== 0 ? `${c.strengthDelta > 0 ? "+" : ""}${c.strengthDelta}` : dir.word}
            </span>
          }
        />
        <Stat
          label="Weight (30d)"
          value={
            c.weightDelta != null
              ? `${c.weightDelta > 0 ? "+" : ""}${c.weightDelta} ${c.unit}`
              : c.weightNow != null
                ? `${c.weightNow} ${c.unit}`
                : "no data"
          }
        />
      </section>

      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Last 8 weeks</h2>
        <div className="flex gap-1.5">
          {c.consistency.map((w) => (
            <span
              key={w.week}
              title={w.week}
              className={`h-8 flex-1 rounded-field ${w.trained ? "bg-accent" : "bg-surface-2"}`}
            />
          ))}
        </div>
        <p className="text-xs text-dim">
          {c.consistency.filter((w) => w.trained).length} of 8 weeks trained
        </p>
      </section>

      {c.activeProgram ? (
        <section className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Current program</h2>
          <p className="text-sm font-medium text-fg">{c.activeProgram.name}</p>
          <p className="text-xs text-dim">
            Week {c.activeProgram.week} of {c.activeProgram.weeks}
            {c.activeProgram.sessionsPerWeek ? ` · aiming for ${c.activeProgram.sessionsPerWeek} a week` : ""}
          </p>
        </section>
      ) : null}

      {tested.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Strength, last 6 weeks</h2>
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
            {tested.map((p) => (
              <li key={p.key} className="flex items-center gap-3 bg-bg/40 px-3 py-2.5 text-sm">
                <span className="w-[4.75rem] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {labelByKey.get(p.key) ?? p.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-fg">{p.lift}</span>
                <span className="tabular shrink-0 font-semibold text-fg">
                  {Math.round(p.e1rm)} {c.unit}
                </span>
                <span
                  className="shrink-0 text-xs font-semibold"
                  style={{ color: tierColorFor(p.tierIndex) }}
                >
                  {p.tier}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {c.weightSeries.length >= 2 ? (
        <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Body weight</h2>
          <Sparkline points={c.weightSeries.map((p) => p.weight)} />
          <div className="flex justify-between text-xs text-dim">
            <span>{c.weightSeries[0].date}</span>
            <span className="tabular font-semibold text-fg">
              {c.weightSeries[c.weightSeries.length - 1].weight} {c.unit}
            </span>
          </div>
        </section>
      ) : null}

      {c.recentWorkouts.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Recent workouts</h2>
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
            {c.recentWorkouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 bg-bg/40 px-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate text-fg">{w.title}</span>
                  <span className="text-xs text-dim">{fmtDate(w.date)}</span>
                </span>
                <span className="tabular shrink-0 text-xs text-muted">
                  {w.sets} sets{w.minutes != null ? ` · ${w.minutes}m` : ""}
                  {w.effort ? ` · RPE ${w.effort}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-dim">{children}</span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-dim">{label}</span>
      <span className="tabular truncate text-base font-bold text-fg">{value}</span>
    </div>
  );
}

function Sparkline({ points }) {
  if (points.length < 2) return null;
  const w = 300;
  const h = 48;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * (h - 6) - 3;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--color-sky)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
