import { createClient } from "@/lib/supabase/server";

// POST { subscription } : save this browser's push subscription.
// DELETE { endpoint }   : remove it (reminders off on this device).
// proxy.js lets /api/ through unauthenticated, so auth is checked here.

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad body" }, 400);
  }
  const sub = body?.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return json({ error: "incomplete subscription" }, 400);

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: "endpoint" });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
}

export async function DELETE(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const query = supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  if (body?.endpoint) query.eq("endpoint", body.endpoint);
  const { error } = await query;
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
