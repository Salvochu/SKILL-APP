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
    }. Putting in the work without the payoff, a strong case for 1:1.`;
  }
  if (c.streak >= 3 && dir === "up") {
    return `On a ${c.streak}-week streak with strength climbing${
      c.strengthDelta ? ` (+${c.strengthDelta})` : ""
    }. Momentum is there, a good moment to offer more structure.`;
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
  none: { sym: "·", cls: "text-dim", word: "no data" },
};

export default function ClientDetail({ client: c }) {
  const dir = DIR[c.strengthDir] ?? DIR.none;
  const tested = (c.strengthPatterns ?? []).filter((p) => p.e1rm > 0);
  const labelByKey = new Map((c.patternLabels ?? []).map((p) => [p.key, p.label]));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/clients"
        className="-ml-1 -mb-3 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 6-6 6 6 6" />
        </svg>
        All clients
      </Link>

      <header className="flex flex-col gap-1.5">
        <h1 className="text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">{c.name}</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[15px] text-muted">
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

      {c.membership === "challenge" ? (
        <Link
          href={`/clients/${c.id}/challenge`}
          className="flex items-center gap-3.5 rounded-2xl bg-accent-soft p-4 transition-transform active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-black">
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 21V4M5 4l4-1 6 2 4-1v10l-4 1-6-2-4 1" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[16px] font-semibold text-fg">View their 14-Day Challenge</span>
            <span className="text-[13px] text-muted">The climb, the checklist, day by day</span>
          </span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Link>
      ) : null}

      <section className="relative flex flex-col gap-2 overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-5">
        <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">Worth a conversation?</h2>
        <p className="text-[15px] leading-relaxed text-fg">{pitchLine(c)}</p>
        {c.flags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {c.flags.map((f) => (
              <span key={f.key} className="rounded-full bg-fg/10 px-2.5 py-0.5 text-[12px] font-semibold text-muted">
                {f.label}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-x-3 gap-y-4 rounded-2xl bg-surface p-4 sm:grid-cols-3">
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

      <Section title="Last 8 weeks" footer={`${c.consistency.filter((w) => w.trained).length} of 8 weeks trained`}>
        <div className="flex gap-1.5 rounded-2xl bg-surface p-4">
          {c.consistency.map((w) => (
            <span
              key={w.week}
              title={w.week}
              className={`h-8 flex-1 rounded-lg ${w.trained ? "bg-accent" : "bg-fg/10"}`}
            />
          ))}
        </div>
      </Section>

      {c.activeProgram ? (
        <Section title="Current program">
          <div className="flex flex-col rounded-2xl bg-surface px-4 py-3.5">
            <span className="text-[16px] font-semibold text-fg">{c.activeProgram.name}</span>
            <span className="text-[13px] text-muted">
              Week {c.activeProgram.week} of {c.activeProgram.weeks}
              {c.activeProgram.sessionsPerWeek ? ` · aiming for ${c.activeProgram.sessionsPerWeek} a week` : ""}
            </span>
          </div>
        </Section>
      ) : null}

      {tested.length > 0 ? (
        <Section title="Strength, last 6 weeks">
          <ul className="overflow-hidden rounded-2xl bg-surface [&>*+*]:border-t [&>*+*]:border-border/70">
            {tested.map((p) => (
              <li key={p.key} className="flex items-center gap-3 px-4 py-3">
                <span className="w-[4.75rem] shrink-0 text-[12px] font-semibold uppercase tracking-[0.04em] text-dim">
                  {labelByKey.get(p.key) ?? p.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] text-fg">{p.lift}</span>
                <span className="tabular shrink-0 text-[15px] font-semibold text-fg">
                  {Math.round(p.e1rm)} {c.unit}
                </span>
                <span className="shrink-0 text-[13px] font-semibold" style={{ color: tierColorFor(p.tierIndex) }}>
                  {p.tier}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {c.weightSeries.length >= 2 ? (
        <Section title="Body weight">
          <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
            <Sparkline points={c.weightSeries.map((p) => p.weight)} />
            <div className="flex justify-between text-[13px] text-muted">
              <span>{c.weightSeries[0].date}</span>
              <span className="tabular font-semibold text-fg">
                {c.weightSeries[c.weightSeries.length - 1].weight} {c.unit}
              </span>
            </div>
          </div>
        </Section>
      ) : null}

      {c.recentWorkouts.length > 0 ? (
        <Section title="Recent workouts">
          <ul className="overflow-hidden rounded-2xl bg-surface [&>*+*]:border-t [&>*+*]:border-border/70">
            {c.recentWorkouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-[16px] text-fg">{w.title}</span>
                  <span className="text-[13px] text-dim">{fmtDate(w.date)}</span>
                </span>
                <span className="tabular shrink-0 text-[13px] text-muted">
                  {w.sets} sets{w.minutes != null ? ` · ${w.minutes}m` : ""}
                  {w.effort ? ` · RPE ${w.effort}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, footer = null, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-4 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">{title}</h2>
      {children}
      {footer ? <p className="px-4 text-[13px] text-dim">{footer}</p> : null}
    </section>
  );
}

function Tag({ children }) {
  return <span className="rounded-full bg-fg/10 px-2.5 py-0.5 text-[12px] font-semibold text-muted">{children}</span>;
}

function Stat({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      <span className="tabular truncate text-[20px] font-bold leading-tight text-fg">{value}</span>
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
