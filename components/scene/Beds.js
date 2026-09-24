/**
 * One bed per hotel theme. Beds lie along x, centred at the origin, 1.9 long.
 * Higher room levels add finer materials and trims.
 */

import { useMemo } from 'react';
import { ExtrudeGeometry, Shape } from 'three';
import { GOLD } from './Props';
import { Ball, Box, Cyl, M, RimM } from './primitives';

function coffinGeometry(scale, depth) {
  const s = new Shape();
  const pts = [[-0.95, -0.2], [-0.45, -0.38], [0.95, -0.24], [0.95, 0.24], [-0.45, 0.38], [-0.95, 0.2]];
  s.moveTo(pts[0][0] * scale, pts[0][1] * scale);
  pts.slice(1).forEach(([x, y]) => s.lineTo(x * scale, y * scale));
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 });
  g.rotateX(-Math.PI / 2);
  return g;
}

function useCoffinGeos() {
  return useMemo(() => ({ outer: coffinGeometry(1, 0.42), inner: coffinGeometry(0.86, 0.02), lid: coffinGeometry(1, 0.08) }), []);
}

function Coffin({ level }) {
  const g = useCoffinGeos();
  const wood = level >= 7 ? '#2b1a33' : '#4a2a1e';
  return (
    <group>
      <mesh geometry={g.outer} material={M(wood, { tx: 'planks', rx: 2, bump: 1 })} castShadow receiveShadow />
      <mesh geometry={g.inner} position={[0, 0.41, 0]} material={M(level >= 4 ? '#9b3fc0' : '#7a3a8f', { tx: 'fabric' })} />
      <Box p={[-0.62, 0.47, 0]} s={[0.26, 0.1, 0.4]} mat={M('#efe4f5', { tx: 'fabric' })} />
      {level >= 7 && <Box p={[0, 0.425, 0]} s={[1.9, 0.02, 0.05]} mat={GOLD()} />}
    </group>
  );
}

function VampireCoffin({ level }) {
  const g = useCoffinGeos();
  return (
    <group>
      <mesh geometry={g.outer} material={M('#141016', { rough: 0.25, metal: 0.2 })} castShadow receiveShadow />
      <mesh geometry={g.inner} position={[0, 0.41, 0]} material={M('#a3122e', { tx: 'fabric', rough: 0.5 })} />
      <Box p={[-0.62, 0.47, 0]} s={[0.26, 0.1, 0.4]} mat={M('#c21a3a', { tx: 'fabric' })} />
      {/* open lid leaning against the wall */}
      <mesh geometry={g.lid} position={[0.1, 0.85, -0.55]} rotation={[1.25, 0, 0]} material={M('#141016', { rough: 0.25, metal: 0.2 })} castShadow />
      {[-0.5, 0.2, 0.7].map(x => (
        <Box key={x} p={[x, 0.22, 0.34]} s={[0.14, 0.05, 0.04]} mat={level >= 4 ? GOLD() : M('#6a6070', { metal: 0.6 })} />
      ))}
      {level >= 7 && <Ball p={[0.95, 0.5, 0]} rad={0.08} w={6} hs={4} mat={M('#ff2a4a', { emissive: '#ff0022', intensity: 1.5 })} />}
    </group>
  );
}

function Sarcophagus({ level }) {
  const gold = level >= 4 ? GOLD() : M('#c9a14a', { metal: 0.5, rough: 0.45 });
  const teal = M('#1f7d82', { metal: 0.3, rough: 0.4 });
  return (
    <group>
      <Box p={[0, 0.22, 0]} s={[1.9, 0.44, 0.7]} mat={M('#d9b77a', { tx: 'sandstone', bump: 1.2 })} />
      <Box p={[0, 0.5, 0]} s={[1.85, 0.14, 0.62]} mat={gold} />
      {/* painted lid stripes + face */}
      {[-0.5, -0.2, 0.1, 0.4, 0.7].map(x => (
        <Box key={x} p={[x, 0.58, 0]} s={[0.1, 0.03, 0.6]} mat={teal} cast={false} />
      ))}
      <Box p={[-0.72, 0.62, 0]} s={[0.36, 0.1, 0.44]} mat={gold} />
      <Ball p={[-0.72, 0.68, 0]} rad={0.16} w={7} hs={5} sc={[0.8, 0.6, 1]} mat={gold} />
      <Box p={[-0.6, 0.72, 0.08]} s={[0.04, 0.03, 0.06]} c="#1b1026" cast={false} />
      <Box p={[-0.6, 0.72, -0.08]} s={[0.04, 0.03, 0.06]} c="#1b1026" cast={false} />
      {level >= 7 && [-0.35, 0.35].map(z => (
        <Ball key={z} p={[0.9, 0.62, z]} rad={0.07} w={6} hs={4} mat={M('#3fe0e0', { emissive: '#1fb0b0', intensity: 1.4 })} />
      ))}
    </group>
  );
}

function IceBed({ level }) {
  const ice = RimM('#bfe8ff', '#6fdcff', { strength: 0.9, intensity: 0.15, opacity: 0.88, rough: 0.15 });
  return (
    <group>
      <Box p={[0, 0.22, 0]} s={[1.9, 0.44, 0.8]} mat={ice} />
      <Box p={[0.1, 0.48, 0]} s={[1.6, 0.1, 0.78]} mat={M(level >= 4 ? '#f2ece4' : '#b08a6a', { tx: 'fabric' })} />
      <Box p={[0.3, 0.55, 0]} s={[1.1, 0.06, 0.82]} mat={M(level >= 4 ? '#6a8ac0' : '#8a5a3a', { tx: 'fabric' })} />
      <Box p={[-0.72, 0.56, 0]} s={[0.3, 0.12, 0.5]} mat={M('#ffffff', { tx: 'fabric' })} />
      <Box p={[-0.98, 0.6, 0]} s={[0.12, 0.8, 0.86]} mat={ice} />
      {level >= 7 && <Cyl p={[-0.98, 1.08, 0]} rt={0.02} rb={0.1} h={0.25} seg={5} mat={ice} />}
    </group>
  );
}

const BEDS = { coffin: Coffin, vampireCoffin: VampireCoffin, sarcophagus: Sarcophagus, iceBed: IceBed };

export default function Bed({ kind, level }) {
  const C = BEDS[kind] ?? Coffin;
  return <C level={level} />;
}
