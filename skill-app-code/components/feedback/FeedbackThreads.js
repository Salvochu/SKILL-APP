"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { replyToFeedback, coachReply, setFeedbackStatus, markFeedbackRead } from "@/app/(app)/feedback/actions";
import { FEEDBACK_KIND_LABEL } from "@/lib/feedbackKinds";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function when(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function statusLabel(t, viewer) {
  if (t.status === "done") return { text: "Done", cls: "bg-fg/10 text-muted" };
  const last = t.messages.at(-1);
  if (viewer === "client") {
    return last?.fromCoach
      ? { text: "Salvador replied", cls: "bg-accent-soft text-accent" }
      : { text: "Waiting for a reply", cls: "bg-fg/10 text-muted" };
  }
  return last?.fromCoach
    ? { text: "You replied", cls: "bg-fg/10 text-muted" }
    : { text: "Needs a reply", cls: "bg-accent-soft text-accent" };
}

// A list of feedback conversations. `viewer` is "client" (their own
// threads) or "coach" (the inbox: names, mark done). Each opens into the
// messages and a reply box.
export default function FeedbackThreads({ threads, viewer, markRead = false }) {
  const router = useRouter();
  const [open, setOpen] = useState(() => (viewer === "client" ? threads.find((t) => t.clientUnread)?.id ?? null : null));

  useEffect(() => {
    if (markRead && threads.some((t) => t.clientUnread)) markFeedbackRead();
  }, [markRead, threads]);

  if (!threads.length) return null;

  return (
    <ul className="flex flex-col gap-2.5">
      {threads.map((t) => {
        const s = statusLabel(t, viewer);
        const first = t.messages[0];
        const isOpen = open === t.id;
        return (
          <li key={t.id} className="overflow-hidden rounded-2xl bg-surface">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : t.id)}
              aria-expanded={isOpen}
              className="flex w-full flex-col gap-1.5 p-4 text-left transition-colors active:bg-surface-2"
            >
              <span className="flex flex-wrap items-center gap-2">
                {viewer === "coach" ? <span className="text-[16px] font-semibold text-fg">{t.clientName}</span> : null}
                <span className="rounded-full bg-fg/10 px-2 py-0.5 text-[12px] font-semibold text-muted">
                  {FEEDBACK_KIND_LABEL[t.kind] ?? t.kind}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${s.cls}`}>{s.text}</span>
                <span className="ml-auto text-[12px] tabular-nums text-dim">{when(t.updatedAt)}</span>
              </span>
              {!isOpen && first ? <span className="line-clamp-2 text-[15px] leading-snug text-muted">{first.body}</span> : null}
            </button>
            {isOpen ? <Thread thread={t} viewer={viewer} onChanged={() => router.refresh()} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

function Thread({ thread, viewer, onChanged }) {
  const [body, setBody] = useState("");
  // A sent message shows straight away, until the refreshed thread (which
  // includes it) arrives, so nobody taps Send twice thinking it failed.
  const [sentLocal, setSentLocal] = useState([]);
  const [seenCount, setSeenCount] = useState(thread.messages.length);
  if (thread.messages.length !== seenCount) {
    setSeenCount(thread.messages.length);
    setSentLocal([]);
  }
  const shown = [...thread.messages, ...sentLocal];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function send(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const localId = `local-${Date.now()}`;
    setSentLocal((list) => [
      ...list,
      { id: localId, fromCoach: viewer === "coach", body: text, createdAt: new Date().toISOString(), sending: true },
    ]);
    setBody("");
    setPending(true);
    setError(null);
    const res =
      viewer === "coach"
        ? await coachReply({ feedbackId: thread.id, body: text })
        : await replyToFeedback({ feedbackId: thread.id, body: text });
    setPending(false);
    if (res?.error) {
      setSentLocal((list) => list.filter((m) => m.id !== localId));
      setBody(text);
      return setError(res.error);
    }
    setSentLocal((list) => list.map((m) => (m.id === localId ? { ...m, sending: false } : m)));
    onChanged();
  }

  async function toggleDone() {
    setPending(true);
    await setFeedbackStatus({ feedbackId: thread.id, status: thread.status === "done" ? "open" : "done" });
    setPending(false);
    onChanged();
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 p-4">
      <ol className="flex flex-col gap-2">
        {shown.map((m) => {
          const mine = viewer === "coach" ? m.fromCoach : !m.fromCoach;
          return (
            <li key={m.id} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
              <span
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug ${
                  mine ? "rounded-br-md bg-accent text-black" : "rounded-bl-md bg-surface-2 text-fg"
                }`}
              >
                {m.body}
              </span>
              <span className="px-1 text-[11px] text-dim">
                {m.fromCoach ? "Salvador" : viewer === "coach" ? thread.clientName : "You"} ·{" "}
                {m.sending ? "Sending..." : when(m.createdAt)}
              </span>
            </li>
          );
        })}
      </ol>
      <form onSubmit={send} className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder={viewer === "coach" ? "Reply..." : "Add a message..."}
          aria-label="Reply"
          className="min-w-0 flex-1 resize-none rounded-xl bg-surface-2 px-3.5 py-2.5 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/60"
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="h-11 shrink-0 rounded-full bg-accent px-4 text-[15px] font-semibold text-black transition-transform active:scale-95 disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {error ? <p className="text-[14px] text-danger">{error}</p> : null}
      {viewer === "coach" ? (
        <button
          type="button"
          onClick={toggleDone}
          disabled={pending}
          className="self-start rounded-lg py-1 text-[14px] font-semibold text-accent transition-opacity active:opacity-60 disabled:opacity-50"
        >
          {thread.status === "done" ? "Re-open" : "Mark as done"}
        </button>
      ) : null}
    </div>
  );
}
