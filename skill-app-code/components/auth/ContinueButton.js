"use client";

import { useFormStatus } from "react-dom";

// The submit button on /auth/confirm. Locked while the link is being
// spent, so a double tap can't send it twice (the second try would find
// it already used and land on "link expired").
export default function ContinueButton({ disabled = false }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="btn-shine rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black shadow-[0_10px_30px_-10px_rgba(252,118,5,0.7)] transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Opening..." : "Continue"}
    </button>
  );
}
