import Wordmark from "@/components/Wordmark";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6">
      <div className="flex flex-col gap-2">
        <Wordmark height="2rem" />
        <p className="text-sm text-muted">
          Enter your email and we will send a link to set a new password.
        </p>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
