/**
 * Atmosphere: themed particles (wisps, embers, sand, snow), indoor dust motes,
 * drifting ground fog and a flock of bats at Burg Dracula.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, MeshBasicMaterial, PointsMaterial,
} from 'three';
import { Ball, Box } from './primitives';
import { tex } from './textures';
import { useTheme } from './theme';

/**
 * kind → spawn box [x0, x1, y0, y1, z0, z1], velocity, colours, size (px).
 */
const KINDS = {
  wisps:  { box: [-2, 20, 0, 4, -2, 20], vel: [0, 0.15, 0], wobble: 0.6, colors: ['#6dff9e', '#c58bff', '#8fe3ff'], size: 7, count: 60 },
  embers: { box: [-4, 20, -1, 6, -4, 20], vel: [0.1, 0.5, 0], wobble: 0.3, colors: ['#ff4a2a', '#ffb347', '#ff2a4a'], size: 5, count: 70 },
  sand:   { box: [-6, 22, 0, 5, -4, 22], vel: [1.4, 0.05, 0.4], wobble: 0.2, colors: ['#e0a050', '#c08040', '#ffcf6b'], size: 3, count: 70 },
  snow:   { box: [-6, 22, 0, 12, -6, 22], vel: [0.25, -0.9, 0.1], wobble: 0.35, colors: ['#ffffff', '#dff4ff', '#bfe8ff'], size: 5, count: 180 },
  dust:   { box: [1, 13, 0.3, 3.2, 1, 11], vel: [0.02, 0.04, 0], wobble: 0.15, colors: ['#ffd9a0', '#ffe8c0'], size: 3, count: 50 },
};

const THEME_KIND = { wisps: 'wisps', bats: 'embers', sand: 'sand', snow: 'snow' };

function Field({ kind, density }) {
  const cfg = KINDS[kind];
  const { gl } = useThree();
  const count = Math.round(cfg.count * density);
  const { geom, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sd = new Float32Array(count);
    const c = new Color();
    const [x0, x1, y0, y1, z0, z1] = cfg.box;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = x0 + Math.random() * (x1 - x0);
      pos[i * 3 + 1] = y0 + Math.random() * (y1 - y0);
      pos[i * 3 + 2] = z0 + Math.random() * (z1 - z0);
      c.set(cfg.colors[i % cfg.colors.length]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      sd[i] = Math.random() * 100;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('color', new BufferAttribute(col, 3));
    return { geom: g, seeds: sd };
  }, [cfg, count]);

  const mat = useMemo(() => new PointsMaterial({
    size: cfg.size * Math.min(2, gl.getPixelRatio()),
    sizeAttenuation: false,
    map: tex('radial'),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    opacity: 0.9,
  }), [cfg, gl]);

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.1);
    const pos = geom.attributes.position.array;
    const [x0, x1, y0, y1, z0, z1] = cfg.box;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      pos[i * 3] += (cfg.vel[0] + Math.sin(t * 0.7 + s) * cfg.wobble) * d;
      pos[i * 3 + 1] += (cfg.vel[1] + Math.cos(t * 0.9 + s) * cfg.wobble * 0.5) * d;
      pos[i * 3 + 2] += (cfg.vel[2] + Math.cos(t * 0.6 + s * 1.3) * cfg.wobble) * d;
      if (pos[i * 3] > x1) pos[i * 3] = x0;
      if (pos[i * 3] < x0) pos[i * 3] = x1;
      if (pos[i * 3 + 1] > y1) pos[i * 3 + 1] = y0;
      if (pos[i * 3 + 1] < y0) pos[i * 3 + 1] = y1;
      if (pos[i * 3 + 2] > z1) pos[i * 3 + 2] = z0;
      if (pos[i * 3 + 2] < z0) pos[i * 3 + 2] = z1;
    }
    geom.attributes.position.needsUpdate = true;
  });

  return <points geometry={geom} material={mat} frustumCulled={false} renderOrder={4} />;
}

/** Big soft fog sheets drifting over the garden. */
function GroundFog({ color, opacity }) {
  const group = useRef();
  const mat = useMemo(() => new MeshBasicMaterial({
    color, map: tex('fog'), transparent: true, opacity, depthWrite: false,
  }), [color, opacity]);
  const sheets = useMemo(() => [
    [3, 15, 9], [10, 18, 11], [17, 10, 9], [-2, 8, 10], [7, 21, 12], [16, 1, 8],
  ], []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((m, i) => {
      const [x, z] = sheets[i];
      m.position.x = x + Math.sin(clock.elapsedTime * 0.07 + i) * 2;
      m.position.z = z + Math.cos(clock.elapsedTime * 0.05 + i * 2) * 1.5;
      m.rotation.z = clock.elapsedTime * 0.02 * (i % 2 ? 1 : -1);
    });
  });
  return (
    <group ref={group}>
      {sheets.map(([x, z, s], i) => (
        <mesh key={i} position={[x, -0.35 + (i % 3) * 0.12, z]} rotation={[-Math.PI / 2, 0, 0]} material={mat} renderOrder={2}>
          <planeGeometry args={[s, s]} />
        </mesh>
      ))}
    </group>
  );
}

function BatFlock({ count }) {
  const group = useRef();
  const bats = useMemo(() => Array.from({ length: count }, (_, i) => ({
    cx: [-3, 7, 16.8][i % 3], cz: [-3, -4.2, -2.6][i % 3], r: 2 + (i % 4) * 0.7, h: 10 + (i % 5), speed: 0.6 + (i % 3) * 0.3, ph: i,
  })), [count]);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((b, i) => {
      const d = bats[i];
      const a = t * d.speed + d.ph;
      b.position.set(d.cx + Math.cos(a) * d.r, d.h + Math.sin(t * 2 + d.ph) * 0.5, d.cz + Math.sin(a) * d.r);
      b.rotation.y = -a;
      const flap = Math.sin(t * 18 + d.ph) * 0.8;
      b.children[1].rotation.z = flap;
      b.children[2].rotation.z = -flap;
    });
  });
  return (
    <group ref={group}>
      {bats.map((_, i) => (
        <group key={i}>
          <Ball rad={0.14} w={5} hs={4} c="#140c12" cast={false} />
          <group><Box p={[0.25, 0, 0]} s={[0.4, 0.02, 0.18]} c="#140c12" cast={false} /></group>
          <group><Box p={[-0.25, 0, 0]} s={[0.4, 0.02, 0.18]} c="#140c12" cast={false} /></group>
        </group>
      ))}
    </group>
  );
}

export default function Particles({ density = 1 }) {
  const { palette } = useTheme();
  if (density <= 0) return null;
  return (
    <group>
      <Field kind={THEME_KIND[palette.particles] ?? 'wisps'} density={density} />
      <Field kind="dust" density={density} />
      <GroundFog
        color={palette.particles === 'sand' ? '#c0a070' : palette.particles === 'snow' ? '#9fc4e0' : '#9888d8'}
        opacity={palette.particles === 'snow' ? 0.12 : 0.2}
      />
      {palette.particles === 'bats' && <BatFlock count={Math.round(12 * density)} />}
    </group>
  );
}
