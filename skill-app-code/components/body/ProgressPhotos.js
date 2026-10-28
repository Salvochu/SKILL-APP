"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/imageResize";
import { uploadProgressPhoto, deleteProgressPhoto } from "@/app/(app)/body/photo-actions";
import { shortDate } from "@/components/progress/chartkit";
import PhotoCompare from "@/components/body/PhotoCompare";
import ConfirmModal from "@/components/ConfirmModal";

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
  const [confirmDelete, setConfirmDelete] = useState(null); // photo id

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
    setConfirmDelete(null);
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
    <section className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-sans text-[17px] font-semibold tracking-[-0.01em] text-fg">Progress photos</h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-expanded={adding}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition-transform active:scale-95 ${
            adding ? "bg-fg/10 text-fg" : "bg-accent text-black"
          }`}
        >
          {adding ? null : <IconPlus className="h-3.5 w-3.5" />}
          {adding ? "Close" : "Add photo"}
        </button>
      </div>

      {adding ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 text-[15px] text-fg">
              Date
              <input
                type="date"
                value={takenOn}
                max={today}
                onChange={(e) => setTakenOn(e.target.value)}
                className="min-w-0 rounded-lg bg-fg/[0.07] px-2.5 py-1.5 text-[16px] text-fg outline-none focus:ring-2 focus:ring-accent/60"
              />
            </label>
            <div role="group" aria-label="Angle" className="inline-flex rounded-full bg-fg/[0.07] p-1">
              {ANGLES.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAngle(a.key)}
                  aria-pressed={angle === a.key}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    angle === a.key ? "bg-fg text-bg" : "text-muted hover:text-fg"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[16px] font-semibold transition-transform active:scale-[0.98] ${
              busy ? "bg-fg/[0.06] text-muted" : "bg-accent-soft text-accent"
            }`}
          >
            <IconCamera className="h-5 w-5" />
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

      {error ? <p className="text-[14px] text-danger">{error}</p> : null}

      {!hasPhotos ? (
        <p className="py-3 text-center text-[15px] leading-relaxed text-muted">
          No photos yet. Add a front, side and back shot to start a visual record.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {dates.map((group) => {
            const body = bodyByDate?.[group.date];
            return (
              <div key={group.date} className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2 text-[13px] text-muted">
                  <span className="text-[15px] font-semibold text-fg">{shortDate(group.date)}</span>
                  {body?.weight != null ? <span className="tabular-nums">{body.weight} {unit}</span> : null}
                  {body?.fat != null ? <span className="tabular-nums">{body.fat}% bf</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((p) => (
                    <div key={p.id} className="relative">
                      <button
                        type="button"
                        onClick={() => (revealed ? setLightbox(p) : setRevealed(true))}
                        className="block h-32 w-24 overflow-hidden rounded-xl bg-fg/[0.06] transition-transform active:scale-[0.97]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt={`${p.angle} on ${group.date}`}
                          className={`h-full w-full object-cover transition ${revealed ? "" : "scale-110 blur-lg"}`}
                        />
                      </button>
                      <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold capitalize text-white backdrop-blur-sm">
                        {p.angle}
                      </span>
                      {revealed ? (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(p.id)}
                          aria-label="Delete photo"
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors after:absolute after:-inset-2 hover:bg-danger"
                        >
                          <IconClose className="h-3 w-3" />
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

      {hasPhotos ? (
        <div className={`grid gap-2 ${dates.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="flex items-center justify-center gap-2 rounded-xl bg-fg/10 px-3 py-3 text-[15px] font-semibold text-fg transition-transform active:scale-[0.98]"
          >
            {revealed ? <IconEyeOff className="h-[18px] w-[18px]" /> : <IconEye className="h-[18px] w-[18px]" />}
            {revealed ? "Hide" : "Reveal"}
          </button>
          {dates.length >= 2 ? (
            <button
              type="button"
              onClick={() => setComparing(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-fg/10 px-3 py-3 text-[15px] font-semibold text-fg transition-transform active:scale-[0.98]"
            >
              <IconCompare className="h-[18px] w-[18px]" />
              Compare
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="flex items-start gap-1.5 text-[13px] leading-snug text-dim">
        <IconLock className="mt-px h-3.5 w-3.5 shrink-0" />
        Only you can see these. They are stored privately and never shown to anyone else.
      </p>

      {lightbox ? (
        <button
          type="button"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          aria-label="Close photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.url} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
          <span className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
            <IconClose className="h-[18px] w-[18px]" />
          </span>
        </button>
      ) : null}

      {comparing ? (
        <PhotoCompare dates={dates} bodyByDate={bodyByDate} unit={unit} onClose={() => setComparing(false)} />
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          title="Delete this photo?"
          message="This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Keep it"
          danger
          onConfirm={() => onDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      ) : null}
    </section>
  );
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconCamera(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}
function IconEye(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconEyeOff(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 5.4-1.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </svg>
  );
}
function IconCompare(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="7.5" height="14" rx="1.5" />
      <rect x="13.5" y="5" width="7.5" height="14" rx="1.5" />
    </svg>
  );
}
function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
