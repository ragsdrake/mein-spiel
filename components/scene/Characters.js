/**
 * Low-poly characters: the ghost guests (one look per guest type) and the
 * hotel staff. All models face +z and stand on y = 0.
 */

import { useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import { getGuestType } from '../../game/config';
import { Ball, Box, Cone, Cyl, M } from './primitives';

const INK   = '#1b1026';
const BONE  = '#efe7d2';
const GOLD  = '#ffc94a';

/** Per-ghost materials so each ghost can fade in/out on its own. */
export function useGhostMaterials(typeId) {
  return useMemo(() => {
    const t = getGuestType(typeId);
    const make = (color, emissive, ei) => new MeshStandardMaterial({
      color, flatShading: true, roughness: 0.6, transparent: true, opacity: 0,
      emissive, emissiveIntensity: ei,
    });
    return {
      body: make(t.color, t.glow, 0.35),
      ink:  make(INK, '#000000', 0),
      cheek: make('#ff9ac1', '#ff9ac1', 0.2),
    };
  }, [typeId]);
}

const TAILS = Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2);

export function Ghost({ type, mats }) {
  const headless = type === 'ritter';
  return (
    <group>
      {/* body */}
      {!headless && <Ball p={[0, 0.78, 0]} rad={0.34} w={8} hs={6} sc={[1, 1.08, 1]} mat={mats.body} />}
      {headless && <Cyl p={[0, 0.82, 0]} rt={0.2} rb={0.3} h={0.16} seg={8} c="#9aa7b4" />}
      <Cyl p={[0, 0.5, 0]} rt={0.34} rb={0.43} h={0.56} seg={8} open mat={mats.body} />
      {TAILS.map(a => (
        <Cone key={a} p={[Math.sin(a) * 0.35, 0.16, Math.cos(a) * 0.35]} rad={0.1} h={0.24} seg={4}
          r={[Math.PI, 0, 0]} mat={mats.body} />
      ))}
      {/* arms */}
      <Ball p={[0.4, 0.55, 0.08]} rad={0.1} w={5} hs={4} mat={mats.body} />
      <Ball p={[-0.4, 0.55, 0.08]} rad={0.1} w={5} hs={4} mat={mats.body} />

      {/* face */}
      {!headless && (
        <group>
          <Ball p={[0.12, 0.83, 0.3]} rad={0.055} w={5} hs={4} sc={[1, 1.5, 0.6]} mat={mats.ink} cast={false} />
          <Ball p={[-0.12, 0.83, 0.3]} rad={0.055} w={5} hs={4} sc={[1, 1.5, 0.6]} mat={mats.ink} cast={false} />
          <Ball p={[0, 0.68, 0.33]} rad={type === 'banshee' ? 0.07 : 0.04} w={5} hs={4} sc={[1.2, 0.9, 0.5]}
            mat={mats.ink} cast={false} />
          <Ball p={[0.21, 0.72, 0.26]} rad={0.045} w={5} hs={3} sc={[1, 0.6, 0.5]} mat={mats.cheek} cast={false} />
          <Ball p={[-0.21, 0.72, 0.26]} rad={0.045} w={5} hs={3} sc={[1, 0.6, 0.5]} mat={mats.cheek} cast={false} />
        </group>
      )}

      {type === 'poltergeist' && (
        <group>
          {[0, 1, 2].map(i => (
            <mesh key={i} position={[0.45, 0.42 - i * 0.12, 0.1]} rotation={[0, i % 2 ? Math.PI / 2 : 0, 0]}
              material={M('#8b8f9c', { metal: 0.6, rough: 0.4 })}>
              <torusGeometry args={[0.06, 0.02, 4, 6]} />
            </mesh>
          ))}
          <Box p={[0.45, 0.08, 0.1]} s={[0.18, 0.18, 0.18]} c="#4b4f5c" />
        </group>
      )}

      {type === 'banshee' && (
        <group>
          <Cone p={[0, 0.66, -0.16]} rad={0.36} h={0.95} seg={7} c="#7f9cff" />
          <Cone p={[0, 1.08, -0.02]} rad={0.3} h={0.22} seg={7} r={[-0.3, 0, 0]} c="#7f9cff" />
        </group>
      )}

      {type === 'graf' && (
        <group>
          <Cyl p={[0, 1.13, 0]} rt={0.3} h={0.03} seg={10} c={INK} />
          <Cyl p={[0, 1.3, 0]} rt={0.18} rb={0.19} h={0.32} seg={10} c={INK} />
          <Cyl p={[0, 1.18, 0]} rt={0.195} h={0.06} seg={10} c="#b02a4a" />
          <mesh position={[0, 0.55, -0.02]} rotation={[0, Math.PI, 0]} material={M('#5a1d6e')} castShadow>
            <coneGeometry args={[0.5, 0.9, 8, 1, true, -Math.PI / 2, Math.PI]} />
          </mesh>
          <mesh position={[0.12, 0.84, 0.31]} material={M(GOLD, { metal: 0.7, rough: 0.3 })}>
            <torusGeometry args={[0.075, 0.015, 4, 8]} />
          </mesh>
        </group>
      )}

      {type === 'ritter' && (
        <group>
          {/* armour plate + the head he carries under his arm */}
          <Cyl p={[0, 0.58, 0.02]} rt={0.36} rb={0.4} h={0.36} seg={8} c="#aeb8c4" mat={M('#aeb8c4', { metal: 0.6, rough: 0.35 })} />
          <group position={[0.42, 0.62, 0.22]}>
            <Ball rad={0.17} w={7} hs={5} c="#9aa7b4" mat={M('#9aa7b4', { metal: 0.6, rough: 0.35 })} />
            <Box p={[0, 0.02, 0.15]} s={[0.2, 0.04, 0.04]} c={INK} cast={false} />
            <Cone p={[0, 0.2, -0.02]} rad={0.05} h={0.2} seg={4} c="#d23c3c" />
          </group>
        </group>
      )}

      {type === 'koenigin' && (
        <group>
          <Cyl p={[0, 1.15, 0]} rt={0.2} rb={0.18} h={0.12} seg={8} mat={M(GOLD, { metal: 0.7, rough: 0.3, emissive: '#ffb300', intensity: 0.3 })} />
          {[0, 1, 2, 3, 4].map(i => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <Cone key={i} p={[Math.sin(a) * 0.17, 1.26, Math.cos(a) * 0.17]} rad={0.045} h={0.12} seg={4}
                mat={M(GOLD, { metal: 0.7, rough: 0.3, emissive: '#ffb300', intensity: 0.3 })} />
            );
          })}
          <Ball p={[0, 1.18, 0.19]} rad={0.035} w={4} hs={3} mat={M('#ff3b7a', { emissive: '#ff3b7a', intensity: 0.8 })} />
          <mesh position={[0, 0.5, -0.02]} rotation={[0, Math.PI, 0]} material={M('#a8243d')} castShadow>
            <coneGeometry args={[0.52, 0.8, 8, 1, true, -Math.PI / 2, Math.PI]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Skeleton receptionist with bow tie. */
export function Skeleton() {
  return (
    <group>
      <Box p={[0.1, 0.35, 0]} s={[0.07, 0.7, 0.07]} c={BONE} />
      <Box p={[-0.1, 0.35, 0]} s={[0.07, 0.7, 0.07]} c={BONE} />
      <Box p={[0, 0.72, 0]} s={[0.34, 0.1, 0.18]} c={BONE} />
      <Cyl p={[0, 0.95, 0]} rt={0.03} h={0.5} seg={4} c={BONE} />
      {[1.08, 0.97, 0.86].map((y, i) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={M(BONE)} castShadow>
          <torusGeometry args={[0.17 - i * 0.02, 0.025, 4, 8]} />
        </mesh>
      ))}
      <Box p={[0.25, 1.0, 0.06]} s={[0.06, 0.4, 0.06]} r={[0.5, 0, 0.2]} c={BONE} />
      <Box p={[-0.25, 1.0, 0.06]} s={[0.06, 0.4, 0.06]} r={[0.5, 0, -0.2]} c={BONE} />
      <Ball p={[0, 1.42, 0]} rad={0.22} w={7} hs={5} c={BONE} />
      <Box p={[0, 1.24, 0.06]} s={[0.22, 0.1, 0.2]} c={BONE} />
      <Ball p={[0.08, 1.44, 0.18]} rad={0.055} w={5} hs={4} c={INK} cast={false} />
      <Ball p={[-0.08, 1.44, 0.18]} rad={0.055} w={5} hs={4} c={INK} cast={false} />
      <Cone p={[0, 1.36, 0.21]} rad={0.03} h={0.05} seg={3} r={[Math.PI, 0, 0]} c={INK} cast={false} />
      {/* bow tie */}
      <Cone p={[0.06, 1.16, 0.12]} rad={0.05} h={0.1} seg={4} r={[0, 0, Math.PI / 2]} c="#d2283f" />
      <Cone p={[-0.06, 1.16, 0.12]} rad={0.05} h={0.1} seg={4} r={[0, 0, -Math.PI / 2]} c="#d2283f" />
      {/* tiny top hat */}
      <Cyl p={[0.03, 1.66, 0]} rt={0.2} h={0.025} seg={10} r={[0, 0, -0.15]} c={INK} />
      <Cyl p={[0.05, 1.77, 0]} rt={0.12} h={0.2} seg={10} r={[0, 0, -0.15]} c={INK} />
    </group>
  );
}

/** Bar witch with pointy hat and ladle. */
export function Witch() {
  return (
    <group>
      <Cone p={[0, 0.5, 0]} rad={0.42} h={1.0} seg={8} c="#4b2a6a" />
      <Cyl p={[0, 0.2, 0]} rt={0.4} rb={0.44} h={0.08} seg={8} c="#2c173f" />
      <Ball p={[0, 1.15, 0]} rad={0.21} w={7} hs={5} c="#8fd16a" />
      <Cone p={[0, 1.12, 0.24]} rad={0.05} h={0.16} seg={4} r={[Math.PI / 2, 0, 0]} c="#7ab85a" />
      <Ball p={[0.08, 1.2, 0.18]} rad={0.035} w={4} hs={3} c={INK} cast={false} />
      <Ball p={[-0.08, 1.2, 0.18]} rad={0.035} w={4} hs={3} c={INK} cast={false} />
      <Cone p={[0.2, 1.02, -0.05]} rad={0.1} h={0.4} seg={5} c="#ff7a2e" />
      <Cone p={[-0.2, 1.02, -0.05]} rad={0.1} h={0.4} seg={5} c="#ff7a2e" />
      <Cyl p={[0, 1.32, 0]} rt={0.4} h={0.04} seg={10} c="#231333" />
      <Cyl p={[0, 1.37, 0]} rt={0.21} h={0.07} seg={10} c="#ff7a2e" />
      <Cone p={[0.05, 1.66, -0.03]} rad={0.21} h={0.6} seg={8} r={[-0.25, 0, -0.2]} c="#231333" />
      {/* arms + ladle */}
      <Box p={[0.3, 0.8, 0.14]} s={[0.1, 0.36, 0.1]} r={[0.9, 0, 0.3]} c="#4b2a6a" />
      <Box p={[-0.3, 0.8, 0.14]} s={[0.1, 0.36, 0.1]} r={[0.9, 0, -0.3]} c="#4b2a6a" />
      <Box p={[0.34, 0.9, 0.36]} s={[0.03, 0.03, 0.4]} r={[-0.6, 0, 0]} c="#8b5a33" />
      <Ball p={[0.34, 0.78, 0.52]} rad={0.06} w={5} hs={3} c="#5b5f6a" />
    </group>
  );
}

/** Zombie housekeeper with mop. */
export function Zombie() {
  return (
    <group>
      <Box p={[0.11, 0.25, 0]} s={[0.16, 0.5, 0.16]} c="#34456b" />
      <Box p={[-0.11, 0.25, 0]} s={[0.16, 0.5, 0.16]} c="#34456b" />
      <Box p={[0, 0.78, 0]} s={[0.46, 0.56, 0.3]} c="#3f8f86" />
      <Box p={[0.12, 0.6, 0.155]} s={[0.12, 0.12, 0.02]} c="#2d6b64" cast={false} />
      <Box p={[0, 1.24, 0.02]} s={[0.36, 0.36, 0.34]} c="#8fbf6a" />
      <Box p={[0.09, 1.28, 0.19]} s={[0.1, 0.1, 0.02]} c="#ffffff" cast={false} />
      <Box p={[0.09, 1.28, 0.2]} s={[0.04, 0.04, 0.02]} c={INK} cast={false} />
      <Box p={[-0.09, 1.3, 0.19]} s={[0.06, 0.05, 0.02]} c={INK} cast={false} />
      <Box p={[0, 1.15, 0.19]} s={[0.16, 0.03, 0.02]} c="#4a2a2a" cast={false} />
      <Box p={[0, 1.44, 0.02]} s={[0.38, 0.06, 0.36]} c="#55733f" />
      {/* arms reaching forward */}
      <Box p={[0.28, 0.95, 0.22]} s={[0.12, 0.12, 0.46]} c="#8fbf6a" />
      <Box p={[-0.28, 0.95, 0.22]} s={[0.12, 0.12, 0.46]} c="#8fbf6a" />
      {/* mop */}
      <Box p={[0.3, 0.6, 0.45]} s={[0.04, 1.2, 0.04]} r={[0.35, 0, 0]} c="#8b5a33" />
      <Box p={[0.3, 0.05, 0.64]} s={[0.3, 0.1, 0.16]} c="#cfd3d9" />
    </group>
  );
}
