"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendFeedback } from "@/app/(app)/feedback/actions";
import { FEEDBACK_KINDS } from "@/lib/feedbackKinds";

const PLACEHOLDER = {
  bug: "What happened, and what were you trying to do?",
  video: "Which exercise, and what's missing or wrong?",
  idea: "What would make the app better for you?",
  other: "What's on your mind?",
};

// Start a new feedback thread: pick what it's about, write, send.
export default function FeedbackForm() {
  const router = useRouter();
  const [kind, setKind] = useState("bug");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await sendFeedback({ kind, body });
    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setBody("");
    setSent(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      <div role="radiogroup" aria-label="What is it about?" className="grid grid-cols-2 gap-2">
        {FEEDBACK_KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            role="radio"
            aria-checked={kind === k.key}
            onClick={() => {
              setKind(k.key);
              setSent(false);
            }}
            className={`rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold leading-snug transition-colors ${
              kind === k.key ? "bg-accent-soft text-accent ring-1 ring-accent/50" : "bg-surface-2 text-muted"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setSent(false);
        }}
        rows={4}
        maxLength={2000}
        placeholder={PLACEHOLDER[kind]}
        aria-label="Your message"
        className="w-full resize-y rounded-xl bg-surface-2 px-3.5 py-3 text-[16px] leading-relaxed text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/60"
      />
      {error ? <p className="text-[14px] text-danger">{error}</p> : null}
      {sent ? <p className="text-[14px] text-good">Sent. Salvador will reply here.</p> : null}
      <button
        type="submit"
        disabled={pending || !body.trim()}
        className="rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-black transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
