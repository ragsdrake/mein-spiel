/** Yeti-Eispalast — ice spires, snowy pines, igloos, frozen lake. */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Flame } from '../Props';
import { Ball, Blob, Box, Cone, Cyl, M, RimM, Rock, Sprite, rand } from '../primitives';
import { Floaty, GardenPath, Ground, PoleTorch } from './common';

const ICE = () => RimM('#bfe8ff', '#6fdcff', { strength: 1.1, intensity: 0.2, rough: 0.15 });
const ICE_CLEAR = () => RimM('#d8f4ff', '#8fe8ff', { strength: 1.4, intensity: 0.25, opacity: 0.75, rough: 0.1 });
const SNOW = () => M('#b8cce4');

function Spire({ p, h = 6, rad = 0.8, tilt = 0 }) {
  return (
    <group position={p} rotation={[tilt, 0, tilt * 0.6]}>
      <Cyl p={[0, h / 2, 0]} rt={rad * 0.7} rb={rad} h={h} seg={6} mat={ICE()} />
      <Cone p={[0, h + rad * 0.9, 0]} rad={rad * 0.7} h={rad * 1.8} seg={6} mat={ICE()} />
      <Sprite p={[0, h * 0.6, 0]} size={h * 0.8} color="#4fd8ff" opacity={0.18} />
    </group>
  );
}

export function Pine({ p, s = 1 }) {
  const green = M('#1f4a3a');
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.4, 0]} rt={0.1} rb={0.14} h={0.8} seg={5} c="#4a3024" />
      {[0, 1, 2].map(i => (
        <group key={i}>
          <Cone p={[0, 1.0 + i * 0.65, 0]} rad={0.95 - i * 0.25} h={1.1} seg={7} mat={green} />
          <Cone p={[0, 1.2 + i * 0.65, 0]} rad={0.7 - i * 0.2} h={0.6} seg={7} mat={SNOW()} />
        </group>
      ))}
      <Blob size={2} />
    </group>
  );
}

function Igloo({ p, r = 0, s = 1 }) {
  return (
    <group position={p} rotation={[0, r, 0]} scale={s}>
      <Ball p={[0, 0, 0]} rad={1.1} w={12} hs={8} mat={M('#eef8ff', { tx: 'iceBricks', rx: 3, ry: 2, bump: 2 })} />
      <Cyl p={[0, 0.3, 1.0]} rt={0.45} h={0.7} seg={10} r={[Math.PI / 2, 0, 0]} mat={M('#eef8ff', { tx: 'iceBricks', bump: 2 })} />
      <mesh position={[0, 0.3, 1.36]} material={M('#ffcf8a', { emissive: '#ff9a3a', intensity: 2 })}>
        <circleGeometry args={[0.32, 10]} />
      </mesh>
      <Sprite p={[0, 0.3, 1.5]} size={1.6} color="#ff9a3a" opacity={0.45} />
    </group>
  );
}

function FrozenLake() {
  return (
    <mesh position={[3.5, -0.48, 16]} rotation={[-Math.PI / 2, 0, 0]}
      material={M('#7fc8f0', { rough: 0.05, metal: 0.5, emissive: '#2a6a9a', intensity: 0.25, tx: 'ice', rx: 3, ry: 2 })}>
      <circleGeometry args={[3.2, 16]} />
    </mesh>
  );
}

function Outside({ wing = 0 }) {
  return (
    <group>
      <Ground />
      <GardenPath />
      <Spire p={[-3, -0.5, -3]} h={11} rad={1.6} />
      <Spire p={[-1, -0.5, -5]} h={7} rad={1} tilt={0.1} />
      <Spire p={[6, -0.5, -4.5]} h={9} rad={1.2} tilt={-0.05} />
      <Spire p={[16.5, -0.5, -3]} h={8} rad={1.3} tilt={0.08} />
      <Spire p={[-4, -0.5, 7]} h={6} rad={1} tilt={-0.1} />
      {/* snow hills — kept well outside the building footprint */}
      {[[-9, 4, [5, 3, 8]], [wing ? 27.5 : 23, 8, [5, 2.5, 8]], [6, -15, [11, 4, 5]]].map(([x, z, sc], i) => (
        <Rock key={i} p={[x, -1.4, z]} rad={1} sc={sc} mat={SNOW()} detail={1} />
      ))}
      <Pine p={wing ? [22.2, -0.5, 6.5] : [16.6, -0.5, 7]} s={1.2} />
      <Pine p={wing ? [21.4, -0.5, 12.2] : [17.4, -0.5, 11]} s={0.9} />
      <Pine p={[0, -0.5, 20]} s={1.3} />
      <Pine p={[9.5, -0.5, 20]} s={1} />
      <Pine p={[17, -0.5, 17]} s={1.4} />
      <Igloo p={wing ? [22.8, -0.5, 2.4] : [16.8, -0.5, 2.8]} r={-1.2} />
      <FrozenLake />
      {Array.from({ length: 8 }, (_, i) => (
        <Rock key={`d${i}`} p={[rand(i) * 16, -0.55, 13 + rand(i + 9) * 6]} rad={0.6} sc={[1.6, 0.35, 1]} mat={SNOW()} />
      ))}
      <PoleTorch p={[11.2, -0.5, 14.5]} />
      <PoleTorch p={[14.6, -0.5, 14.5]} />
    </group>
  );
}

/** Snow caps and icicles along the wall tops. */
function WallTop({ width = 14 }) {
  const icicles = Array.from({ length: width * 2 }, (_, i) => i);
  return (
    <group>
      <Box p={[width / 2, 3.65, -0.1]} s={[width + 0.8, 0.2, 0.7]} mat={SNOW()} />
      <Box p={[-0.1, 3.65, 6]} s={[0.7, 0.2, 12.8]} mat={SNOW()} />
      {icicles.map(i => (
        <Cone key={`b${i}`} p={[0.2 + i * 0.5, 3.1, 0.12]} rad={0.06} h={0.3 + rand(i) * 0.4} seg={4} r={[Math.PI, 0, 0]} mat={ICE()} cast={false} />
      ))}
      {icicles.slice(0, 24).map(i => (
        <Cone key={`l${i}`} p={[0.12, 3.1, 0.2 + i * 0.5]} rad={0.06} h={0.3 + rand(i + 5) * 0.4} seg={4} r={[Math.PI, 0, 0]} mat={ICE()} cast={false} />
      ))}
    </group>
  );
}

function BarPiece() {
  const liquid = useRef();
  useFrame(({ clock }) => {
    if (liquid.current) liquid.current.rotation.y = clock.elapsedTime * 0.5;
  });
  return (
    <group>
      <group position={[8.4, 0, 4.3]}>
        <Cyl p={[0, 0.35, 0]} rt={0.25} rb={0.35} h={0.7} seg={8} mat={ICE()} />
        <Cyl p={[0, 0.85, 0]} rt={0.55} rb={0.3} h={0.35} seg={10} mat={ICE_CLEAR()} />
        <mesh ref={liquid} position={[0, 0.98, 0]} material={M('#6ff4ff', { emissive: '#1fd0ff', intensity: 1.6 })}>
          <cylinderGeometry args={[0.48, 0.48, 0.04, 10]} />
        </mesh>
        <Sprite p={[0, 1.1, 0]} size={2.4} color="#3fd8ff" opacity={0.45} />
      </group>
      {[[4.1, 5.0, 0.2], [4.2, 5.8, -0.3], [4.1, 5.4, 0.5]].map(([x, z, r], i) => (
        <Box key={i} p={[x, 0.3 + (i === 2 ? 0.6 : 0), z]} s={[0.6, 0.6, 0.6]} r={[0, r, 0]} mat={ICE_CLEAR()} />
      ))}
    </group>
  );
}

function LoungePiece() {
  const stone = M('#6a7a8a', { tx: 'bricks', bump: 2 });
  return (
    <group position={[0.6, 0, 10.9]} rotation={[0, Math.PI / 2, 0]}>
      {/* stone fireplace — warm contrast in the cold palace */}
      <Box p={[0, 0.9, 0]} s={[1.8, 1.8, 0.8]} mat={stone} />
      <Box p={[0, 0.5, 0.25]} s={[1.0, 0.9, 0.4]} mat={M('#1a1418')} />
      <Box p={[0, 1.85, 0.05]} s={[2.0, 0.15, 0.95]} mat={M('#e8f4ff', { tx: 'snow' })} />
      <Flame p={[-0.2, 0.2, 0.35]} s={3.5} color="#ff8a2a" />
      <Flame p={[0.2, 0.2, 0.3]} s={3} color="#ffb347" />
      <Sprite p={[0, 0.6, 0.8]} size={3} color="#ff8a2a" opacity={0.5} />
      <Box p={[0, 0.12, 0.35]} s={[0.8, 0.1, 0.2]} c="#4a3024" />
    </group>
  );
}

// ─── attractions ─────────────────────────────────────────────────────────────
function IceSculptures({ level }) {
  return (
    <group>
      <Box p={[0, 0.2, 0]} s={[3, 0.4, 2]} mat={SNOW()} />
      {/* swan */}
      <group position={[-0.6, 0.4, 0]}>
        <Ball p={[0, 0.4, 0]} rad={0.45} w={10} hs={6} sc={[1.3, 0.7, 0.8]} mat={ICE_CLEAR()} />
        <Cyl p={[0.45, 0.9, 0]} rt={0.07} rb={0.1} h={0.8} seg={6} r={[0, 0, -0.3]} mat={ICE_CLEAR()} />
        <Ball p={[0.6, 1.28, 0]} rad={0.13} w={8} hs={6} mat={ICE_CLEAR()} />
      </group>
      {level >= 2 && <Cone p={[0.7, 1.1, -0.3]} rad={0.35} h={1.4} seg={6} mat={ICE_CLEAR()} />}
      {level >= 3 && <Ball p={[0.7, 0.8, 0.5]} rad={0.35} w={10} hs={6} mat={ICE_CLEAR()} />}
      <Sprite p={[0, 1, 0]} size={3} color="#6fdcff" opacity={0.25} />
      <Blob size={3.2} />
    </group>
  );
}

function AuroraHarp({ level }) {
  const strings = useRef();
  useFrame(({ clock }) => {
    if (!strings.current) return;
    strings.current.children.forEach((s, i) => {
      s.scale.x = 1 + Math.sin(clock.elapsedTime * 8 + i) * 0.4;
    });
  });
  const colors = ['#4fffb0', '#4fd8ff', '#b07aff', '#ff6ad8', '#4fffb0', '#4fd8ff'];
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <Box p={[0, 0.15, 0]} s={[1.6, 0.3, 0.8]} mat={SNOW()} />
      <Cyl p={[-0.6, 1.4, 0]} rt={0.08} h={2.4} seg={6} mat={ICE()} />
      <Cyl p={[0, 2.5, 0]} rt={0.07} h={1.4} seg={6} r={[0, 0, Math.PI / 2 - 0.3]} mat={ICE()} />
      <group ref={strings}>
        {colors.slice(0, 2 + Math.floor(level * 1.4)).map((c, i) => (
          <Box key={i} p={[-0.45 + i * 0.18, 1.3 + i * 0.07, 0]} s={[0.02, 2 - i * 0.15, 0.02]}
            mat={M(c, { emissive: c, intensity: 2.2 })} cast={false} />
        ))}
      </group>
      <Sprite p={[0, 1.6, 0]} size={3 + level * 0.5} color="#4fffb0" opacity={0.3} />
      <Blob size={2} />
    </group>
  );
}

function HotSpring({ level }) {
  return (
    <group scale={0.8 + level * 0.15}>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return <Rock key={i} p={[Math.sin(a) * 1.3, 0.2, Math.cos(a) * 1.1]} rad={0.35} mat={M('#6a7a8a', { tx: 'stone', bump: 2 })} />;
      })}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M('#5fd8e8', { emissive: '#2ab0c0', intensity: 0.8, rough: 0.05 })}>
        <circleGeometry args={[1.25, 14]} />
      </mesh>
      {[0, 1, 2].map(i => (
        <Floaty key={i} p={[(i - 1) * 0.5, 0.8 + i * 0.3, 0]} amp={0.3} speed={0.8 + i * 0.3}>
          <Sprite size={1.4} color="#ffffff" opacity={0.18} />
        </Floaty>
      ))}
      <Sprite p={[0, 0.3, 0]} size={3} color="#ffb86b" opacity={0.25} />
    </group>
  );
}

export default {
  Outside,
  BarPiece,
  LoungePiece,
  WallTop,
  attractions: [IceSculptures, AuroraHarp, HotSpring],
};

