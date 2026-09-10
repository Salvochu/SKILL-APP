"use client";

// Branded, story-format (1080x1920) workout-complete card, drawn on a
// canvas and returned as a PNG blob. Hand-drawn with system fonts so it
// never depends on the page's fonts loading.

const WIDTH = 1080;
const HEIGHT = 1920;
const SYS_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const COLORS = {
  bg: "#000000",
  accent: "#fc7605",
  fg: "#ffffff",
  muted: "#9a938c",
  faint: "#6f6961",
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// One stat in a row: big value, small label under it.
function drawStat(ctx, cx, y, label, value) {
  ctx.textAlign = "center";
  ctx.font = `700 66px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.fg;
  ctx.fillText(value, cx, y);
  ctx.font = `600 24px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(label.toUpperCase(), cx, y + 40);
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

// The muscles trained most, as short horizontal bars. `rows` is
// [{ group|name, sets }], biggest first.
function drawMuscleBars(ctx, cx, top, rows) {
  const barW = 560;
  const x0 = cx - barW / 2;
  const rowH = 78;
  const max = rows.reduce((m, r) => Math.max(m, r.sets || 0), 0) || 1;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 22px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText("MOST TRAINED", x0, top - 22);

  rows.forEach((r, i) => {
    const y = top + i * rowH;
    const label = String(r.group ?? r.name ?? "").toUpperCase();
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

    ctx.font = `700 24px ${SYS_FONT}`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.fillText(label, x0 + 20, y + 23);

    ctx.font = `600 24px ${SYS_FONT}`;
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(r.sets)} sets`, x0 + barW, y + 23);
  });
  ctx.textAlign = "center";
}

// "TRAINED WITH" over the SKILL logo, centred at (cx, y = label baseline).
function drawTrainedWith(ctx, cx, y, logo) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 24px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.faint;
  ctx.fillText("TRAINED WITH", cx, y);
  if (logo) {
    const w = 190;
    const h = w * (logo.height / logo.width);
    ctx.drawImage(logo, cx - w / 2, y + 16, w, h);
  }
}

// Small "@salvador_skfitness" with the Instagram glyph, centred at (cx, y).
function drawHandle(ctx, cx, y, glyph) {
  const handle = "@salvador_skfitness";
  ctx.font = `600 28px ${SYS_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const tW = ctx.measureText(handle).width;
  const gW = glyph ? 32 : 0;
  const gap = glyph ? 13 : 0;
  const x = cx - (tW + gap + gW) / 2;
  if (glyph) ctx.drawImage(glyph, x, y - gW / 2, gW, gW);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(handle, x + gW + gap, y);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
}

export async function buildShareImageBlob({
  volumeLabel,
  setsLabel,
  timeLabel,
  topMuscles = [],
}) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  const [logo, glyph] = await Promise.all([
    loadImage("/skill-logo.png"),
    loadImage("/ig-glyph.png"),
  ]);

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const glow = ctx.createRadialGradient(WIDTH / 2, 820, 0, WIDTH / 2, 820, 820);
  glow.addColorStop(0, "rgba(252,118,5,0.24)");
  glow.addColorStop(1, "rgba(252,118,5,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawTrainedWith(ctx, WIDTH / 2, 330, logo);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.fg;
  ctx.font = `800 110px ${SYS_FONT}`;
  ctx.fillText("Workout", WIDTH / 2, 720);
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("complete.", WIDTH / 2, 842);

  const stats = [
    ["Volume", volumeLabel],
    ["Sets", setsLabel],
    ["Time", timeLabel],
  ];
  const cols = [0.19, 0.5, 0.81];
  stats.forEach(([label, value], i) => {
    drawStat(ctx, WIDTH * cols[i], 1050, label, value);
  });

  const rows = topMuscles.slice(0, 3);
  if (rows.length) drawMuscleBars(ctx, WIDTH / 2, 1360, rows);

  drawHandle(ctx, WIDTH / 2, HEIGHT - 150, glyph);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
