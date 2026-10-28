// A small labelled number pill ("Sets 4", "Reps 6-8"): the label quiet,
// the value in the body font so it reads like the text around it.
export default function StatPill({ label, value, tone = "default" }) {
  const accent = tone === "accent";
  return (
    <span
      className={`inline-flex items-baseline gap-1 rounded-full px-2.5 py-1 font-sans text-[12px] leading-none ${
        accent ? "bg-accent-soft" : "bg-surface-2"
      }`}
    >
      <span className={accent ? "text-accent/80" : "text-dim"}>{label}</span>
      <span className={`font-semibold ${accent ? "text-accent" : "text-fg"}`}>{value}</span>
    </span>
  );
}
