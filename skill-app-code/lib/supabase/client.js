import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — safe to import into Client Components.
// Uses the public URL + anon key, which are meant to be exposed as long
// as Row Level Security (RLS) is enabled on every table in the database.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
