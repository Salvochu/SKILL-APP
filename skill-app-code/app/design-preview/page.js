import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";

// Dev-only gallery for reviewing the theme and shared components without a
// login. It 404s in production, and proxy.js lets it through unauthenticated
// so `npm run dev` can render it. Grows as shared UI is added.
export const instant = false;

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-full">
      <NavBar />
      <main className="mx-auto w-full max-w-2xl px-4 pt-14 pb-24 md:max-w-5xl md:px-6 md:pt-16">
        <div className="flex flex-col gap-8 py-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-fg">Welcome back</h1>
            <p className="text-sm text-muted">Signed in as sam@skfitness.com</p>
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
              Start training
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card
                title="Programs"
                body="Pick a split and load today's session."
              />
              <Card
                title="Exercise library"
                body="Every movement with a form video."
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
              Sample set logger
            </h2>
            <div className="rounded-card border border-border bg-surface p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-display font-semibold text-fg">
                  Incline Dumbbell Press
                </span>
                <span className="text-xs text-dim">2 x 8-12</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                Dumbbells at shoulder level, press up to full extension.
              </p>
              <div className="mt-3 flex gap-2">
                <span className="tabular rounded-field bg-surface-2 px-3 py-2 text-sm text-fg">
                  135 lb
                </span>
                <span className="tabular rounded-field bg-surface-2 px-3 py-2 text-sm text-fg">
                  10 reps
                </span>
                <span className="tabular rounded-field bg-accent px-3 py-2 text-sm font-semibold text-black">
                  1:30
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Card({ title, body }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-card border border-border bg-surface p-4">
      <span className="flex items-center justify-between font-display text-base font-semibold text-fg">
        {title}
        <span className="text-dim">&rarr;</span>
      </span>
      <span className="text-sm text-muted">{body}</span>
    </div>
  );
}
