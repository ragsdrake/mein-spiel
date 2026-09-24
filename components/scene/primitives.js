/**
 * Low-poly building blocks. Every mesh uses flat shading and a shared,
 * cached material per colour so the whole hotel stays cheap to render.
 */

import { MeshStandardMaterial } from 'three';

const cache = new Map();

/** Shared flat-shaded material. `emissive` makes things glow (windows, candles). */
export function M(color, { emissive, intensity = 1, opacity, metal = 0, rough = 0.85 } = {}) {
  const key = `${color}|${emissive}|${intensity}|${opacity}|${metal}|${rough}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({
      color,
      flatShading:  true,
      roughness:    rough,
      metalness:    metal,
      emissive:     emissive ?? '#000000',
      emissiveIntensity: emissive ? intensity : 0,
      transparent:  opacity != null,
      opacity:      opacity ?? 1,
    });
    cache.set(key, m);
  }
  return m;
}

const shadowProps = (cast, receive) => ({ castShadow: cast, receiveShadow: receive });

export function Box({ p = [0, 0, 0], s = [1, 1, 1], r, c, mat, cast = true, receive = true, ...rest }) {
  return (
    <mesh position={p} rotation={r} material={mat ?? M(c)} {...shadowProps(cast, receive)} {...rest}>
      <boxGeometry args={s} />
    </mesh>
  );
}

export function Cyl({ p = [0, 0, 0], rt = 0.5, rb, h = 1, seg = 7, r, c, mat, open = false, cast = true, receive = true, ...rest }) {
  return (
    <mesh position={p} rotation={r} material={mat ?? M(c)} {...shadowProps(cast, receive)} {...rest}>
      <cylinderGeometry args={[rt, rb ?? rt, h, seg, 1, open]} />
    </mesh>
  );
}

export function Cone({ p = [0, 0, 0], rad = 0.5, h = 1, seg = 6, r, c, mat, cast = true, ...rest }) {
  return (
    <mesh position={p} rotation={r} material={mat ?? M(c)} castShadow={cast} {...rest}>
      <coneGeometry args={[rad, h, seg]} />
    </mesh>
  );
}

export function Ball({ p = [0, 0, 0], rad = 0.5, w = 7, hs = 5, sc, r, c, mat, cast = true, ...rest }) {
  return (
    <mesh position={p} rotation={r} scale={sc} material={mat ?? M(c)} castShadow={cast} {...rest}>
      <sphereGeometry args={[rad, w, hs]} />
    </mesh>
  );
}

export function Rock({ p = [0, 0, 0], rad = 0.5, sc, r, c, mat, cast = true, ...rest }) {
  return (
    <mesh position={p} rotation={r} scale={sc} material={mat ?? M(c)} castShadow={cast} receiveShadow {...rest}>
      <icosahedronGeometry args={[rad, 0]} />
    </mesh>
  );
}

/** Deterministic pseudo random so decorations never jump between renders. */
export function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
