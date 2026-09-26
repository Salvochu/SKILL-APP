"use client";

// The climb-path card, made shareable. Story format (1080x1920),
// hand-drawn on a canvas, matching lib/shareCard.js / lib/challengeShare.js
// in look. Used at Day 7 (progress check-in) and Day 14 (finished), so it
// is the one "game card" people actually recognize from the app itself,
// rather than a separate stats-card design.
//
// The path geometry is the same PATH_D as components/challenge/ChallengeClimb.js
// (a fixed decoration, never changes), pre-sampled once into a smooth
// 121-point trail (for a fluid curve) plus the 14 exact day-node
// positions, both in the path's own untransformed coordinate space.

const W = 1080;
const H = 1920;
const SYS = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const C = { bg: "#000000", accent: "#fc7605", fg: "#ffffff", muted: "#9a938c", faint: "#6f6961", track: "#2b2016" };

const NODES = [
  { x: 40, y: 330 }, { x: 65.942, y: 282.867 }, { x: 116.868, y: 262.429 },
  { x: 169.301, y: 244.92 }, { x: 216.301, y: 216.013 }, { x: 187.315, y: 183.331 },
  { x: 133.204, y: 171.804 }, { x: 78.367, y: 164.233 }, { x: 23.939, y: 154.288 },
  { x: 14.182, y: 125.509 }, { x: 67.249, y: 109.878 }, { x: 120.774, y: 95.741 },
  { x: 174.075, y: 80.988 }, { x: 150, y: 34 },
];

const TRAIL = [
  [40,330],[40.9,324.07],[42.23,318.23],[44.04,312.51],[46.34,306.97],[49.14,301.67],[52.43,296.66],
  [56.17,291.98],[60.33,287.66],[64.85,283.72],[69.68,280.17],[74.76,276.98],[80.04,274.14],[85.49,271.64],
  [91.07,269.43],[96.74,267.5],[102.5,265.82],[108.32,264.38],[114.17,263.06],[120.01,261.66],[125.81,260.17],
  [131.59,258.57],[137.34,256.86],[143.06,255.05],[148.74,253.11],[154.37,251.06],[159.96,248.89],[165.5,246.59],
  [170.98,244.16],[176.4,241.59],[181.75,238.88],[187.03,236.03],[192.23,233.04],[197.33,229.89],[202.34,226.6],
  [207.25,223.15],[212.04,219.54],[216.64,215.69],[220.39,211.04],[221.91,205.33],[219.77,199.82],[215.51,195.62],
  [210.48,192.38],[205.11,189.7],[199.57,187.42],[193.92,185.4],[188.2,183.59],[182.43,181.95],[176.63,180.43],
  [170.8,179.03],[164.95,177.72],[159.08,176.48],[153.19,175.32],[147.3,174.22],[141.39,173.17],[135.48,172.18],
  [129.56,171.22],[123.63,170.31],[117.7,169.43],[111.76,168.59],[105.82,167.78],[99.87,166.99],[93.92,166.24],
  [87.97,165.5],[82.02,164.72],[76.08,163.92],[70.14,163.07],[64.21,162.19],[58.29,161.25],[52.37,160.26],
  [46.47,159.2],[40.58,158.07],[34.71,156.85],[28.86,155.52],[23.05,154.05],[17.28,152.39],[11.6,150.48],
  [6.07,148.17],[0.9,145.15],[-2.85,140.59],[-1.44,135.02],[3.08,131.12],[8.29,128.16],[13.76,125.69],
  [19.35,123.51],[25.01,121.55],[30.73,119.74],[36.48,118.05],[42.27,116.46],[48.07,114.93],[53.87,113.4],
  [59.66,111.88],[65.46,110.35],[71.26,108.82],[77.06,107.29],[82.86,105.76],[88.66,104.23],[94.46,102.7],
  [100.26,101.17],[106.06,99.64],[111.85,98.1],[117.65,96.57],[123.45,95.03],[129.25,93.5],[135.04,91.96],
  [140.84,90.42],[146.63,88.87],[152.43,87.32],[158.22,85.77],[164.01,84.2],[169.79,82.62],[175.02,79.98],
  [175.65,74.18],[173.73,68.51],[171.01,63.17],[167.9,58.04],[164.57,53.05],[161.07,48.18],[157.46,43.39],
  [153.77,38.67],[150,34],
];

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
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

function drawTrainedWith(ctx, cx, y, logo) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 24px ${SYS}`;
  ctx.fillStyle = C.faint;
  ctx.fillText("TRAINED WITH", cx, y);
  if (logo) {
    const w = 170;
    const h = w * (logo.height / logo.width);
    ctx.drawImage(logo, cx - w / 2, y + 14, w, h);
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

export async function buildClimbShareBlob({
  day = 1,
  totalDays = 14,
  streak = 0,
  headline = null,
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

  // Sized so the trail's lowest point clears the handle at the bottom
  // (verified live: previously the two nearly touched) and its topmost
  // point clears the streak pill above it.
  const scale = 2.365;
  const offsetX = W / 2 - 115 * scale;
  const offsetY = 870;
  const T = (x, y) => ({ x: offsetX + x * scale, y: offsetY + y * scale });
  const trail = TRAIL.map(([x, y]) => T(x, y));
  const nodes = NODES.map((p) => T(p.x, p.y));

  const curIdx = Math.min(Math.max(day, 1), totalDays) - 1;
  const cur = nodes[curIdx];
  const curFrac = curIdx / (totalDays - 1);
  const curTrailI = Math.round(curFrac * (trail.length - 1));

  const glow = ctx.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, 320);
  glow.addColorStop(0, "rgba(252,118,5,0.32)");
  glow.addColorStop(1, "rgba(252,118,5,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  drawTrainedWith(ctx, W / 2, 300, logo);

  ctx.textAlign = "center";
  ctx.font = `600 30px ${SYS}`;
  ctx.fillStyle = C.accent;
  ctx.fillText("MAIN CHARACTER CHALLENGE", W / 2, 470);

  const dayStr = String(curIdx + 1);
  const ofStr = ` OF ${totalDays}`;
  ctx.font = `800 220px ${SYS}`;
  const dayW = ctx.measureText(dayStr).width;
  ctx.font = `700 56px ${SYS}`;
  const ofW = ctx.measureText(ofStr).width;
  const x0 = W / 2 - (dayW + 24 + ofW) / 2;
  ctx.textAlign = "left";
  ctx.font = `800 220px ${SYS}`;
  ctx.fillStyle = C.fg;
  ctx.fillText(dayStr, x0, 680);
  ctx.font = `700 56px ${SYS}`;
  ctx.fillStyle = C.muted;
  ctx.fillText(ofStr, x0 + dayW + 24, 680);

  ctx.textAlign = "center";
  if (headline) {
    ctx.font = `700 40px ${SYS}`;
    ctx.fillStyle = C.fg;
    ctx.fillText(headline, W / 2, 750);
  }

  const pillLabel = `${streak} day${streak === 1 ? "" : "s"} streak`;
  ctx.font = `700 30px ${SYS}`;
  const pillW = ctx.measureText(pillLabel).width + 90;
  const pillY = headline ? 800 : 760;
  roundRect(ctx, W / 2 - pillW / 2, pillY, pillW, 76, 38);
  ctx.fillStyle = "rgba(252,118,5,0.14)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(252,118,5,0.4)";
  roundRect(ctx, W / 2 - pillW / 2, pillY, pillW, 76, 38);
  ctx.stroke();
  ctx.fillStyle = C.accent;
  ctx.fillText(pillLabel, W / 2 + 20, pillY + 50);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = C.track;
  ctx.lineWidth = 14;
  ctx.beginPath();
  trail.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 14;
  ctx.beginPath();
  for (let i = 0; i <= curTrailI; i++) {
    const p = trail[i];
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  nodes.forEach((p, i) => {
    const n = i + 1;
    const done = n <= curIdx + 1;
    const isCurrent = n === curIdx + 1;
    const isFinish = n === totalDays;
    if (isCurrent) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
      ctx.fillStyle = C.accent;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 34, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,180,84,0.7)";
      ctx.lineWidth = 4;
      ctx.stroke();
    } else if (isFinish) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 14);
      ctx.lineTo(p.x, p.y - 46);
      ctx.strokeStyle = done ? C.accent : "#4a382a";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 46);
      ctx.lineTo(p.x + 34, p.y - 36);
      ctx.lineTo(p.x, p.y - 26);
      ctx.closePath();
      ctx.fillStyle = done ? C.accent : "#4a382a";
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, done ? 18 : 12, 0, Math.PI * 2);
      ctx.fillStyle = done ? C.accent : "#1a1409";
      ctx.fill();
      if (!done) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#4a382a";
        ctx.stroke();
      }
    }
  });

  drawHandle(ctx, W / 2, H - 150, glyph);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
