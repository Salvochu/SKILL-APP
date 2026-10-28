"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { deleteWorkout } from "@/app/(app)/workouts/actions";

export default function DeleteWorkoutButton({ sessionId }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function onConfirm() {
    setDeleting(true);
    setError(null);
    const result = await deleteWorkout(sessionId);
    if (result?.error) {
      setError(result.error);
      setDeleting(false);
      setConfirming(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <>
      {/* A destructive row at the bottom of the page, iOS style: red text
          on a plain surface, confirmed before anything is deleted. */}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-2 w-full rounded-2xl bg-surface py-3.5 text-[16px] font-semibold text-danger transition-colors active:bg-surface-2"
      >
        Delete workout
      </button>
      {error ? <p className="px-4 text-[14px] text-danger">{error}</p> : null}
      {confirming ? (
        <ConfirmModal
          title="Delete this workout?"
          message="This removes the session and every set logged against it. It cannot be undone."
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          cancelLabel="Keep it"
          danger
          onConfirm={onConfirm}
          onCancel={() => !deleting && setConfirming(false)}
        />
      ) : null}
    </>
  );
}
