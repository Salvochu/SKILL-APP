"use client";

// Branded progress card drawn on a canvas and returned as a PNG blob.
// Story format (1080x1920), matching every other share card in the app
// (lib/shareCard.js, lib/climbShare.js) - this one used to be a squarer
// feed-post shape, brought in line so it can actually be posted as a
// story like the rest.
//
// It leads with the thing people want to show off: their level and rank,
// then a few lifetime totals, then the top 3 muscle groups they have
// trained the most. Orange is reserved for the @handle and the logo;
// everything else is the rank colour, white, or a per-muscle hue.

const WIDTH = 1080;
const HEIGHT = 1920;
const SYS_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const COLORS = {
  bg: "#000000",
  accent: "#fc7605",
  fg: "#ffffff",
  muted: "#9a938c",
  faint: "#6f6961",
  track: "#221f1c",
};

// One hue per muscle group, matching the app's dark-theme --muscle-*.
const MUSCLE_HEX = {
  chest: "#e66767",
  back: "#3987e5",
  legs: "#1faa77",
  shoulders: "#9085e9",
  arms: "#cf8a1f",
  core: "#d55181",
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
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

// "#rrggbb" + alpha -> "rgba(...)". Falls back to the accent on a bad hex.
function hexA(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return `rgba(252,118,5,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function drawTrainedWith(ctx, cx, y, logo) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 24px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.faint;
  ctx.fillText("TRAIN WITH", cx, y);
  if (logo) {
    const w = 170;
    const h = w * (logo.height / logo.width);
    ctx.drawImage(logo, cx - w / 2, y + 14, w, h);
  }
}

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

export async function buildProgressShareBlob({
  levelLabel = null,
  tierLabel = null,
  tierColor = null,
  xpPct = null,
  stats = [],
  muscles = [],
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  const rank = tierColor || COLORS.accent;

  const [logo, glyph] = await Promise.all([
    loadImage("/skill-logo.png"),
    loadImage("/ig-glyph.png"),
  ]);

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH / 2, 700, 0, WIDTH / 2, 700, 700);
  glow.addColorStop(0, hexA(rank, 0.22));
  glow.addColorStop(1, hexA(rank, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawTrainedWith(ctx, WIDTH / 2, 300, logo);

  ctx.textAlign = "center";

  // Level headline
  let y = 500;
  if (levelLabel) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 30px ${SYS_FONT}`;
    ctx.fillText("MY PROGRESS", WIDTH / 2, y);

    ctx.fillStyle = COLORS.fg;
    ctx.font = `800 140px ${SYS_FONT}`;
    ctx.fillText(levelLabel.toUpperCase(), WIDTH / 2, y + 150);

    if (tierLabel) {
      ctx.fillStyle = rank;
      ctx.font = `700 46px ${SYS_FONT}`;
      ctx.fillText(tierLabel.toUpperCase(), WIDTH / 2, y + 225);
    }
    y += 330;

    if (xpPct != null) {
      const barW = 560;
      const barX = (WIDTH - barW) / 2;
      ctx.fillStyle = COLORS.track;
      roundRect(ctx, barX, y, barW, 18, 9);
      ctx.fill();
      const w = Math.max(18, (Math.min(100, Math.max(0, xpPct)) / 100) * barW);
      ctx.fillStyle = rank;
      roundRect(ctx, barX, y, w, 18, 9);
      ctx.fill();
      y += 130;
    } else {
      y += 40;
    }
  } else {
    y = 460;
  }

  // Lifetime stat row
  if (stats.length) {
    const pad = 90;
    const usable = WIDTH - pad * 2;
    const colW = usable / stats.length;
    stats.forEach(([label, value], i) => {
      const cx = pad + colW * i + colW / 2;
      ctx.fillStyle = COLORS.fg;
      ctx.font = `800 64px ${SYS_FONT}`;
      ctx.fillText(clip(ctx, String(value), colW - 16), cx, y);
      ctx.fillStyle = COLORS.muted;
      ctx.font = `600 26px ${SYS_FONT}`;
      ctx.fillText(clip(ctx, String(label).toUpperCase(), colW - 12), cx, y + 42);
    });
    y += 200;
  }

  // Top 3 most-trained muscle groups
  if (!muscles.length) {
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 28px ${SYS_FONT}`;
    ctx.fillText("Keep logging to see your muscle breakdown", WIDTH / 2, y + 30);
  } else {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.fg;
    ctx.font = `700 42px ${SYS_FONT}`;
    ctx.fillText("Most trained", 90, y);
    y += 80;

    const rowX = 90;
    const rowW = WIDTH - 180;
    const maxSets = Math.max(1, ...muscles.map((m) => m.sets));

    for (const m of muscles.slice(0, 3)) {
      const hue = MUSCLE_HEX[String(m.parent ?? m.name).toLowerCase()] || COLORS.muted;

      ctx.fillStyle = COLORS.track;
      roundRect(ctx, rowX, y - 30, rowW, 72, 16);
      ctx.fill();

      // Keep the fill clear of the right-hand set count so it stays legible.
      const fillW = Math.max(52, Math.min(rowW - 210, (m.sets / maxSets) * (rowW - 210)));
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
      ctx.fillText(clip(ctx, m.name, 420), rowX + 60, y + 14);

      ctx.textAlign = "right";
      ctx.fillStyle = COLORS.fg;
      ctx.font = `700 32px ${SYS_FONT}`;
      ctx.fillText(`${m.sets} sets`, rowX + rowW - 26, y + 14);

      y += 100;
    }
  }

  drawHandle(ctx, WIDTH / 2, HEIGHT - 150, glyph);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
