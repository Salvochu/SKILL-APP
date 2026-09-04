import { muscleKey } from "@/lib/exercises";

// A small chip that colours itself by muscle group. Coloured text on a
// faint tint of the same hue, so a list of them stays calm.
export default function MusclePill({ muscle, className = "" }) {
  const key = muscleKey(muscle);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
      style={{
        color: `var(--muscle-${key})`,
        backgroundColor: `color-mix(in srgb, var(--muscle-${key}) 15%, transparent)`,
      }}
    >
      {muscle}
    </span>
  );
}
