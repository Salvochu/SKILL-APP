import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

// The ordered exercises for one day template + variant, used to preload the
// Log screen when a session is started from Splits. Reference data, cached.
export async function getDayTemplateExercises(dayTemplateId, variant) {
  "use cache";
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("day_template_exercises")
    .select("position, sets, reps, exercise:exercises(id, name, muscle, equipment, video_url, instructions)")
    .eq("day_template_id", dayTemplateId)
    .eq("variant", variant)
    .order("position");

  if (error) throw new Error(`Failed to load day: ${error.message}`);
  return data ?? [];
}

export async function getDayTemplate(dayTemplateId) {
  "use cache";
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("day_templates")
    .select("id, name, focus")
    .eq("id", dayTemplateId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load day: ${error.message}`);
  return data;
}
