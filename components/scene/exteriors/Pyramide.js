/** Pharaonengrab — giant pyramid, palms, the Nile, obelisks and gold. */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Flame, GOLD } from '../Props';
import { Ball, Blob, Box, Cone, Cyl, M, Rock, Sprite } from '../primitives';
import { Floaty, GardenPath, Ground, PoleTorch } from './common';

const SAND = '#d9b77a';
const TEAL = () => M('#1f7d82', { metal: 0.3, rough: 0.35 });

function Pyramid({ p, s = 10 }) {
  return (
    <group position={p}>
      <Cone p={[0, s * 0.45, 0]} rad={s} h={s * 0.9} seg={4} r={[0, Math.PI / 4, 0]}
        mat={M(SAND, { tx: 'sandstone', rx: 6, ry: 6, bump: 2 })} />
      <Cone p={[0, s * 0.83, 0]} rad={s * 0.14} h={s * 0.13} seg={4} r={[0, Math.PI / 4, 0]} mat={GOLD()} />
      <Sprite p={[0, s * 0.9, 0]} size={4} color="#ffd36b" opacity={0.35} />
    </group>
  );
}

export function Palm({ p, s = 1, r = 0 }) {
  const trunk = M('#8a6a3a', { tx: 'planks', bump: 1.5 });
  const leaf = M('#3f7a3a');
  return (
    <group position={p} scale={s} rotation={[0, r, 0]}>
      {Array.from({ length: 6 }, (_, i) => (
        <Cyl key={i} p={[i * 0.06, 0.3 + i * 0.5, 0]} rt={0.14 - i * 0.01} rb={0.18 - i * 0.01} h={0.5} seg={6} r={[0, 0, -0.1]} mat={trunk} />
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <Box key={i} p={[0.35 + Math.sin(a) * 0.7, 3.1, Math.cos(a) * 0.7]} s={[0.35, 0.05, 1.5]}
            r={[0.5 * Math.cos(a), a, 0]} mat={leaf} />
        );
      })}
      <Ball p={[0.35, 3.05, 0]} rad={0.18} w={5} hs={4} c="#5a3a1a" />
      <Blob size={2.4} />
    </group>
  );
}

export function Obelisk({ p, h = 4, glow }) {
  return (
    <group position={p}>
      <Box p={[0, 0.2, 0]} s={[1, 0.4, 1]} mat={M(SAND, { tx: 'sandstone', bump: 2 })} />
      <Cyl p={[0, 0.4 + h / 2, 0]} rt={0.24} rb={0.36} h={h} seg={4} r={[0, Math.PI / 4, 0]}
        mat={M('#c9a26b', { tx: 'sandstone', rx: 1, ry: 3, bump: 2 })} />
      <Cone p={[0, 0.4 + h + 0.2, 0]} rad={0.33} h={0.4} seg={4} r={[0, Math.PI / 4, 0]}
        mat={glow ? M('#ffd36b', { emissive: '#ffb300', intensity: 2, metal: 0.8 }) : GOLD()} />
      {glow && <Sprite p={[0, 0.4 + h + 0.2, 0]} size={2.5} color="#ffc94a" opacity={0.5} />}
      {[0.3, 0.5, 0.7].map(f => (
        <Box key={f} p={[0, 0.4 + h * f, 0.26]} s={[0.12, 0.12, 0.02]} c="#3a2a14" cast={false} />
      ))}
      <Blob size={1.6} />
    </group>
  );
}

function Nile() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.35 + Math.sin(clock.elapsedTime * 0.8) * 0.08;
  });
  return (
    <mesh ref={ref} position={[4, -0.47, 30]} rotation={[-Math.PI / 2, 0, 0.12]}
      material={M('#2a6aa8', { emissive: '#1a4a8a', intensity: 0.35, rough: 0.05, metal: 0.4 })}>
      <planeGeometry args={[40, 3.5]} />
    </mesh>
  );
}

function Outside() {
  return (
    <group>
      <Ground />
      <GardenPath />
      <Pyramid p={[-6, -0.5, -7]} s={11} />
      <Pyramid p={[14, -0.5, -8]} s={6} />
      <Pyramid p={[-9, -0.5, 10]} s={5} />
      {[[20, 4, 1.2], [4, 23.5, 1.5], [9, 16.5, 0.8]].map(([x, z, s], i) => (
        <Rock key={i} p={[x, -0.9, z]} rad={2} sc={[s * 2, s * 0.5, s * 1.4]} mat={M(SAND, { tx: 'sand', bump: 1.5 })} detail={1} />
      ))}
      <Palm p={[16.5, -0.5, 8]} s={1.1} />
      <Palm p={[17.2, -0.5, 13.5]} s={0.9} r={1} />
      <Palm p={[1, -0.5, 18.5]} s={1.2} r={2} />
      <Palm p={[7.5, -0.5, 18.6]} s={0.95} r={3} />
      <Obelisk p={[11.2, -0.5, 14.2]} h={3} />
      <Obelisk p={[14.6, -0.5, 14.2]} h={3} />
      <PoleTorch p={[11.2, -0.5, 17.2]} />
      <PoleTorch p={[14.6, -0.5, 17.2]} />
      {/* broken statue head in the sand */}
      <group position={[3, -0.5, 14.4]} rotation={[0.2, 0.6, 0.3]}>
        <Box p={[0, 0.5, 0]} s={[1.1, 1, 0.9]} mat={M(SAND, { tx: 'sandstone', bump: 2 })} />
        <Box p={[0, 1.1, 0]} s={[1.4, 0.5, 1.1]} mat={TEAL()} />
        <Box p={[0, 0.5, 0.46]} s={[0.2, 0.3, 0.1]} mat={M(SAND, { tx: 'stone' })} />
      </group>
      <Nile />
    </group>
  );
}

/** Gold band and hieroglyph row along the wall tops. */
function WallTop() {
  const glyph = M('#3a2a14');
  return (
    <group>
      {Array.from({ length: 20 }, (_, i) => (
        <Box key={`b${i}`} p={[0.4 + i * 0.7, 2.95, 0.03]} s={[0.25, 0.3, 0.02]} r={[0, 0, (i % 3) * 0.3]} mat={glyph} cast={false} />
      ))}
      {Array.from({ length: 17 }, (_, i) => (
        <Box key={`l${i}`} p={[0.03, 2.95, 0.4 + i * 0.7]} s={[0.02, 0.3, 0.25]} r={[(i % 3) * 0.3, 0, 0]} mat={glyph} cast={false} />
      ))}
      <Box p={[7, 3.2, 0.03]} s={[14.3, 0.08, 0.04]} mat={TEAL()} cast={false} />
      <Box p={[0.03, 3.2, 6]} s={[0.04, 0.08, 12.3]} mat={TEAL()} cast={false} />
      {[[-0.15, -0.15], [14.15, -0.15], [-0.15, 12.15]].map(([x, z]) => (
        <Cone key={`${x}${z}`} p={[x, 3.9, z]} rad={0.45} h={0.7} seg={4} r={[0, Math.PI / 4, 0]} mat={GOLD()} />
      ))}
    </group>
  );
}

function BarPiece() {
  return (
    <group>
      {/* golden brazier */}
      <group position={[8.4, 0, 4.3]}>
        {[0, 2.1, 4.2].map(a => (
          <Box key={a} p={[Math.sin(a) * 0.25, 0.4, Math.cos(a) * 0.25]} s={[0.06, 0.8, 0.06]} r={[Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2]} mat={GOLD()} />
        ))}
        <Cyl p={[0, 0.85, 0]} rt={0.45} rb={0.25} h={0.25} seg={12} mat={GOLD()} />
        <Flame p={[0, 0.95, 0]} s={4} color="#ff9a2a" />
        <Sprite p={[0, 1.2, 0]} size={2.6} color="#ff9a2a" opacity={0.45} />
      </group>
      {/* amphorae */}
      {[[4.1, 5.0], [4.2, 5.8]].map(([x, z]) => (
        <group key={z} position={[x, 0, z]}>
          <Ball p={[0, 0.45, 0]} rad={0.3} w={10} hs={7} sc={[1, 1.4, 1]} mat={M('#b0603a', { rough: 0.6 })} />
          <Cyl p={[0, 0.95, 0]} rt={0.09} rb={0.13} h={0.25} seg={8} mat={M('#b0603a')} />
          <Box p={[0, 0.5, 0.29]} s={[0.4, 0.08, 0.02]} mat={TEAL()} cast={false} />
          <Blob size={0.9} />
        </group>
      ))}
    </group>
  );
}

function LoungePiece() {
  const black = M('#1a1418', { rough: 0.25, metal: 0.3 });
  return (
    <group position={[1.1, 0, 10.9]} rotation={[0, Math.PI / 2, 0]}>
      {/* Bastet statue */}
      <Box p={[0, 0.3, 0]} s={[1.1, 0.6, 1.1]} mat={M(SAND, { tx: 'sandstone', bump: 2 })} />
      <Ball p={[0, 1.0, 0]} rad={0.4} w={8} hs={6} sc={[0.9, 1.3, 1]} mat={black} />
      <Ball p={[0, 1.65, 0.1]} rad={0.25} w={8} hs={6} mat={black} />
      <Cone p={[0.14, 1.9, 0.08]} rad={0.08} h={0.25} seg={4} mat={black} />
      <Cone p={[-0.14, 1.9, 0.08]} rad={0.08} h={0.25} seg={4} mat={black} />
      <Cyl p={[0, 1.42, 0.08]} rt={0.24} h={0.08} seg={10} mat={GOLD()} />
      <Ball p={[0.1, 1.7, 0.3]} rad={0.04} w={4} hs={3} mat={M('#3fe0e0', { emissive: '#1fb0b0', intensity: 2 })} />
      <Ball p={[-0.1, 1.7, 0.3]} rad={0.04} w={4} hs={3} mat={M('#3fe0e0', { emissive: '#1fb0b0', intensity: 2 })} />
      <Flame p={[0.45, 0.62, 0.45]} s={1.2} />
      <Flame p={[-0.45, 0.62, 0.45]} s={1.2} />
    </group>
  );
}

// ─── attractions ─────────────────────────────────────────────────────────────
function GoldenScarab({ level }) {
  return (
    <group>
      <Cyl p={[0, 0.3, 0]} rt={1} rb={1.1} h={0.6} seg={8} mat={M(SAND, { tx: 'sandstone', bump: 2 })} />
      <Floaty p={[0, 1.2, 0]} amp={0.12} speed={1.2} spin={0.6}>
        <Ball rad={0.5} w={10} hs={6} sc={[1, 0.55, 1.3]} mat={M('#ffd36b', { metal: 0.9, rough: 0.2, emissive: '#ff9d00', intensity: 0.2 + level * 0.2 })} />
        <Ball p={[0, 0, 0.6]} rad={0.22} w={8} hs={6} sc={[1, 0.6, 0.8]} mat={GOLD()} />
        <Box p={[0, 0.28, 0]} s={[0.03, 0.02, 1]} c="#6a4a10" cast={false} />
        <Sprite size={2 + level * 0.6} color="#ffc94a" opacity={0.4} />
      </Floaty>
      <Blob size={2.6} />
    </group>
  );
}

function EternalObelisk({ level }) {
  return <Obelisk h={3.5 + level} glow />;
}

function Sphinx({ level }) {
  const stone = M(SAND, { tx: 'sandstone', bump: 2 });
  return (
    <group rotation={[0, -Math.PI / 2, 0]} scale={0.8 + level * 0.12}>
      <Box p={[0, 0.3, 0]} s={[1.6, 0.6, 3]} mat={stone} />
      <Box p={[0, 0.9, -0.4]} s={[1.2, 0.8, 1.8]} mat={stone} />
      <Box p={[0.4, 0.35, 1.5]} s={[0.35, 0.3, 0.9]} mat={stone} />
      <Box p={[-0.4, 0.35, 1.5]} s={[0.35, 0.3, 0.9]} mat={stone} />
      <Box p={[0, 1.6, 0.6]} s={[0.8, 0.9, 0.7]} mat={stone} />
      <Box p={[0, 1.7, 0.5]} s={[1.3, 1.0, 0.5]} mat={TEAL()} />
      <Box p={[0, 1.55, 0.97]} s={[0.12, 0.2, 0.1]} mat={stone} />
      <Ball p={[0.18, 1.72, 0.96]} rad={0.05} w={4} hs={3} mat={M('#ffd36b', { emissive: '#ffb300', intensity: 2 })} />
      <Ball p={[-0.18, 1.72, 0.96]} rad={0.05} w={4} hs={3} mat={M('#ffd36b', { emissive: '#ffb300', intensity: 2 })} />
      <Blob size={3.6} />
    </group>
  );
}

export default {
  Outside,
  BarPiece,
  LoungePiece,
  WallTop,
  attractions: [GoldenScarab, EternalObelisk, Sphinx],
};

