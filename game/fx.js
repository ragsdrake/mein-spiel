/**
 * game/fx.js
 * One-shot 3D effects (confetti, dust, fireworks, coin fountains) requested
 * from anywhere, and the intro gate that holds build-up animations while a
 * splash screen or title card covers the scene.
 */
import { create } from 'zustand';

let nextId = 1;

export const useFx = create((set) => ({
  /** [{ id, kind: 'confetti' | 'dust' | 'firework' | 'coins' | 'sparkle', pos: [x, y, z], delay }] */
  items: [],
  remove: (id) => set(s => ({ items: s.items.filter(f => f.id !== id) })),
}));

/** Spawn an effect at a world position (optionally delayed, in seconds). */
export function burst(kind, pos, delay = 0) {
  const id = nextId++;
  useFx.setState(s => ({ items: [...s.items.slice(-30), { id, kind, pos, delay }] }));
  return id;
}

/**
 * While `hold` is true the camera swoop and the hotel's build-up animation
 * wait (the intro splash / hotel title card is on screen).
 */
export const intro = { hold: true, frames: 0 };
/** True once the 3D scene has rendered a few frames (shaders compiled). */
export const sceneReady = () => intro.frames > 8;
