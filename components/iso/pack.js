/**
 * Loads a hotel's pre-rendered sprite pack (assets/sprites/<hotel>, made by
 * tools/sprites) into Skia images and prepares the lookup tables the
 * renderer needs: sprite variants per part, level presence, character
 * frames, and a depth order for all environment sprites.
 */

import { Skia } from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
import PACKS from '../../assets/sprites';

const cache = new Map();

async function loadImage(mod) {
  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();
  const data = await Skia.Data.fromURI(asset.localUri ?? asset.uri);
  return Skia.Image.MakeImageFromEncoded(data);
}

export const hasPack = (hotel) => Boolean(PACKS[hotel]);

/** Load (once) and prepare a hotel pack. Resolves to null if there is none. */
export function loadPack(hotel) {
  if (!PACKS[hotel]) return Promise.resolve(null);
  if (!cache.has(hotel)) {
    cache.set(hotel, (async () => {
      const mod = PACKS[hotel]();
      const [pages, backdrop] = await Promise.all([
        Promise.all(mod.pages.map(loadImage)),
        Promise.all(mod.backdrop.map(loadImage)),
      ]);
      return prepare(mod.pack, pages, backdrop);
    })());
  }
  return cache.get(hotel);
}

// ─── depth order ─────────────────────────────────────────────────────────────
/** True if footprint a lies behind b for a camera looking from +x/+z. */
export function behind(a, b) {
  if (a[1] <= b[0] + 1e-3) return true;
  if (b[1] <= a[0] + 1e-3) return false;
  if (a[3] <= b[2] + 1e-3) return true;
  if (b[3] <= a[2] + 1e-3) return false;
  return a[0] + a[1] + a[2] + a[3] < b[0] + b[1] + b[2] + b[3];
}

const overlaps = (r, s) => r.x < s.x + s.w && s.x < r.x + r.w && r.y < s.y + s.h && s.y < r.y + r.h;

/** Topological sort (Kahn) of sprites whose screen rectangles overlap. */
function depthSort(items) {
  const n = items.length;
  const after = items.map(() => []);
  const indeg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!overlaps(items[i], items[j])) continue;
      if (behind(items[i].foot, items[j].foot)) { after[i].push(j); indeg[j]++; } else { after[j].push(i); indeg[i]++; }
    }
  }
  // stable queue by rough depth so unrelated sprites keep a sensible order
  const depth = (s) => s.foot[0] + s.foot[1] + s.foot[2] + s.foot[3];
  const ready = [];
  for (let i = 0; i < n; i++) if (!indeg[i]) ready.push(i);
  const out = [];
  while (ready.length) {
    ready.sort((a, b) => depth(items[b]) - depth(items[a]));
    const i = ready.pop();
    out.push(items[i]);
    for (const j of after[i]) if (--indeg[j] === 0) ready.push(j);
  }
  // cycles (should be rare): append the rest by depth
  if (out.length < n) {
    const seen = new Set(out);
    items.filter(s => !seen.has(s)).sort((a, b) => depth(a) - depth(b)).forEach(s => out.push(s));
  }
  out.forEach((s, i) => { s.order = i; });
  return out;
}

// ─── preparation ─────────────────────────────────────────────────────────────
function prepare(pack, pages, backdrop) {
  const frame = (key) => {
    const t = pack.table[key];
    return t && { img: pages[t[0]], src: Skia.XYWHRect(t[1], t[2], t[3], t[4]) };
  };

  // one entry per part id, holding its level variants
  const parts = new Map();
  for (const s of pack.sprites) {
    const key = s.state === 'open' ? `${s.id}@open` : s.id;
    let p = parts.get(key);
    if (!p) {
      p = { id: s.id, key, kind: s.kind, station: s.station, variants: [], foot: s.foot, x: s.x, y: s.y, w: s.w, h: s.h };
      parts.set(key, p);
    }
    p.variants.push({
      level: s.level ?? 0, ...frame(s.name), x: s.x, y: s.y, w: s.w, h: s.h, top: s.top,
      shadow: s.shadow && { ...frame(`${s.name}.sh`), ...s.shadow },
    });
    // the screen rect used for sorting covers all variants
    const x1 = Math.max(p.x + p.w, s.x + s.w), y1 = Math.max(p.y + p.h, s.y + s.h);
    p.x = Math.min(p.x, s.x); p.y = Math.min(p.y, s.y); p.w = x1 - p.x; p.h = y1 - p.y;
  }
  parts.forEach(p => p.variants.sort((a, b) => a.level - b.level));

  const sprites = [...parts.values()].filter(p => p.kind === 'sprite' && !p.key.endsWith('@open'));
  const ordered = depthSort(sprites);

  const chars = {};
  for (const [name, c] of Object.entries(pack.chars)) chars[name] = { ...c, ...frame(`c:${name}`) };

  return {
    ppu: pack.ppu,
    backdrop: pack.backdrop.map((b, i) => ({ ...b, img: backdrop[i] })),
    parts,
    ordered,
    flats: [...parts.values()].filter(p => p.kind === 'flat'),
    decals: [...parts.values()].filter(p => p.kind === 'decal'),
    presence: pack.presence,
    chars,
  };
}

const LEVELS = [0, 1, 2, 3, 4, 6, 7, 10];

/**
 * Variant of a part for a station level: the export level at or below the
 * current level decides whether the part exists at all; the latest variant
 * up to that level is drawn.
 */
export function variantFor(pack, part, level) {
  if (!part.station) return part.variants[0];
  let snap = 0;
  for (const l of LEVELS) if (l <= level) snap = l;
  const present = pack.presence[part.id];
  if (present && !present.includes(snap)) return null;
  let v = null;
  for (const cand of part.variants) if (cand.level <= snap) v = cand;
  return v;
}
