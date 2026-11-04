"use client";

// The rest timer's "time's up": a short chime, plus a buzz. Phones only
// let a page make sound after a tap, so primeRestAlarm() runs inside the
// tap that starts a rest (ticking a set) and unlocks the audio then; the
// chime itself plays later, when the timer runs out.
//
// The chime is generated (Web Audio), so there is no sound file to load.
// It mixes over music rather than stopping it, and on iPhone it follows
// the ring / silent switch like other app sounds.

let ctx = null;

function audio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function primeRestAlarm() {
  const c = audio();
  if (!c) return;
  try {
    if (c.state !== "running") c.resume();
    // A silent blip inside the tap is what unlocks audio on iOS.
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(c.destination);
    src.start(0);
  } catch {
    // No sound then; the visual alert still shows.
  }
  haptic(); // creates the iPhone switch now, inside the tap
}

// Two quick beeps and a higher one, like a gym interval timer.
export function ringRestAlarm() {
  buzz();
  const c = audio();
  if (!c) return;
  try {
    if (c.state !== "running") c.resume();
    const t0 = c.currentTime + 0.02;
    [
      [880, 0, 0.14],
      [880, 0.22, 0.14],
      [1320, 0.44, 0.34],
    ].forEach(([freq, at, len]) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      // Short fade in and out, so it chimes instead of clicking.
      gain.gain.setValueAtTime(0.0001, t0 + at);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + len);
      osc.connect(gain).connect(c.destination);
      osc.start(t0 + at);
      osc.stop(t0 + at + len + 0.02);
    });
  } catch {
    // No sound then; the visual alert still shows.
  }
}

// Android vibrates through the Vibration API. iPhones don't have it; from
// iOS 18, flipping a switch-style checkbox gives a light haptic tap, so
// tap that three times instead (best effort: older iOS just stays still).
function buzz() {
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate([220, 120, 220, 120, 380]);
      return;
    }
  } catch {
    // fall through to the iPhone tap
  }
  [0, 180, 360].forEach((ms) => setTimeout(haptic, ms));
}

let switchLabel = null;
function haptic() {
  if (typeof navigator.vibrate === "function") return;
  try {
    if (!switchLabel) {
      const label = document.createElement("label");
      label.setAttribute("aria-hidden", "true");
      label.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      input.tabIndex = -1;
      label.appendChild(input);
      document.body.appendChild(label);
      switchLabel = label;
      return; // created during the priming tap; no tap wanted yet
    }
    switchLabel.click();
  } catch {
    // no haptics
  }
}
