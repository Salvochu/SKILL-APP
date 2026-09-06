"use client";

// Branded progress card drawn on a canvas and returned as a PNG blob.
// Same approach as lib/shareCard.js: hand-drawn with system fonts, no
// page rasterising, no new dependency. Portrait 4:5, the densest crop
// that still posts cleanly to a feed or a story.

const WIDTH = 1080;
const HEIGHT = 1350;
const SYS_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const COLORS = {
  bg: "#000000",
  accent: "#fc7605",
  fg: "#ffffff",
  muted: "#9a938c",
  track: "#2a2521",
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function buildProgressShareBlob({ rangeLabel, stats = [], muscles = [] }) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH * 0.18, HEIGHT * 0.1, 0, WIDTH * 0.18, HEIGHT * 0.1, 620);
  glow.addColorStop(0, "rgba(252,118,5,0.30)");
  glow.addColorStop(1, "rgba(252,118,5,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  try {
    const logo = await loadImage("/skill-logo.png");
    const logoW = 260;
    const logoH = logoW * (logo.height / logo.width);
    ctx.drawImage(logo, (WIDTH - logoW) / 2, 90, logoW, logoH);
  } catch {
    // logo is decorative; skip if it fails to load
  }

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.fg;
  ctx.font = `800 72px ${SYS_FONT}`;
  ctx.fillText("My progress", WIDTH / 2, 300);
  if (rangeLabel) {
    ctx.fillStyle = COLORS.accent;
    ctx.font = `600 36px ${SYS_FONT}`;
    ctx.fillText(rangeLabel, WIDTH / 2, 356);
  }

  // stat row
  const statY = 480;
  const colW = WIDTH / Math.max(1, stats.length);
  stats.forEach(([label, value], i) => {
    const cx = colW * i + colW / 2;
    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 26px ${SYS_FONT}`;
    ctx.fillText(label.toUpperCase(), cx, statY);
    ctx.fillStyle = COLORS.fg;
    ctx.font = `800 58px ${SYS_FONT}`;
    ctx.fillText(value, cx, statY + 66);
  });

  // weekly sets by muscle
  let y = 680;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.fg;
  ctx.font = `700 38px ${SYS_FONT}`;
  ctx.fillText("Weekly sets by muscle", 110, y);
  y += 62;

  const barX = 470;
  const barW = WIDTH - barX - 190;
  const maxVal = Math.max(20, ...muscles.map((m) => m.value));
  for (const m of muscles) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 30px ${SYS_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(clip(ctx, m.name, barX - 130), 110, y + 8);

    ctx.fillStyle = COLORS.track;
    roundRect(ctx, barX, y - 22, barW, 26, 13);
    ctx.fill();

    const w = Math.max(6, (Math.min(m.value, maxVal) / maxVal) * barW);
    ctx.fillStyle = COLORS.accent;
    roundRect(ctx, barX, y - 22, w, 26, 13);
    ctx.fill();

    ctx.fillStyle = COLORS.fg;
    ctx.font = `700 34px ${SYS_FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(fmtNum(m.value), WIDTH - 110, y + 8);

    y += 74;
  }

  ctx.textAlign = "center";
  ctx.font = `700 40px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("@salvador_skfitness", WIDTH / 2, HEIGHT - 88);
  ctx.font = `400 28px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText("Train. Track. Improve.", WIDTH / 2, HEIGHT - 44);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function fmtNum(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function clip(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}...`).width > maxWidth) t = t.slice(0, -1);
  return `${t}...`;
}
