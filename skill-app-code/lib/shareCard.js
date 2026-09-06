"use client";

// Draws a branded, story-format (1080x1920) achievement card on a
// canvas and returns it as a PNG blob, for sharing a real image instead
// of asking someone to screenshot the app. Hand-drawn with system fonts
// rather than rasterising the live page (html2canvas and friends): no
// new dependency, and no risk of the app's custom fonts or CSS colour
// tokens not loading in time and silently rendering wrong.

const WIDTH = 1080;
const HEIGHT = 1920;
const SYS_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const COLORS = {
  bg: "#000000",
  accent: "#fc7605",
  fg: "#ffffff",
  muted: "#9a938c",
  good: "#4caf72",
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawStat(ctx, cx, y, label, value) {
  ctx.font = `600 30px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(label.toUpperCase(), cx, y);
  ctx.font = `800 84px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.fg;
  ctx.fillText(value, cx, y + 92);
}

export async function buildShareImageBlob({
  strengthLabel,
  volumeLabel,
  timeLabel,
  levelLabel,
  tierColor,
  xpLabel,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH * 0.82, HEIGHT * 0.1, 0, WIDTH * 0.82, HEIGHT * 0.1, 560);
  glow.addColorStop(0, "rgba(252,118,5,0.35)");
  glow.addColorStop(1, "rgba(252,118,5,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const logo = await loadImage("/skill-logo.png");
  const logoW = 380;
  const logoH = logoW * (logo.height / logo.width);
  ctx.drawImage(logo, (WIDTH - logoW) / 2, 190, logoW, logoH);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.fg;
  ctx.font = `800 78px ${SYS_FONT}`;
  ctx.fillText("Workout", WIDTH / 2, 500);
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("completed.", WIDTH / 2, 590);

  const stats = [];
  if (strengthLabel) stats.push(["Strength score", strengthLabel]);
  if (volumeLabel) stats.push(["Volume", volumeLabel]);
  if (timeLabel) stats.push(["Time", timeLabel]);

  const startY = stats.length >= 3 ? 800 : 860;
  const gap = 218;
  stats.forEach(([label, value], i) => drawStat(ctx, WIDTH / 2, startY + i * gap, label, value));

  let footerTop = startY + stats.length * gap + 40;

  if (levelLabel) {
    ctx.font = `700 40px ${SYS_FONT}`;
    ctx.fillStyle = tierColor || COLORS.fg;
    ctx.fillText(levelLabel.toUpperCase(), WIDTH / 2, footerTop);
    footerTop += 78;
  }
  if (xpLabel) {
    ctx.font = `800 44px ${SYS_FONT}`;
    ctx.fillStyle = COLORS.good;
    ctx.fillText(xpLabel, WIDTH / 2, footerTop);
  }

  ctx.font = `700 46px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("@salvador_skfitness", WIDTH / 2, HEIGHT - 150);
  ctx.font = `400 30px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText("Train. Track. Improve.", WIDTH / 2, HEIGHT - 100);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
