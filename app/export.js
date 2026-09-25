/**
 * Dev tool: /export?hotel=nachtruh
 * Builds a hotel's 3D model (the modelling source of the pre-rendered
 * sprites) and exposes `window.__exportGLB()` which returns it as a binary
 * glTF (base64). tools/sprites/ drives this with Playwright and renders the
 * result in Blender. Not linked from the game.
 */

import { Canvas, useThree } from '@react-three/fiber';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import Character, { FLOATING } from '../components/scene/Blocky';
import { Construction } from '../components/scene/anim';
import Hotel from '../components/scene/Hotel';
import { Vehicle } from '../components/scene/Street';
import { Part } from '../components/scene/parts';
import { RENDER_MODE } from '../components/scene/primitives';
import { ThemeContext } from '../components/scene/theme';
import { intro } from '../game/fx';
import { getHotel } from '../game/hotels';
import useHotel from '../game/store';

RENDER_MODE.export = true;
intro.hold = false;

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function Probe() {
  const { scene } = useThree();
  useEffect(() => {
    window.__exportGLB = async (name) => {
      const root = name ? scene.getObjectByName(name) : scene;
      const glb = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true });
      return toBase64(glb);
    };
    window.__exportReady = true;
  }, [scene]);
  return null;
}

// ─── character sheet: every guest/staff model in every pose and direction ────
const CHAR_SCALE = 1.2;
const POSES = [['idle', { swing: 0 }], ['walkA', { swing: 0.6 }], ['walkB', { swing: -0.6 }], ['sit', { sit: true }], ['lie', { swing: 0 }]];
const DIRS = [['pz', 0], ['px', Math.PI / 2], ['nz', Math.PI], ['nx', -Math.PI / 2]];

function CharacterSheet({ def }) {
  const defs = [
    ...def.guests,
    ...Object.entries(def.staff).map(([role, st]) => ({ ...st, id: `staff-${role}` })),
  ];
  const cells = [];
  defs.forEach((d, row) => {
    const floats = FLOATING.has(d.model);
    POSES.forEach(([pose, p], pi) => {
      if (floats && pose !== 'idle') return;
      DIRS.forEach(([dir, ry], di) => {
        const x = (pi * 4 + di) * 3;
        const z = row * 3;
        const motion = { current: { moving: false, pose: p } };
        const lie = pose === 'lie';
        cells.push(
          <Part key={`${d.id}-${pose}-${dir}`} id={`char-${d.id}-${pose}-${dir}`} station="char"
            extra={{ ox: x, oz: z }} position={[x, 0, z]} rotation={[0, ry, 0]}>
            <group rotation={[lie ? -Math.PI / 2 : 0, 0, 0]} position={[0, 0, lie ? 0.55 : 0]} scale={CHAR_SCALE}>
              <Character def={d} motion={motion} />
            </group>
          </Part>,
        );
      });
    });
  });
  // traffic cars (two driving directions) and the construction sites
  const row = defs.length;
  (def.palette.cars ?? []).forEach((color, i) => {
    [['px', 0], ['nx', Math.PI]].forEach(([dir, ry], di) => {
      const x = (i * 2 + di) * 4;
      const z = row * 3 + 2;
      cells.push(
        <Part key={`car${i}${dir}`} id={`char-car${i}-idle-${dir}`} station="char" extra={{ ox: x, oz: z }}
          position={[x, 0, z]} rotation={[0, ry, 0]}>
          <Vehicle color={color} />
        </Part>,
      );
    });
  });
  [['room', 2.8, 2.8, 2], ['bar', 5.2, 1.9, 1.8], ['attr', 2.6, 2.6, 2.4]].forEach(([kind, w, d, h], i) => {
    const x = i * 8;
    const z = row * 3 + 8;
    cells.push(
      <Part key={`build-${kind}`} id={`char-build-${kind}-idle-pz`} station="char" extra={{ ox: x, oz: z }} position={[x, 0, z]}>
        <Construction w={w} d={d} h={h} />
      </Part>,
    );
  });
  return cells;
}

export default function ExportScreen() {
  const { hotel = 'nachtruh', level = '10', doors, chars } = useLocalSearchParams();
  RENDER_MODE.doorsOpen = doors === 'open';
  const def = getHotel(hotel);
  const [ready] = useState(() => {
    const lvl = Number(level);
    useHotel.setState(s => ({
      activeHotel: def.id,
      hotels: {
        ...s.hotels,
        [def.id]: {
          ...s.hotels[def.id],
          unlocked: true,
          rooms: def.rooms.map(() => lvl),
          barLevel: lvl, receptionLevel: Math.max(1, lvl), attractions: [0, 1, 2].map(() => Math.min(3, lvl)),
        },
      },
    }));
    return true;
  });
  if (!ready) return null;
  return (
    <View style={styles.root}>
      <Canvas orthographic camera={{ position: [60, 60, 60], zoom: 14 }} style={styles.root}>
        <ThemeContext.Provider value={def}>
          <ambientLight intensity={1} />
          <group name="hotel">{chars ? <CharacterSheet def={def} /> : <Hotel />}</group>
          <Probe />
        </ThemeContext.Provider>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#222' } });
