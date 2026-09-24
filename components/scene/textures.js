/**
 * Procedural, tileable textures generated in JavaScript (no image files, so
 * they work identically on web and in expo-gl). Greyscale values are
 * multiplied with the material colour; the same texture doubles as bump map.
 */

import {
  DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, SRGBColorSpace,
} from 'three';

const SIZE = 128;

// ─── periodic value noise ────────────────────────────────────────────────────
function hash(x, y, seed) {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function noise(u, v, period, seed = 0) {
  const x = u * period;
  const y = v * period;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const w = (a) => ((a % period) + period) % period;
  const a = hash(w(x0), w(y0), seed);
  const b = hash(w(x0 + 1), w(y0), seed);
  const c = hash(w(x0), w(y0 + 1), seed);
  const d = hash(w(x0 + 1), w(y0 + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(u, v, period = 4, seed = 0, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let p = period;
  for (let i = 0; i < octaves; i++) {
    sum += noise(u, v, p, seed + i * 13) * amp;
    amp *= 0.5;
    p *= 2;
  }
  return sum / (1 - Math.pow(0.5, octaves));
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

// ─── patterns: return brightness 0..1 (and optional alpha) ───────────────────
const PATTERNS = {
  planks(u, v) {
    const n = 4;
    const idx = Math.floor(u * n);
    const lu = u * n - idx;
    const tint = 0.82 + hash(idx, 3, 1) * 0.18;
    const offset = hash(idx, 7, 2);
    const grain = Math.sin((v + offset) * 60 + fbm(u, v, 4, idx) * 9) * 0.5 + 0.5;
    const gap = lu < 0.05 || lu > 0.95 ? 0.45 : 1;
    const joint = Math.abs(((v + offset) % 1) - 0.5) < 0.008 ? 0.55 : 1;
    return tint * (0.82 + grain * 0.12 + fbm(u, v, 8, 5) * 0.08) * gap * joint;
  },
  bricks(u, v) {
    const rows = 4;
    const row = Math.floor(v * rows);
    const lv = v * rows - row;
    const shift = row % 2 ? 0.25 : 0;
    const cols = 2;
    const cu = (u + shift) * cols;
    const col = Math.floor(cu);
    const lu = cu - col;
    const mortar = lv < 0.07 || lu < 0.035 ? 0.55 : 1;
    const tint = 0.78 + hash(col % cols, row, 4) * 0.22;
    const edge = Math.min(lv, 1 - lv, lu * 2, (1 - lu) * 2);
    const bevel = edge < 0.12 ? 0.9 + edge : 1;
    return mortar * tint * bevel * (0.85 + fbm(u, v, 8, 9) * 0.15);
  },
  sandstone(u, v) {
    const rows = 3;
    const row = Math.floor(v * rows);
    const lv = v * rows - row;
    const cu = (u + (row % 2) * 0.5) * 1.5;
    const lu = cu - Math.floor(cu);
    const seam = lv < 0.04 || lu < 0.02 ? 0.72 : 1;
    const strata = 0.9 + Math.sin(v * 50 + fbm(u, v, 4, 3) * 6) * 0.05;
    return seam * strata * (0.86 + fbm(u, v, 8, 11) * 0.14) * (0.9 + hash(Math.floor(cu), row, 6) * 0.1);
  },
  tiles(u, v) {
    const n = 2;
    const iu = Math.floor(u * n);
    const iv = Math.floor(v * n);
    const lu = u * n - iu;
    const lv = v * n - iv;
    const grout = lu < 0.04 || lv < 0.04 ? 0.5 : 1;
    const tint = 0.84 + hash(iu, iv, 8) * 0.16;
    const crack = Math.abs(fbm(u, v, 4, iu + iv * 3) - 0.5) < 0.012 ? 0.75 : 1;
    return grout * tint * crack * (0.88 + fbm(u, v, 16, 2) * 0.12);
  },
  iceBricks(u, v) {
    const rows = 3;
    const row = Math.floor(v * rows);
    const lv = v * rows - row;
    const cu = (u + (row % 2) * 0.5) * 2;
    const lu = cu - Math.floor(cu);
    const edge = Math.min(lv, 1 - lv, lu, 1 - lu);
    const rim = edge < 0.05 ? 1.1 : 1;
    const seam = edge < 0.015 ? 0.7 : 1;
    const crack = Math.abs(fbm(u, v, 3, row) - 0.5) < 0.01 ? 1.12 : 1;
    return clamp01(seam * rim * crack * (0.88 + fbm(u, v, 4, 21) * 0.12));
  },
  ice(u, v) {
    const cracks = Math.abs(fbm(u, v, 3, 5) - 0.5) < 0.012 || Math.abs(fbm(u, v, 5, 8) - 0.5) < 0.008 ? 1.12 : 1;
    return clamp01((0.88 + fbm(u, v, 4, 1) * 0.12) * cracks);
  },
  grass(u, v) {
    return 0.72 + fbm(u, v, 4, 31) * 0.2 + (hash(Math.floor(u * 64), Math.floor(v * 64), 3) > 0.9 ? 0.08 : 0);
  },
  sand(u, v) {
    const ripple = Math.sin((v + fbm(u, v, 2, 4) * 0.4) * 40) * 0.018;
    return 0.88 + fbm(u, v, 8, 17) * 0.08 + fbm(u, v, 32, 3) * 0.04 + ripple;
  },
  snow(u, v) {
    return 0.9 + fbm(u, v, 8, 23) * 0.08 + (hash(Math.floor(u * 128), Math.floor(v * 128), 9) > 0.985 ? 0.1 : 0);
  },
  stone(u, v) {
    return 0.75 + fbm(u, v, 4, 41) * 0.25;
  },
  fabric(u, v) {
    const weave = (Math.sin(u * Math.PI * 64) * Math.sin(v * Math.PI * 64)) * 0.05;
    return 0.88 + weave + fbm(u, v, 8, 51) * 0.08;
  },
};

// ─── clean patterns (Codigames-style flat look: no noise, crisp lines) ───────
Object.assign(PATTERNS, {
  cleanPlanks(u, v) {
    const n = 4;
    const idx = Math.floor(u * n);
    const lu = u * n - idx;
    const off = hash(idx, 7, 2);
    const joint = Math.abs(((v + off) % 1) - 0.5) < 0.012;
    const gap = lu < 0.03 || lu > 0.97;
    return gap || joint ? 0.8 : 0.96 + hash(idx, 3, 1) * 0.04;
  },
  cleanTiles(u, v) {
    const n = 2;
    const iu = Math.floor(u * n);
    const iv = Math.floor(v * n);
    const lu = u * n - iu;
    const lv = v * n - iv;
    if (lu < 0.025 || lv < 0.025) return 0.84;
    return (iu + iv) % 2 ? 1 : 0.95;
  },
  cleanGrass(u, v) {
    const n = 2;
    const iu = Math.floor(u * n);
    const iv = Math.floor(v * n);
    return (iu + iv) % 2 ? 1 : 0.95;
  },
  cleanSand(u, v) {
    return 0.97 + (Math.sin((u + v) * Math.PI * 8) > 0.92 ? -0.04 : 0);
  },
  cleanSnow() {
    return 1;
  },
});

/** Soft alpha textures for glows, fog wisps and blob shadows. */
const ALPHA_PATTERNS = {
  radial(u, v) {
    const d = Math.hypot(u - 0.5, v - 0.5) * 2;
    const a = clamp01(1 - d);
    return a * a;
  },
  fog(u, v) {
    const d = Math.hypot(u - 0.5, v - 0.5) * 2;
    return clamp01(fbm(u, v, 3, 61) * 1.4 - 0.35) * clamp01(1 - d * d);
  },
};

const baseCache = new Map();

function build(kind) {
  const data = new Uint8Array(SIZE * SIZE * 4);
  const alphaFn = ALPHA_PATTERNS[kind];
  const fn = PATTERNS[kind];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE;
      const v = y / SIZE;
      const i = (y * SIZE + x) * 4;
      if (alphaFn) {
        data[i] = data[i + 1] = data[i + 2] = 255;
        data[i + 3] = Math.round(alphaFn(u, v) * 255);
      } else {
        const b = Math.round(clamp01(fn(u, v)) * 255);
        data[i] = data[i + 1] = data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
  }
  const t = new DataTexture(data, SIZE, SIZE, RGBAFormat);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.magFilter = LinearFilter;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  if (!alphaFn) t.colorSpace = SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

const repeatCache = new Map();

/** Texture of `kind`, repeated rx × ry times across a face. Cached. */
export function tex(kind, rx = 1, ry = 1) {
  const key = `${kind}|${rx}|${ry}`;
  let t = repeatCache.get(key);
  if (t) return t;
  let base = baseCache.get(kind);
  if (!base) {
    base = build(kind);
    baseCache.set(kind, base);
  }
  if (rx === 1 && ry === 1) {
    t = base;
  } else {
    t = base.clone();
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
  }
  repeatCache.set(key, t);
  return t;
}
