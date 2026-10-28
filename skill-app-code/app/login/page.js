import Link from "next/link";
import { login } from "./actions";
import AuthShell from "@/components/auth/AuthShell";

// This page reads searchParams (for the "next" redirect target and any
// error message), which makes it request-time. It's a low-traffic auth
// screen with no need for instant-navigation prefetching, so it opts out
// of the Cache Components static-shell requirement rather than being
// restructured around a Suspense boundary.
export const instant = false;

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : null;
  const next = typeof params?.next === "string" ? params.next : "/dashboard";

  return (
    <AuthShell
      title="Train like a Main Character"
      subtitle="Sign in and pick up where you left off."
    >
      {error ? (
        <p className="mb-4 rounded-xl bg-danger/10 px-3.5 py-2.5 text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <form action={login} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          Email
          <input name="email" type="email" required autoComplete="email" className="auth-input" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="auth-input"
          />
          <Link
            href="/auth/forgot-password"
            className="self-end text-xs font-normal text-muted hover:text-fg"
          >
            Forgot password?
          </Link>
        </label>
        <button
          type="submit"
          className="btn-shine mt-1 rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black shadow-[0_10px_30px_-10px_rgba(252,118,5,0.7)] transition-transform active:scale-[0.98]"
        >
          Sign in
        </button>
      </form>
    </AuthShell>
  );
}
