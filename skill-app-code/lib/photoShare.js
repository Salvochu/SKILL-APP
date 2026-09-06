"use client";

// Branded before/after image for sharing a body transformation. Fetches
// both photos as blobs first (blob URLs are same-origin, so the canvas
// never taints and toBlob works), draws them side by side with the dates
// and the deltas, and returns a PNG blob.

const WIDTH = 1080;
const HEIGHT = 1350;
const SYS_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const COLORS = {
  bg: "#000000",
  accent: "#fc7605",
  fg: "#ffffff",
  muted: "#9a938c",
};

async function loadBlobImage(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draw `img` covering the box (like object-fit: cover), clipped to it.
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export async function buildPhotoCompareBlob({ beforeUrl, afterUrl, beforeLabel, afterLabel, deltaLines = [] }) {
  const [before, after] = await Promise.all([loadBlobImage(beforeUrl), loadBlobImage(afterUrl)]);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const pad = 40;
  const gap = 16;
  const colW = (WIDTH - pad * 2 - gap) / 2;
  const imgTop = 120;
  const imgH = 850;

  drawCover(ctx, before, pad, imgTop, colW, imgH);
  drawCover(ctx, after, pad + colW + gap, imgTop, colW, imgH);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.muted;
  ctx.font = `600 30px ${SYS_FONT}`;
  ctx.fillText("BEFORE", pad + colW / 2, imgTop - 24);
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("AFTER", pad + colW + gap + colW / 2, imgTop - 24);

  ctx.fillStyle = COLORS.fg;
  ctx.font = `600 30px ${SYS_FONT}`;
  ctx.fillText(beforeLabel, pad + colW / 2, imgTop + imgH + 44);
  ctx.fillText(afterLabel, pad + colW + gap + colW / 2, imgTop + imgH + 44);

  let y = imgTop + imgH + 100;
  ctx.font = `500 32px ${SYS_FONT}`;
  for (const line of deltaLines.slice(0, 3)) {
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(line, WIDTH / 2, y);
    y += 46;
  }

  try {
    const logo = await loadImage("/skill-logo.png");
    const logoW = 220;
    const logoH = logoW * (logo.height / logo.width);
    ctx.drawImage(logo, (WIDTH - logoW) / 2, HEIGHT - logoH - 44, logoW, logoH);
  } catch {
    ctx.fillStyle = COLORS.accent;
    ctx.font = `800 44px ${SYS_FONT}`;
    ctx.fillText("SKILL", WIDTH / 2, HEIGHT - 50);
  }

  before.close?.();
  after.close?.();

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
