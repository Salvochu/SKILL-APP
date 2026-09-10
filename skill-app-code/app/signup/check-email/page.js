import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

export const metadata = { title: "Check your inbox" };

export default function CheckEmailPage() {
  return (
    <AuthShell
      title="Check your inbox"
      subtitle="We sent you a confirmation link. Open it to finish setting up your account, then sign in."
      footer={
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      <p className="text-sm text-muted">
        The link comes from SK Fitness and lands within a minute or two. If you do not see it,
        check your spam or promotions folder.
      </p>
    </AuthShell>
  );
}
