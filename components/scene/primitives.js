/**
 * Low-poly building blocks. Materials are cached per look so the whole hotel
 * shares a handful of GPU programs. Surfaces can carry a procedural texture
 * (`tx`) that is also used as bump map for real depth in the light.
 */

import { AdditiveBlending, Color, MeshBasicMaterial, MeshStandardMaterial, SpriteMaterial } from 'three';
import { tex } from './textures';

const cache = new Map();

/**
 * Shared material.
 *  - `emissive`/`intensity`: glow (values > 1 bloom on high quality)
 *  - `tx`, `rx`, `ry`:       procedural texture + repeat
 *  - `bump`:                 bump strength of that texture
 *  - `smooth`:               smooth instead of flat shading
 */
export function M(color, opts = {}) {
  const {
    emissive, intensity = 1, opacity, metal = 0, rough = 0.85, tx, rx = 1, ry = 1, bump = 0, smooth = false,
  } = opts;
  const key = `${color}|${emissive}|${intensity}|${opacity}|${metal}|${rough}|${tx}|${rx}|${ry}|${bump}|${smooth}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({
      color,
      flatShading:  !smooth && !tx,
      roughness:    rough,
      metalness:    metal,
      emissive:     emissive ?? '#000000',
      emissiveIntensity: emissive ? intensity : 0,
      transparent:  opacity != null,
      opacity:      opacity ?? 1,
      depthWrite:   opacity == null || opacity > 0.6,
    });
    if (tx) {
      m.map = tex(tx, rx, ry);
      if (bump) {
        m.bumpMap = m.map;
        m.bumpScale = bump;
      }
    }
    cache.set(key, m);
  }
  return m;
}

/** Unlit additive glow (halos, light shafts, particles). */
export function Glow(color, opacity = 0.6) {
  const key = `glow|${color}|${opacity}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshBasicMaterial({
      color, map: tex('radial'), transparent: true, opacity, depthWrite: false, blending: AdditiveBlending,
    });
    cache.set(key, m);
  }
  return m;
}

/** Camera-facing additive glow sprite material (flames, magic, halos). */
export function GlowS(color, opacity = 0.6) {
  const key = `glows|${color}|${opacity}`;
  let m = cache.get(key);
  if (!m) {
    m = new SpriteMaterial({
      color, map: tex('radial'), transparent: true, opacity, depthWrite: false, blending: AdditiveBlending,
    });
    cache.set(key, m);
  }
  return m;
}

/** Glowing sprite of `size` world units. */
export function Sprite({ p = [0, 0, 0], size = 1, color = '#ffb347', opacity = 0.6 }) {
  return <sprite position={p} scale={[size, size, 1]} material={GlowS(color, opacity)} renderOrder={3} />;
}

/** Soft dark disc under characters and props. */
export const SHADOW_BLOB = new MeshBasicMaterial({
  color: '#000000', map: tex('radial'), transparent: true, opacity: 0.4, depthWrite: false,
});

/**
 * Standard material with a fresnel rim glow — ghosts, ice and magic look
 * like they emit light around their silhouette.
 */
export function RimM(color, rim, { strength = 1.4, opacity, emissive, intensity = 0.3, rough = 0.5 } = {}) {
  const key = `rim|${color}|${rim}|${strength}|${opacity}|${emissive}|${intensity}|${rough}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({
      color, roughness: rough, flatShading: true,
      emissive: emissive ?? rim, emissiveIntensity: intensity,
      transparent: opacity != null, opacity: opacity ?? 1, depthWrite: opacity == null || opacity > 0.6,
    });
    const rimColor = new Color(rim);
    m.onBeforeCompile = (shader) => {
      shader.uniforms.rimColor = { value: rimColor };
      shader.uniforms.rimStrength = { value: strength };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;\nuniform float rimStrength;')
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          vec3 rimView = isOrthographic ? vec3( 0.0, 0.0, 1.0 ) : normalize( vViewPosition );
          float rimF = 1.0 - saturate( dot( normalize( normal ), rimView ) );
          totalEmissiveRadiance += rimColor * pow( rimF, 2.2 ) * rimStrength;`,
        );
    };
    m.customProgramCacheKey = () => 'rim';
    cache.set(key, m);
  }
  return m;
}

// ─── animated materials (candle flicker etc.) ────────────────────────────────
const flickerList = [];

/** Flame material whose glow flickers; animated once per frame by <Flicker/>. */
export function FlameM(color = '#ffcf6b', glow = '#ffae3b', base = 2.4) {
  const key = `flame|${color}|${glow}|${base}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({ color, emissive: glow, emissiveIntensity: base, flatShading: true });
    m.userData.base = base;
    m.userData.seed = flickerList.length * 1.7;
    flickerList.push(m);
    cache.set(key, m);
  }
  return m;
}

export function flickerMaterials(t) {
  for (const m of flickerList) {
    const s = m.userData.seed;
    m.emissiveIntensity = m.userData.base * (0.82 + Math.sin(t * 11 + s) * 0.08 + Math.sin(t * 23.3 + s * 2) * 0.06
      + Math.sin(t * 3.1 + s) * 0.06);
  }
}

// ─── meshes ──────────────────────────────────────────────────────────────────
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

export function Rock({ p = [0, 0, 0], rad = 0.5, sc, r, c, mat, cast = true, detail = 0, ...rest }) {
  return (
    <mesh position={p} rotation={r} scale={sc} material={mat ?? M(c)} castShadow={cast} receiveShadow {...rest}>
      <icosahedronGeometry args={[rad, detail]} />
    </mesh>
  );
}

export function Torus({ p = [0, 0, 0], rad = 0.2, tube = 0.04, seg = 8, arc = Math.PI * 2, r, c, mat, cast = true, ...rest }) {
  return (
    <mesh position={p} rotation={r} material={mat ?? M(c)} castShadow={cast} {...rest}>
      <torusGeometry args={[rad, tube, 5, seg, arc]} />
    </mesh>
  );
}

/** Flat halo sprite lying on the ground or facing up (additive). */
export function Halo({ p = [0, 0, 0], size = 1, color = '#ffb347', opacity = 0.5, r = [-Math.PI / 2, 0, 0] }) {
  return (
    <mesh position={p} rotation={r} material={Glow(color, opacity)} renderOrder={2}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}

/** Soft contact shadow disc. */
export function Blob({ p = [0, 0.02, 0], size = 0.9 }) {
  return (
    <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} material={SHADOW_BLOB} renderOrder={1}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}

/** Deterministic pseudo random so decorations never jump between renders. */
export function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
