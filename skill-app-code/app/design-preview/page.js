import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import LibraryBrowser from "@/components/library/LibraryBrowser";
import SplitsBrowser from "@/components/splits/SplitsBrowser";
import WorkoutLogger from "@/components/log/WorkoutLogger";
import BarChart from "@/components/progress/BarChart";
import StrengthChart from "@/components/progress/StrengthChart";

// Dev-only gallery for reviewing the theme and shared components without a
// login. 404s in production; proxy.js lets it through unauthenticated.
export const instant = false;

const EX = [
  { id: "1", name: "Back Squat", muscle: "Legs", equipment: "Barbell", instructions: "Bar on upper traps, brace core, descend to depth, drive through midfoot.", video_url: "https://www.loom.com/share/41f88c0ebac84e82b315337cb4d38f33" },
  { id: "2", name: "Bench Press", muscle: "Chest", equipment: "Barbell", instructions: "Lie flat, grip slightly wider than shoulders, lower bar to mid-chest, press up.", video_url: "https://www.loom.com/share/2a6255e415724571bfcca5efc150128b" },
  { id: "3", name: "Pec Fly Machine", muscle: "Chest", equipment: "Machine", instructions: "Back against pad, bring handles together in a wide arc, squeeze chest at the top.", video_url: "https://www.loom.com/share/bd19ddcac4ad4ea18798f936bc07b366" },
  { id: "4", name: "Hip Thrust", muscle: "Legs", equipment: "Barbell", instructions: "Upper back on bench, bar over hips, drive up, squeeze glutes, lower.", video_url: null },
  { id: "5", name: "Pull Up", muscle: "Back", equipment: "Bodyweight", instructions: "Hang with straight arms, pull chest to bar, lower with control.", video_url: "https://www.loom.com/share/6522956d872c4a018ba2dac840e4130f" },
  { id: "6", name: "Lateral Raise", muscle: "Shoulders", equipment: "Dumbbell", instructions: "Slight elbow bend, raise to shoulder height, lead with elbows, slow lower.", video_url: "https://www.loom.com/share/15a88578ee5a4eb6ba48ea3895e67978" },
  { id: "7", name: "Plank", muscle: "Core", equipment: "Bodyweight", instructions: "Forearms down, body straight line, brace abs and glutes, hold.", video_url: "https://www.loom.com/share/68e15714ba7649ab8441e2085fbe8be3" },
];

const SPLITS = [
  {
    id: "full-body",
    name: "Full Body",
    cadence: "2-3x per week",
    description: "One full-body session repeated 2-3 times per week.",
    section: "primary",
    days: [
      {
        id: "d1",
        position: 0,
        label: null,
        template: { id: "full-body", name: "Full Body", focus: "Whole-body strength", description: "Hits every major muscle group in one session." },
        variants: {
          "Full Gym": [
            { variant: "Full Gym", position: 0, sets: 4, reps: "6-8", exercise: EX[0] },
            { variant: "Full Gym", position: 1, sets: 4, reps: "6-8", exercise: EX[1] },
            { variant: "Full Gym", position: 2, sets: 3, reps: "30-45s", exercise: EX[6] },
          ],
          Bodyweight: [
            { variant: "Bodyweight", position: 0, sets: 4, reps: "15-20", exercise: EX[4] },
            { variant: "Bodyweight", position: 1, sets: 3, reps: "30-45s", exercise: EX[6] },
          ],
        },
      },
    ],
  },
];

const VOL = [
  ["2026-08-04", "Full Body", 3800], ["2026-08-07", "Upper", 4200], ["2026-08-10", "Lower", 5100],
  ["2026-08-14", "Full Body", 4050], ["2026-08-18", "Upper", 4600], ["2026-08-21", "Lower", 5400],
  ["2026-08-25", "Push", 3900], ["2026-08-28", "Pull", 4700], ["2026-09-01", "Legs", 5800],
].map(([date, label, volumeKg], i) => ({ id: String(i), date, label, volumeKg }));

const STRENGTH = [
  {
    id: "bs", name: "Back Squat",
    points: [
      { date: "2026-08-04", best1rm: 110, topWeight: 100, topReps: 3 },
      { date: "2026-08-14", best1rm: 116, topWeight: 105, topReps: 3 },
      { date: "2026-08-21", best1rm: 120, topWeight: 110, topReps: 3 },
      { date: "2026-09-01", best1rm: 127, topWeight: 115, topReps: 3 },
    ],
  },
  {
    id: "bp", name: "Bench Press",
    points: [
      { date: "2026-08-07", best1rm: 82, topWeight: 75, topReps: 3 },
      { date: "2026-08-18", best1rm: 85, topWeight: 77, topReps: 3 },
      { date: "2026-08-28", best1rm: 90, topWeight: 82, topReps: 3 },
    ],
  },
];

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-full">
      <NavBar />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-4 pt-14 pb-28 md:max-w-5xl md:px-6 md:pt-16">
        <Section title="/library">
          <LibraryBrowser exercises={EX} />
        </Section>
        <Section title="/splits">
          <SplitsBrowser splits={SPLITS} />
        </Section>
        <Section title="/progress">
          <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
            <h2 className="font-display text-base font-semibold text-fg">Training volume</h2>
            <BarChart data={VOL} />
          </div>
          <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
            <h2 className="font-display text-base font-semibold text-fg">Strength over time</h2>
            <StrengthChart exercises={STRENGTH} />
          </div>
        </Section>
        <Section title="/log">
          <WorkoutLogger
            allExercises={EX}
            initial={{
              title: "Full Body (Full Gym)",
              date: "2026-09-03",
              exercises: [
                { exercise: EX[0], sets: 3, reps: "6-8" },
                { exercise: EX[1], sets: 3, reps: "6-8" },
              ],
              splitId: "full-body",
              dayTemplateId: "full-body",
              variant: "Full Gym",
            }}
          />
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">{title}</h2>
      {children}
    </section>
  );
}
