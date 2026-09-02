import Link from "next/link";
import { signUp } from "./actions";
import Wordmark from "@/components/Wordmark";

// Same reasoning as app/login/page.js: reads searchParams, low traffic,
// so it opts out of the static-shell requirement instead of adding a
// Suspense boundary for a page that doesn't need instant navigation.
export const instant = false;

export default async function SignUpPage({ searchParams }) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6">
      <div className="flex flex-col gap-2">
        <Wordmark className="text-2xl" />
        <p className="text-sm text-muted">Create your account.</p>
      </div>

      {error ? (
        <p className="rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={signUp} className="flex flex-col gap-4">
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
            minLength={8}
            autoComplete="new-password"
            className="rounded-field border border-border bg-surface px-3 py-2 text-fg placeholder:text-dim focus:border-accent"
          />
          <span className="text-xs font-normal text-dim">
            At least 8 characters.
          </span>
        </Field>
        <button
          type="submit"
          className="mt-1 rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Sign up
        </button>
      </form>

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
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
