import "server-only";
import { createClient } from "@supabase/supabase-js";

// A session-less Supabase client that only reads the public reference
// data (splits, exercises, day templates, education videos, program
// templates - all of it RLS-readable without a login). It uses the
// anon key, which unlike the service-role key is present in every
// environment including the Vercel build step, so a `"use cache"`
// function can call it while pages are pre-rendered.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
