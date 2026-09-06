import { muscleKey } from "@/lib/exercises";

// A small chip that colours itself by muscle group. Coloured text on a
// faint tint of the same hue, so a list of them stays calm. Works for a
// parent group ("Legs") or a specific muscle ("Quads") - specific muscles
// take their parent group's colour. `subtle` dials it back for secondary
// (assisting) muscle tags.
export default function MusclePill({ muscle, subtle = false, className = "" }) {
  const key = muscleKey(muscle);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
      style={{
        color: `var(--muscle-${key})`,
        backgroundColor: `color-mix(in srgb, var(--muscle-${key}) 15%, transparent)`,
        opacity: subtle ? 0.6 : 1,
      }}
    >
      {muscle}
    </span>
  );
}
