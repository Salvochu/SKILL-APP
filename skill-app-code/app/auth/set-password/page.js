import AuthShell from "@/components/auth/AuthShell";
import SetPasswordForm from "@/components/auth/SetPasswordForm";

export const metadata = { title: "Set your password" };

// Reached after /auth/confirm verifies a recovery link, so the visitor
// already has a session. It reads no request data of its own.
export const instant = false;

export default function SetPasswordPage() {
  return (
    <AuthShell
      title="Set your password"
      subtitle="One step to finish setting up your SKILL account."
    >
      <SetPasswordForm />
    </AuthShell>
  );
}
