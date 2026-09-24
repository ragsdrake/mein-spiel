/**
 * The haunted hotel itself: floor, cut-away walls, guest crypts, bar,
 * reception, lounge and the graveyard garden in front.
 */

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { ExtrudeGeometry, Shape } from 'three';
import { P, ROOMS, barStools } from '../../game/config';
import { tapRoom, useSim } from '../../game/sim';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import { Ball, Box, Cone, Cyl, M, Rock, rand } from './primitives';

const WOOD      = '#8b4a2b';
const WOOD_DARK = '#5c2f1d';
const TRIM      = '#d0662f';
const STONE     = '#7d7390';
const STONE_DK  = '#5b536a';
const FLOOR_A   = '#6b3f2c';
const FLOOR_B   = '#613927';
const WINDOW    = M('#c58bff', { emissive: '#a45bff', intensity: 1.1 });
const FLAME     = M('#ffcf6b', { emissive: '#ffae3b', intensity: 2.2 });
const SLIME     = M('#7dff7a', { emissive: '#35e05a', intensity: 0.9, opacity: 0.85 });
const CAULDRON  = M('#7dff7a', { emissive: '#35e05a', intensity: 1.4 });

// ─── small props ─────────────────────────────────────────────────────────────
function Candle({ p, h = 0.25 }) {
  return (
    <group position={p}>
      <Cyl p={[0, h / 2, 0]} rt={0.05} h={h} seg={6} c="#f3ead2" />
      <Cone p={[0, h + 0.06, 0]} rad={0.035} h={0.1} seg={4} mat={FLAME} cast={false} />
    </group>
  );
}

function Candelabra({ p, gold }) {
  const c = gold ? '#e2b347' : '#3a2f44';
  return (
    <group position={p}>
      <Cyl p={[0, 0.02, 0]} rt={0.14} h={0.04} seg={6} c={c} />
      <Cyl p={[0, 0.45, 0]} rt={0.025} h={0.9} seg={4} c={c} />
      <Box p={[0, 0.9, 0]} s={[0.4, 0.03, 0.03]} c={c} />
      <Candle p={[-0.18, 0.92, 0]} h={0.14} />
      <Candle p={[0, 0.92, 0]} h={0.18} />
      <Candle p={[0.18, 0.92, 0]} h={0.14} />
    </group>
  );
}

function Window({ p, r }) {
  return (
    <group position={p} rotation={r}>
      <Box s={[1.1, 1.2, 0.1]} c={WOOD_DARK} />
      <Box p={[0, 0, 0.04]} s={[0.86, 0.96, 0.06]} mat={WINDOW} cast={false} />
      <Box p={[0, 0, 0.09]} s={[0.07, 0.96, 0.04]} c={WOOD_DARK} />
      <Box p={[0, 0.05, 0.09]} s={[0.86, 0.07, 0.04]} c={WOOD_DARK} />
      <Cone p={[0, 0.72, 0.02]} rad={0.62} h={0.35} seg={3} r={[0, 0, 0]} c={WOOD} />
    </group>
  );
}

function Painting({ p, r, hue = '#3c6b5a' }) {
  return (
    <group position={p} rotation={r}>
      <Box s={[0.7, 0.85, 0.06]} c="#c9982f" />
      <Box p={[0, 0, 0.035]} s={[0.56, 0.7, 0.02]} c={hue} cast={false} />
      <Ball p={[0, 0.06, 0.05]} rad={0.13} w={6} hs={4} sc={[1, 1.2, 0.3]} c="#e8dcc8" cast={false} />
    </group>
  );
}

function Padlock({ p, onPress }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = p[1] + Math.sin(clock.elapsedTime * 2 + p[0]) * 0.1;
  });
  return (
    <group ref={ref} position={p} onClick={(e) => { e.stopPropagation(); onPress(); }}>
      <Box s={[0.5, 0.42, 0.2]} mat={M('#ffc94a', { metal: 0.6, rough: 0.35, emissive: '#ff9d00', intensity: 0.35 })} />
      <mesh position={[0, 0.28, 0]} material={M('#b9bfcc', { metal: 0.7, rough: 0.3 })}>
        <torusGeometry args={[0.16, 0.045, 5, 10, Math.PI]} />
      </mesh>
      <Box p={[0, -0.02, 0.11]} s={[0.08, 0.14, 0.02]} c="#3a2a14" cast={false} />
      {/* generous invisible hit area */}
      <mesh visible={false}>
        <sphereGeometry args={[0.9, 6, 4]} />
      </mesh>
    </group>
  );
}

// ─── coffin bed ──────────────────────────────────────────────────────────────
function coffinGeometry(scale, depth) {
  const s = new Shape();
  const pts = [[-0.95, -0.2], [-0.45, -0.38], [0.95, -0.24], [0.95, 0.24], [-0.45, 0.38], [-0.95, 0.2]];
  s.moveTo(pts[0][0] * scale, pts[0][1] * scale);
  pts.slice(1).forEach(([x, y]) => s.lineTo(x * scale, y * scale));
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

function CoffinBed({ level }) {
  const outer = useMemo(() => coffinGeometry(1, 0.42), []);
  const inner = useMemo(() => coffinGeometry(0.86, 0.02), []);
  const wood = level >= 7 ? '#2b1a33' : '#4a2a1e';
  return (
    <group>
      <mesh geometry={outer} material={M(wood)} castShadow receiveShadow />
      <mesh geometry={inner} position={[0, 0.41, 0]} material={M(level >= 4 ? '#9b3fc0' : '#7a3a8f')} />
      <Box p={[-0.62, 0.47, 0]} s={[0.26, 0.1, 0.4]} c="#efe4f5" />
      {level >= 7 && (
        <Box p={[0, 0.425, 0]} s={[1.9, 0.02, 0.05]} mat={M('#ffc94a', { metal: 0.6, rough: 0.3 })} />
      )}
    </group>
  );
}

// ─── guest room ──────────────────────────────────────────────────────────────
function Room({ index }) {
  const level = useHotel(s => s.rooms[index]);
  const prevUnlocked = useHotel(s => index === 0 || s.rooms[index - 1] > 0);
  const hasZombie = useHotel(s => s.staff.zombie);
  const dirty = useSim(s => s.dirty[index]);
  const openSheet = useUi(s => s.openSheet);
  const def = ROOMS[index];
  const [cx, cz] = def.center;

  return (
    <group position={[cx, 0, cz]} rotation={[0, def.rot, 0]}>
      {level === 0 ? (
        <group>
          <Box p={[-0.4, 0.3, -0.5]} s={[0.6, 0.6, 0.6]} r={[0, 0.3, 0]} c="#7a5234" />
          <Box p={[0.3, 0.25, -0.7]} s={[0.5, 0.5, 0.5]} r={[0, -0.2, 0]} c="#6b462c" />
          <Box p={[-0.2, 0.8, -0.6]} s={[0.4, 0.4, 0.4]} r={[0, 0.7, 0]} c="#8a603f" />
          <mesh position={[0.9, 1.1, -1.35]} rotation={[0, 0, Math.PI / 4]} material={M('#e8e6f0', { opacity: 0.5 })}>
            <circleGeometry args={[0.5, 3]} />
          </mesh>
          {prevUnlocked && (
            <Padlock p={[0, 1.5, 0]} onPress={() => openSheet('rooms', index)} />
          )}
          {!prevUnlocked && <Box p={[0, 0.02, 0]} s={[2.4, 0.03, 1.8]} c="#3a2a33" cast={false} />}
        </group>
      ) : (
        <group>
          <Box p={[0, 0.015, 0.1]} s={[2.5, 0.03, 2.1]} c={level >= 4 ? '#6d2a7a' : '#5a2a55'} cast={false} />
          <Box p={[0, 0.03, 0.1]} s={[2.1, 0.02, 1.7]} c={level >= 4 ? '#8c3a9c' : '#6e3868'} cast={false} />
          <group position={[0, 0.03, -0.35]}>
            <CoffinBed level={level} />
          </group>
          <Box p={[1.15, 0.3, -1.05]} s={[0.45, 0.6, 0.4]} c={WOOD} />
          <Candle p={[1.15, 0.6, -1.05]} />
          {level >= 2 && <Painting p={[0, 2.1, -1.42]} hue={index % 2 ? '#40506e' : '#3c6b5a'} />}
          {level >= 4 && (
            <group position={[-1.15, 0, -0.95]}>
              <Box p={[0, 0.8, 0]} s={[0.55, 1.6, 0.5]} c={WOOD_DARK} />
              <Box p={[0, 0.8, 0.26]} s={[0.02, 1.4, 0.02]} c={TRIM} cast={false} />
            </group>
          )}
          {level >= 6 && <Candelabra p={[-1.15, 0, 0.75]} gold />}
          {level >= 8 && (
            <group position={[1.15, 0, 0.8]}>
              <Cyl p={[0, 0.2, 0]} rt={0.18} rb={0.13} h={0.4} seg={6} c="#8a4a8f" />
              <Rock p={[0, 0.6, 0]} rad={0.28} sc={[1, 1.3, 1]} c="#3f6b45" />
            </group>
          )}
          {level >= 10 && (
            <Ball p={[0, 2.6, 0]} rad={0.25} w={6} hs={4} mat={M('#c9f2ff', { emissive: '#8fe3ff', intensity: 1.2 })} />
          )}
          {dirty && <Puddle index={index} showHint={!hasZombie} />}
        </group>
      )}
    </group>
  );
}

function Puddle({ index, showHint }) {
  const hint = useRef();
  useFrame(({ clock }) => {
    if (hint.current) hint.current.position.y = 1.4 + Math.sin(clock.elapsedTime * 4) * 0.08;
  });
  const press = (e) => { e.stopPropagation(); tapRoom(index); };
  return (
    <group position={[0.2, 0, 0.55]} onClick={press}>
      <Cyl p={[0, 0.05, 0]} rt={0.45} h={0.03} seg={7} mat={SLIME} cast={false} />
      <Cyl p={[0.45, 0.05, 0.2]} rt={0.22} h={0.03} seg={6} mat={SLIME} cast={false} />
      <Cyl p={[-0.35, 0.05, 0.3]} rt={0.16} h={0.03} seg={5} mat={SLIME} cast={false} />
      <Ball p={[0.1, 0.1, 0]} rad={0.08} w={5} hs={4} mat={SLIME} cast={false} />
      {showHint && (
        <group ref={hint} position={[0, 1.4, 0]}>
          <Ball rad={0.28} w={8} hs={6} c="#ffffff" cast={false} />
          <Box p={[0, 0.02, 0.2]} s={[0.05, 0.3, 0.05]} r={[0, 0, 0.5]} c="#8b5a33" cast={false} />
          <Box p={[0.1, -0.13, 0.2]} s={[0.18, 0.1, 0.05]} r={[0, 0, 0.5]} c="#e0a33a" cast={false} />
        </group>
      )}
      <mesh visible={false} position={[0, 0.6, 0]}>
        <boxGeometry args={[2, 1.8, 2]} />
      </mesh>
    </group>
  );
}

// ─── building shell ──────────────────────────────────────────────────────────
function Shell() {
  const planks = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);
  const stones = useMemo(() => {
    const out = [];
    // stone path: corridor behind the bar and the walkway to the entrance
    for (let i = 0; i < 26; i++) out.push([1.2 + i * 0.5 + rand(i) * 0.2, 3.9 + (rand(i + 50) - 0.5) * 0.6, i]);
    for (let i = 0; i < 18; i++) out.push([12.6 + (rand(i + 90) - 0.5) * 1.4, 4.5 + i * 0.45, i + 100]);
    return out;
  }, []);

  return (
    <group>
      {/* foundation + planks */}
      <Box p={[7, -0.45, 6]} s={[14.6, 0.7, 12.6]} c={STONE_DK} />
      {planks.map(i => (
        <Box key={i} p={[i + 0.5, -0.05, 6]} s={[0.98, 0.1, 12]} c={i % 2 ? FLOOR_A : FLOOR_B} cast={false} />
      ))}
      {stones.map(([x, z, k]) => (
        <Cyl key={k} p={[x, 0.02, z]} rt={0.22 + rand(k + 7) * 0.12} h={0.05} seg={6}
          r={[0, rand(k) * 3, 0]} c={rand(k + 3) > 0.5 ? '#6f6878' : '#645d6e'} cast={false} />
      ))}

      {/* back wall (z = 0) */}
      <Box p={[7, 1.7, -0.15]} s={[14.3, 3.4, 0.3]} c={STONE} />
      <Box p={[7, 0.15, 0.02]} s={[14.3, 0.3, 0.06]} c={WOOD_DARK} />
      <Box p={[7, 3.45, -0.1]} s={[14.6, 0.25, 0.5]} c={TRIM} />
      {[0.15, 3.5, 6.5, 9.5, 12.5].map(x => (
        <Box key={x} p={[x, 1.7, 0.04]} s={[0.26, 3.4, 0.1]} c={WOOD} />
      ))}
      {[2, 5, 8, 11].map(x => <Window key={x} p={[x, 2.25, 0.04]} />)}

      {/* left wall (x = 0) */}
      <Box p={[-0.15, 1.7, 6]} s={[0.3, 3.4, 12.3]} c={STONE} />
      <Box p={[0.02, 0.15, 6]} s={[0.06, 0.3, 12.3]} c={WOOD_DARK} />
      <Box p={[-0.1, 3.45, 6]} s={[0.5, 0.25, 12.6]} c={TRIM} />
      {[3.6, 6.7, 9.7, 12].map(z => (
        <Box key={z} p={[0.04, 1.7, z]} s={[0.1, 3.4, 0.26]} c={WOOD} />
      ))}
      {[5.2, 8.2, 10.9].map(z => <Window key={z} p={[0.04, 2.25, z]} r={[0, Math.PI / 2, 0]} />)}

      {/* room dividers */}
      {[3.5, 6.5, 9.5, 12.5].map(x => (
        <group key={x}>
          <Box p={[x, 0.65, 1.5]} s={[0.2, 1.3, 3]} c={STONE} />
          <Box p={[x, 1.33, 1.5]} s={[0.3, 0.1, 3.1]} c={TRIM} />
        </group>
      ))}
      {[3.6, 6.7, 9.7].map(z => (
        <group key={z}>
          <Box p={[1.5, 0.65, z]} s={[3, 1.3, 0.2]} c={STONE} />
          <Box p={[1.5, 1.33, z]} s={[3.1, 0.1, 0.3]} c={TRIM} />
        </group>
      ))}

      {/* low front walls with the entrance gap (x 11.8 … 13.9) */}
      <Box p={[5.9, 0.4, 12.15]} s={[11.8, 0.8, 0.3]} c={STONE} />
      <Box p={[5.9, 0.84, 12.15]} s={[11.9, 0.1, 0.4]} c={TRIM} />
      <Box p={[14.15, 0.4, 6]} s={[0.3, 0.8, 12.3]} c={STONE} />
      <Box p={[14.15, 0.84, 6]} s={[0.4, 0.1, 12.4]} c={TRIM} />
      {[11.8, 13.95].map(x => (
        <group key={x}>
          <Box p={[x, 0.8, 12.15]} s={[0.35, 1.6, 0.35]} c={WOOD} />
          <Cyl p={[x, 1.72, 12.15]} rt={0.14} rb={0.1} h={0.25} seg={6} c="#2c2433" />
          <Ball p={[x, 1.72, 12.15]} rad={0.09} w={5} hs={4} mat={FLAME} cast={false} />
        </group>
      ))}

      <Stairs />
    </group>
  );
}

function Stairs() {
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => {
        const h = 0.4 * (i + 1);
        return (
          <group key={i}>
            <Box p={[13.3, h / 2, 3.0 - i * 0.38]} s={[1.3, h, 0.4]} c={i % 2 ? WOOD : '#9a5431'} />
          </group>
        );
      })}
      <Box p={[12.62, 1.7, 1.6]} s={[0.1, 0.1, 3.4]} r={[0.83, 0, 0]} c={TRIM} />
      {[3.1, 2.1, 1.1].map((z, i) => (
        <Box key={z} p={[12.62, 0.8 + i * 1.1, z]} s={[0.1, 1.2, 0.1]} c={WOOD_DARK} />
      ))}
    </group>
  );
}

// ─── reception ───────────────────────────────────────────────────────────────
function Reception() {
  return (
    <group>
      <Box p={[10, 0.5, 9.6]} s={[0.8, 1.0, 2.6]} c={WOOD} />
      <Box p={[10.42, 0.5, 9.6]} s={[0.04, 0.7, 2.2]} c={WOOD_DARK} cast={false} />
      <Box p={[10, 1.05, 9.6]} s={[1.0, 0.1, 2.8]} c={TRIM} />
      <group position={[10.1, 1.1, 9.0]}>
        <Cyl p={[0, 0.02, 0]} rt={0.12} h={0.04} seg={8} c="#2c2433" />
        <Ball p={[0, 0.08, 0]} rad={0.1} w={8} hs={4} mat={M('#ffc94a', { metal: 0.7, rough: 0.3 })} />
      </group>
      <Box p={[9.95, 1.13, 10.1]} s={[0.4, 0.06, 0.55]} r={[0, 0.2, 0]} c="#7a2433" />
      <Candle p={[9.9, 1.1, 10.7]} h={0.3} />
      {/* key board on the back */}
      <group position={[8.7, 0, 9.6]}>
        <Box p={[0, 0.9, 0]} s={[0.25, 1.8, 1.6]} c={WOOD_DARK} />
        {[-0.5, 0, 0.5].map(z => [1.3, 0.9].map(y => (
          <Ball key={`${z}${y}`} p={[0.15, y, z]} rad={0.06} w={4} hs={3} mat={M('#ffc94a', { metal: 0.7, rough: 0.3 })} />
        )))}
      </group>
    </group>
  );
}

// ─── bar ─────────────────────────────────────────────────────────────────────
function Bar() {
  const level = useHotel(s => s.barLevel);
  const openSheet = useUi(s => s.openSheet);
  const stools = level > 0 ? barStools(level) : 0;
  const bubbles = useRef();
  useFrame(({ clock }) => {
    if (!bubbles.current) return;
    bubbles.current.children.forEach((b, i) => {
      const t = (clock.elapsedTime * 0.8 + i * 0.33) % 1;
      b.position.y = 0.75 + t * 0.5;
      b.scale.setScalar(1 - t);
    });
  });

  return (
    <group>
      {/* counter */}
      <Box p={[6.9, 0.5, 5.3]} s={[4.6, 1.0, 0.8]} c={WOOD} />
      <Box p={[6.9, 0.5, 5.71]} s={[4.3, 0.12, 0.04]} c={TRIM} cast={false} />
      <Box p={[6.9, 1.05, 5.3]} s={[4.8, 0.1, 1.0]} c={TRIM} />
      <Box p={[9.4, 0.5, 4.75]} s={[0.8, 1.0, 1.9]} c={WOOD} />
      <Box p={[9.4, 1.05, 4.75]} s={[1.0, 0.1, 2.1]} c={TRIM} />

      {level === 0 ? (
        <group>
          <Box p={[6.9, 1.2, 5.3]} s={[4.7, 0.2, 1.05]} c="#a9a3b3" />
          <Padlock p={[6.9, 2.1, 5.3]} onPress={() => openSheet('bar')} />
        </group>
      ) : (
        <group>
          {/* bottles */}
          {[5.0, 5.3, 5.6, 7.9, 8.3].map((x, i) => (
            <group key={x} position={[x, 1.1, 5.1]}>
              <Cyl p={[0, 0.16, 0]} rt={0.07} h={0.32} seg={6}
                mat={M(['#3fb8a0', '#7a3ac0', '#c03a5a', '#3a7ac0', '#b8a03f'][i], { rough: 0.3 })} />
              <Cyl p={[0, 0.38, 0]} rt={0.03} h={0.12} seg={5} c="#2c2433" />
            </group>
          ))}
          {/* cauldron */}
          <group position={[8.4, 0, 4.3]}>
            <Ball p={[0, 0.45, 0]} rad={0.5} w={9} hs={6} sc={[1, 0.8, 1]} c="#26222b" />
            <Cyl p={[0, 0.8, 0]} rt={0.4} h={0.05} seg={9} mat={CAULDRON} cast={false} />
            <group ref={bubbles} position={[0, 0, 0]}>
              {[0, 1, 2].map(i => (
                <Ball key={i} p={[(i - 1) * 0.15, 0.8, (i % 2) * 0.1]} rad={0.07} w={5} hs={4} mat={CAULDRON} cast={false} />
              ))}
            </group>
            {[0, 2.1, 4.2].map(a => (
              <Box key={a} p={[Math.sin(a) * 0.3, 0.08, Math.cos(a) * 0.3]} s={[0.1, 0.16, 0.1]} c="#26222b" />
            ))}
          </group>
          {level >= 3 && <Candelabra p={[5.2, 1.1, 5.4]} gold={level >= 6} />}
        </group>
      )}

      {/* barrels */}
      {[[4.0, 5.9, 0], [4.0, 5.2, 1]].map(([x, z, k]) => (
        <group key={k} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
          <Cyl rt={0.36} h={0.8} seg={8} c="#7a4326" />
          <Cyl p={[0, 0.25, 0]} rt={0.37} h={0.06} seg={8} c="#3a3440" />
          <Cyl p={[0, -0.25, 0]} rt={0.37} h={0.06} seg={8} c="#3a3440" />
        </group>
      ))}

      {/* stools */}
      {P.stools.slice(0, stools).map(([x, z]) => (
        <group key={x} position={[x, 0, z]}>
          <Cyl p={[0, 0.3, 0]} rt={0.05} h={0.6} seg={5} c={WOOD_DARK} />
          <Cyl p={[0, 0.62, 0]} rt={0.22} h={0.08} seg={7} c="#8a2f4a" />
        </group>
      ))}
    </group>
  );
}

// ─── lounge ──────────────────────────────────────────────────────────────────
function Lounge() {
  const tables = [[6.5, 9.2], [8.2, 11.1], [5.3, 11.3]];
  return (
    <group>
      <Box p={[6.8, 0.02, 10.2]} s={[4.6, 0.03, 3.6]} c="#3e2a4d" cast={false} />
      {tables.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cyl p={[0, 0.35, 0]} rt={0.08} h={0.7} seg={5} c={WOOD_DARK} />
          <Cyl p={[0, 0.72, 0]} rt={0.55} h={0.08} seg={8} c={WOOD} />
          <Candle p={[0, 0.76, 0]} h={0.16} />
          <Box p={[0.8, 0.25, 0]} s={[0.4, 0.5, 0.4]} c="#7a3a4d" />
          <Box p={[0.98, 0.55, 0]} s={[0.06, 0.6, 0.4]} c={WOOD_DARK} />
          <Box p={[-0.8, 0.25, 0]} s={[0.4, 0.5, 0.4]} c="#7a3a4d" />
          <Box p={[-0.98, 0.55, 0]} s={[0.06, 0.6, 0.4]} c={WOOD_DARK} />
        </group>
      ))}
      {/* piano */}
      <group position={[1.1, 0, 10.9]}>
        <Box p={[0, 0.55, 0]} s={[1.0, 1.1, 2.0]} c="#2c1f33" />
        <Box p={[0.55, 0.78, 0]} s={[0.35, 0.06, 1.8]} c="#f2eee6" />
        {[-0.7, -0.35, 0, 0.35, 0.7].map(z => (
          <Box key={z} p={[0.6, 0.82, z]} s={[0.2, 0.04, 0.08]} c="#1b1026" cast={false} />
        ))}
        <Candelabra p={[0, 1.1, -0.6]} />
      </group>
    </group>
  );
}

// ─── garden / graveyard ──────────────────────────────────────────────────────
function Gravestone({ p, r = 0, kind = 0 }) {
  return (
    <group position={p} rotation={[0, r, (kind - 1) * 0.06]}>
      {kind === 2 ? (
        <group>
          <Box p={[0, 0.55, 0]} s={[0.14, 1.1, 0.14]} c="#9c96a8" />
          <Box p={[0, 0.75, 0]} s={[0.6, 0.14, 0.14]} c="#9c96a8" />
        </group>
      ) : (
        <group>
          <Box p={[0, 0.4, 0]} s={[0.6, 0.8, 0.18]} c="#8e889a" />
          <Cyl p={[0, 0.8, 0]} rt={0.3} h={0.18} seg={8} r={[Math.PI / 2, 0, 0]} c="#8e889a" />
        </group>
      )}
      <Rock p={[0, 0.05, 0.3]} rad={0.3} sc={[1.3, 0.3, 1]} c="#3d5e3a" />
    </group>
  );
}

function Pumpkin({ p, s = 1 }) {
  return (
    <group position={p} scale={s}>
      <Ball p={[0, 0.25, 0]} rad={0.32} w={8} hs={5} sc={[1, 0.8, 1]}
        mat={M('#ff8a1f', { emissive: '#ff5a00', intensity: 0.45 })} />
      <Cyl p={[0, 0.52, 0]} rt={0.04} h={0.14} seg={4} c="#3f6b2a" />
      <Box p={[0.1, 0.3, 0.29]} s={[0.07, 0.07, 0.02]} mat={FLAME} cast={false} />
      <Box p={[-0.1, 0.3, 0.29]} s={[0.07, 0.07, 0.02]} mat={FLAME} cast={false} />
      <Box p={[0, 0.17, 0.29]} s={[0.2, 0.04, 0.02]} mat={FLAME} cast={false} />
    </group>
  );
}

function DeadTree({ p, s = 1 }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 1, 0]} rt={0.12} rb={0.25} h={2} seg={5} c="#3b2a2f" />
      <Cyl p={[0.35, 1.8, 0]} rt={0.04} rb={0.09} h={1} seg={4} r={[0, 0, -0.8]} c="#3b2a2f" />
      <Cyl p={[-0.3, 2.0, 0.1]} rt={0.03} rb={0.08} h={0.9} seg={4} r={[0.2, 0, 0.9]} c="#3b2a2f" />
      <Cyl p={[0, 2.3, -0.2]} rt={0.03} rb={0.07} h={0.8} seg={4} r={[-0.6, 0, 0]} c="#3b2a2f" />
    </group>
  );
}

function Garden() {
  const fence = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);
  return (
    <group>
      <Box p={[8, -0.7, 10]} s={[46, 0.4, 40]} c="#28402f" cast={false} />
      {/* path from the gate to the entrance */}
      {Array.from({ length: 12 }, (_, i) => (
        <Cyl key={i} p={[12.9 + (rand(i + 7) - 0.5) * 0.8, -0.48, 12.9 + i * 0.6]} rt={0.35} h={0.05} seg={6}
          r={[0, rand(i) * 3, 0]} c="#6f6878" cast={false} />
      ))}
      <Gravestone p={[2, -0.5, 14]} r={0.2} />
      <Gravestone p={[4.2, -0.5, 15.6]} r={-0.1} kind={2} />
      <Gravestone p={[6.6, -0.5, 14.2]} r={0.1} kind={1} />
      <Gravestone p={[8.8, -0.5, 16.2]} r={-0.3} />
      <Gravestone p={[1.2, -0.5, 17.4]} r={0.4} kind={2} />
      <Gravestone p={[16.2, -0.5, 7]} r={-1.4} kind={1} />
      <Gravestone p={[17, -0.5, 10.5]} r={-1.7} />
      <Pumpkin p={[10.6, -0.5, 13.6]} />
      <Pumpkin p={[15.2, -0.5, 12.6]} s={1.3} />
      <Pumpkin p={[15.6, -0.5, 3.5]} s={0.9} />
      <Pumpkin p={[5.5, -0.5, 17.2]} s={1.1} />
      <DeadTree p={[16.8, -0.5, 1]} s={1.3} />
      <DeadTree p={[3, -0.5, 20]} s={1.1} />
      <DeadTree p={[17.5, -0.5, 16]} />
      <Rock p={[9.5, -0.3, 13.5]} rad={0.6} sc={[1.2, 0.8, 1]} c="#2f5a3f" />
      <Rock p={[15.3, -0.3, 14.5]} rad={0.7} sc={[1.3, 0.9, 1.1]} c="#35603f" />
      <Rock p={[0.5, -0.3, 13.5]} rad={0.8} sc={[1.4, 0.9, 1]} c="#2f5a3f" />
      <Rock p={[16, -0.3, 5.5]} rad={0.6} c="#4a3a5a" />
      {/* graveyard fence */}
      {fence.map(i => (
        <Box key={i} p={[i * 1.1 - 1, -0.1, 19.4]} s={[0.1, 0.9, 0.1]} c="#2a2230" />
      ))}
      <Box p={[6.2, 0.15, 19.4]} s={[15.4, 0.06, 0.06]} c="#2a2230" />
      {/* well */}
      <group position={[16.5, -0.5, 13.5]}>
        <Cyl p={[0, 0.35, 0]} rt={0.6} h={0.7} seg={8} c="#8e889a" />
        <Cyl p={[0, 0.66, 0]} rt={0.45} h={0.05} seg={8} mat={SLIME} cast={false} />
        <Box p={[0.55, 1.1, 0]} s={[0.1, 1.2, 0.1]} c={WOOD_DARK} />
        <Box p={[-0.55, 1.1, 0]} s={[0.1, 1.2, 0.1]} c={WOOD_DARK} />
        <Cone p={[0, 1.9, 0]} rad={0.85} h={0.5} seg={4} r={[0, Math.PI / 4, 0]} c={TRIM} />
      </group>
    </group>
  );
}

/** Moon, stars and floating wisps in the sky behind the hotel. */
function Sky() {
  const stars = useMemo(() => Array.from({ length: 40 }, (_, i) => [
    -14 + rand(i) * 18, 8 + rand(i + 40) * 10, -14 + rand(i + 80) * 18, i,
  ]), []);
  return (
    <group>
      <Ball p={[-9, 15, -9]} rad={2.2} w={10} hs={8} mat={M('#fff4c9', { emissive: '#fff0b0', intensity: 1.1 })} cast={false} />
      {stars.map(([x, y, z, k]) => (
        <Box key={k} p={[x, y, z]} s={[0.12, 0.12, 0.12]} r={[k, k, 0]}
          mat={M('#ffffff', { emissive: '#dfe8ff', intensity: 1.5 })} cast={false} receive={false} />
      ))}
    </group>
  );
}

export default function Hotel() {
  return (
    <group>
      <Shell />
      {ROOMS.map((_, i) => <Room key={i} index={i} />)}
      <Reception />
      <Bar />
      <Lounge />
      <Garden />
      <Sky />
    </group>
  );
}
