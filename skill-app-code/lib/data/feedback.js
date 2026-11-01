import "server-only";
import { cache } from "react";
import { getServerSupabase, getSessionUser } from "@/lib/data/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIsCoach } from "@/lib/data/coach";
import { getMembership } from "@/lib/data/profile";
import { getChallengeAccess } from "@/lib/data/challenge";

// In-app feedback (migration 0049). Clients read their own threads
// through their session (RLS); the coach reads everyone's through the
// service role, only after getIsCoach().

function shapeThreads(threads, messages) {
  const byThread = new Map();
  for (const m of messages ?? []) {
    if (!byThread.has(m.feedback_id)) byThread.set(m.feedback_id, []);
    byThread.get(m.feedback_id).push({
      id: m.id,
      fromCoach: m.from_coach,
      body: m.body,
      createdAt: m.created_at,
    });
  }
  return (threads ?? []).map((t) => ({
    id: t.id,
    userId: t.user_id,
    kind: t.kind,
    status: t.status,
    clientUnread: t.client_unread,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    messages: byThread.get(t.id) ?? [],
  }));
}

// Who can send feedback: active challengers (until their access ends after
// Day 14) and paying members. Lapsed accounts (challenge ended unpaid, or a
// cancelled membership) can still read past messages but not send. The
// coach can mute an account (app_metadata.feedback_muted, which clients
// can't change). "open" | "closed" | "muted".
export async function feedbackAccessFor(user) {
  if (!user) return "closed";
  if (user.appMetadata?.feedback_muted) return "muted";
  const membership = await getMembership();
  if (membership === "lapsed") return "closed";
  if (membership === "challenge") {
    const access = await getChallengeAccess();
    if (access.lapsed) return "closed";
  }
  return "open";
}

export const getFeedbackAccess = cache(async () => feedbackAccessFor(await getSessionUser()));

// The signed-in client's own threads, newest activity first. Empty if the
// table isn't there yet (migration not run), rather than breaking the page.
export const getMyFeedback = cache(async () => {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await getServerSupabase();
  const { data: threads, error } = await supabase
    .from("feedback")
    .select("id, user_id, kind, status, client_unread, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error || !threads?.length) return [];
  const { data: messages } = await supabase
    .from("feedback_messages")
    .select("id, feedback_id, from_coach, body, created_at")
    .in("feedback_id", threads.map((t) => t.id))
    .order("created_at", { ascending: true });
  return shapeThreads(threads, messages);
});

// For the Menu row's "New reply" badge.
export const getFeedbackUnreadCount = cache(async () => {
  const user = await getSessionUser();
  if (!user) return 0;
  const supabase = await getServerSupabase();
  const { count, error } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("client_unread", true);
  return error ? 0 : count ?? 0;
});

// Coach inbox: every thread with the client's name. Null for non-coaches.
export async function getFeedbackInbox() {
  if (!(await getIsCoach())) return null;
  const admin = createAdminClient();
  const { data: threads, error } = await admin
    .from("feedback")
    .select("id, user_id, kind, status, client_unread, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) return { threads: [], missingTable: true };
  if (!threads?.length) return { threads: [] };
  const ids = threads.map((t) => t.id);
  const userIds = [...new Set(threads.map((t) => t.user_id))];
  const [{ data: messages }, { data: profiles }] = await Promise.all([
    admin.from("feedback_messages").select("id, feedback_id, from_coach, body, created_at").in("feedback_id", ids).order("created_at", { ascending: true }),
    admin.from("profiles").select("user_id, full_name").in("user_id", userIds),
  ]);
  const nameBy = new Map((profiles ?? []).map((p) => [p.user_id, (p.full_name || "").trim()]));
  const mutedBy = new Map();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      mutedBy.set(id, Boolean(data?.user?.app_metadata?.feedback_muted));
    }),
  );
  return {
    threads: shapeThreads(threads, messages).map((t) => ({
      ...t,
      clientName: nameBy.get(t.userId) || "A client",
      muted: mutedBy.get(t.userId) ?? false,
    })),
  };
}

// The "N new" count for the coach's Clients screen.
export async function getFeedbackNewCount() {
  if (!(await getIsCoach())) return 0;
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  return error ? 0 : count ?? 0;
}
