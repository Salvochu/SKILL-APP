import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server-side Supabase client — for use inside Server Components, Server
// Actions, and Route Handlers. Reads/writes the auth cookies via
// next/headers, so any call into this must happen at request time (i.e.
// behind a Suspense boundary / inside a Server Action, same rule as
// cookies() itself under Cache Components).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll was called from a Server Component (not a Server
            // Action or Route Handler), which can't set cookies. That's
            // fine as long as proxy.js is refreshing the session on every
            // request — see proxy.js.
          }
        },
      },
    }
  );
}
