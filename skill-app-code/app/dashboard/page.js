import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/actions";

// The session read (getCurrentUser) happens at request time, so it can't
// be part of the static shell — it streams in behind this boundary. See
// the Cache Components authentication guide for why.
export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-black dark:text-white">
        Welcome back
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Signed in as {user.email}
      </p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        This is the first working screen. Exercise library, workout
        logging, and progress tracking land here next.
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
  );
}
