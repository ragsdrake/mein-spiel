/**
 * Render styles for the style study. Every part of a model asks the active
 * style for its material; toon styles additionally draw an ink outline
 * (inverted hull pushed out along the normals).
 */

import { createContext, useContext } from 'react';
import {
  BackSide, Color, DataTexture, MeshPhysicalMaterial, MeshStandardMaterial, MeshToonMaterial,
  NearestFilter, RedFormat, ShaderMaterial,
} from 'three';

function gradientMap(steps) {
  const data = new Uint8Array(steps.map(v => Math.round(v * 255)));
  const t = new DataTexture(data, steps.length, 1, RedFormat);
  t.minFilter = t.magFilter = NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

const TOON3 = gradientMap([0.45, 0.78, 1]);
const TOON2 = gradientMap([0.62, 1]);

export const STYLES = {
  lowpoly: {
    id: 'lowpoly',
    name: 'A · Low-Poly (aktuell)',
    note: 'Facettiert, flach schattiert',
    outline: 0,
  },
  soft: {
    id: 'soft',
    name: 'B · Soft 3D',
    note: 'Rund, weich beleuchtet, Clay/Pixar-Richtung',
    outline: 0,
  },
  toon: {
    id: 'toon',
    name: 'C · Chibi-Toon',
    note: 'Cel-Shading + feine Kontur (Genre-Standard)',
    outline: 0.018,
  },
  ink: {
    id: 'ink',
    name: 'D · Cartoon-Ink',
    note: 'Harte Schatten, dicke Kontur (Jetpack-Richtung)',
    outline: 0.04,
  },
};

const cache = new Map();

/** Material for `color` in style `sid`. `glow` makes it emissive. */
export function styleMat(sid, color, { glow, rough = 0.6, opacity } = {}) {
  const key = `${sid}|${color}|${glow}|${rough}|${opacity}`;
  let m = cache.get(key);
  if (m) return m;
  const common = { color, transparent: opacity != null, opacity: opacity ?? 1 };
  if (glow) Object.assign(common, { emissive: glow, emissiveIntensity: 1.2 });
  if (sid === 'toon') m = new MeshToonMaterial({ ...common, gradientMap: TOON3 });
  else if (sid === 'ink') m = new MeshToonMaterial({ ...common, gradientMap: TOON2 });
  else if (sid === 'soft') {
    m = new MeshPhysicalMaterial({
      ...common, roughness: rough, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.4,
      sheenColor: new Color(color).lerp(new Color('#ffffff'), 0.5),
    });
  } else m = new MeshStandardMaterial({ ...common, roughness: 0.85, flatShading: true });
  cache.set(key, m);
  return m;
}

const outlineCache = new Map();

/** Solid-colour hull pushed outward along the normals, back faces only. */
export function outlineMat(thickness, color = '#1a1024') {
  const key = `${thickness}|${color}`;
  let m = outlineCache.get(key);
  if (m) return m;
  m = new ShaderMaterial({
    uniforms: { thickness: { value: thickness }, color: { value: new Color(color) } },
    vertexShader: `
      uniform float thickness;
      void main() {
        vec3 p = position + normal * thickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
    side: BackSide,
  });
  outlineCache.set(key, m);
  return m;
}

export const StyleContext = createContext(STYLES.toon);
export const useStyle = () => useContext(StyleContext);

/** Segment counts: smooth styles get round silhouettes, low-poly stays faceted. */
export const seg = (sid, lo, hi) => (sid === 'lowpoly' ? lo : hi);
