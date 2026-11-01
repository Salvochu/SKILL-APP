"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, getSessionUser } from "@/lib/data/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIsCoach } from "@/lib/data/coach";
import { FEEDBACK_KINDS } from "@/lib/feedbackKinds";
import { sendPush } from "@/lib/push";
import { feedbackAccessFor } from "@/lib/data/feedback";

const KINDS = new Set(FEEDBACK_KINDS.map((k) => k.key));
const MAX = 2000;
// Enough for anyone with something real to say; stops a script filling
// the coach's inbox. New conversations are capped per day as well.
const PER_HOUR = 10;
const NEW_PER_DAY = 3;

// Re-checked on every send, with the account read fresh from the auth
// server (the session's copy of the mute flag can be up to an hour old).
async function canSend(user) {
  const { data } = await createAdminClient().auth.admin.getUserById(user.id);
  const fresh = { ...user, appMetadata: data?.user?.app_metadata ?? user.appMetadata };
  const access = await feedbackAccessFor(fresh);
  if (access === "muted") return "Sending feedback is paused on your account.";
  if (access === "closed") return "Feedback is for active challengers and members.";
  return null;
}

function cleanBody(raw) {
  const body = String(raw ?? "").trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > MAX) return { error: `Keep it under ${MAX} characters.` };
  return { body };
}

async function overLimit(supabase) {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("feedback_messages")
    .select("id", { count: "exact", head: true })
    .eq("from_coach", false)
    .gte("created_at", since);
  return (count ?? 0) >= PER_HOUR;
}

// A client starts a new thread.
export async function sendFeedback({ kind, body: raw }) {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };
  if (!KINDS.has(kind)) return { error: "Pick what it's about." };
  const { body, error } = cleanBody(raw);
  if (error) return { error };
  const blocked = await canSend(user);
  if (blocked) return { error: blocked };
  const supabase = await getServerSupabase();
  if (await overLimit(supabase)) return { error: "That's a lot of messages in an hour. Try again a bit later." };
  const { count: today } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 86400_000).toISOString());
  if ((today ?? 0) >= NEW_PER_DAY) {
    return { error: "You've started 3 conversations today. Add to one of them below, or try again tomorrow." };
  }

  const { data: thread, error: tErr } = await supabase
    .from("feedback")
    .insert({ user_id: user.id, kind })
    .select("id")
    .single();
  if (tErr) return { error: "Couldn't send that. Try again." };
  const { error: mErr } = await supabase
    .from("feedback_messages")
    .insert({ feedback_id: thread.id, author_id: user.id, body });
  if (mErr) return { error: "Couldn't send that. Try again." };

  revalidatePath("/feedback");
  return { ok: true };
}

// A client adds to their own thread. Re-opens it for the coach if it was
// marked done.
export async function replyToFeedback({ feedbackId, body: raw }) {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };
  const { body, error } = cleanBody(raw);
  if (error) return { error };
  const blocked = await canSend(user);
  if (blocked) return { error: blocked };
  const supabase = await getServerSupabase();
  if (await overLimit(supabase)) return { error: "That's a lot of messages in an hour. Try again a bit later." };
  const { error: mErr } = await supabase
    .from("feedback_messages")
    .insert({ feedback_id: feedbackId, author_id: user.id, body });
  if (mErr) return { error: "Couldn't send that. Try again." };
  // RLS let the insert through only if the thread is theirs; the status
  // change needs the service role, still scoped to their own thread.
  await createAdminClient()
    .from("feedback")
    .update({ status: "new", updated_at: new Date().toISOString() })
    .eq("id", feedbackId)
    .eq("user_id", user.id);
  revalidatePath("/feedback");
  return { ok: true };
}

// Opening the Feedback screen clears the "New reply" badge.
export async function markFeedbackRead() {
  const user = await getSessionUser();
  if (!user) return;
  await createAdminClient()
    .from("feedback")
    .update({ client_unread: false })
    .eq("user_id", user.id)
    .eq("client_unread", true);
  revalidatePath("/menu");
}

// Coach replies. The client gets a "New reply" badge and, if they have
// notifications on, a push.
export async function coachReply({ feedbackId, body: raw }) {
  if (!(await getIsCoach())) return { error: "Not allowed." };
  const user = await getSessionUser();
  const { body, error } = cleanBody(raw);
  if (error) return { error };
  const admin = createAdminClient();
  const { data: thread } = await admin.from("feedback").select("id, user_id").eq("id", feedbackId).maybeSingle();
  if (!thread) return { error: "That conversation no longer exists." };
  const { error: mErr } = await admin
    .from("feedback_messages")
    .insert({ feedback_id: feedbackId, author_id: user.id, from_coach: true, body });
  if (mErr) return { error: "Couldn't send that. Try again." };
  await admin
    .from("feedback")
    .update({ status: "open", client_unread: true, updated_at: new Date().toISOString() })
    .eq("id", feedbackId);

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", thread.user_id);
  for (const sub of subs ?? []) {
    const r = await sendPush(sub, { title: "Salvador replied", body: body.slice(0, 120), url: "/feedback" });
    if (r.gone) await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  }

  revalidatePath("/clients/feedback");
  return { ok: true };
}

// Coach marks a thread done (or re-opens it).
export async function setFeedbackStatus({ feedbackId, status }) {
  if (!(await getIsCoach())) return { error: "Not allowed." };
  if (!["new", "open", "done"].includes(status)) return { error: "Unknown status." };
  await createAdminClient().from("feedback").update({ status }).eq("id", feedbackId);
  revalidatePath("/clients/feedback");
  return { ok: true };
}

// Coach mutes (or unmutes) a client's feedback. Stored on their auth
// account's app_metadata, which only the server can change.
export async function setFeedbackMuted({ userId, muted }) {
  if (!(await getIsCoach())) return { error: "Not allowed." };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) return { error: "Couldn't find that account." };
  const { error: uErr } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...data.user.app_metadata, feedback_muted: Boolean(muted) },
  });
  if (uErr) return { error: "Couldn't change that. Try again." };
  revalidatePath("/clients/feedback");
  return { ok: true };
}
