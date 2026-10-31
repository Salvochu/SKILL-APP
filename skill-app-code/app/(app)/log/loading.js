import FocusMode from "@/components/FocusMode";
import { FOCUS_LAYOUT } from "@/components/log/focusLayout";

// Shown the instant someone taps into a workout, while the plan, their
// last numbers and the exercise library load: the shape of the logger,
// so it reads as "nearly there" instead of a blank screen or a spinner.
// It already switches on focus mode, so the app's bars slide away on the
// tap rather than once the workout arrives.
export default function LogLoading() {
  return (
    <div className={`flex flex-col gap-6 pb-2 ${FOCUS_LAYOUT}`} aria-busy="true" aria-label="Loading workout">
      <FocusMode />
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between pb-2 pt-[max(0.625rem,env(safe-area-inset-top))]">
          <div className="h-9 w-9 rounded-full skeleton bg-surface-2" />
          <div className="h-9 w-9 rounded-full skeleton bg-surface-2" />
        </div>
        <div className="h-9 w-56 rounded-lg skeleton bg-surface-2" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-2/3 rounded-full skeleton bg-surface-2" />
              <div className="h-3 w-1/3 rounded-full skeleton bg-surface-2" />
            </div>
            <div className="h-9 w-9 shrink-0 rounded-full skeleton bg-surface-2" />
          </div>
          {Array.from({ length: 3 }).map((__, j) => (
            <div key={j} className="h-10 w-full rounded-xl skeleton bg-surface-2" />
          ))}
        </div>
      ))}
    </div>
  );
}
