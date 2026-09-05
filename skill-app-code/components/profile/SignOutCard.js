import { signOut } from "@/app/actions";

// Its own card, deliberately separate from DangerZone: signing out is a
// routine action, not a decision that should sit next to "delete my
// account" and risk being confused with it.
export default function SignOutCard() {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Session</h2>
      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-field border border-border px-4 py-2.5 text-left text-sm font-medium text-fg hover:bg-surface-2"
        >
          Sign out
        </button>
      </form>
    </section>
  );
}
