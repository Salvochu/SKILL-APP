import AuthShell from "@/components/auth/AuthShell";
import MfaForm from "@/components/auth/MfaForm";
import { signOut } from "@/app/actions";
import { safeNext } from "@/lib/safeNext";

export const metadata = { title: "Enter your code" };

// The second step of signing in, for an account with two-factor turned
// on: the password (or email link) already worked, this asks for the
// 6-digit code from the authenticator app. Reads ?next=, so it renders
// per request like the login page.
export const instant = false;

export default async function MfaPage({ searchParams }) {
  const params = await searchParams;
  const next = safeNext(params?.next);

  return (
    <AuthShell
      title="Enter your code"
      subtitle="Open your authenticator app and type the 6-digit code for SKILL."
      footer={
        <form action={signOut}>
          <button type="submit" className="text-muted underline-offset-4 hover:text-fg hover:underline">
            Not you? Sign out
          </button>
        </form>
      }
    >
      <MfaForm next={next} />
    </AuthShell>
  );
}
