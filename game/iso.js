/**
 * game/iso.js
 * 2:1 isometric projection shared by the sprite renderer and the tap hit
 * tests. It matches the Blender camera of tools/sprites (30° elevation,
 * 45° yaw), so pre-rendered sprites line up with world coordinates.
 *
 * World: x/z on the ground (game/config.js), y up.
 * "Render px": pixels of the sprite sheets (ppu px per world unit, horizontal).
 */

import { cam, FIT_WIDTH } from './camera';

const RX = Math.SQRT1_2;             // screen-x per (x − z)
const RY = 0.5 * Math.SQRT1_2;       // screen-y per (x + z)
const RH = Math.sqrt(0.75);          // screen-y per height

/** World → render px (unscaled, origin = world origin). */
export function project(ppu, x, z, y = 0) {
  return [(x - z) * RX * ppu, ((x + z) * RY - y * RH) * ppu];
}

/**
 * View transform for the current camera: render px → screen points.
 * `zoomMul` animates intros.
 */
export function viewFor(ppu, width, height, zoomMul = 1, panX = 0, panZ = 0) {
  const k = (width / FIT_WIDTH) * cam.zoom * zoomMul / ppu;   // pt per render px
  const [cx, cy] = project(ppu, cam.x + panX, cam.z + panZ);
  return {
    k, ppu, width, height,
    ox: width / 2 - cx * k,
    oy: height / 2 - cy * k,
  };
}

/** World → screen points. */
export function toScreen(v, x, z, y = 0) {
  const [px, py] = project(v.ppu, x, z, y);
  return [v.ox + px * v.k, v.oy + py * v.k];
}

/** Screen point → world ground position (y = 0). */
export function toGround(v, sx, sy) {
  const a = (sx - v.ox) / v.k / (RX * v.ppu);   // x − z
  const b = (sy - v.oy) / v.k / (RY * v.ppu);   // x + z
  return [(a + b) / 2, (b - a) / 2];
}
