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
  faint: "#6f6961",
};

async function loadBlobImage(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
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

// "TRAIN WITH" over the SKILL logo - no @handle here, unlike the other
// cards: this one is about the person's own result, not an invitation.
function drawTrainedWith(ctx, cx, y, logo) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 22px ${SYS_FONT}`;
  ctx.fillStyle = COLORS.faint;
  ctx.fillText("TRAIN WITH", cx, y);
  if (logo) {
    const w = 150;
    const h = w * (logo.height / logo.width);
    ctx.drawImage(logo, cx - w / 2, y + 12, w, h);
  }
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

  // Delta stats in one horizontal row rather than stacked lines, so they
  // read as a single result at a glance instead of a list.
  const lines = deltaLines.slice(0, 3);
  if (lines.length) {
    const rowY = imgTop + imgH + 110;
    const segW = WIDTH / lines.length;
    ctx.font = `700 34px ${SYS_FONT}`;
    ctx.fillStyle = COLORS.fg;
    lines.forEach((line, i) => {
      ctx.fillText(line, segW * i + segW / 2, rowY);
    });
  }

  const logo = await loadImage("/skill-logo.png");
  drawTrainedWith(ctx, WIDTH / 2, HEIGHT - 70, logo);

  before.close?.();
  after.close?.();

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
