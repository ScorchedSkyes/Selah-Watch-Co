const sharp = require("sharp");
const path = require("path");

const src = path.join(__dirname, "..", "assets", "banner.png");
const out = path.join(__dirname, "..", "assets", "logo-clear.png");

// Sampled navy leather field colors from banner corners
const NAVY_KEYS = [
  [22, 38, 61],
  [9, 18, 30],
  [12, 22, 37],
  [12, 18, 30],
  [16, 29, 47],
  [14, 25, 42],
  [20, 34, 55],
  [8, 14, 26],
  [18, 32, 52],
  [10, 20, 34],
];

function dist(r, g, b, key) {
  const dr = r - key[0];
  const dg = g - key[1];
  const db = b - key[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function nearestNavy(r, g, b) {
  let best = Infinity;
  for (const key of NAVY_KEYS) {
    best = Math.min(best, dist(r, g, b, key));
  }
  return best;
}

async function main() {
  const image = sharp(src);
  const { width, height } = await image.metadata();
  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Watch face circle on the left — keep its full interior solid so the
  // dark dial doesn't get hollowed out with the background. Solid out to
  // DIAL_R (covers the curved SELAH WATCH CO. / EST. 2026 text ring), then
  // feather to transparent by DIAL_FADE so the rim melts into the page.
  const DIAL_CX = 234;
  const DIAL_CY = 206;
  const DIAL_R = 188;
  const DIAL_FADE = 196;

  for (let i = 0; i < data.length; i += 4) {
    const p = i / 4;
    const px = p % width;
    const py = Math.floor(p / width);
    const ddx = px - DIAL_CX;
    const ddy = py - DIAL_CY;
    const dd = Math.sqrt(ddx * ddx + ddy * ddy);
    if (dd <= DIAL_R) {
      data[i + 3] = 255;
      continue;
    }
    if (dd <= DIAL_FADE) {
      data[i + 3] = Math.round(255 * (1 - (dd - DIAL_R) / (DIAL_FADE - DIAL_R)));
      continue;
    }

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max - min;
    const navyDist = nearestNavy(r, g, b);

    // Keep champagne / gold (wordmark, shields, tagline, ring lettering)
    const isGold =
      r > 90 &&
      g > 65 &&
      r >= g - 10 &&
      r > b + 10 &&
      (r - b > 18 || (lum > 95 && r > b + 8));

    // Keep silver / chrome
    const isSilver = lum > 105 && sat < 42 && Math.abs(r - g) < 22 && Math.abs(g - b) < 28;

    // Keep dial blue (brighter / more saturated than leather field)
    const isDial =
      b > 60 &&
      b > r + 15 &&
      b >= g &&
      lum > 40 &&
      sat > 28 &&
      navyDist > 28;

    // Keep white / cream micro-text
    const isLight = lum > 160 && sat < 45;

    // Star glint
    const isGlint = lum > 130 && sat < 55;

    if (isGold || isSilver || isDial || isLight || isGlint) {
      data[i + 3] = 255;
      continue;
    }

    // Soft keep for metallic fringe
    if (lum > 85 && (r > b + 5 || sat < 20)) {
      data[i + 3] = Math.round(255 * Math.min(1, (lum - 70) / 45));
      continue;
    }

    // Aggressive navy / shadow kill
    // Hard transparent inside navy cluster
    if (navyDist < 42 || (lum < 55 && b >= r - 2 && r < 75)) {
      data[i + 3] = 0;
      continue;
    }

    // Soft edge for near-navy
    if (navyDist < 58 || (lum < 78 && b >= g - 5 && r < 90)) {
      const t = Math.max(0, (navyDist - 42) / 20);
      data[i + 3] = Math.round(255 * t * 0.25);
      continue;
    }

    // Anything still dark-ish and cool-toned → drop
    if (lum < 70 && b + 8 >= r) {
      data[i + 3] = 0;
      continue;
    }

    data[i + 3] = 255;
  }

  // Second pass: kill leftover semi-transparent haze (skip the dial emblem)
  for (let i = 0; i < data.length; i += 4) {
    const p = i / 4;
    const px = p % width;
    const py = Math.floor(p / width);
    const ddx = px - DIAL_CX;
    const ddy = py - DIAL_CY;
    if (ddx * ddx + ddy * ddy <= DIAL_FADE * DIAL_FADE) continue;

    const a = data[i + 3];
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const navyDist = nearestNavy(data[i], data[i + 1], data[i + 2]);
    if (a > 0 && a < 90 && (navyDist < 50 || lum < 65)) {
      data[i + 3] = 0;
    }
  }

  // Third pass: remove isolated dark pixels (noise) while keeping connected logo
  const alpha = Buffer.alloc(width * height);
  for (let p = 0; p < width * height; p++) alpha[p] = data[p * 4 + 3];

  await sharp(data, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 12 })
    .extend({
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(out);

  // Also write a matching flat CSS-friendly bg color note via a 1px png
  await sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 14, g: 25, b: 42 },
    },
  })
    .png()
    .toFile(path.join(__dirname, "..", "assets", "bg-navy.png"));

  const check = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let t = 0,
    o = 0,
    p = 0;
  for (let i = 3; i < check.data.length; i += 4) {
    const a = check.data[i];
    if (a === 0) t++;
    else if (a === 255) o++;
    else p++;
  }
  const total = check.info.width * check.info.height;
  console.log(
    `logo ${check.info.width}x${check.info.height} transparent=${((t / total) * 100).toFixed(1)}% opaque=${((o / total) * 100).toFixed(1)}% partial=${((p / total) * 100).toFixed(1)}%`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
