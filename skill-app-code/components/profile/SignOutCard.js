import { signOut } from "@/app/actions";

// Its own card, deliberately separate from DangerZone: signing out is a
// routine action, not a decision that should sit next to "delete my
// account" and risk being confused with it.
export default function SignOutCard() {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">Session</h3>
      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-field border border-border px-4 py-2.5 text-left text-sm font-medium text-fg hover:bg-surface-2"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
