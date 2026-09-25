/**
 * World-space UI drawn with Skia vectors on top of the sprites: status
 * badges (upgrade, check-in, drink, Zzz, tip, cleaning, padlock), slime
 * puddles, rising "+money" labels and particle bursts.
 */

import { Skia } from '@shopify/react-native-skia';
import { toScreen } from '../../game/iso';

const OUTLINE = '#1f2447';
let fill = null;
let textFill = null;
let textStroke = null;
/** Paints are created on first use (CanvasKit loads late on the web). */
export function initOverlay() {
  if (fill) return;
  fill = Skia.Paint();
  fill.setAntiAlias(true);
  textFill = Skia.Paint();
  textFill.setAntiAlias(true);
  textStroke = Skia.Paint();
  textStroke.setAntiAlias(true);
  textStroke.setStyle(1);
  textStroke.setStrokeJoin(1);
}
const color = (p, c, a = 1) => { p.setColor(Skia.Color(c)); p.setAlphaf(a); return p; };

function circle(c, x, y, r, col, a = 1) {
  c.drawCircle(x, y, r, color(fill, col, a));
}

function tri(c, x, y, r, rot, col) {
  const path = Skia.Path.Make();
  for (let i = 0; i < 3; i++) {
    const ang = rot + i * (Math.PI * 2 / 3);
    const px = x + Math.cos(ang) * r, py = y + Math.sin(ang) * r;
    if (i === 0) path.moveTo(px, py); else path.lineTo(px, py);
  }
  path.close();
  c.drawPath(path, color(fill, col));
}

function rect(c, x, y, w, h, col, rot = 0) {
  if (rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot * 180 / Math.PI, 0, 0);
    c.drawRect(Skia.XYWHRect(-w / 2, -h / 2, w, h), color(fill, col));
    c.restore();
  } else {
    c.drawRect(Skia.XYWHRect(x - w / 2, y - h / 2, w, h), color(fill, col));
  }
}

/** Round badge with outline, white ring, coloured face, highlight, optional tail. */
function badge(c, x, y, r, face, tail) {
  circle(c, x + r * 0.09, y + r * 0.13, r * 1.05, '#000000', 0.28);
  if (tail) {
    tri(c, x, y + r * 1.0, r * 0.45, Math.PI / 2, OUTLINE);
    tri(c, x, y + r * 0.9, r * 0.3, Math.PI / 2, '#ffffff');
  }
  circle(c, x, y, r, OUTLINE);
  circle(c, x, y, r * 0.89, '#ffffff');
  circle(c, x, y, r * 0.74, face);
  c.save();
  c.translate(x, y - r * 0.26);
  c.scale(1, 0.42);
  circle(c, 0, 0, r * 0.52, '#ffffff', 0.22);
  c.restore();
}

export function drawBadge(c, kind, x, y, r) {
  switch (kind) {
    case 'upgrade':
      badge(c, x, y, r, '#2ecc5a');
      rect(c, x, y + r * 0.18, r * 0.2, r * 0.46, '#ffffff');
      tri(c, x, y - r * 0.16, r * 0.32, -Math.PI / 2, '#ffffff');
      break;
    case 'checkin':
      badge(c, x, y, r, '#ff8a1a', true);
      rect(c, x, y - r * 0.12, r * 0.2, r * 0.55, '#ffffff');
      circle(c, x, y + r * 0.34, r * 0.12, '#ffffff');
      break;
    case 'drink':
      badge(c, x, y, r, '#2f9be8', true);
      rect(c, x - r * 0.08, y + r * 0.02, r * 0.44, r * 0.56, '#ffffff');
      rect(c, x - r * 0.08, y - r * 0.2, r * 0.44, r * 0.1, '#fff1b8');
      circle(c, x + r * 0.2, y, r * 0.17, '#ffffff');
      circle(c, x + r * 0.2, y, r * 0.08, '#2f9be8');
      break;
    case 'zzz': {
      badge(c, x, y, r, '#8a5ad0', true);
      const z = (zx, zy, s) => {
        rect(c, x + zx * r, y + (zy - 0.18 * s) * r, 0.36 * s * r, 0.09 * s * r, '#ffffff');
        rect(c, x + zx * r, y + zy * r, 0.09 * s * r, 0.44 * s * r, '#ffffff', 0.9);
        rect(c, x + zx * r, y + (zy + 0.18 * s) * r, 0.36 * s * r, 0.09 * s * r, '#ffffff');
      };
      z(-0.26, 0.2, 0.7); z(0.02, -0.02, 0.85); z(0.3, -0.26, 1);
      break;
    }
    case 'tip':
      badge(c, x, y, r, '#ffc31a');
      circle(c, x, y, r * 0.5, '#f09a00');
      circle(c, x, y, r * 0.4, '#ffd84a');
      rect(c, x, y, r * 0.13, r * 0.52, '#f09a00');
      break;
    case 'clean':
      badge(c, x, y, r, '#1fb7c9', true);
      rect(c, x + r * 0.08, y - r * 0.12, r * 0.13, r * 0.72, '#ffffff', -0.5);
      rect(c, x - r * 0.18, y + r * 0.3, r * 0.46, r * 0.22, '#ffd24a', -0.5);
      break;
    case 'lock':
      badge(c, x, y, r, '#f2b33d');
      c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - r * 0.34, y - r * 0.04, r * 0.68, r * 0.52), r * 0.08, r * 0.08), color(fill, '#ffffff'));
      {
        const s = Skia.Paint();
        s.setAntiAlias(true);
        s.setStyle(1);
        s.setStrokeWidth(r * 0.14);
        s.setColor(Skia.Color('#ffffff'));
        c.drawArc(Skia.XYWHRect(x - r * 0.24, y - r * 0.44, r * 0.48, r * 0.6), 180, 180, false, s);
      }
      circle(c, x, y + r * 0.2, r * 0.08, '#f2b33d');
      break;
    default:
      badge(c, x, y, r, '#888888');
  }
}

export function drawPuddle(c, v, x, z, col) {
  const [sx, sy] = toScreen(v, x, z, 0);
  const s = v.ppu * v.k;
  c.save();
  c.translate(sx, sy);
  c.scale(1, 0.5);
  circle(c, 0, 0, 0.5 * s, col, 0.8);
  circle(c, 0.5 * s, 0.3 * s, 0.25 * s, col, 0.8);
  circle(c, -0.4 * s, 0.35 * s, 0.18 * s, col, 0.8);
  circle(c, -0.1 * s, -0.12 * s, 0.14 * s, '#ffffff', 0.35);
  c.restore();
}

// ─── money labels ────────────────────────────────────────────────────────────

export function drawMoney(c, v, font, f, label) {
  const [sx, sy] = toScreen(v, f.pos[0], f.pos[1], 1.6 + f.t * 1.4);
  const pop = f.t < 0.2 ? 1 + 2.4 * Math.pow(f.t / 0.2 - 1, 3) + 1.4 * Math.pow(f.t / 0.2 - 1, 2) : 1;
  const alpha = f.t > 0.85 ? Math.max(0, 1 - (f.t - 0.85) / 0.35) : 1;
  const tip = f.kind === 'tip';
  c.save();
  c.translate(sx, sy);
  c.scale(pop * (tip ? 1.25 : 1), pop * (tip ? 1.25 : 1));
  // green bill icon
  c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-30, -11, 22, 14), 3, 3), color(fill, '#2a8a4a', alpha));
  c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-29, -10, 20, 12), 2, 2), color(fill, '#3fce6a', alpha));
  circle(c, -19, -4, 3.2, '#e8fff0', alpha);
  if (font) {
    textStroke.setStrokeWidth(4);
    textStroke.setColor(Skia.Color('#123a22'));
    textStroke.setAlphaf(alpha);
    c.drawText(label, -4, 2, textStroke, font);
    textFill.setColor(Skia.Color(tip ? '#ffd84a' : '#7dff9a'));
    textFill.setAlphaf(alpha);
    c.drawText(label, -4, 2, textFill, font);
  }
  c.restore();
}

// ─── particles ───────────────────────────────────────────────────────────────
const CONFETTI = ['#ff4f6d', '#ffc31a', '#2ecc5a', '#2f9be8', '#a86af0', '#ffffff', '#ff8a1a'];
const KINDS = {
  confetti: { n: 46, size: 0.12, colors: CONFETTI, life: 1.8, g: 7, drag: 1.6,
    v: (r) => [(r() - 0.5) * 5, 4 + r() * 4.5, (r() - 0.5) * 5] },
  sparkle: { n: 22, size: 0.08, colors: ['#ffffff', '#fff1a0', '#9ff0ff'], life: 1.1, g: 2, drag: 2.5, round: true,
    v: (r) => [(r() - 0.5) * 4, 1.5 + r() * 3, (r() - 0.5) * 4] },
  dust: { n: 16, size: 0.3, colors: ['#efe6d8', '#d9cfc0', '#ffffff'], life: 1.0, g: -0.5, drag: 3.5, grow: 1.8, round: true, fade: 0.7,
    v: (r) => { const a = r() * Math.PI * 2; return [Math.cos(a) * 3, 0.4 + r(), Math.sin(a) * 3]; } },
  firework: { n: 60, size: 0.12, colors: null, life: 1.9, g: 2.2, drag: 1.2, round: true, air: true,
    v: (r) => {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, s = 5.5 + r() * 1.2, q = Math.sqrt(1 - u * u);
      return [Math.cos(a) * q * s, u * s, Math.sin(a) * q * s];
    } },
  coins: { n: 26, size: 0.16, colors: ['#ffc31a', '#ffd84a', '#f09a00'], life: 1.8, g: 9, drag: 0.6, round: true,
    v: (r) => [(r() - 0.5) * 3, 6 + r() * 3, (r() - 0.5) * 3] },
};

let seed = 7;
const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

/** Creates the particle state for a burst request from game/fx.js. */
export function spawnBurst(req, now) {
  const spec = KINDS[req.kind] ?? KINDS.confetti;
  const hue = CONFETTI[Math.floor(rng() * 5)];
  return {
    id: req.id, spec, kind: req.kind, start: now + (req.delay ?? 0),
    parts: Array.from({ length: spec.n }, () => ({
      p: [...req.pos], v: spec.v(rng), rot: rng() * 6, spin: (rng() - 0.5) * 12,
      col: spec.colors ? spec.colors[Math.floor(rng() * spec.colors.length)] : (rng() < 0.75 ? hue : '#ffffff'),
    })),
  };
}

/** Advances and draws a burst; returns false when it is finished. */
export function stepBurst(c, v, b, now, dt) {
  const t = now - b.start;
  if (t < 0) return true;
  const { spec } = b;
  const k = t / spec.life;
  if (k >= 1) return false;
  const damp = Math.exp(-spec.drag * dt);
  const px = v.ppu * v.k;
  for (const q of b.parts) {
    q.v[0] *= damp; q.v[2] *= damp;
    q.v[1] = q.v[1] * damp - spec.g * dt;
    q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt;
    if (!spec.air && q.p[1] < 0.05) { q.p[1] = 0.05; q.v[1] = Math.abs(q.v[1]) * 0.3; }
    q.rot += q.spin * dt;
    const [sx, sy] = toScreen(v, q.p[0], q.p[2], q.p[1]);
    const size = spec.size * (1 + (spec.grow ?? 0) * k) * (k > 0.75 ? (1 - k) / 0.25 : 1) * px;
    const alpha = spec.fade ? spec.fade * (1 - k) : 1;
    if (spec.round) circle(c, sx, sy, size / 2, q.col, alpha);
    else {
      color(fill, q.col, alpha);
      c.save();
      c.translate(sx, sy);
      c.rotate(q.rot * 57.3, 0, 0);
      c.drawRect(Skia.XYWHRect(-size / 2, -size * 0.3, size, size * 0.6 * Math.abs(Math.cos(q.rot))), fill);
      c.restore();
    }
  }
  return true;
}
