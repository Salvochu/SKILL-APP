"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

const ANGLES = ["front", "side", "back"];

// Store one progress photo. The image is already downscaled to a JPEG
// on the client (lib/imageResize). It lands in the private
// progress-photos bucket under the user's own folder; the DB row is the
// index. If the row insert fails the object is rolled back.
export async function uploadProgressPhoto(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const file = formData.get("photo");
  if (!file || typeof file !== "object" || file.size === 0) {
    return { error: "Pick a photo first." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { error: "That image is too large. Try another." };
  }

  const takenOn = /^\d{4}-\d{2}-\d{2}$/.test(formData.get("takenOn"))
    ? formData.get("takenOn")
    : new Date().toISOString().slice(0, 10);
  const angle = ANGLES.includes(formData.get("angle")) ? formData.get("angle") : "front";
  const width = Number(formData.get("width")) || null;
  const height = Number(formData.get("height")) || null;

  const id = randomUUID();
  const path = `${user.id}/${id}.jpg`;

  const { error: upErr } = await supabase.storage
    .from("progress-photos")
    .upload(path, file, { contentType: "image/jpeg", upsert: false });
  if (upErr) return { error: `Could not save that photo: ${upErr.message}` };

  const { error } = await supabase.from("progress_photos").insert({
    id,
    user_id: user.id,
    taken_on: takenOn,
    angle,
    storage_path: path,
    width,
    height,
  });
  if (error) {
    await supabase.storage.from("progress-photos").remove([path]);
    return { error: error.message };
  }

  return { ok: true };
}

export async function deleteProgressPhoto(id) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  if (!id || typeof id !== "string") return { error: "That photo could not be found." };

  const { data: row } = await supabase
    .from("progress_photos")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (row?.storage_path) {
    await supabase.storage.from("progress-photos").remove([row.storage_path]);
  }

  const { error } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  return { ok: true };
}
