import { notFound } from "next/navigation";
import FinishPreview from "@/components/dev/FinishPreview";

// Dev-only: the workout-complete screen in its main states, and every
// share image the app generates, with sample data. 404s in production,
// like the rest of /design-preview.
export default function FinishPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <FinishPreview />;
}
