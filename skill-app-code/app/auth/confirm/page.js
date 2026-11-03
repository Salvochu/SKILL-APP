import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ContinueButton from "@/components/auth/ContinueButton";
import { confirmLink } from "./actions";

export const metadata = { title: "Continue to SKILL" };

// Landing point for every one-time login link: coach invites, the
// welcome emails after a purchase or challenge sign-up, Forgot password.
//
// Opening the link only shows this screen; the link is spent when the
// person taps Continue (a form post, see actions.js). WhatsApp, Instagram
// and iMessage open a link themselves to build its preview, and email
// scanners open every link in a message. When opening it logged in
// straight away, that visit used the link up, so the person got "link
// expired" a minute after it was sent. Those visits never tap a button.
export default function ConfirmPage({ searchParams }) {
  return (
    <AuthShell title="You're almost in" subtitle="Tap continue to open your SKILL account.">
      <Suspense fallback={<ContinueButton disabled />}>
        <ConfirmForm searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function ConfirmForm({ searchParams }) {
  const params = await searchParams;
  const tokenHash = first(params.token_hash);
  const type = first(params.type);
  const code = first(params.code);
  if (!(tokenHash && type) && !code) redirect("/login?error=expired");

  return (
    <form action={confirmLink} className="flex flex-col">
      {tokenHash ? <input type="hidden" name="token_hash" value={tokenHash} /> : null}
      {type ? <input type="hidden" name="type" value={type} /> : null}
      {code ? <input type="hidden" name="code" value={code} /> : null}
      <input type="hidden" name="next" value={first(params.next) ?? ""} />
      <ContinueButton />
    </form>
  );
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}
