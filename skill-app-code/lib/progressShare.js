"use client";

// Branded progress card drawn on a canvas and returned as a PNG blob.
// Same approach as lib/shareCard.js: hand-drawn with system fonts, no
// page rasterising, no new dependency. Portrait 4:5, the densest crop
// that still posts cleanly to a feed or a story.
//
// It leads with the thing people actually want to show off: their level
// and rank, then a few lifetime totals, then their strongest lifts. The
// @handle is kept small, the way the workout card does it, so the
// numbers stay the hero.

const WIDTH = 1080;
const HEIGHT = 1200;
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

function clip(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}...`).width > maxWidth) t = t.slice(0, -1);
  return `${t}...`;
}

export async function buildProgressShareBlob({
  levelLabel = null,
  tierLabel = null,
  tierColor = null,
  xpPct = null,
  stats = [],
  lifts = [],
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  const rank = tierColor || COLORS.accent;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH * 0.5, 330, 0, WIDTH * 0.5, 330, 560);
  glow.addColorStop(0, hexA(rank, 0.24));
  glow.addColorStop(1, hexA(rank, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  try {
    const logo = await loadImage("/skill-logo.png");
    const logoW = 240;
    const logoH = logoW * (logo.height / logo.width);
    ctx.drawImage(logo, (WIDTH - logoW) / 2, 84, logoW, logoH);
  } catch {
    // logo is decorative; skip if it fails to load
  }

  ctx.textAlign = "center";

  // Level headline
  let y = 340;
  if (levelLabel) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 30px ${SYS_FONT}`;
    ctx.fillText("MY PROGRESS", WIDTH / 2, y - 66);

    ctx.fillStyle = COLORS.fg;
    ctx.font = `800 128px ${SYS_FONT}`;
    ctx.fillText(levelLabel.toUpperCase(), WIDTH / 2, y + 40);

    if (tierLabel) {
      ctx.fillStyle = rank;
      ctx.font = `700 44px ${SYS_FONT}`;
      ctx.fillText(tierLabel.toUpperCase(), WIDTH / 2, y + 104);
    }
    y += 170;

    if (xpPct != null) {
      const barW = 520;
      const barX = (WIDTH - barW) / 2;
      ctx.fillStyle = COLORS.track;
      roundRect(ctx, barX, y, barW, 16, 8);
      ctx.fill();
      const w = Math.max(16, (Math.min(100, Math.max(0, xpPct)) / 100) * barW);
      ctx.fillStyle = rank;
      roundRect(ctx, barX, y, w, 16, 8);
      ctx.fill();
      y += 70;
    } else {
      y += 24;
    }
  } else {
    y = 300;
  }

  // Lifetime stat row
  if (stats.length) {
    y += 40;
    const pad = 80;
    const usable = WIDTH - pad * 2;
    const colW = usable / stats.length;
    stats.forEach(([label, value], i) => {
      const cx = pad + colW * i + colW / 2;
      ctx.fillStyle = COLORS.fg;
      ctx.font = `800 ${stats.length > 2 ? 52 : 60}px ${SYS_FONT}`;
      ctx.fillText(clip(ctx, String(value), colW - 16), cx, y);
      ctx.fillStyle = COLORS.muted;
      ctx.font = `600 24px ${SYS_FONT}`;
      ctx.fillText(clip(ctx, String(label).toUpperCase(), colW - 12), cx, y + 40);
    });
    y += 110;
  }

  // Strongest lifts
  if (!lifts.length) {
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 28px ${SYS_FONT}`;
    ctx.fillText("Log a Strength Check to show your best lifts", WIDTH / 2, y + 30);
  } else {
    y += 20;
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.fg;
    ctx.font = `700 38px ${SYS_FONT}`;
    ctx.fillText("Strongest lifts", 120, y);
    y += 54;

    for (const lift of lifts.slice(0, 3)) {
      ctx.fillStyle = COLORS.track;
      roundRect(ctx, 120, y - 34, WIDTH - 240, 78, 18);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.fillStyle = COLORS.fg;
      ctx.font = `600 32px ${SYS_FONT}`;
      ctx.fillText(clip(ctx, lift.name, 460), 156, y + 10);

      ctx.textAlign = "right";
      ctx.fillStyle = COLORS.accent;
      ctx.font = `700 32px ${SYS_FONT}`;
      ctx.fillText(clip(ctx, lift.detail, 380), WIDTH - 156, y + 10);

      y += 96;
    }
  }

  // Credit, kept small: the numbers are the hero.
  ctx.textAlign = "center";
  ctx.font = `600 30px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("@salvador_skfitness", WIDTH / 2, HEIGHT - 96);
  ctx.font = `400 26px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText("Train. Track. Improve.", WIDTH / 2, HEIGHT - 54);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// "#rrggbb" + alpha -> "rgba(...)". Falls back to the accent on a bad hex.
function hexA(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return `rgba(252,118,5,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
