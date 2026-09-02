import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

// Data Access Layer: the one place in the app that reads "who is signed
// in." Every page/Server Action that needs the current user calls this
// instead of touching Supabase auth directly, so there is exactly one
// spot that decides what happens when there isn't a valid session.
//
// 'use cache: private' is required here under Cache Components: it's the
// only cache mode allowed to call cookies()/headers() directly, and it
// keeps the result in the browser only (never on the server), which is
// what you want for something as sensitive as "is this person logged
// in." Callers must sit behind a <Suspense> boundary — see
// app/dashboard/page.js for the pattern.
export async function getCurrentUser() {
  "use cache: private";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Return only what the rest of the app needs, never the raw Supabase
  // user/session object, so nothing sensitive leaks into a Client
  // Component that ends up reading this.
  return {
    id: user.id,
    email: user.email,
  };
}
