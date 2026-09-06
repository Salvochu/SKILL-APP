"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDraft } from "@/lib/activeWorkout";
import ConfirmModal from "@/components/ConfirmModal";

// A normal Link to /log, except: if there is already an unsaved workout
// on this tab (lib/activeWorkout.js), confirm before navigating, since
// that would silently discard it. Used everywhere a "start a workout"
// action exists: the mesocycle card, Splits, the FAB, the nav bar's Log
// button.
export default function GuardedStartLink({ href, className, children, ...rest }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pressed, setPressed] = useState(false);
  const timer = useRef(null);

  function press() {
    if (timer.current) clearTimeout(timer.current);
    setPressed(true);
  }
  function release() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPressed(false), 500);
  }

  function onClick(e) {
    const draft = getDraft();
    // Already the same in-progress workout: no need to warn, just go.
    if (draft && draft.href !== href) {
      e.preventDefault();
      setConfirming(true);
    }
  }

  return (
    <>
      <Link
        href={href}
        onClick={onClick}
        onPointerDown={press}
        onPointerUp={release}
        onPointerCancel={release}
        className={`${className ?? ""} ${pressed ? "bg-accent-soft" : ""}`}
        {...rest}
      >
        {children}
      </Link>
      {confirming ? (
        <ConfirmModal
          title="Workout in progress"
          message="You have an unsaved workout on the Log screen. Starting this one will end that session without saving it. Continue?"
          confirmLabel="Yes, start this"
          cancelLabel="No, keep going"
          danger
          onConfirm={() => {
            setConfirming(false);
            router.push(href);
          }}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </>
  );
}
