import AuthShell from "@/components/auth/AuthShell";
import SetPasswordForm from "@/components/auth/SetPasswordForm";
import { getSessionUser } from "@/lib/data/session";

export const metadata = { title: "Set your password" };

// Reached after /auth/confirm verifies a recovery link, so the visitor
// already has a session: its email is shown above the password fields.
export const instant = false;

export default async function SetPasswordPage() {
  const user = await getSessionUser();
  return (
    <AuthShell
      title="Set your password"
      subtitle="One step to finish setting up your SKILL account."
    >
      <SetPasswordForm email={user?.email ?? null} />
    </AuthShell>
  );
}
