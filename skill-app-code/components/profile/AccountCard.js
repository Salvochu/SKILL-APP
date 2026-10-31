import { getMembership } from "@/lib/data/profile";
import { getAuthUserRecord } from "@/lib/data/session";
import { membershipEndDate, formatEndDate } from "@/lib/membershipEnd";
import { signOut } from "@/app/actions";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import DangerZone from "@/components/profile/DangerZone";
import { Group, rowButton } from "@/components/ui/Grouped";

// Everything account-level as grouped rows, iOS Settings style: billing
// and password up top, sign out on its own, and deleting the account in
// a separate group at the bottom so it's never next to a routine action.
export default async function AccountCard() {
  const [membership, authUser] = await Promise.all([getMembership(), getAuthUserRecord()]);
  // Members the coach invited have no Stripe subscription to manage.
  // Older invites predate the billing flag and only carry their source.
  const billing = authUser?.app_metadata?.billing;
  const coachInvited =
    billing === "coach" || (!billing && authUser?.user_metadata?.source === "coach_invite");
  const isMember = membership === "member" && !coachInvited;
  // Cancelled but still paid up: say when access stops, and offer to undo
  // it (Stripe's billing page shows "Renew plan" for exactly this).
  const endsAt = isMember ? membershipEndDate(authUser?.app_metadata) : null;
  return (
    <div className="flex flex-col gap-7">
      <Group
        title="Account"
        footer={
          endsAt
            ? `Your membership ends on ${formatEndDate(endsAt)}. You keep full access until then. Changed your mind? Keep it and nothing changes.`
            : isMember
              ? "Update your card or cancel your subscription directly with Stripe."
              : null
        }
      >
        {endsAt ? (
          <a href="/membership/manage" className={`${rowButton} font-semibold text-accent`}>
            Keep my membership
            <IconExternal className="h-4 w-4 shrink-0 text-accent/70" />
          </a>
        ) : isMember ? (
          <a href="/membership/manage" className={`${rowButton} text-fg`}>
            Manage membership
            <IconExternal className="h-4 w-4 shrink-0 text-dim" />
          </a>
        ) : null}
        <ChangePasswordForm />
        <form action={signOut}>
          <button type="submit" className={`${rowButton} text-accent`}>
            Sign out
          </button>
        </form>
      </Group>

      <Group>
        <DangerZone />
      </Group>
    </div>
  );
}

function IconExternal(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
