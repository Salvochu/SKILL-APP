"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/imageResize";
import { uploadProgressPhoto, deleteProgressPhoto } from "@/app/(app)/body/photo-actions";
import { shortDate } from "@/components/progress/chartkit";
import PhotoCompare from "@/components/body/PhotoCompare";

const ANGLES = [
  { key: "front", label: "Front" },
  { key: "side", label: "Side" },
  { key: "back", label: "Back" },
];

export default function ProgressPhotos({ dates, bodyByDate, unit }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [adding, setAdding] = useState(false);
  const [angle, setAngle] = useState("front");
  const [takenOn, setTakenOn] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [comparing, setComparing] = useState(false);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { blob, width, height } = await compressImage(file);
      const fd = new FormData();
      fd.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      fd.set("takenOn", takenOn);
      fd.set("angle", angle);
      fd.set("width", String(width));
      fd.set("height", String(height));
      const res = await uploadProgressPhoto(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setAdding(false);
        setRevealed(true);
        router.refresh();
      }
    } catch {
      setError("Could not read that image. Try another.");
    }
    setBusy(false);
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    const res = await deleteProgressPhoto(id);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setLightbox(null);
    router.refresh();
  }

  const hasPhotos = dates.length > 0;

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Progress photos</h2>
        <div className="flex items-center gap-2">
          {hasPhotos ? (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="rounded-field border border-border px-2.5 py-1 text-xs font-medium text-muted hover:text-fg"
            >
              {revealed ? "Hide" : "Reveal"}
            </button>
          ) : null}
          {dates.length >= 2 ? (
            <button
              type="button"
              onClick={() => setComparing(true)}
              className="rounded-field border border-border px-2.5 py-1 text-xs font-medium text-muted hover:text-fg"
            >
              Compare
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-field bg-accent px-2.5 py-1 text-xs font-semibold text-black hover:bg-accent-2"
          >
            {adding ? "Close" : "Add photo"}
          </button>
        </div>
      </div>

      {adding ? (
        <div className="flex flex-col gap-3 rounded-field border border-border bg-bg p-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-dim">
              Date
              <input
                type="date"
                value={takenOn}
                max={today}
                onChange={(e) => setTakenOn(e.target.value)}
                className="min-w-0 rounded-field border border-border bg-surface px-2 py-1.5 text-sm text-fg focus:border-accent"
              />
            </label>
            <div className="flex flex-col gap-1 text-xs text-dim">
              Angle
              <div className="flex gap-1">
                {ANGLES.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAngle(a.key)}
                    className={`rounded-field border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      angle === a.key
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-muted hover:text-fg"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label
            className={`flex cursor-pointer items-center justify-center rounded-field border border-dashed border-border px-4 py-3 text-sm font-medium ${
              busy ? "text-dim" : "text-accent hover:bg-surface-2"
            }`}
          >
            {busy ? "Uploading..." : "Choose or take a photo"}
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={onFile}
              className="hidden"
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {!hasPhotos ? (
        <p className="py-4 text-center text-sm text-muted">
          No photos yet. Add a front, side and back shot to start a visual record.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {dates.map((group) => {
            const body = bodyByDate?.[group.date];
            return (
              <div key={group.date} className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2 text-xs text-dim">
                  <span className="font-semibold text-fg">{shortDate(group.date)}</span>
                  {body?.weight != null ? <span>{body.weight} {unit}</span> : null}
                  {body?.fat != null ? <span>{body.fat}% bf</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((p) => (
                    <div key={p.id} className="relative">
                      <button
                        type="button"
                        onClick={() => (revealed ? setLightbox(p) : setRevealed(true))}
                        className="block h-28 w-24 overflow-hidden rounded-field border border-border bg-bg"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt={`${p.angle} on ${group.date}`}
                          className={`h-full w-full object-cover transition ${revealed ? "" : "blur-lg"}`}
                        />
                      </button>
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-medium capitalize text-white">
                        {p.angle}
                      </span>
                      {revealed ? (
                        <button
                          type="button"
                          onClick={() => onDelete(p.id)}
                          aria-label="Delete photo"
                          className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[11px] leading-4 text-white hover:bg-danger"
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-dim">
        Only you can see these. They are stored privately and never shown to anyone else.
      </p>

      {lightbox ? (
        <button
          type="button"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          aria-label="Close photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.url} alt="" className="max-h-full max-w-full rounded-card object-contain" />
        </button>
      ) : null}

      {comparing ? (
        <PhotoCompare dates={dates} bodyByDate={bodyByDate} unit={unit} onClose={() => setComparing(false)} />
      ) : null}
    </section>
  );
}
