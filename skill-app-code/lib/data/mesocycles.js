import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentWeek, isMesocycleComplete, isDeloadWeek, rirForWeek, nextDayIndex } from "@/lib/mesocycle";
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
      "id, start_date, status, variant, template:mesocycle_templates(id, name, weeks, starting_rir, split:splits(id, name))",
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

  const [{ data: days, error: daysError }, { count: sessionsLogged, error: countError }] = await Promise.all([
    supabase
      .from("split_days")
      .select("position, day_template_id, label, day_template:day_templates(id, name, focus)")
      .eq("split_id", run.template.split.id)
      .order("position"),
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_mesocycle_id", run.id),
  ]);
  if (daysError) throw new Error(`Failed to load mesocycle days: ${daysError.message}`);
  if (countError) throw new Error(`Failed to load mesocycle progress: ${countError.message}`);

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
    isComplete: complete,
    sessionsLogged: sessionsLogged ?? 0,
    totalDays,
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
