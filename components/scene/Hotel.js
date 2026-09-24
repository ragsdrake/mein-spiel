/**
 * The hotel building, shared by all themes: floor, cut-away walls, guest
 * rooms, reception, bar and lounge. Everything theme-specific (outside world,
 * wall tops, bar and lounge centrepieces, attractions) comes from the
 * exterior module of the active hotel.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import {
  ATTRACTION_SPOTS, BAR_MAX_LEVEL, P, RECEPTION_MAX_LEVEL, ROOMS, ROOM_MAX_LEVEL, barStools, barUpgradeCost,
  receptionUpgradeCost, roomUpgradeCost,
} from '../../game/config';
import { tapRoom, useSim } from '../../game/sim';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import Bed from './Beds';
import EXTERIORS from './exteriors';
import Street from './Street';
import { Candelabra, Candle, Cobweb, GOLD, Padlock, Painting, Table, Torch, Window } from './Props';
import { Ball, Blob, Box, Cyl, Halo, M, Rock } from './primitives';
import { useTheme } from './theme';

// ─── tap targets & upgrade markers ──────────────────────────────────────────
const MARKER_GREEN = M('#2ecc5a', { smooth: true, rough: 0.5 });
const MARKER_WHITE = M('#ffffff', { rough: 0.6 });

/** Floating green "upgrade available" badge, always facing the camera. */
function UpgradeMarker({ p, onPress }) {
  const ref = useRef();
  const { camera } = useThree();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.quaternion.copy(camera.quaternion);
    ref.current.position.y = p[1] + Math.abs(Math.sin(clock.elapsedTime * 3 + p[0])) * 0.18;
  });
  return (
    <group ref={ref} position={p} onClick={(e) => { e.stopPropagation(); onPress(); }}>
      <Cyl rt={0.34} h={0.08} seg={20} r={[Math.PI / 2, 0, 0]} mat={MARKER_GREEN} cast={false} />
      <Box p={[0, -0.07, 0.06]} s={[0.12, 0.24, 0.03]} mat={MARKER_WHITE} cast={false} />
      <mesh position={[0, 0.1, 0.06]} material={MARKER_WHITE}>
        <coneGeometry args={[0.17, 0.18, 3]} />
      </mesh>
      <mesh visible={false}><sphereGeometry args={[0.6, 6, 4]} /></mesh>
    </group>
  );
}

/** Invisible, flat tap area on the floor of a station. */
function TapArea({ p, s, onPress }) {
  return (
    <mesh position={p} visible={false} onClick={(e) => { e.stopPropagation(); onPress(); }}>
      <boxGeometry args={s} />
    </mesh>
  );
}

// ─── guest room ──────────────────────────────────────────────────────────────
function Room({ index }) {
  const theme = useTheme();
  const { palette } = theme;
  const level = useHotel(s => s.hotels[s.activeHotel].rooms[index]);
  const prevUnlocked = useHotel(s => index === 0 || s.hotels[s.activeHotel].rooms[index - 1] > 0);
  const hasCleaner = useHotel(s => s.hotels[s.activeHotel].staff.cleaner > 0);
  const dirty = useSim(s => s.dirty[index]);
  const openUpgrade = useUi(s => s.openUpgrade);
  const affordable = useHotel(s => {
    const lvl = s.hotels[s.activeHotel].rooms[index];
    return lvl > 0 && lvl < ROOM_MAX_LEVEL && s.coins >= roomUpgradeCost(index, lvl, s.activeDef().pm);
  });
  const open = () => openUpgrade('room', index);
  const def = ROOMS[index];
  const [cx, cz] = def.center;

  return (
    <group position={[cx, 0, cz]} rotation={[0, def.rot, 0]}>
      {level === 0 ? (
        <group>
          <Box p={[-0.4, 0.3, -0.5]} s={[0.6, 0.6, 0.6]} r={[0, 0.3, 0]} mat={M('#7a5234', { tx: 'planks', bump: 1 })} />
          <Box p={[0.3, 0.25, -0.7]} s={[0.5, 0.5, 0.5]} r={[0, -0.2, 0]} mat={M('#6b462c', { tx: 'planks', bump: 1 })} />
          <Box p={[-0.2, 0.8, -0.6]} s={[0.4, 0.4, 0.4]} r={[0, 0.7, 0]} mat={M('#8a603f', { tx: 'planks', bump: 1 })} />
          <Cobweb p={[0.9, 1.1, -1.35]} r={[0, 0, Math.PI / 4]} />
          <Cobweb p={[-1.2, 1.2, -1.35]} r={[0, 0, -Math.PI / 5]} s={0.7} />
          {prevUnlocked && <Padlock p={[0, 1.5, 0]} onPress={open} />}
        </group>
      ) : (
        <group>
          {/* accent rug, bed, and a fully furnished room from level 1 */}
          <Box p={[0, 0.025, 0.25]} s={[2.1, 0.02, 1.5]} mat={M(palette.rugHi)} cast={false} />
          <group position={[0, 0.03, -0.35]}>
            <Bed kind={theme.bed} level={level} />
          </group>
          <Box p={[1.15, 0.3, -1.05]} s={[0.45, 0.6, 0.4]} mat={M(palette.wood)} />
          <Candle p={[1.15, 0.6, -1.05]} />
          <group position={[-1.15, 0, -1.0]}>
            <Box p={[0, 0.75, 0]} s={[0.55, 1.5, 0.45]} mat={M(palette.woodDark)} />
            <Box p={[0, 0.75, 0.23]} s={[0.02, 1.3, 0.02]} mat={level >= 4 ? GOLD() : M(palette.wood)} cast={false} />
          </group>
          {/* armchair */}
          <group position={[1.1, 0, 0.95]} rotation={[0, -0.6, 0]}>
            <Box p={[0, 0.2, 0]} s={[0.55, 0.4, 0.5]} mat={M(palette.zoneLounge)} />
            <Box p={[0, 0.5, -0.2]} s={[0.55, 0.5, 0.12]} mat={M(palette.zoneLounge)} />
            <Box p={[0.25, 0.32, 0]} s={[0.08, 0.3, 0.5]} mat={M(palette.zoneLounge)} />
            <Box p={[-0.25, 0.32, 0]} s={[0.08, 0.3, 0.5]} mat={M(palette.zoneLounge)} />
          </group>
          {/* suitcase */}
          <group position={[-0.95, 0, 0.95]} rotation={[0, 0.4, 0]}>
            <Box p={[0, 0.22, 0]} s={[0.45, 0.42, 0.18]} mat={M(palette.zoneDesk)} />
            <Box p={[0, 0.47, 0]} s={[0.18, 0.06, 0.05]} mat={M('#2c2433')} />
          </group>
          {/* floor lamp */}
          <group position={[1.3, 0, -0.35]}>
            <Cyl p={[0, 0.5, 0]} rt={0.025} h={1} seg={5} c="#3a3440" />
            <Cyl p={[0, 1.05, 0]} rt={0.12} rb={0.2} h={0.22} seg={8} mat={M('#fff4d8', { emissive: '#ffe0a0', intensity: 0.5 })} />
          </group>
          {level >= 2 && <Painting p={[0, 1.8, -1.42]} hue={index % 2 ? '#40506e' : '#3c6b5a'} />}
          {level >= 6 && <Candelabra p={[-1.25, 0, 0.2]} gold />}
          {level >= 8 && (
            <group position={[-0.3, 0, 1.15]}>
              <Cyl p={[0, 0.2, 0]} rt={0.18} rb={0.13} h={0.4} seg={8} c="#8a4a8f" />
              <Rock p={[0, 0.6, 0]} rad={0.28} sc={[1, 1.3, 1]} c="#3fb84a" />
            </group>
          )}
          {level >= 10 && (
            <Ball p={[0, 2.3, 0]} rad={0.22} w={8} hs={6} mat={M('#f4fbff', { emissive: palette.windowGlow, intensity: 0.8 })} />
          )}
          {dirty && <Puddle index={index} showHint={!hasCleaner} color={palette.slime} />}
          <TapArea p={[0, 0.1, 0]} s={[2.8, 0.2, 2.8]} onPress={open} />
          {affordable && !dirty && <UpgradeMarker p={[0.9, 1.9, 0.6]} onPress={open} />}
        </group>
      )}
    </group>
  );
}

function Puddle({ index, showHint, color }) {
  const hint = useRef();
  useFrame(({ clock }) => {
    if (hint.current) hint.current.position.y = 1.4 + Math.sin(clock.elapsedTime * 4) * 0.08;
  });
  const slime = M(color, { emissive: color, intensity: 0.8, opacity: 0.85, rough: 0.1 });
  const press = (e) => { e.stopPropagation(); tapRoom(index); };
  return (
    <group position={[0.2, 0, 0.55]} onClick={press}>
      <Cyl p={[0, 0.05, 0]} rt={0.45} h={0.03} seg={9} mat={slime} cast={false} />
      <Cyl p={[0.45, 0.05, 0.2]} rt={0.22} h={0.03} seg={7} mat={slime} cast={false} />
      <Cyl p={[-0.35, 0.05, 0.3]} rt={0.16} h={0.03} seg={6} mat={slime} cast={false} />
      <Ball p={[0.1, 0.1, 0]} rad={0.08} w={6} hs={4} mat={slime} cast={false} />
      <Halo p={[0, 0.07, 0]} size={1.4} color={color} opacity={0.3} />
      {showHint && (
        <group ref={hint} position={[0, 1.4, 0]}>
          <Ball rad={0.28} w={10} hs={8} mat={M('#ffffff', { emissive: '#ffffff', intensity: 0.3, smooth: true })} cast={false} />
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
/** Floor zones: one strong colour per area, like the tycoon references. */
const ZONES = [
  // rooms along the back wall and the left wall
  ['zoneRoom', 0, 3.5, 0, 3.2], ['zoneRoom', 3.5, 6.5, 0, 3.2], ['zoneRoom', 6.5, 9.5, 0, 3.2], ['zoneRoom', 9.5, 12.5, 0, 3.2],
  ['zoneRoom', 0, 3.2, 3.6, 6.7], ['zoneRoom', 0, 3.2, 6.7, 9.7],
  ['zoneBar', 4.4, 10.8, 4.4, 7.3],
  ['zoneLounge', 4.4, 9.2, 7.7, 12],
  ['zoneDesk', 8.6, 11.4, 8.1, 12],
];

const WALL_H = 2.8;
const WALL_T = 0.5;

function Shell({ Ext }) {
  const { palette } = useTheme();
  const wall = M(palette.wall);
  const cap = M(palette.wallTop);
  const base = M(palette.woodDark);

  return (
    <group>
      {/* foundation + neutral floor + coloured zones (small inset = visible seams) */}
      <Box p={[7, -0.45, 6]} s={[14.8, 0.7, 12.8]} mat={M(palette.wall)} />
      <Box p={[7, -0.05, 6]} s={[14, 0.1, 12]} mat={M(palette.floorA, { tx: palette.floorTex, rx: 7, ry: 6 })} cast={false} />
      {ZONES.map(([key, x0, x1, z0, z1], i) => (
        <Box key={i} p={[(x0 + x1) / 2, 0.005, (z0 + z1) / 2]} s={[x1 - x0 - 0.08, 0.02, z1 - z0 - 0.08]}
          mat={M(palette[key], { tx: 'cleanTiles', rx: Math.round(x1 - x0), ry: Math.round(z1 - z0) })} cast={false} />
      ))}

      {/* back wall (z = 0): thick, low, light top cap shows the cut */}
      <Box p={[7, WALL_H / 2, -WALL_T / 2]} s={[14 + WALL_T, WALL_H, WALL_T]} mat={wall} />
      <Box p={[7, WALL_H + 0.04, -WALL_T / 2]} s={[14 + WALL_T + 0.04, 0.08, WALL_T + 0.04]} mat={cap} />
      <Box p={[7, 0.1, 0.02]} s={[14, 0.2, 0.05]} mat={base} cast={false} />
      {[2, 5, 8, 11].map(x => <Window key={x} p={[x, 1.75, 0.03]} />)}
      <Torch p={[6.5, 1.9, 0.04]} />
      <Torch p={[12.5, 1.9, 0.04]} />

      {/* left wall (x = 0) */}
      <Box p={[-WALL_T / 2, WALL_H / 2, 6]} s={[WALL_T, WALL_H, 12]} mat={wall} />
      <Box p={[-WALL_T / 2, WALL_H + 0.04, 6]} s={[WALL_T + 0.04, 0.08, 12.04]} mat={cap} />
      <Box p={[0.02, 0.1, 6]} s={[0.05, 0.2, 12]} mat={base} cast={false} />
      {[5.2, 8.2, 10.9].map(z => <Window key={z} p={[0.03, 1.75, z]} r={[0, Math.PI / 2, 0]} />)}

      {Ext.WallTop && <Ext.WallTop />}

      {/* room dividers */}
      {[3.5, 6.5, 9.5, 12.5].map(x => (
        <group key={x}>
          <Box p={[x, 0.6, 1.6]} s={[0.3, 1.2, 3.2]} mat={wall} />
          <Box p={[x, 1.23, 1.6]} s={[0.34, 0.06, 3.24]} mat={cap} />
        </group>
      ))}
      {[3.6, 6.7, 9.7].map(z => (
        <group key={z}>
          <Box p={[1.6, 0.6, z]} s={[3.2, 1.2, 0.3]} mat={wall} />
          <Box p={[1.6, 1.23, z]} s={[3.24, 0.06, 0.34]} mat={cap} />
        </group>
      ))}

      {/* low front walls with the entrance gap (x 11.8 … 13.9) */}
      <Box p={[5.9, 0.35, 12.2]} s={[11.8, 0.7, 0.4]} mat={wall} />
      <Box p={[5.9, 0.73, 12.2]} s={[11.84, 0.06, 0.44]} mat={cap} />
      <Box p={[14.2, 0.35, 6]} s={[0.4, 0.7, 12.4]} mat={wall} />
      <Box p={[14.2, 0.73, 6]} s={[0.44, 0.06, 12.44]} mat={cap} />
      {[11.8, 13.95].map(x => (
        <group key={x}>
          <Box p={[x, 0.7, 12.2]} s={[0.4, 1.4, 0.4]} mat={wall} />
          <Box p={[x, 1.43, 12.2]} s={[0.44, 0.06, 0.44]} mat={cap} />
          <Cyl p={[x, 1.58, 12.2]} rt={0.14} rb={0.1} h={0.22} seg={6} c="#2c2433" />
          <Ball p={[x, 1.6, 12.2]} rad={0.09} w={6} hs={4} mat={M('#fff1b8', { emissive: palette.warm, intensity: 1 })} cast={false} />
        </group>
      ))}

      <Stairs />
    </group>
  );
}

function Stairs() {
  const { palette } = useTheme();
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => {
        const h = 0.4 * (i + 1);
        return (
          <Box key={i} p={[13.3, h / 2, 3.0 - i * 0.38]} s={[1.3, h, 0.4]}
            mat={M(i % 2 ? palette.wood : palette.woodDark, { tx: 'planks', bump: 0.8 })} />
        );
      })}
      <Box p={[12.62, 1.7, 1.6]} s={[0.1, 0.1, 3.4]} r={[0.83, 0, 0]} mat={M(palette.trim)} />
      {[3.1, 2.1, 1.1].map((z, i) => (
        <Box key={z} p={[12.62, 0.8 + i * 1.1, z]} s={[0.1, 1.2, 0.1]} mat={M(palette.woodDark)} />
      ))}
    </group>
  );
}

// ─── reception ───────────────────────────────────────────────────────────────
function Reception() {
  const { palette } = useTheme();
  const openUpgrade = useUi(s => s.openUpgrade);
  const affordable = useHotel(s => {
    const lvl = s.hotels[s.activeHotel].receptionLevel;
    return lvl < RECEPTION_MAX_LEVEL && s.coins >= receptionUpgradeCost(lvl, s.activeDef().pm);
  });
  const open = () => openUpgrade('reception');
  const wood = M(palette.wood, { tx: 'planks', rx: 1, ry: 2, bump: 1 });
  return (
    <group>
      <Box p={[10, 0.5, 9.6]} s={[0.8, 1.0, 2.6]} mat={wood} />
      <Box p={[10.42, 0.5, 9.6]} s={[0.04, 0.7, 2.2]} mat={M(palette.woodDark)} cast={false} />
      <Box p={[10.43, 0.5, 9.6]} s={[0.03, 0.1, 2.2]} mat={GOLD()} cast={false} />
      <Box p={[10, 1.05, 9.6]} s={[1.0, 0.1, 2.8]} mat={M(palette.trim, { rough: 0.4 })} />
      <group position={[10.1, 1.1, 9.0]}>
        <Cyl p={[0, 0.02, 0]} rt={0.12} h={0.04} seg={10} c="#2c2433" />
        <Ball p={[0, 0.08, 0]} rad={0.1} w={10} hs={6} mat={GOLD()} />
      </group>
      <Box p={[9.95, 1.13, 10.1]} s={[0.4, 0.06, 0.55]} r={[0, 0.2, 0]} c="#7a2433" />
      <Candle p={[9.9, 1.1, 10.7]} h={0.3} />
      <group position={[8.7, 0, 9.6]}>
        <Box p={[0, 0.9, 0]} s={[0.25, 1.8, 1.6]} mat={M(palette.woodDark, { tx: 'planks', bump: 0.8 })} />
        {[-0.5, 0, 0.5].map(z => [1.3, 0.9].map(y => (
          <Ball key={`${z}${y}`} p={[0.15, y, z]} rad={0.06} w={5} hs={4} mat={GOLD()} />
        )))}
      </group>
      <Halo p={[10.2, 0.04, 9.6]} size={3.5} color={palette.warm} opacity={0.18} />
      <TapArea p={[9.6, 0.6, 9.6]} s={[1.6, 1.2, 2.8]} onPress={open} />
      {affordable && <UpgradeMarker p={[10, 2.4, 9.6]} onPress={open} />}
    </group>
  );
}

// ─── bar ─────────────────────────────────────────────────────────────────────
function Bar({ Ext }) {
  const { palette } = useTheme();
  const level = useHotel(s => s.hotels[s.activeHotel].barLevel);
  const openUpgrade = useUi(s => s.openUpgrade);
  const affordable = useHotel(s => {
    const lvl = s.hotels[s.activeHotel].barLevel;
    return lvl > 0 && lvl < BAR_MAX_LEVEL && s.coins >= barUpgradeCost(lvl, s.activeDef().pm);
  });
  const open = () => openUpgrade('bar');
  const stools = level > 0 ? barStools(level) : 0;
  const wood = M(palette.wood, { tx: 'planks', rx: 4, bump: 1 });
  const top = M(palette.trim, { rough: 0.3, metal: 0.1 });

  return (
    <group>
      <Box p={[6.9, 0.5, 5.3]} s={[4.6, 1.0, 0.8]} mat={wood} />
      <Box p={[6.9, 0.5, 5.71]} s={[4.3, 0.12, 0.04]} mat={GOLD()} cast={false} />
      <Box p={[6.9, 1.05, 5.3]} s={[4.8, 0.1, 1.0]} mat={top} />
      <Box p={[9.4, 0.5, 4.75]} s={[0.8, 1.0, 1.9]} mat={wood} />
      <Box p={[9.4, 1.05, 4.75]} s={[1.0, 0.1, 2.1]} mat={top} />

      {level === 0 ? (
        <group>
          <Box p={[6.9, 1.2, 5.3]} s={[4.7, 0.2, 1.05]} mat={M('#a9a3b3', { tx: 'fabric' })} />
          <Padlock p={[6.9, 2.1, 5.3]} onPress={open} />
        </group>
      ) : (
        <group>
          {[5.0, 5.3, 5.6, 7.9, 8.3].map((x, i) => (
            <group key={x} position={[x, 1.1, 5.1]}>
              <Cyl p={[0, 0.16, 0]} rt={0.07} h={0.32} seg={8}
                mat={M(['#3fb8a0', '#7a3ac0', '#c03a5a', '#3a7ac0', '#b8a03f'][i], { rough: 0.15, opacity: 0.85 })} />
              <Cyl p={[0, 0.38, 0]} rt={0.03} h={0.12} seg={6} c="#2c2433" />
            </group>
          ))}
          <Ext.BarPiece level={level} />
          {level >= 3 && <Candelabra p={[5.2, 1.1, 5.4]} gold={level >= 6} />}
          <Halo p={[7, 0.04, 6]} size={4} color={palette.accentLight} opacity={0.12} />
        </group>
      )}

      <TapArea p={[7.2, 0.6, 5.1]} s={[5.2, 1.2, 1.4]} onPress={open} />
      {affordable && <UpgradeMarker p={[7.2, 2.2, 5.3]} onPress={open} />}
      {P.stools.slice(0, stools).map(([x, z]) => (
        <group key={x} position={[x, 0, z]}>
          <Cyl p={[0, 0.3, 0]} rt={0.05} h={0.6} seg={6} mat={M('#2c2433', { metal: 0.6, rough: 0.4 })} />
          <Cyl p={[0, 0.62, 0]} rt={0.22} h={0.08} seg={10} mat={M(palette.rugHi, { tx: 'fabric' })} />
          <Blob p={[0, 0.03, 0]} size={0.7} />
        </group>
      ))}
    </group>
  );
}

// ─── lounge ──────────────────────────────────────────────────────────────────
function Lounge({ Ext }) {
  const { palette } = useTheme();
  return (
    <group>
      <Table p={[6.5, 0, 9.2]} />
      <Table p={[8.2, 0, 11.1]} />
      <Table p={[5.3, 0, 11.3]} />
      <Ext.LoungePiece />
      {/* waiting sofa + coffee table */}
      <group position={[3.2, 0, 11.4]} rotation={[0, Math.PI, 0]}>
        <Box p={[0, 0.22, 0]} s={[1.6, 0.44, 0.6]} mat={M(palette.zoneDesk)} />
        <Box p={[0, 0.55, 0.24]} s={[1.6, 0.5, 0.14]} mat={M(palette.zoneDesk)} />
        <Box p={[0.76, 0.36, 0]} s={[0.1, 0.3, 0.6]} mat={M(palette.zoneDesk)} />
        <Box p={[-0.76, 0.36, 0]} s={[0.1, 0.3, 0.6]} mat={M(palette.zoneDesk)} />
        <Blob p={[0, 0.02, 0]} size={1.8} />
      </group>
      <Box p={[3.2, 0.2, 10.5]} s={[0.9, 0.08, 0.5]} mat={M(palette.wood)} />
      <Box p={[3.2, 0.1, 10.5]} s={[0.7, 0.2, 0.3]} mat={M(palette.woodDark)} />
      {/* potted plants in the corners of the zones */}
      {[[4.2, 7.9], [9.3, 11.6], [11.3, 7.9], [3.8, 4.2]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <Cyl p={[0, 0.2, 0]} rt={0.2} rb={0.15} h={0.4} seg={6} mat={M(palette.wallTop)} />
          <Rock p={[0, 0.62, 0]} rad={0.3} sc={[1, 1.2, 1]} c="#3fb84a" />
          <Blob p={[0, 0.02, 0]} size={0.7} />
        </group>
      ))}
    </group>
  );
}

function Attractions({ Ext }) {
  const levels = useHotel(s => s.hotels[s.activeHotel].attractions);
  return Ext.attractions.map((A, i) => (levels[i] > 0 ? (
    <group key={i} position={[ATTRACTION_SPOTS[i][0], -0.5, ATTRACTION_SPOTS[i][1]]}>
      <A level={levels[i]} />
    </group>
  ) : null));
}

export default function Hotel() {
  const theme = useTheme();
  const Ext = EXTERIORS[theme.id];
  return (
    <group>
      <Shell Ext={Ext} />
      {ROOMS.map((_, i) => <Room key={i} index={i} />)}
      <Reception />
      <Bar Ext={Ext} />
      <Lounge Ext={Ext} />
      <Ext.Outside />
      <Street />
      <Attractions Ext={Ext} />
    </group>
  );
}
