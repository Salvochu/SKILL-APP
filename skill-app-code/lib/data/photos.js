import "server-only";
import { createClient } from "@/lib/supabase/server";

const SIGNED_TTL = 60 * 60; // 1 hour

// The signed-in user's progress photos, newest date first, each with a
// short-lived signed URL (the bucket is private). Grouped by date so the
// gallery and the compare picker can work in whole check-ins.
export async function getProgressPhotos() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("progress_photos")
    .select("id, taken_on, angle, storage_path, width, height")
    .order("taken_on", { ascending: false })
    .order("angle", { ascending: true });
  if (error || !data?.length) return { dates: [], count: 0 };

  const paths = data.map((r) => r.storage_path);
  const { data: signed } = await supabase.storage
    .from("progress-photos")
    .createSignedUrls(paths, SIGNED_TTL);
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const photos = data
    .map((r) => ({
      id: r.id,
      date: r.taken_on,
      angle: r.angle,
      width: r.width,
      height: r.height,
      url: urlByPath.get(r.storage_path) ?? null,
    }))
    .filter((p) => p.url);

  const byDate = new Map();
  for (const p of photos) {
    if (!byDate.has(p.date)) byDate.set(p.date, []);
    byDate.get(p.date).push(p);
  }

  const dates = [...byDate.entries()].map(([date, items]) => ({ date, items }));
  return { dates, count: photos.length };
}
