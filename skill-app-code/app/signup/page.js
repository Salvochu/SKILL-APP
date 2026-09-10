import Link from "next/link";
import { signUp } from "./actions";
import AuthShell from "@/components/auth/AuthShell";

// Same reasoning as app/login/page.js: reads searchParams, low traffic,
// so it opts out of the static-shell requirement instead of adding a
// Suspense boundary for a page that doesn't need instant navigation.
export const instant = false;

export default async function SignUpPage({ searchParams }) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : null;

  return (
    <AuthShell
      title="Train like a Main Character"
      subtitle="Create your account to get started."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {error ? (
        <p className="mb-4 rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={signUp} className="flex flex-col gap-4">
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
            minLength={8}
            autoComplete="new-password"
            className="auth-input"
          />
          <span className="text-xs font-normal text-dim">At least 8 characters.</span>
        </label>
        <button
          type="submit"
          className="btn-shine mt-1 rounded-field bg-accent px-4 py-3 font-bold text-black shadow-[0_10px_30px_-10px_rgba(252,118,5,0.7)] transition-transform active:scale-[0.99]"
        >
          Sign up
        </button>
      </form>
    </AuthShell>
  );
}
