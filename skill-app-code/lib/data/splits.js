import "server-only";
import { createClient } from "@/lib/supabase/server";

// All splits with their ordered days and each day's per-variant exercise
// lists. Reference data, readable by any signed-in user.
export async function getSplits() {
  const supabase = await createClient();

  const [splitsRes, splitDaysRes, templatesRes, templateExRes] = await Promise.all([
    supabase.from("splits").select("id, name, cadence, description, section, position").order("position"),
    supabase.from("split_days").select("id, split_id, position, day_template_id, label").order("position"),
    supabase.from("day_templates").select("id, name, focus, description"),
    supabase
      .from("day_template_exercises")
      .select("day_template_id, variant, position, sets, reps, exercise:exercises(id, name, muscle, equipment, video_url, instructions)")
      .order("position"),
  ]);

  for (const r of [splitsRes, splitDaysRes, templatesRes, templateExRes]) {
    if (r.error) throw new Error(`Failed to load splits: ${r.error.message}`);
  }

  const templateById = new Map(templatesRes.data.map((t) => [t.id, t]));
  const exByTemplate = new Map();
  for (const row of templateExRes.data) {
    if (!exByTemplate.has(row.day_template_id)) exByTemplate.set(row.day_template_id, {});
    const variants = exByTemplate.get(row.day_template_id);
    (variants[row.variant] ||= []).push(row);
  }

  const daysBySplit = new Map();
  for (const sd of splitDaysRes.data) {
    const template = templateById.get(sd.day_template_id);
    if (!template) continue;
    const variantMap = exByTemplate.get(sd.day_template_id) ?? {};
    const day = {
      id: sd.id,
      position: sd.position,
      label: sd.label,
      template,
      variants: Object.fromEntries(
        Object.entries(variantMap).map(([name, list]) => [
          name,
          list.sort((a, b) => a.position - b.position),
        ]),
      ),
    };
    if (!daysBySplit.has(sd.split_id)) daysBySplit.set(sd.split_id, []);
    daysBySplit.get(sd.split_id).push(day);
  }

  return splitsRes.data.map((s) => ({
    ...s,
    days: (daysBySplit.get(s.id) ?? []).sort((a, b) => a.position - b.position),
  }));
}
