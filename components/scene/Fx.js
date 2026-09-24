/**
 * One-shot particle bursts (see game/fx.js): confetti after a build, dust
 * when something lands, fireworks for star-ups and coin fountains. Each
 * burst is a single instanced mesh that removes itself when it is done,
 * plus <EventFx/>, which turns game events into bursts.
 */

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BoxGeometry, Color, DynamicDrawUsage, MeshBasicMaterial, Object3D, OctahedronGeometry } from 'three';
import { P } from '../../game/config';
import { burst, useFx } from '../../game/fx';
import { useSim } from '../../game/sim';
import useHotel from '../../game/store';

const CONFETTI = ['#ff4f6d', '#ffc31a', '#2ecc5a', '#2f9be8', '#a86af0', '#ffffff', '#ff8a1a'];

/** Per-kind setup: count, geometry, colours, initial velocity, gravity, life. */
const KINDS = {
  confetti: { n: 46, geo: 'flake', size: 0.12, colors: CONFETTI, life: 1.8, g: 7, drag: 1.6,
    v: (r) => [(r() - 0.5) * 5, 4 + r() * 4.5, (r() - 0.5) * 5] },
  sparkle:  { n: 22, geo: 'gem', size: 0.1, colors: ['#ffffff', '#fff1a0', '#9ff0ff'], life: 1.1, g: 2, drag: 2.5,
    v: (r) => [(r() - 0.5) * 4, 1.5 + r() * 3, (r() - 0.5) * 4] },
  dust:     { n: 16, geo: 'gem', size: 0.35, colors: ['#efe6d8', '#d9cfc0', '#ffffff'], life: 1.0, g: -0.5, drag: 3.5, grow: 1.8,
    v: (r) => { const a = r() * Math.PI * 2; return [Math.cos(a) * 3, 0.4 + r(), Math.sin(a) * 3]; } },
  firework: { n: 60, geo: 'gem', size: 0.14, colors: null, life: 1.9, g: 2.2, drag: 1.2,
    v: (r) => {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, s = 5.5 + r() * 1.2, q = Math.sqrt(1 - u * u);
      return [Math.cos(a) * q * s, u * s, Math.sin(a) * q * s];
    } },
  coins:    { n: 26, geo: 'coin', size: 0.2, colors: ['#ffc31a', '#ffd84a', '#f09a00'], life: 1.8, g: 9, drag: 0.6,
    v: (r) => [(r() - 0.5) * 3, 6 + r() * 3, (r() - 0.5) * 3] },
};

const GEOS = {
  flake: new BoxGeometry(1, 0.15, 0.6),
  gem:   new OctahedronGeometry(0.6, 0),
  coin:  new BoxGeometry(1, 0.25, 1),
};

let seed = 1;
const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const dummy = new Object3D();
const tmpColor = new Color();

function Burst({ id, kind, pos, delay = 0 }) {
  const spec = KINDS[kind] ?? KINDS.confetti;
  const mesh = useRef();
  const remove = useFx(s => s.remove);
  const t = useRef(-delay);
  const parts = useMemo(() => {
    // fireworks get one random hue family per rocket
    const hue = CONFETTI[Math.floor(rng() * 5)];
    return Array.from({ length: spec.n }, () => ({
      p: [...pos], v: spec.v(rng), rot: [rng() * 6, rng() * 6, rng() * 6], spin: (rng() - 0.5) * 14,
      color: spec.colors ? spec.colors[Math.floor(rng() * spec.colors.length)] : (rng() < 0.75 ? hue : '#ffffff'),
    }));
  }, [spec, pos]);
  const material = useMemo(() => new MeshBasicMaterial({ transparent: true, depthWrite: false }), []);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    if (!mesh.current) return;
    mesh.current.instanceMatrix.setUsage(DynamicDrawUsage);
    parts.forEach((q, i) => mesh.current.setColorAt(i, tmpColor.set(q.color)));
    mesh.current.instanceColor.needsUpdate = true;
    material.needsUpdate = true;
  }, [parts, material]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    t.current += dt;
    const m = mesh.current;
    if (!m) return;
    if (t.current < 0) { m.visible = false; return; }
    m.visible = true;
    const k = t.current / spec.life;
    if (k >= 1) { remove(id); return; }
    const damp = Math.exp(-spec.drag * dt);
    parts.forEach((q, i) => {
      q.v[0] *= damp; q.v[2] *= damp;
      q.v[1] = q.v[1] * damp - spec.g * dt;
      q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt;
      if (kind !== 'firework' && q.p[1] < 0.05) { q.p[1] = 0.05; q.v[1] = Math.abs(q.v[1]) * 0.3; }
      q.rot[0] += q.spin * dt; q.rot[2] += q.spin * 0.7 * dt;
      dummy.position.set(q.p[0], q.p[1], q.p[2]);
      dummy.rotation.set(q.rot[0], q.rot[1], q.rot[2]);
      dummy.scale.setScalar(spec.size * (1 + (spec.grow ?? 0) * k) * (k > 0.75 ? (1 - k) / 0.25 : 1));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    material.opacity = kind === 'dust' ? 0.8 * (1 - k) : 1;
  });

  return (
    <instancedMesh ref={mesh} args={[GEOS[spec.geo], material, spec.n]} frustumCulled={false} renderOrder={6} visible={false} />
  );
}

/** Renders every active burst. */
export function FxLayer() {
  const items = useFx(s => s.items);
  return items.map(f => <Burst key={f.id} {...f} />);
}

/** Game events → celebrations in the 3D world. */
export function EventFx() {
  const starUp = useHotel(s => s.starUp);
  const active = useHotel(s => s.activeHotel);
  const summary = useSim(s => s.nightSummary);

  useEffect(() => {
    if (!starUp || starUp.hotel !== active) return;
    // fireworks over the hotel, then confetti on the lobby
    [[4, 9, 3], [10, 10, 2], [7, 11, 6], [2, 8.5, 8], [12, 9.5, 7]].forEach((p, i) => burst('firework', p, 0.25 + i * 0.35));
    burst('confetti', [8, 1.5, 9], 0.2);
    burst('confetti', [5, 1.5, 6], 0.6);
  }, [starUp, active]);

  useEffect(() => {
    if (!summary) return;
    burst('coins', [P.reception[0] + 0.6, 1.4, P.reception[1]]);
    burst('coins', [P.bar[0], 1.4, P.bar[1] + 1], 0.3);
  }, [summary]);

  return null;
}
