import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// One Supabase server client and one auth check per request, shared by
// every DAL function.
//
// The project signs sessions with an asymmetric (ECC P-256) key, so
// getClaims() verifies the session JWT right here against Supabase's
// public key, with no network round-trip to the auth server (getUser()
// made one on every render). React's cache() keeps it to one check per
// render. The trade-off: a session revoked elsewhere stays valid until
// its access token expires (an hour at most), which is fine for this app.

export const getServerSupabase = cache(async () => createClient());

export const getSessionUser = cache(async () => {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : data?.claims;
  if (!claims?.sub) return null;
  // aal is "aal2" once this session has also passed the authenticator
  // code (two-factor), "aal1" for a password or email link alone.
  return { id: claims.sub, email: claims.email ?? null, aal: claims.aal ?? "aal1" };
});

// The full auth user record, from the auth server. Only for the rare
// reads the token doesn't carry (account creation date), so it costs a
// round-trip only where it's actually needed.
export const getAuthUserRecord = cache(async () => {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

// The signed-in user's profile row, fetched once and shared by
// getProfile / getUnitPreference / getBeginnerContext / needsOnboarding.
// Selects "*" on purpose - the row is tiny, and it means a column added
// in a migration works before every reader is updated (and vice versa).
export const getProfileRow = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return data ?? null;
});
