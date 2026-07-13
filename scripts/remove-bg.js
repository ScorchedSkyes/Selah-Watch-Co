const sharp = require("sharp");
const path = require("path");

const src = path.join(__dirname, "..", "assets", "logo.png");
const out = path.join(__dirname, "..", "assets", "logo-clear.png");

async function main() {
  const image = sharp(src);
  const { width, height } = await image.metadata();
  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const lumOf = (i) =>
    0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  const satOf = (i) => {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    return max - min;
  };
  const idx = (x, y) => (y * width + x) * 4;

  // Pass 1: kill dark, low-chroma field (leather backdrop + soft ground shadow)
  for (let i = 0; i < data.length; i += 4) {
    const lum = lumOf(i);
    const sat = satOf(i);

    // Strong rose/copper or silver stays
    if (sat > 32 || lum > 95) {
      data[i + 3] = 255;
      continue;
    }

    // Mid-dark with some warmth (metal edge) — soft alpha
    if (sat > 18 && lum > 40) {
      data[i + 3] = Math.round(255 * Math.min(1, (sat - 10) / 30 + (lum - 40) / 80));
      continue;
    }

    // Near-black ink on banner — keep for now, restore in pass 2
    if (lum < 55 && sat < 22) {
      data[i + 3] = 0;
    } else if (lum < 85 && sat < 28) {
      const t = (lum - 45) / 40;
      data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, t * 0.35)));
    } else {
      data[i + 3] = 255;
    }
  }

  const snapshot = Buffer.from(data);

  // Pass 2: restore black lettering sitting on metallic ribbon / shield
  const radius = 4;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      const lum =
        0.2126 * snapshot[i] +
        0.7152 * snapshot[i + 1] +
        0.0722 * snapshot[i + 2];
      const sat =
        Math.max(snapshot[i], snapshot[i + 1], snapshot[i + 2]) -
        Math.min(snapshot[i], snapshot[i + 1], snapshot[i + 2]);

      if (lum > 50 || sat > 25) continue;

      let metal = 0;
      let n = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const j = idx(nx, ny);
          const nl =
            0.2126 * snapshot[j] +
            0.7152 * snapshot[j + 1] +
            0.0722 * snapshot[j + 2];
          const ns =
            Math.max(snapshot[j], snapshot[j + 1], snapshot[j + 2]) -
            Math.min(snapshot[j], snapshot[j + 1], snapshot[j + 2]);
          n++;
          if (nl > 85 || ns > 40) metal++;
        }
      }

      if (metal / n > 0.18) {
        data[i + 3] = 255;
      }
    }
  }

  // Pass 3: gentle edge cleanup — fully kill faint haze (alpha < 40 and dark)
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0 && data[i + 3] < 45 && lumOf(i) < 70 && satOf(i) < 30) {
      data[i + 3] = 0;
    }
  }

  // Trim transparent margins and add a little padding
  await sharp(data, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 8 })
    .extend({ top: 12, bottom: 12, left: 12, right: 12, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);

  console.log(`Wrote ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
