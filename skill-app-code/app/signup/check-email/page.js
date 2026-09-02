import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-3 px-6">
      <Wordmark className="text-2xl" />
      <h1 className="text-xl font-bold text-fg">Check your inbox</h1>
      <p className="text-sm text-muted">
        We sent you a confirmation link. Open it to finish setting up your
        account, then sign in.
      </p>
      <Link
        href="/login"
        className="mt-2 text-sm font-medium text-accent hover:underline"
      >
        Back to sign in
      </Link>
    </main>
  );
}
