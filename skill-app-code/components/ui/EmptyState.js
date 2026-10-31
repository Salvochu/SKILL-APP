import TapLink from "@/components/TapLink";

// One shape for every "nothing here yet" screen: a tinted icon, a short
// title, one line on what will appear, and, when there is an obvious
// next step, the button for it.
export default function EmptyState({ icon, title, body, action = null }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">{icon}</span>
      <div className="flex flex-col gap-1">
        <p className="text-[17px] font-semibold tracking-[-0.01em] text-fg">{title}</p>
        <p className="text-balance text-[15px] leading-snug text-muted">{body}</p>
      </div>
      {action ? (
        <TapLink
          href={action.href}
          className="rounded-full bg-accent px-5 py-2.5 text-[15px] font-semibold text-black transition-transform active:scale-[0.97]"
        >
          {action.label}
        </TapLink>
      ) : null}
    </div>
  );
}
