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
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="self-start rounded-field border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger hover:text-black"
      >
        Delete workout
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
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
