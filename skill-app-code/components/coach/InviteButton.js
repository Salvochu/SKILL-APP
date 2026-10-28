"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { Group } from "@/components/ui/Grouped";
import { inviteToSkill } from "@/app/(app)/clients/actions";

// Coach only (it sits on the Clients page): invite someone straight into
// the app, no challenge and no purchase. Creates their account and hands
// back a ready-to-send message with their login link.
export default function InviteButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[14px] font-semibold text-black transition-transform active:scale-95"
      >
        <IconPlus className="h-4 w-4" />
        Invite
      </button>
      {open ? <InviteSheet onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function InviteSheet({ onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null); // "message" | "link"

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await inviteToSkill({ name, email });
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setResult(res);
  }

  function reset() {
    setResult(null);
    setName("");
    setEmail("");
    setCopied(null);
  }

  const first = (result?.name || "").split(/\s+/)[0];
  const message = result
    ? `Hey${first ? ` ${first}` : ""}, here's your access to SKILL, my training app. Tap this link to set your password and log in:\n\n${result.url}\n\nOpen it soon, it only works for a limited time. After that you can log in any time at ${result.appHost}`
    : "";

  async function copy(kind) {
    const text = kind === "link" ? result.url : message;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setError("Couldn't copy automatically. Press and hold the message to copy it.");
    }
  }

  async function share() {
    try {
      await navigator.share({ text: message });
    } catch {
      /* cancelled from the share sheet */
    }
  }
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Sheet onClose={onClose} ariaLabel="Invite to SKILL">
      {(close) => (
        <div className="flex min-h-0 flex-col overflow-y-auto">
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-3">
            <h2 className="font-display text-[1.35rem] font-bold tracking-[-0.02em] text-fg">
              {result ? "Invite ready" : "Invite to SKILL"}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {result ? (
            <div className="flex flex-col gap-4 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-1">
              <p className="text-[15px] leading-relaxed text-muted">
                <span className="font-semibold text-fg">{result.email}</span>{" "}
                {result.isNew
                  ? "now has full access to the app. Send them this message:"
                  : "already had an account, so they now have full access and a fresh login link. Send them this message:"}
              </p>
              <p className="select-all whitespace-pre-wrap break-words rounded-2xl bg-surface px-4 py-3.5 text-[14px] leading-relaxed text-fg">
                {message}
              </p>
              <div className="flex flex-col gap-2">
                {canShare ? (
                  <button
                    type="button"
                    onClick={share}
                    className="rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-black transition-transform active:scale-[0.98]"
                  >
                    Share message
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => copy("message")}
                  className={`rounded-2xl py-3.5 text-[16px] font-semibold transition-transform active:scale-[0.98] ${
                    canShare ? "bg-fg/10 text-fg" : "bg-accent text-black"
                  }`}
                >
                  {copied === "message" ? "Copied" : "Copy message"}
                </button>
                <button
                  type="button"
                  onClick={() => copy("link")}
                  className="py-2 text-[15px] font-semibold text-accent transition-opacity active:opacity-60"
                >
                  {copied === "link" ? "Link copied" : "Copy the link only"}
                </button>
              </div>
              {error ? <p className="text-[14px] text-danger">{error}</p> : null}
              <p className="text-[13px] leading-snug text-dim">
                The link logs them in once. If it expires before they open it, invite the same email again for
                a fresh one. Their account and workouts stay as they are.
              </p>
              <button
                type="button"
                onClick={reset}
                className="self-center py-1 text-[15px] font-semibold text-accent transition-opacity active:opacity-60"
              >
                Invite someone else
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-1">
              <p className="text-[15px] leading-relaxed text-muted">
                They get full access straight away, no challenge and no payment. You&apos;ll get a message with
                their login link to send them.
              </p>
              <Group>
                <div className="px-4">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-label="Their name"
                    placeholder="Their name"
                    autoComplete="off"
                    className="w-full bg-transparent py-3.5 text-[16px] text-fg outline-none placeholder:text-dim"
                  />
                </div>
                <div className="px-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Their email"
                    placeholder="Their email"
                    autoComplete="off"
                    autoCapitalize="none"
                    required
                    className="w-full bg-transparent py-3.5 text-[16px] text-fg outline-none placeholder:text-dim"
                  />
                </div>
              </Group>
              {error ? <p className="px-1 text-[14px] text-danger">{error}</p> : null}
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-black transition-[transform,opacity] active:scale-[0.98] disabled:opacity-40"
              >
                {busy ? "Creating invite..." : "Create invite"}
              </button>
            </form>
          )}
        </div>
      )}
    </Sheet>
  );
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
