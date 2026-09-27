import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Mirrors lib/data/challenge.js's CHALLENGE_TEMPLATE_ID/CHALLENGE_DAYS/
// GRACE_DAYS - duplicated here rather than imported, since that module
// pulls in next/headers-based session helpers that don't belong in Edge
// middleware (same reasoning as the reminders cron, which recomputes
// this in bulk with the admin client instead of the request-scoped
// helpers).
const CHALLENGE_TEMPLATE_ID = "main-character-14";
const CHALLENGE_DAYS = 14;
const GRACE_DAYS = 3;
const DAY_MS = 86400000;

// Next.js 16 renamed middleware.js -> proxy.js (same mechanics, new name/
// export). This runs on every matched request, before rendering.
//
// Job 1: keep the Supabase session cookie fresh. Supabase's access token
// is short-lived; without this, a Server Component reading an expired
// token would see the user as logged out mid-session.
// Job 2: gate the app's own protected routes so a signed-out visitor is
// bounced to /login before any page code runs (defense in depth — every
// Server Action / DAL read still re-checks the session itself too, per
// the Cache Components auth guide).
export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the token if needed — do not remove, and do not add any
  // code between createServerClient and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Routes that must be reachable without a session and must never be
  // redirected to /login: the login/signup screens, the password recovery
  // screen, inbound webhooks, the offline fallback (precached by the
  // service worker, has to render with no auth check possible), and the
  // dev-only component gallery.
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/offline") ||
    pathname.startsWith("/design-preview");
  const isAuthScreen =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthScreen) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // A lapsed paid membership locks the whole app behind /paused (the
  // resubscribe screen). One indexed lookup, only on an authenticated
  // in-app route. Server Actions still re-check, per the auth guide.
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("membership")
      .eq("user_id", user.id)
      .maybeSingle();
    const lapsed = profile?.membership === "lapsed";

    if (lapsed && pathname !== "/paused") {
      const url = request.nextUrl.clone();
      url.pathname = "/paused";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (!lapsed && pathname === "/paused") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // A challenge account past its 14 days + grace window without
    // converting gets the same full-lock treatment behind
    // /challenge-ended, instead of just losing access to the logger
    // while the rest of the app stays browsable.
    if (profile?.membership === "challenge") {
      const { data: run } = await supabase
        .from("user_mesocycles")
        .select("start_date, started_at")
        .eq("user_id", user.id)
        .eq("template_id", CHALLENGE_TEMPLATE_ID)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const basis = run?.started_at || run?.start_date;
      let challengeLapsed = false;
      if (basis) {
        const startMs = Date.parse(`${basis}T00:00:00Z`);
        const todayMs = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
        const daysSince = Math.max(0, Math.floor((todayMs - startMs) / DAY_MS));
        challengeLapsed = daysSince + 1 > CHALLENGE_DAYS + GRACE_DAYS;
      }

      if (challengeLapsed && pathname !== "/challenge-ended") {
        const url = request.nextUrl.clone();
        url.pathname = "/challenge-ended";
        url.search = "";
        return NextResponse.redirect(url);
      }
      if (!challengeLapsed && pathname === "/challenge-ended") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }
    } else if (pathname === "/challenge-ended") {
      // Not (or no longer) a challenge account - nothing to lock here.
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next/static, _next/image (Next internals)
     * - favicon / common static assets
     * - the web app manifest and the service worker script: both must be
     *   fetchable by a signed-out browser (a first-time visitor, or one
     *   who has just signed out), or Chrome's install check silently
     *   fails and the service worker registration fetches the redirected
     *   /login page's HTML instead of a script and never registers.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
