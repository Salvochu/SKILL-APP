import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import LibraryBrowser from "@/components/library/LibraryBrowser";
import SplitsList from "@/components/splits/SplitsList";
import SplitDetail from "@/components/splits/SplitDetail";
import WorkoutLogger from "@/components/log/WorkoutLogger";
import WorkoutBuilder from "@/components/workouts/WorkoutBuilder";
import BarChart from "@/components/progress/BarChart";
import StrengthChart from "@/components/progress/StrengthChart";
import CompareExercises from "@/components/progress/CompareExercises";
import ShareCardPreview from "@/components/dev/ShareCardPreview";
import WorkoutHistoryModal from "@/components/dashboard/WorkoutHistoryModal";
import MesocyclePanel from "@/components/dashboard/MesocyclePanel";
import TrainingModeSetting from "@/components/settings/TrainingModeSetting";

const LOG_INITIAL = {
  title: "Full Body (Full Gym)",
  date: "2026-09-03",
  exercises: [
    { exercise: { id: "1", name: "Back Squat", muscle: "Legs", equipment: "Barbell" }, sets: 3, reps: "6-8" },
    { exercise: { id: "2", name: "Bench Press", muscle: "Chest", equipment: "Barbell" }, sets: 3, reps: "6-8" },
    { exercise: { id: "7", name: "Plank", muscle: "Core", equipment: "Bodyweight" }, sets: 3, reps: "30-45s" },
  ],
  splitId: "full-body",
  dayTemplateId: "full-body",
  variant: "Full Gym",
};

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

const MULTI_SPLIT = {
  id: "ppl-demo",
  name: "Push Pull Legs",
  cadence: "6 days",
  description: "Push, Pull, Legs run twice across six sessions.",
  section: "primary",
  days: [
    { id: "p1", position: 0, label: "Push", template: { id: "push", name: "Push Day", focus: "Chest, Shoulders, Triceps", description: "All pressing movements." },
      variants: { "Full Gym": [
        { variant: "Full Gym", position: 0, sets: 4, reps: "6-8", exercise: EX[1] },
        { variant: "Full Gym", position: 1, sets: 3, reps: "10-12", exercise: EX[5] },
      ] } },
    { id: "p2", position: 1, label: "Pull", template: { id: "pull", name: "Pull Day", focus: "Back, Biceps", description: "All pulling movements." },
      variants: { "Full Gym": [
        { variant: "Full Gym", position: 0, sets: 4, reps: "6-8", exercise: EX[4] },
      ] } },
    { id: "l1", position: 2, label: "Legs", template: { id: "legs", name: "Legs Day", focus: "Quads, Hamstrings, Glutes", description: "Squat and hinge patterns." },
      variants: { "Full Gym": [
        { variant: "Full Gym", position: 0, sets: 4, reps: "6-8", exercise: EX[0] },
        { variant: "Full Gym", position: 1, sets: 3, reps: "8-10", exercise: EX[3] },
      ] } },
    { id: "p3", position: 3, label: "Push", template: { id: "push", name: "Push Day", focus: "Chest, Shoulders, Triceps", description: "All pressing movements." },
      variants: { "Full Gym": [{ variant: "Full Gym", position: 0, sets: 4, reps: "8-10", exercise: EX[1] }] } },
    { id: "p4", position: 4, label: "Pull", template: { id: "pull", name: "Pull Day", focus: "Back, Biceps", description: "All pulling movements." },
      variants: { "Full Gym": [{ variant: "Full Gym", position: 0, sets: 4, reps: "8-10", exercise: EX[4] }] } },
    { id: "l2", position: 5, label: "Legs", template: { id: "legs", name: "Legs Day", focus: "Quads, Hamstrings, Glutes", description: "Squat and hinge patterns." },
      variants: { "Full Gym": [{ variant: "Full Gym", position: 0, sets: 4, reps: "8-10", exercise: EX[0] }] } },
  ],
};

const MESO_ACTIVE = {
  id: "m1", kind: "mesocycle", variant: "Full Gym",
  splitId: "ppl-x2", splitName: "Push Pull Legs x2",
  weeks: 5, week: 2, startingRir: 3, isDeload: false,
  sessionsThisWeek: 2, sessionsPerWeek: 6, sessionsLogged: 8,
  totalDays: 6, targetSessions: null, isComplete: false,
  guidance: { headline: "Add a little", detail: "Push one more rep or a small jump on your top set." },
  nextDay: { position: 2, dayTemplateId: "legs", name: "Legs Day", focus: "Quads, Hamstrings, Glutes" },
  days: [
    { position: 0, dayTemplateId: "push", name: "Push Day", focus: "Chest, Shoulders, Triceps", isNext: false },
    { position: 1, dayTemplateId: "pull", name: "Pull Day", focus: "Back, Biceps", isNext: false },
    { position: 2, dayTemplateId: "legs", name: "Legs Day", focus: "Quads, Hamstrings, Glutes", isNext: true },
    { position: 3, dayTemplateId: "push", name: "Push Day", focus: "Chest, Shoulders, Triceps", isNext: false },
    { position: 4, dayTemplateId: "pull", name: "Pull Day", focus: "Back, Biceps", isNext: false },
    { position: 5, dayTemplateId: "legs", name: "Legs Day", focus: "Quads, Hamstrings, Glutes", isNext: false },
  ],
};

const MESO_CHALLENGE = {
  id: "c1", kind: "challenge", isChallenge: true, challengeDay: 4, challengeDays: 14,
  variant: "Full Gym", splitId: "main-character-14", splitName: "14-Day Main Character",
  weeks: 2, week: 1, startingRir: 3, isDeload: false, advanced: false,
  sessionsThisWeek: 1, sessionsPerWeek: 3, sessionsLogged: 2,
  totalDays: 2, targetSessions: 6, isComplete: false,
  guidance: { headline: "2 of 6 sessions", detail: "Alternate Day A and Day B, beat last time where you can, and get your cardio in each week." },
  nextDay: { position: 1, dayTemplateId: "foundations-b", name: "Day B", focus: "Hinge, press, pull" },
  days: [
    { position: 0, dayTemplateId: "foundations-a", name: "Day A", focus: "Squat, push, pull", isNext: false, doneThisWeek: true },
    { position: 1, dayTemplateId: "foundations-b", name: "Day B", focus: "Hinge, press, pull", isNext: true, doneThisWeek: false },
  ],
};

const MESO_CHALLENGE_OVER = { ...MESO_CHALLENGE, challengeDay: 15, sessionsLogged: 5, sessionsThisWeek: 2 };

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
        <Section title="dashboard / mesocycle panel">
          <MesocyclePanel active={MESO_ACTIVE} summary={null} />
        </Section>
        <Section title="dashboard / 14-day challenge (mid)">
          <MesocyclePanel active={MESO_CHALLENGE} summary={null} isBeginner />
        </Section>
        <Section title="dashboard / 14-day challenge (fork)">
          <MesocyclePanel active={MESO_CHALLENGE_OVER} summary={null} isBeginner />
        </Section>
        <Section title="/splits">
          <SplitsList splits={SPLITS} />
        </Section>
        <Section title="/splits (with My workouts)">
          <SplitsList
            splits={SPLITS}
            myWorkouts={[
              {
                id: "mw1",
                name: "Quick push day",
                note: "",
                updatedAt: "2026-09-06",
                exercises: [
                  { exerciseId: "2", exercise: EX[1], name: "Bench Press", muscle: "Chest", sets: 4, reps: "6 to 8" },
                  { exerciseId: "6", exercise: EX[5], name: "Lateral Raise", muscle: "Shoulders", sets: 3, reps: "12 to 15" },
                ],
                muscleSummary: "Chest, Shoulders",
              },
            ]}
          />
        </Section>
        <Section title="/workouts/mine/new (builder, empty)">
          <WorkoutBuilder allExercises={EX} initial={{ id: null, name: "", note: "", exercises: [] }} />
        </Section>
        <Section title="/workouts/mine/[id] (builder, editing)">
          <WorkoutBuilder
            allExercises={EX}
            initial={{
              id: "mw1",
              name: "Quick push day",
              note: "Keep rests short.",
              exercises: [
                { exerciseId: "2", exercise: EX[1], sets: 4, reps: "6 to 8" },
                { exerciseId: "6", exercise: EX[5], sets: 3, reps: "12 to 15" },
              ],
            }}
          />
        </Section>
        <Section title="/splits/[id] (multi-day)">
          <SplitDetail split={MULTI_SPLIT} template={{ id: "ppl-demo", weeks: 5 }} activeProgram={null} />
        </Section>
        <Section title="/splits/[id] (single day)">
          <SplitDetail split={SPLITS[0]} template={{ id: "full-body", weeks: 5 }} activeProgram={null} />
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
          <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
            <h2 className="font-display text-base font-semibold text-fg">Compare two lifts</h2>
            <CompareExercises exercises={STRENGTH} />
          </div>
        </Section>
        <Section title="Share card">
          <ShareCardPreview />
        </Section>
        <Section title="Workout history modal">
          <WorkoutHistoryModal sessions={VOL.map((v) => ({ id: v.id, title: v.label, started_at: v.date }))}>
            <button type="button" className="rounded-field border border-border px-4 py-2 text-sm">
              Show all
            </button>
          </WorkoutHistoryModal>
        </Section>
        <Section title="/log (advanced - RIR box)">
          <WorkoutLogger
            allExercises={EX}
            initial={LOG_INITIAL}
          />
        </Section>
        <Section title="/log (simple - to-failure tap)">
          <WorkoutLogger allExercises={EX} advanced={false} initial={LOG_INITIAL} />
        </Section>
        <Section title="settings / training detail">
          <TrainingModeSetting initialAdvanced={false} isExplicit={false} />
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
