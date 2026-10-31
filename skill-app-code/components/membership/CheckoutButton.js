"use client";

import { useFormStatus } from "react-dom";
import { usePathname } from "next/navigation";
import { startMembershipCheckout } from "@/app/(app)/membership/actions";

// The "Keep training for £7.99/mo" button: opens Stripe's checkout for
// this account (app/(app)/membership/actions.js). Backing out of the
// checkout returns to the page it was opened from.
export default function CheckoutButton({ className, children }) {
  const pathname = usePathname();
  return (
    <form action={startMembershipCheckout} className="contents">
      <input type="hidden" name="back" value={pathname || "/dashboard"} />
      <Submit className={className}>{children}</Submit>
    </form>
  );
}

function Submit({ className, children }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-70`}>
      {pending ? "Opening checkout..." : children}
    </button>
  );
}
