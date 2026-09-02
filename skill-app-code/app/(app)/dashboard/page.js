import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

// The session read (getCurrentUser) happens at request time, so it can't
// be part of the static shell. It streams in behind this boundary. See
// the Cache Components authentication guide for why.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<GreetingSkeleton />}>
        <Greeting />
      </Suspense>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
          Start training
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            href="/programs"
            title="Programs"
            body="Pick a split and load today's session."
          />
          <ActionCard
            href="/library"
            title="Exercise library"
            body="Every movement with a form video."
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
          Track
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            href="/progress"
            title="Progress"
            body="History, lifts over time, and body weight."
          />
        </div>
      </section>
    </div>
  );
}

async function Greeting() {
  const user = await getCurrentUser();
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-fg">Welcome back</h1>
      <p className="text-sm text-muted">Signed in as {user.email}</p>
    </div>
  );
}

function GreetingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-7 w-40 rounded bg-surface-2" />
      <div className="h-4 w-56 rounded bg-surface" />
    </div>
  );
}

function ActionCard({ href, title, body }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1.5 rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span className="flex items-center justify-between font-display text-base font-semibold text-fg">
        {title}
        <span className="text-dim transition-colors group-hover:text-accent">
          &rarr;
        </span>
      </span>
      <span className="text-sm text-muted">{body}</span>
    </Link>
  );
}
