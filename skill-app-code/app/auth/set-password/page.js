import Wordmark from "@/components/Wordmark";
import SetPasswordForm from "@/components/auth/SetPasswordForm";

export const metadata = { title: "Set your password" };

// Reached after /auth/confirm verifies a recovery link, so the visitor
// already has a session. It reads no request data of its own.
export const instant = false;

export default function SetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6">
      <div className="flex flex-col gap-2">
        <Wordmark height="2rem" />
        <p className="text-sm text-muted">
          Choose a password to finish setting up your SKILL account.
        </p>
      </div>
      <SetPasswordForm />
    </main>
  );
}
