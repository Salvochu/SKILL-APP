import { muscleKey } from "@/lib/exercises";

// A small chip that colours itself by muscle group. Coloured text on a
// faint tint of the same hue, so a list of them stays calm. Works for a
// parent group ("Legs") or a specific muscle ("Quads") - specific muscles
// take their parent group's colour. `subtle` dials it back for secondary
// (assisting) muscle tags.
export default function MusclePill({ muscle, subtle = false, className = "" }) {
  const key = muscleKey(muscle);
  // "Lower back (spinal erectors)" reads as "Lower back" in a chip; the
  // full name stays available on hover and to screen readers.
  const label = String(muscle ?? "").replace(/\s*\(.*\)\s*$/, "");
  return (
    <span
      title={label !== muscle ? muscle : undefined}
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none ${className}`}
      style={{
        color: `var(--muscle-${key})`,
        backgroundColor: `color-mix(in srgb, var(--muscle-${key}) 15%, transparent)`,
        opacity: subtle ? 0.6 : 1,
      }}
    >
      {label}
    </span>
  );
}
