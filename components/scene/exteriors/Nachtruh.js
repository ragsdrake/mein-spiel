/** Spukhotel Nachtruh — graveyard garden, crooked tower, cauldron bar. */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Candelabra, GOLD } from '../Props';
import { Ball, Blob, Box, Cone, Cyl, M, RimM, Sprite } from '../primitives';
import {
  Bush, DeadTree, Fence, Floaty, GardenPath, Gravestone, Ground, Hill, PoleTorch, Pumpkin, Tower,
} from './common';

const SLIME = () => M('#7dff7a', { emissive: '#35e05a', intensity: 1.8 });

function Outside() {
  return (
    <group>
      <Ground />
      <GardenPath />
      {/* crooked hotel tower + hills behind the building */}
      <Tower p={[-3.2, -0.5, -3]} h={9} rad={1.8} roof="#4a2a5a" wall="#6d6380" glow="#c58bff" />
      <Tower p={[16.5, -0.5, -2.5]} h={6} rad={1.2} roof="#4a2a5a" wall="#6d6380" glow="#ffb347" />
      <Hill p={[-8, -1.5, 6]} s={[5, 3, 9]} color="#1f3326" />
      <Hill p={[6, -1.8, -8]} s={[12, 3.5, 4]} color="#1f3326" />
      <Hill p={[22, -1.5, 8]} s={[5, 2.5, 10]} color="#1f3326" />

      <Gravestone p={[2, -0.5, 14]} r={0.2} />
      <Gravestone p={[4.2, -0.5, 15.6]} r={-0.1} kind={2} />
      <Gravestone p={[6.6, -0.5, 14.2]} r={0.1} kind={1} />
      <Gravestone p={[10, -0.5, 17.6]} r={-0.3} />
      <Gravestone p={[1.2, -0.5, 17.4]} r={0.4} kind={2} />
      <Gravestone p={[16.2, -0.5, 6.5]} r={-1.4} kind={1} />
      <Gravestone p={[17.4, -0.5, 12.5]} r={-1.7} />
      <Pumpkin p={[10.6, -0.5, 13.6]} />
      <Pumpkin p={[15.2, -0.5, 12.6]} s={1.3} />
      <Pumpkin p={[15.6, -0.5, 3.5]} s={0.9} />
      <Pumpkin p={[5.5, -0.5, 17.2]} s={1.1} />
      <DeadTree p={[16.8, -0.5, 1]} s={1.3} />
      <DeadTree p={[0, -0.5, 20]} s={1.1} />
      <DeadTree p={[18, -0.5, 16.5]} />
      <Bush p={[9.2, -0.5, 13.6]} s={0.9} />
      <Bush p={[15.3, -0.5, 15]} s={1.1} color="#35603f" />
      <Bush p={[0.4, -0.5, 13.4]} s={1.2} />
      <Fence from={[-1, 19.6]} to={[11.6, 19.6]} count={13} />
      <PoleTorch p={[11.4, -0.5, 14]} />
      <PoleTorch p={[14.4, -0.5, 17.5]} />
      {/* well */}
      <group position={[17.4, -0.5, 5.6]}>
        <Cyl p={[0, 0.35, 0]} rt={0.6} h={0.7} seg={10} mat={M('#8e889a', { tx: 'bricks', rx: 3, bump: 2 })} />
        <Cyl p={[0, 0.66, 0]} rt={0.48} h={0.05} seg={10} mat={SLIME()} cast={false} />
        <Sprite p={[0, 0.8, 0]} size={2} color="#35e05a" opacity={0.3} />
        <Box p={[0.55, 1.1, 0]} s={[0.1, 1.2, 0.1]} c="#5c2f1d" />
        <Box p={[-0.55, 1.1, 0]} s={[0.1, 1.2, 0.1]} c="#5c2f1d" />
        <Cone p={[0, 1.9, 0]} rad={0.85} h={0.5} seg={4} r={[0, Math.PI / 4, 0]} mat={M('#d0662f', { tx: 'tiles', bump: 1 })} />
        <Blob size={2} />
      </group>
    </group>
  );
}

function BarPiece() {
  const bubbles = useRef();
  useFrame(({ clock }) => {
    if (!bubbles.current) return;
    bubbles.current.children.forEach((b, i) => {
      const t = (clock.elapsedTime * 0.8 + i * 0.33) % 1;
      b.position.y = 0.8 + t * 0.6;
      b.scale.setScalar(1 - t);
    });
  });
  return (
    <group position={[8.4, 0, 4.3]}>
      <Ball p={[0, 0.45, 0]} rad={0.5} w={12} hs={8} sc={[1, 0.8, 1]} mat={M('#26222b', { metal: 0.5, rough: 0.4, smooth: true })} />
      <Cyl p={[0, 0.8, 0]} rt={0.4} h={0.05} seg={12} mat={SLIME()} cast={false} />
      <group ref={bubbles}>
        {[0, 1, 2].map(i => (
          <Ball key={i} p={[(i - 1) * 0.15, 0.8, (i % 2) * 0.1]} rad={0.07} w={6} hs={4} mat={SLIME()} cast={false} />
        ))}
      </group>
      <Sprite p={[0, 1.0, 0]} size={2.4} color="#35e05a" opacity={0.45} />
      <Box p={[0, 0.06, 0]} s={[0.6, 0.12, 0.6]} r={[0, 0.5, 0]} mat={M('#ff7a2e', { emissive: '#ff5a00', intensity: 2 })} cast={false} />
    </group>
  );
}

function LoungePiece() {
  return (
    <group position={[1.1, 0, 10.9]}>
      <Box p={[0, 0.55, 0]} s={[1.0, 1.1, 2.0]} mat={M('#1f1626', { rough: 0.2, metal: 0.2 })} />
      <Box p={[0.55, 0.78, 0]} s={[0.35, 0.06, 1.8]} mat={M('#f2eee6', { rough: 0.3 })} />
      {[-0.7, -0.35, 0, 0.35, 0.7].map(z => (
        <Box key={z} p={[0.6, 0.82, z]} s={[0.2, 0.04, 0.08]} c="#1b1026" cast={false} />
      ))}
      <Candelabra p={[0, 1.1, -0.6]} />
    </group>
  );
}

// ─── attractions ─────────────────────────────────────────────────────────────
function PumpkinPatch({ level }) {
  const spots = [[0, 0, 1.2], [-0.8, 0.4, 1], [0.8, -0.3, 0.9], [-0.3, -0.9, 1.1], [0.9, 0.8, 0.8], [-1, -0.6, 0.9]];
  return (
    <group>
      <Box p={[0, 0.05, 0]} s={[3, 0.1, 2.6]} mat={M('#4a2e22', { tx: 'grass', bump: 2 })} />
      {spots.slice(0, 2 + Math.floor(level * 1.4)).map(([x, z, s], i) => <Pumpkin key={i} p={[x, 0.1, z]} s={s} />)}
    </group>
  );
}

function Organ({ level }) {
  const pipes = [0.9, 1.3, 1.7, 2.1, 1.7, 1.3, 0.9];
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <Box p={[0, 0.6, 0]} s={[2.4, 1.2, 0.9]} mat={M('#3a1f2a', { tx: 'planks', bump: 1 })} />
      {pipes.map((h, i) => (
        <Cyl key={i} p={[(i - 3) * 0.32, 1.2 + h * (0.8 + level * 0.1) / 2, -0.2]} rt={0.12} h={h * (0.8 + level * 0.1)} seg={8} mat={GOLD()} />
      ))}
      <Box p={[0, 0.95, 0.45]} s={[1.8, 0.08, 0.3]} mat={M('#f2eee6')} />
      <Sprite p={[0, 2.4, 0]} size={3} color="#c58bff" opacity={0.3} />
      <Blob size={3.2} />
    </group>
  );
}

function WispFountain({ level }) {
  return (
    <group>
      <Cyl p={[0, 0.25, 0]} rt={1.1} rb={1.2} h={0.5} seg={12} mat={M('#8e889a', { tx: 'bricks', rx: 4, bump: 2 })} />
      <Cyl p={[0, 0.5, 0]} rt={0.95} h={0.04} seg={12} mat={M('#6ff7ff', { emissive: '#35c0e0', intensity: 1.4, opacity: 0.8 })} cast={false} />
      <Cyl p={[0, 0.9, 0]} rt={0.15} h={0.8} seg={8} mat={M('#8e889a', { tx: 'stone', bump: 2 })} />
      {Array.from({ length: 1 + level }, (_, i) => (
        <Floaty key={i} p={[Math.sin(i * 2.1) * 0.6, 1.4 + i * 0.3, Math.cos(i * 2.1) * 0.6]} amp={0.25} speed={1.2 + i * 0.3}>
          <Ball rad={0.1} w={6} hs={4} mat={RimM('#d8fff4', '#6dff9e', { intensity: 1.5 })} cast={false} />
          <Sprite size={0.9} color="#6dff9e" opacity={0.55} />
        </Floaty>
      ))}
      <Blob size={3} />
    </group>
  );
}

export default {
  Outside,
  BarPiece,
  LoungePiece,
  WallTop: null,
  attractions: [PumpkinPatch, Organ, WispFountain],
};
