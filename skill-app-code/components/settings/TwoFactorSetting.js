"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Group } from "@/components/ui/Grouped";
import Switch from "@/components/ui/Switch";
import Sheet from "@/components/Sheet";
import ConfirmModal from "@/components/ConfirmModal";

// Two-factor sign-in for the coach account: after the password, a 6-digit
// code from an authenticator app. Turning it on scans a QR code into the
// app and checks one code; from then on the coach screens refuse a
// session that hasn't passed the code (lib/data/coach.js getIsCoach).
export default function TwoFactorSetting() {
  const router = useRouter();
  const [factorId, setFactorId] = useState(null); // the verified factor, when on
  const [loaded, setLoaded] = useState(false);
  const [setup, setSetup] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.mfa.listFactors()
      .then(({ data }) => {
        if (cancelled) return;
        setFactorId(data?.totp?.[0]?.id ?? null);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOff() {
    setConfirmOff(false);
    setPending(true);
    setError(null);
    const { error: offError } = await createClient().auth.mfa.unenroll({ factorId });
    setPending(false);
    if (offError) {
      setError("Couldn't turn it off. Sign out and back in with your code, then try again.");
      return;
    }
    setFactorId(null);
    router.refresh();
  }

  const on = Boolean(factorId);

  return (
    <>
      <Group
        title="Sign-in security"
        footer={
          <>
            {on
              ? "On. Signing in asks for your password, then a code from your authenticator app. The coach screens won't open without it."
              : "Ask for a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password) after your password, so your password alone can't open the coach screens."}
            {error ? <span className="mt-1 block text-danger">{error}</span> : null}
          </>
        }
      >
        <div className="flex min-h-[50px] items-center justify-between gap-4 px-4 py-2">
          <span className="text-[16px] text-fg">Two-factor sign-in</span>
          <Switch
            checked={on}
            onChange={(next) => (next ? setSetup(true) : setConfirmOff(true))}
            label="Two-factor sign-in"
            disabled={!loaded || pending}
          />
        </div>
      </Group>

      {setup ? (
        <SetupSheet
          onClose={() => setSetup(false)}
          onDone={(id) => {
            setFactorId(id);
            router.refresh();
          }}
        />
      ) : null}

      {confirmOff ? (
        <ConfirmModal
          title="Turn off two-factor?"
          message="Signing in will only need your password again, and your authenticator app's SKILL code will stop working."
          confirmLabel="Turn off"
          cancelLabel="Keep it on"
          danger
          onConfirm={turnOff}
          onCancel={() => setConfirmOff(false)}
        />
      ) : null}
    </>
  );
}

function SetupSheet({ onClose, onDone }) {
  const [enrolment, setEnrolment] = useState(null); // { id, qr, secret, uri }
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      // A setup that was started and never finished blocks a new one.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.all ?? []) {
        if (f.factor_type === "totp" && f.status !== "verified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `SKILL ${new Date().toISOString().slice(0, 10)}`,
        issuer: "SKILL",
      });
      if (cancelled) return;
      if (enrollError || !data) {
        setError("Couldn't start the setup. Close this and try again.");
        return;
      }
      setEnrolment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function verify(e, close) {
    e.preventDefault();
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) {
      setError("Enter the 6 digits your authenticator app shows for SKILL.");
      return;
    }
    setPending(true);
    setError(null);
    const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({
      factorId: enrolment.id,
      code: clean,
    });
    setPending(false);
    if (verifyError) {
      setCode("");
      setError("That code didn't work. Codes change every 30 seconds, so try the one on screen now.");
      return;
    }
    onDone(enrolment.id);
    close();
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(enrolment.secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Sheet onClose={onClose} ariaLabel="Turn on two-factor sign-in">
      {(close) => (
        <form
          onSubmit={(e) => verify(e, close)}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:pb-5"
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">
              Turn on two-factor
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <ol className="flex flex-col gap-1.5 text-[15px] leading-snug text-muted">
            <li>1. Open an authenticator app (Google Authenticator, Authy, 1Password).</li>
            <li>2. Add an account: scan this code, or on this phone tap the button or paste the key.</li>
            <li>3. Type the 6-digit code it shows for SKILL.</li>
          </ol>

          {enrolment ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enrolment.qr} alt="QR code for your authenticator app" className="h-44 w-44 rounded-xl bg-white p-2" />
              <a
                href={enrolment.uri}
                className="text-[15px] font-semibold text-accent transition-opacity active:opacity-60"
              >
                Open in authenticator app
              </a>
              <button
                type="button"
                onClick={copySecret}
                className="flex max-w-full flex-col items-center gap-0.5 rounded-xl bg-fg/[0.06] px-3 py-2 transition-colors active:bg-fg/10"
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-dim">
                  {copied ? "Key copied" : "Setup key (tap to copy)"}
                </span>
                <span className="break-all font-mono text-[13px] text-fg">{enrolment.secret}</span>
              </button>
            </div>
          ) : !error ? (
            <div className="h-72 rounded-2xl skeleton bg-surface-2" />
          ) : null}

          {error ? <p className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-[14px] text-danger">{error}</p> : null}

          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123 456"
            aria-label="6-digit code"
            disabled={!enrolment}
            className="w-full rounded-2xl bg-surface px-4 py-3.5 text-center text-[22px] tabular-nums tracking-[0.3em] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/60"
          />

          <button
            type="submit"
            disabled={!enrolment || pending}
            className="rounded-2xl bg-accent py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? "Checking..." : "Turn on"}
          </button>
        </form>
      )}
    </Sheet>
  );
}
