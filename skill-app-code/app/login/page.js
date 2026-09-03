import Link from "next/link";
import { login } from "./actions";
import Wordmark from "@/components/Wordmark";

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
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6">
      <div className="flex flex-col gap-2">
        <Wordmark height="2rem" />
        <p className="text-sm text-muted">
          Your SK Fitness training tracker.
        </p>
      </div>

      {error ? (
        <p className="rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={login} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-field border border-border bg-surface px-3 py-2 text-fg placeholder:text-dim focus:border-accent"
          />
        </Field>
        <Field label="Password">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-field border border-border bg-surface px-3 py-2 text-fg placeholder:text-dim focus:border-accent"
          />
        </Field>
        <button
          type="submit"
          className="mt-1 rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Sign in
        </button>
      </form>

      <p className="text-sm text-muted">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
      {label}
      {children}
    </label>
  );
}
