/**
 * Mutable camera rig shared by the pan/pinch gestures (app/index.js) and the
 * camera controller inside the Canvas. `x`/`z` is the ground point the
 * isometric camera looks at, `zoom` a multiplier on the fit-to-width zoom.
 */
export const cam = { x: 8.6, z: 8.4, zoom: 1 };

export const CAM_BOUNDS = { minX: 2, maxX: 15, minZ: 2, maxZ: 17, minZoom: 0.7, maxZoom: 2.2 };

/** World units visible across the screen width at zoom 1. */
export const FIT_WIDTH = 17.5;

const SIN_ELEVATION = 0.677;    // camera on (1, 1.3, 1): pitch ≈ 42.6°

/** Convert a finger drag (pixels) into a camera move on the ground plane. */
export function panBy(dx, dy, screenWidth) {
  const ppu = (screenWidth / FIT_WIDTH) * cam.zoom;          // pixels per world unit
  const r = dx / ppu;                                         // along screen-right (1,0,-1)/√2
  const f = dy / (ppu * SIN_ELEVATION);                       // along screen-up  (-1,0,-1)/√2
  cam.x = clamp(cam.x - r * Math.SQRT1_2 - f * Math.SQRT1_2, CAM_BOUNDS.minX, CAM_BOUNDS.maxX);
  cam.z = clamp(cam.z + r * Math.SQRT1_2 - f * Math.SQRT1_2, CAM_BOUNDS.minZ, CAM_BOUNDS.maxZ);
}

export function zoomBy(factor) {
  cam.zoom = clamp(cam.zoom * factor, CAM_BOUNDS.minZoom, CAM_BOUNDS.maxZoom);
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
