import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  currentWeek,
  isMesocycleComplete,
  isDeloadWeek,
  rirForWeek,
  nextDayIndex,
  weekDateRange,
  weekGuidance,
  sessionOptionsFromCadence,
} from "@/lib/mesocycle";
import { sortVariants } from "@/lib/exercises";

// The programs available to start. Reference data, readable by any
// signed-in user, same as splits/day_templates.
export async function getMesocycleTemplates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesocycle_templates")
    .select("id, name, description, weeks, starting_rir, split:splits(id, name, cadence)")
    .order("position");
  if (error) throw new Error(`Failed to load mesocycle templates: ${error.message}`);
  return data ?? [];
}

// Everything needed to show a template's overview before starting it:
// its days, and which equipment variants its split actually has (the
// coached programs have only "Standard"; the primary splits have Full
// Gym / Dumbbells / Bodyweight).
export async function getMesocycleOverview(templateId) {
  const supabase = await createClient();
  const { data: template, error } = await supabase
    .from("mesocycle_templates")
    .select("id, name, description, weeks, starting_rir, split:splits(id, name, cadence)")
    .eq("id", templateId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load program: ${error.message}`);
  if (!template) return null;

  const { data: days, error: daysError } = await supabase
    .from("split_days")
    .select("position, label, day_template:day_templates(id, name, focus)")
    .eq("split_id", template.split.id)
    .order("position");
  if (daysError) throw new Error(`Failed to load program days: ${daysError.message}`);

  const dayTemplateIds = [...new Set((days ?? []).map((d) => d.day_template?.id).filter(Boolean))];
  const { data: variantRows, error: variantError } = dayTemplateIds.length
    ? await supabase.from("day_template_exercises").select("variant").in("day_template_id", dayTemplateIds)
    : { data: [], error: null };
  if (variantError) throw new Error(`Failed to load program variants: ${variantError.message}`);

  const variants = sortVariants([...new Set((variantRows ?? []).map((r) => r.variant))]);

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    weeks: template.weeks,
    startingRir: template.starting_rir,
    splitName: template.split.name,
    variants,
    // When the split's cadence is a range (Full Body "2-3x per week")
    // the user picks how many sessions a week; otherwise it is fixed.
    sessionOptions: sessionOptionsFromCadence(template.split.cadence),
    days: (days ?? []).map((d) => ({
      position: d.position,
      name: d.day_template?.name ?? d.label ?? "Day",
      focus: d.day_template?.focus ?? null,
    })),
  };
}

// The signed-in user's current run, with everything computed: week, RIR
// target, deload, which day of the split comes next. Null if they are
// not running one.
export async function getActiveMesocycle() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: run, error } = await supabase
    .from("user_mesocycles")
    .select(
      "id, start_date, status, variant, sessions_per_week, template:mesocycle_templates(id, name, weeks, starting_rir, split:splits(id, name))",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load mesocycle: ${error.message}`);
  if (!run) return null;

  const { weeks, starting_rir: startingRir } = run.template;
  const week = currentWeek(run.start_date, weeks);
  const deload = isDeloadWeek(week, weeks);
  const rir = rirForWeek(week, weeks, startingRir);
  const complete = isMesocycleComplete(run.start_date, weeks);

  const { from: weekFrom, to: weekTo } = weekDateRange(run.start_date, week);

  const [
    { data: days, error: daysError },
    { count: sessionsLogged, error: countError },
    { count: sessionsThisWeek, error: weekCountError },
  ] = await Promise.all([
    supabase
      .from("split_days")
      .select("position, day_template_id, label, day_template:day_templates(id, name, focus)")
      .eq("split_id", run.template.split.id)
      .order("position"),
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_mesocycle_id", run.id),
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_mesocycle_id", run.id)
      .gte("started_at", weekFrom)
      .lt("started_at", weekTo),
  ]);
  if (daysError) throw new Error(`Failed to load mesocycle days: ${daysError.message}`);
  if (countError) throw new Error(`Failed to load mesocycle progress: ${countError.message}`);
  if (weekCountError) throw new Error(`Failed to load mesocycle week progress: ${weekCountError.message}`);

  const totalDays = days?.length ?? 0;
  const dayIdx = nextDayIndex(sessionsLogged ?? 0, totalDays);
  const nextDay = days?.[dayIdx] ?? null;

  return {
    id: run.id,
    startDate: run.start_date,
    variant: run.variant || "Standard",
    templateId: run.template.id,
    templateName: run.template.name,
    splitId: run.template.split.id,
    splitName: run.template.split.name,
    weeks,
    week,
    isDeload: deload,
    rirTarget: rir,
    guidance: weekGuidance(week, weeks, startingRir),
    isComplete: complete,
    sessionsLogged: sessionsLogged ?? 0,
    sessionsThisWeek: sessionsThisWeek ?? 0,
    totalDays,
    // Sessions the user aims for each week. Chosen at start for
    // range-cadence splits (Full Body); otherwise the split's day count.
    sessionsPerWeek: run.sessions_per_week || totalDays || 1,
    nextDay: nextDay
      ? {
          position: nextDay.position,
          dayTemplateId: nextDay.day_template_id,
          name: nextDay.day_template?.name ?? nextDay.label ?? "Day",
          focus: nextDay.day_template?.focus ?? null,
        }
      : null,
  };
}

// End-of-block readout: what was done across a finished (or finishing)
// mesocycle run, and where strength moved. Compares the best estimated
// 1RM in the first half of the run against the second half, per lift.
export async function getMesocycleSummary(userMesocycleId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: run } = await supabase
    .from("user_mesocycles")
    .select("id, start_date, template:mesocycle_templates(name, weeks)")
    .eq("id", userMesocycleId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!run) return null;

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at")
    .eq("user_mesocycle_id", userMesocycleId)
    .order("started_at", { ascending: true });
  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) {
    return { templateName: run.template.name, weeks: run.template.weeks, sessionCount: 0, totalVolume: 0, gains: [] };
  }

  const { data: sets } = await supabase
    .from("workout_sets")
    .select("session_id, reps, weight, completed, is_warmup, exercise:exercises(name)")
    .in("session_id", sessionIds);

  const startedAt = new Map((sessions ?? []).map((s) => [s.id, new Date(s.started_at).getTime()]));
  const first = startedAt.get(sessionIds[0]);
  const last = startedAt.get(sessionIds[sessionIds.length - 1]);
  const mid = first + (last - first) / 2;

  let totalVolume = 0;
  const perLift = new Map(); // name -> { early: bestE1, late: bestE1 }
  for (const s of sets ?? []) {
    if (s.completed === false || s.is_warmup) continue;
    const w = Number(s.weight) || 0;
    const r = Number(s.reps) || 0;
    if (w > 0 && r > 0) totalVolume += w * r;
    if (!(w > 0 && r > 0 && r <= 15)) continue;
    const e1 = w * (1 + r / 30);
    const name = s.exercise?.name ?? "Exercise";
    if (!perLift.has(name)) perLift.set(name, { early: 0, late: 0 });
    const rec = perLift.get(name);
    const half = (startedAt.get(s.session_id) ?? first) <= mid ? "early" : "late";
    if (e1 > rec[half]) rec[half] = e1;
  }

  const gains = [...perLift.entries()]
    .filter(([, r]) => r.early > 0 && r.late > 0)
    .map(([name, r]) => ({
      name,
      from: Math.round(r.early),
      to: Math.round(r.late),
      deltaPct: Math.round(((r.late - r.early) / r.early) * 100),
    }))
    .sort((a, b) => b.deltaPct - a.deltaPct)
    .slice(0, 5);

  return {
    templateName: run.template.name,
    weeks: run.template.weeks,
    sessionCount: sessionIds.length,
    totalVolume: Math.round(totalVolume),
    gains,
  };
}
