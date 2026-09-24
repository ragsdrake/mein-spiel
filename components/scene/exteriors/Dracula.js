/** Burg Dracula — castle towers, battlements, blood fountain, throne. */

import { Candelabra, GOLD } from '../Props';
import { Ball, Blob, Box, Cone, Cyl, M, RimM, Rock, Sprite } from '../primitives';
import {
  Bush, DeadTree, Fence, Floaty, GardenPath, Gravestone, Ground, Hill, PoleTorch, Tower,
} from './common';

const CASTLE = '#b4acc0';
const ROOF = '#d0344a';
const BLOOD = () => M('#c0122a', { emissive: '#ff0a2a', intensity: 1.4, rough: 0.1 });

function Gargoyle({ p, r = 0 }) {
  const stone = M('#6a6474', { tx: 'stone', bump: 2 });
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.5, 0]} s={[0.6, 1, 0.6]} mat={M(CASTLE, { tx: 'bricks', bump: 2 })} />
      <Box p={[0, 1.2, 0]} s={[0.35, 0.4, 0.5]} mat={stone} />
      <Box p={[0, 1.45, 0.25]} s={[0.25, 0.22, 0.3]} mat={stone} />
      <Cone p={[0.1, 1.62, 0.2]} rad={0.05} h={0.16} seg={4} mat={stone} />
      <Cone p={[-0.1, 1.62, 0.2]} rad={0.05} h={0.16} seg={4} mat={stone} />
      <Box p={[0.35, 1.35, -0.1]} s={[0.4, 0.3, 0.05]} r={[0, 0.4, 0.5]} mat={stone} />
      <Box p={[-0.35, 1.35, -0.1]} s={[0.4, 0.3, 0.05]} r={[0, -0.4, -0.5]} mat={stone} />
      <Ball p={[0.07, 1.5, 0.4]} rad={0.03} w={4} hs={3} mat={M('#ff2a2a', { emissive: '#ff0000', intensity: 3 })} cast={false} />
      <Ball p={[-0.07, 1.5, 0.4]} rad={0.03} w={4} hs={3} mat={M('#ff2a2a', { emissive: '#ff0000', intensity: 3 })} cast={false} />
      <Blob size={1.2} />
    </group>
  );
}

function Outside({ wing = 0 }) {
  return (
    <group>
      <Ground />
      <GardenPath />
      {/* castle keep and towers towering behind the hotel */}
      <Tower p={[-3, -0.5, -3]} h={12} rad={2.2} roof={ROOF} wall={CASTLE} glow="#ff4a3a" />
      <Tower p={[7, -0.5, -4.2]} h={9} rad={1.5} roof={ROOF} wall={CASTLE} glow="#ff4a3a" crenel />
      <Tower p={[16.8, -0.5, -2.6]} h={10} rad={1.7} roof={ROOF} wall={CASTLE} glow="#ffb347" />
      <Tower p={[-7, -0.5, 0]} h={7} rad={1.4} roof={ROOF} wall={CASTLE} glow="#ff4a3a" crenel />
      <Box p={[1.8, 2.6, -4.2]} s={[9, 6.2, 1.2]} mat={M(CASTLE, { tx: 'bricks', rx: 5, ry: 3, bump: 2 })} />
      <Box p={[12, 2.6, -4.2]} s={[8, 6.2, 1.2]} mat={M(CASTLE, { tx: 'bricks', rx: 5, ry: 3, bump: 2 })} />
      <Hill p={[-9, -1.5, 4]} s={[6, 4, 12]} color="#6aa050" />
      <Hill p={[wing ? 26 : 23, -1.5, 6]} s={[6, 3.5, 12]} color="#6aa050" />

      <Gargoyle p={[11.2, -0.5, 13.2]} r={0.3} />
      <Gargoyle p={[14.6, -0.5, 13.2]} r={-0.3} />
      <Gravestone p={[2, -0.5, 14.4]} r={0.2} kind={2} color="#6a6474" />
      <Gravestone p={[5, -0.5, 15.8]} r={-0.1} color="#6a6474" />
      <Gravestone p={[7.2, -0.5, 14.3]} r={0.1} kind={1} color="#6a6474" />
      <Gravestone p={[17.2, -0.5, 12]} r={-1.5} color="#6a6474" />
      <DeadTree p={wing ? [22.6, -0.5, 1.5] : [17, -0.5, 1.5]} s={1.5} color="#5a3a30" />
      <DeadTree p={[0.5, -0.5, 19]} s={1.3} color="#5a3a30" />
      <DeadTree p={[17.5, -0.5, 16]} s={1.1} color="#5a3a30" />
      <Bush p={[9.4, -0.5, 14]} s={0.9} color="#3f8a44" flowers="#b3122e" />
      <Bush p={[16, -0.5, 8]} s={1.1} color="#3f8a44" flowers="#b3122e" />
      <Bush p={[0.5, -0.5, 13.6]} s={1.1} color="#3f8a44" flowers="#b3122e" />
      <Fence from={[-1, 19.6]} to={[11.6, 19.6]} count={13} spikes />
      <Fence from={wing ? [21.6, 1] : [18.6, 3]} to={[wing ? 21.6 : 18.6, 18]} count={12} spikes />
      <PoleTorch p={[11.2, -0.5, 16.5]} />
      <PoleTorch p={[14.6, -0.5, 16.5]} />
      <Rock p={[4, -0.3, 18]} rad={0.7} sc={[1.3, 0.8, 1]} c="#9a94a4" />
    </group>
  );
}

/** Battlements (merlons) on top of the back walls. */
function WallTop({ width = 14 }) {
  const stone = M(CASTLE, { tx: 'bricks', bump: 2 });
  const back = Array.from({ length: width + 1 }, (_, i) => i);
  const left = Array.from({ length: 13 }, (_, i) => i);
  return (
    <group>
      {back.map(i => <Box key={`b${i}`} p={[i * 1 + 0.3, 3.8, -0.15]} s={[0.5, 0.5, 0.4]} mat={stone} />)}
      {left.map(i => <Box key={`l${i}`} p={[-0.15, 3.8, i + 0.5]} s={[0.4, 0.5, 0.5]} mat={stone} />)}
      {/* red banners */}
      {[3.5, 9.5].map(x => (
        <group key={x} position={[x, 2.4, 0.08]}>
          <Box s={[0.7, 1.6, 0.03]} mat={M('#8a0f22', { tx: 'fabric' })} />
          <Cone p={[0, -0.95, 0]} rad={0.35} h={0.3} seg={3} r={[0, 0, Math.PI]} mat={M('#8a0f22', { tx: 'fabric' })} />
          <Ball p={[0, 0.2, 0.03]} rad={0.14} w={8} hs={4} sc={[1, 1, 0.2]} mat={GOLD()} />
        </group>
      ))}
    </group>
  );
}

function BarPiece() {
  return (
    <group>
      {/* tiered blood fountain */}
      <group position={[8.4, 0, 4.3]}>
        <Cyl p={[0, 0.2, 0]} rt={0.55} rb={0.6} h={0.4} seg={10} mat={M('#3a3440', { tx: 'stone', bump: 2 })} />
        <Cyl p={[0, 0.41, 0]} rt={0.48} h={0.03} seg={10} mat={BLOOD()} cast={false} />
        <Cyl p={[0, 0.75, 0]} rt={0.08} h={0.7} seg={6} mat={GOLD()} />
        <Cyl p={[0, 1.1, 0]} rt={0.3} rb={0.15} h={0.15} seg={10} mat={GOLD()} />
        <Cyl p={[0, 1.18, 0]} rt={0.26} h={0.02} seg={10} mat={BLOOD()} cast={false} />
        <Sprite p={[0, 0.8, 0]} size={2.2} color="#ff0a2a" opacity={0.35} />
      </group>
      {/* wine rack */}
      <group position={[4.2, 0, 5.5]}>
        <Box p={[0, 0.7, 0]} s={[0.5, 1.4, 1.4]} mat={M('#2e1512', { tx: 'planks', bump: 1 })} />
        {[0.35, 0.7, 1.05].map(y => [-0.4, 0, 0.4].map(z => (
          <Cyl key={`${y}${z}`} p={[0.2, y, z]} rt={0.07} h={0.3} seg={6} r={[0, 0, Math.PI / 2]} mat={M('#4a0a12', { rough: 0.15 })} />
        )))}
      </group>
    </group>
  );
}

function LoungePiece() {
  const velvet = M('#8a0f22', { tx: 'fabric' });
  const frame = M('#1a1216', { rough: 0.3, metal: 0.3 });
  return (
    <group position={[1.1, 0, 10.9]} rotation={[0, Math.PI / 2, 0]}>
      {/* gothic throne */}
      <Box p={[0, 0.25, 0]} s={[1.4, 0.5, 1.2]} mat={M('#3a3440', { tx: 'stone', bump: 2 })} />
      <Box p={[0, 0.75, 0]} s={[1.0, 0.2, 0.9]} mat={velvet} />
      <Box p={[0, 1.6, -0.4]} s={[1.0, 1.9, 0.18]} mat={frame} />
      <Box p={[0, 1.5, -0.3]} s={[0.8, 1.4, 0.05]} mat={velvet} />
      <Cone p={[0, 2.8, -0.4]} rad={0.5} h={0.7} seg={4} r={[0, Math.PI / 4, 0]} mat={frame} />
      <Cone p={[0.45, 2.7, -0.4]} rad={0.12} h={0.5} seg={4} mat={frame} />
      <Cone p={[-0.45, 2.7, -0.4]} rad={0.12} h={0.5} seg={4} mat={frame} />
      <Box p={[0.5, 1.0, 0]} s={[0.12, 0.35, 0.9]} mat={frame} />
      <Box p={[-0.5, 1.0, 0]} s={[0.12, 0.35, 0.9]} mat={frame} />
      <Ball p={[0, 2.45, -0.3]} rad={0.1} w={6} hs={4} mat={M('#ff2a4a', { emissive: '#ff0022', intensity: 2 })} />
      <Candelabra p={[0.9, 0.5, -0.3]} gold />
    </group>
  );
}

// ─── attractions ─────────────────────────────────────────────────────────────
function RoseGarden({ level }) {
  return (
    <group>
      <Box p={[0, 0.08, 0]} s={[3, 0.16, 2.4]} mat={M('#3a3440', { tx: 'bricks', bump: 2 })} />
      {Array.from({ length: 2 + level }, (_, i) => (
        <Bush key={i} p={[(i % 3 - 1) * 0.9, 0.12, Math.floor(i / 3) * 0.9 - 0.4]} s={0.6} color="#3f8a44" flowers="#8a0015" />
      ))}
    </group>
  );
}

function MoonAltar({ level }) {
  return (
    <group>
      <Box p={[0, 0.2, 0]} s={[2.2, 0.4, 1.6]} mat={M('#3a3440', { tx: 'stone', bump: 2 })} />
      <Box p={[0, 0.7, 0]} s={[1.4, 0.6, 0.9]} mat={M('#4a4450', { tx: 'bricks', bump: 2 })} />
      <Box p={[0, 1.02, 0]} s={[1.6, 0.06, 1.1]} mat={M('#8a0f22', { tx: 'fabric' })} />
      <Floaty p={[0, 1.9, 0]} amp={0.15} speed={1}>
        <Ball rad={0.25 + level * 0.06} w={12} hs={8} mat={RimM('#ff5a5a', '#ff0022', { intensity: 1.6 })} cast={false} />
        <Sprite size={2.5 + level * 0.5} color="#ff2a3a" opacity={0.5} />
      </Floaty>
      {[-0.6, 0.6].map(x => <Candelabra key={x} p={[x, 1.05, 0.3]} gold />)}
      <Blob size={3} />
    </group>
  );
}

function BatTower({ level }) {
  return (
    <group>
      <Tower p={[0, 0, 0]} h={3 + level} rad={0.8} roof={ROOF} wall={CASTLE} glow="#ff4a3a" />
      {Array.from({ length: 2 + level * 2 }, (_, i) => (
        <Floaty key={i} p={[0, 4 + level + (i % 3) * 0.4, 0]} amp={0.3} speed={1 + i * 0.2} spin={1.5 + (i % 3) * 0.5}>
          <group position={[1.2 + (i % 2) * 0.6, 0, 0]} rotation={[0, i, 0]}>
            <Ball rad={0.1} w={5} hs={4} c="#1a1216" />
            <Box p={[0.15, 0, 0]} s={[0.25, 0.02, 0.12]} r={[0, 0, 0.3]} c="#1a1216" />
            <Box p={[-0.15, 0, 0]} s={[0.25, 0.02, 0.12]} r={[0, 0, -0.3]} c="#1a1216" />
          </group>
        </Floaty>
      ))}
    </group>
  );
}

export default {
  Outside,
  BarPiece,
  LoungePiece,
  WallTop,
  attractions: [RoseGarden, MoonAltar, BatTower],
};

