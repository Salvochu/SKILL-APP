import { Suspense } from "react";
import { getBodyLog } from "@/lib/data/body";
import { getProgressPhotos } from "@/lib/data/photos";
import { getUnitPreference } from "@/lib/data/profile";
import { fromKg, unitLabel } from "@/lib/units";
import BackLink from "@/components/ui/BackLink";
import ProgressPhotos from "@/components/body/ProgressPhotos";

export const metadata = { title: "Progress photos" };

// The photo gallery, compare and share, on a screen of its own rather
// than wedged into the Body page between the check-in and the charts.
export default function ProgressPhotosPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <BackLink href="/body" label="Body" />
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Progress photos</h1>
        <p className="text-[15px] text-muted">Front, side and back. Only you can see them.</p>
      </header>

      <Suspense fallback={<div className="h-64 rounded-2xl skeleton bg-surface-2" />}>
        <Gallery />
      </Suspense>
    </div>
  );
}

async function Gallery() {
  const [{ entries }, photos, unit] = await Promise.all([getBodyLog(), getProgressPhotos(), getUnitPreference()]);
  // Weight on each photo date, for the compare view's deltas.
  const bodyByDate = Object.fromEntries(
    entries.map((e) => [
      e.date,
      { weight: e.weight == null ? null : Math.round(fromKg(e.weight, unit) * 10) / 10, fat: e.fat },
    ]),
  );
  return <ProgressPhotos dates={photos.dates} bodyByDate={bodyByDate} unit={unitLabel(unit)} />;
}
