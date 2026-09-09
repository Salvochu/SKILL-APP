"use client";

// "14-Day Challenge complete" share image. Story format (1080x1920),
// hand-drawn on a canvas. Matches lib/shareCard.js in look.

const W = 1080;
const H = 1920;
const SYS = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const C = { bg: "#000000", accent: "#fc7605", fg: "#ffffff", muted: "#9a938c", faint: "#6f6961" };

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function stat(ctx, cx, y, label, value) {
  ctx.textAlign = "center";
  ctx.font = `700 60px ${SYS}`;
  ctx.fillStyle = C.fg;
  ctx.fillText(value, cx, y);
  ctx.font = `600 22px ${SYS}`;
  ctx.fillStyle = C.muted;
  ctx.fillText(label.toUpperCase(), cx, y + 38);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawMuscleBars(ctx, cx, top, rows) {
  const barW = 560;
  const x0 = cx - barW / 2;
  const rowH = 78;
  const max = rows.reduce((m, r) => Math.max(m, r.sets || 0), 0) || 1;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 22px ${SYS}`;
  ctx.fillStyle = C.muted;
  ctx.fillText("MOST TRAINED", x0, top - 22);

  rows.forEach((r, i) => {
    const y = top + i * rowH;
    const w = Math.max(56, Math.round((r.sets / max) * (barW - 104)));
    ctx.fillStyle = "#241d16";
    roundRect(ctx, x0, y, barW, 34, 17);
    ctx.fill();
    const grad = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    grad.addColorStop(0, "#fc7605");
    grad.addColorStop(1, "#ffab54");
    ctx.fillStyle = grad;
    roundRect(ctx, x0, y, w, 34, 17);
    ctx.fill();
    ctx.font = `700 24px ${SYS}`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.fillText(String(r.group ?? r.name ?? "").toUpperCase(), x0 + 20, y + 23);
    ctx.font = `600 24px ${SYS}`;
    ctx.fillStyle = C.muted;
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(r.sets)} sets`, x0 + barW, y + 23);
  });
  ctx.textAlign = "center";
}

function drawTrainedWith(ctx, cx, y, logo) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 24px ${SYS}`;
  ctx.fillStyle = C.faint;
  ctx.fillText("TRAINED WITH", cx, y);
  if (logo) {
    const w = 190;
    const h = w * (logo.height / logo.width);
    ctx.drawImage(logo, cx - w / 2, y + 16, w, h);
  }
}

function drawHandle(ctx, cx, y, glyph) {
  const handle = "@salvador_skfitness";
  ctx.font = `600 28px ${SYS}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const tW = ctx.measureText(handle).width;
  const gW = glyph ? 32 : 0;
  const gap = glyph ? 13 : 0;
  const x = cx - (tW + gap + gW) / 2;
  if (glyph) ctx.drawImage(glyph, x, y - gW / 2, gW, gW);
  ctx.fillStyle = C.muted;
  ctx.fillText(handle, x + gW + gap, y);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
}

export async function buildChallengeShareBlob({
  sessions = 0,
  targetSessions = 6,
  perfectDays = 0,
  volumeLabel = "0",
  topMuscles = [],
}) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const [logo, glyph] = await Promise.all([
    loadImage("/skill-logo.png"),
    loadImage("/ig-glyph.png"),
  ]);

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 820, 0, W / 2, 820, 820);
  glow.addColorStop(0, "rgba(252,118,5,0.24)");
  glow.addColorStop(1, "rgba(252,118,5,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  drawTrainedWith(ctx, W / 2, 320, logo);

  ctx.textAlign = "center";
  ctx.font = `700 34px ${SYS}`;
  ctx.fillStyle = C.accent;
  ctx.fillText("14-DAY MAIN CHARACTER", W / 2, 620);
  ctx.font = `800 100px ${SYS}`;
  ctx.fillStyle = C.fg;
  ctx.fillText("COMPLETE.", W / 2, 728);

  const rows = topMuscles.slice(0, 3);
  if (rows.length) drawMuscleBars(ctx, W / 2, 900, rows);

  const sy = 1320;
  stat(ctx, W * 0.19, sy, "Sessions", `${sessions}/${targetSessions}`);
  stat(ctx, W * 0.5, sy, "Perfect days", `${perfectDays}/14`);
  stat(ctx, W * 0.81, sy, "Volume", volumeLabel);

  drawHandle(ctx, W / 2, H - 150, glyph);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
