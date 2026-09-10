import Wordmark from "@/components/Wordmark";

// Shared frame for every auth screen (login, sign up, reset / set
// password). Always-dark branded stage: two drifting orange glows behind
// a gradient-bordered card. Pass the form as children.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="auth-stage flex flex-col items-center justify-center px-6 py-12">
      <div aria-hidden="true" className="auth-glow auth-glow-1" />
      <div aria-hidden="true" className="auth-glow auth-glow-2" />

      <div className="auth-rise relative z-10 flex w-full max-w-sm flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wordmark height="1.9rem" />
          {title ? (
            <h1 className="text-balance font-display text-[1.6rem] font-extrabold uppercase leading-[1.06] tracking-tight text-fg">
              {title}
            </h1>
          ) : null}
          {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
        </div>

        <div className="auth-card auth-rise auth-rise-2 w-full p-6">{children}</div>

        {footer ? <div className="text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </main>
  );
}
