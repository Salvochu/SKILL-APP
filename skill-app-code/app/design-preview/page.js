import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import LibraryBrowser from "@/components/library/LibraryBrowser";

// Dev-only gallery for reviewing the theme and shared components without a
// login. It 404s in production, and proxy.js lets it through unauthenticated
// so `npm run dev` can render it. Grows as shared UI is added.
export const instant = false;

const MOCK_GROUPS = [
  {
    category: "Push",
    exercises: [
      {
        id: "1",
        name: "Incline Dumbbell Press",
        category: "Push",
        cue: "Dumbbells at shoulder level, press up to full extension, lower with control, keep chest engaged.",
        video_url: "https://www.loom.com/share/02e642695ac748c5ae8f3edb2ca2c60c",
      },
      {
        id: "2",
        name: "Pec Fly Machine",
        category: "Push",
        cue: "Back against the pad, bring handles together in a wide arc, squeeze the chest at the top.",
        video_url: "https://www.loom.com/share/bd19ddcac4ad4ea18798f936bc07b366",
      },
      {
        id: "3",
        name: "Bench Press",
        category: "Push",
        cue: null,
        video_url: "https://www.loom.com/share/2a6255e415724571bfcca5efc150128b",
      },
    ],
  },
  {
    category: "Hinge",
    exercises: [
      {
        id: "4",
        name: "Hip Thrust",
        category: "Hinge",
        cue: null,
        video_url: null,
      },
      {
        id: "5",
        name: "Romanian Deadlift",
        category: "Hinge",
        cue: null,
        video_url: "https://www.loom.com/share/5d2d19a51b6843bab4bd7513de818b87",
      },
    ],
  },
];

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-full">
      <NavBar />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 pt-14 pb-24 md:max-w-5xl md:px-6 md:pt-16">
        <section className="flex flex-col gap-4 py-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-fg">Welcome back</h1>
            <p className="text-sm text-muted">Signed in as sam@skfitness.com</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card title="Programs" body="Pick a split and load today's session." />
            <Card
              title="Exercise library"
              body="Every movement with a form video."
            />
          </div>

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

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
            /library
          </h2>
          <LibraryBrowser groups={MOCK_GROUPS} />
        </section>
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
