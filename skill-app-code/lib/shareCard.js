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

// One hue per muscle group, matching the app's dark-theme --muscle-*
// (and the progress card, lib/progressShare.js).
const MUSCLE_HEX = {
  chest: "#e66767",
  back: "#3987e5",
  legs: "#1faa77",
  shoulders: "#9085e9",
  arms: "#cf8a1f",
  core: "#d55181",
};

function hexA(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return `rgba(154,147,140,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// The muscles this session trained most, drawn exactly like the progress
// card's rows: a dark track, a fill tinted with the muscle's own colour,
// the name inside and the set count on the right, clear of the fill.
// `rows` is [{ group|name, parent, sets }], biggest first.
function drawMuscleRows(ctx, top, rows) {
  const rowX = 90;
  const rowW = WIDTH - 180;
  const max = Math.max(1, ...rows.map((r) => r.sets || 0));

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.fg;
  ctx.font = `700 42px ${SYS_FONT}`;
  ctx.fillText("Most trained", rowX, top);

  let y = top + 80;
  for (const r of rows) {
    const name = String(r.group ?? r.name ?? "");
    const hue = MUSCLE_HEX[String(r.parent ?? name).toLowerCase()] || COLORS.muted;

    ctx.fillStyle = "#221f1c";
    roundRect(ctx, rowX, y - 30, rowW, 72, 16);
    ctx.fill();

    const fillW = Math.max(52, Math.min(rowW - 210, ((r.sets || 0) / max) * (rowW - 210)));
    ctx.fillStyle = hexA(hue, 0.26);
    roundRect(ctx, rowX, y - 30, fillW, 72, 16);
    ctx.fill();

    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.arc(rowX + 34, y + 6, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.fg;
    ctx.font = `600 32px ${SYS_FONT}`;
    ctx.fillText(name, rowX + 60, y + 14);

    const n = Math.round(r.sets || 0);
    ctx.textAlign = "right";
    ctx.font = `700 32px ${SYS_FONT}`;
    ctx.fillText(`${n} ${n === 1 ? "set" : "sets"}`, rowX + rowW - 26, y + 14);

    y += 100;
  }
  ctx.textAlign = "center";
}

// "TRAIN WITH" over the SKILL logo, centred at (cx, y = label baseline).
function drawTrainedWith(ctx, cx, y, logo) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 24px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.faint;
  ctx.fillText("TRAIN WITH", cx, y);
  if (logo) {
    const w = 190;
    const h = w * (logo.height / logo.width);
    ctx.drawImage(logo, cx - w / 2, y + 16, w, h);
  }
}

// Small "@salvador_skfitness" with the Instagram glyph, centred at (cx, y).
function drawHandle(ctx, cx, y, glyph) {
  const handle = "@salvador_skfitness";
  ctx.font = `600 22px ${SYS_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const tW = ctx.measureText(handle).width;
  const gW = glyph ? 26 : 0;
  const gap = glyph ? 11 : 0;
  const x = cx - (tW + gap + gW) / 2;
  if (glyph) ctx.drawImage(glyph, x, y - gW / 2, gW, gW);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(handle, x + gW + gap, y);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
}

export async function buildShareImageBlob({
  title = null,
  volumeLabel,
  timeLabel,
  effortLabel,
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
  // Which session it was ("BACK & PULL"), so the card isn't the same for
  // every workout. Kept short enough to sit on one line.
  if (title) {
    ctx.font = `700 34px ${SYS_FONT}`;
    ctx.fillStyle = COLORS.accent;
    let t = String(title).toUpperCase();
    while (t.length > 3 && ctx.measureText(t).width > WIDTH - 200) t = `${t.slice(0, -2).trimEnd()}…`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
    ctx.fillText(t, WIDTH / 2, 590);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }
  ctx.fillStyle = COLORS.fg;
  ctx.font = `800 110px ${SYS_FONT}`;
  ctx.fillText("Workout", WIDTH / 2, 720);
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("complete.", WIDTH / 2, 842);

  const stats = [
    ["Volume", volumeLabel],
    ["Time", timeLabel],
  ];
  if (effortLabel) stats.push(["Effort", effortLabel]);
  const cols = stats.length === 3 ? [0.19, 0.5, 0.81] : [0.28, 0.72];
  stats.forEach(([label, value], i) => {
    drawStat(ctx, WIDTH * cols[i], 1050, label, value);
  });

  const rows = topMuscles.slice(0, 3);
  if (rows.length) drawMuscleRows(ctx, 1300, rows);

  drawHandle(ctx, WIDTH / 2, HEIGHT - 150, glyph);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
