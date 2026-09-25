"use client";

import { useRouter } from "next/navigation";
import LoomEmbed from "@/components/challenge/LoomEmbed";
import { setChecklistItem } from "@/app/(app)/challenge/actions";

// Today's video on the Challenge tab. Pressing play also ticks "Watched
// today's video" on the checklist below - one less box to remember, and
// still manually toggleable either way if they click by accident.
export default function TodayVideo({ day, loomId, title }) {
  const router = useRouter();

  return (
    <LoomEmbed
      id={loomId}
      title={title}
      onPlay={() => {
        setChecklistItem(day, "video", true)
          .then(() => router.refresh())
          .catch(() => {});
      }}
    />
  );
}
