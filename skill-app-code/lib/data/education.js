import "server-only";
import { createClient } from "@/lib/supabase/server";

// Short teaching videos for the Education Library (how to train, how to
// progress, form principles). Reference data, readable by any signed-in
// user. Degrades to an empty list rather than throwing so the page still
// renders before migration 0009 has been applied.
export async function getEducationVideos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("education_videos")
    .select("id, title, description, video_url")
    .order("position")
    .order("created_at");

  if (error) return [];
  return data ?? [];
}
