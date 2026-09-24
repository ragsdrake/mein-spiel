/**
 * Low-poly characters for all hotels: guests (by `model` id from
 * game/hotels.js) and staff. All models face +z and stand on y = 0.
 */

import { Ball, Box, Cone, Cyl, M, RimM, Sprite, Torus } from './primitives';

const INK   = '#1b1026';
const BONE  = '#efe7d2';
const ink = () => M(INK, { rough: 0.3 });
const gold = () => M('#ffc94a', { metal: 0.85, rough: 0.28 });
const glowEye = (c) => M(c, { emissive: c, intensity: 3 });

/** Models that hover instead of walking. */
export const FLOATING = new Set(['ghost', 'bat', 'snowSprite']);

// ─── shared parts ────────────────────────────────────────────────────────────
function Eyes({ y, z, gap = 0.08, r = 0.04, mat, tall = 1.2 }) {
  const m = mat ?? ink();
  return (
    <group>
      <Ball p={[gap, y, z]} rad={r} w={6} hs={4} sc={[1, tall, 0.6]} mat={m} cast={false} />
      <Ball p={[-gap, y, z]} rad={r} w={6} hs={4} sc={[1, tall, 0.6]} mat={m} cast={false} />
    </group>
  );
}

/** Generic stylised humanoid: robe/body, head, arms. */
function Body({ robe, skin, h = 1, headR = 0.22, robeR = 0.36, narrow = 0.2, arms = robe }) {
  return (
    <group>
      <Cyl p={[0, 0.45 * h, 0]} rt={narrow} rb={robeR} h={0.9 * h} seg={8} mat={M(robe, { tx: 'fabric' })} />
      <Ball p={[0, 0.9 * h + headR * 0.9, 0]} rad={headR} w={10} hs={8} mat={M(skin, { smooth: true, rough: 0.6 })} />
      <Box p={[0.26, 0.62 * h, 0.05]} s={[0.1, 0.4 * h, 0.1]} r={[0.3, 0, 0.35]} mat={M(arms, { tx: 'fabric' })} />
      <Box p={[-0.26, 0.62 * h, 0.05]} s={[0.1, 0.4 * h, 0.1]} r={[0.3, 0, -0.35]} mat={M(arms, { tx: 'fabric' })} />
    </group>
  );
}

function Cape({ color, y = 0.5, r = 0.5, h = 0.9, collar }) {
  return (
    <group>
      <mesh position={[0, y, -0.03]} rotation={[0, Math.PI, 0]} material={M(color, { tx: 'fabric' })} castShadow>
        <coneGeometry args={[r, h, 10, 1, true, -Math.PI / 2, Math.PI]} />
      </mesh>
      {collar && (
        <mesh position={[0, y + h / 2 + 0.1, -0.08]} rotation={[0.3, Math.PI, 0]} material={M(color, { tx: 'fabric' })}>
          <coneGeometry args={[0.28, 0.4, 8, 1, true, -Math.PI / 2, Math.PI]} />
        </mesh>
      )}
    </group>
  );
}

// ─── Nachtruh ────────────────────────────────────────────────────────────────
const TAILS = Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2);

function Ghost({ def }) {
  const type = def.id;
  const body = RimM(def.color, def.glow, { strength: 1.6, intensity: 0.35, opacity: 0.9 });
  const headless = type === 'ritter';
  return (
    <group>
      {!headless && <Ball p={[0, 0.78, 0]} rad={0.34} w={12} hs={9} sc={[1, 1.08, 1]} mat={body} />}
      {headless && <Cyl p={[0, 0.82, 0]} rt={0.2} rb={0.3} h={0.16} seg={8} c="#9aa7b4" />}
      <Cyl p={[0, 0.5, 0]} rt={0.34} rb={0.43} h={0.56} seg={12} open mat={body} />
      {TAILS.map(a => (
        <Cone key={a} p={[Math.sin(a) * 0.35, 0.16, Math.cos(a) * 0.35]} rad={0.1} h={0.24} seg={5}
          r={[Math.PI, 0, 0]} mat={body} />
      ))}
      <Ball p={[0.4, 0.55, 0.08]} rad={0.1} w={6} hs={5} mat={body} />
      <Ball p={[-0.4, 0.55, 0.08]} rad={0.1} w={6} hs={5} mat={body} />
      <Sprite p={[0, 0.6, 0]} size={1.6} color={def.glow} opacity={0.25} />

      {!headless && (
        <group>
          <Eyes y={0.83} z={0.3} gap={0.12} r={0.055} tall={1.5} />
          <Ball p={[0, 0.68, 0.33]} rad={type === 'banshee' ? 0.07 : 0.04} w={6} hs={4} sc={[1.2, 0.9, 0.5]} mat={ink()} cast={false} />
          <Ball p={[0.21, 0.72, 0.26]} rad={0.045} w={5} hs={3} sc={[1, 0.6, 0.5]} mat={M('#ff9ac1', { emissive: '#ff9ac1', intensity: 0.3 })} cast={false} />
          <Ball p={[-0.21, 0.72, 0.26]} rad={0.045} w={5} hs={3} sc={[1, 0.6, 0.5]} mat={M('#ff9ac1', { emissive: '#ff9ac1', intensity: 0.3 })} cast={false} />
        </group>
      )}

      {type === 'poltergeist' && (
        <group>
          {[0, 1, 2].map(i => (
            <Torus key={i} p={[0.45, 0.42 - i * 0.12, 0.1]} rad={0.06} tube={0.02} seg={6}
              r={[0, i % 2 ? Math.PI / 2 : 0, 0]} mat={M('#8b8f9c', { metal: 0.7, rough: 0.35 })} />
          ))}
          <Box p={[0.45, 0.08, 0.1]} s={[0.18, 0.18, 0.18]} mat={M('#4b4f5c', { metal: 0.6 })} />
        </group>
      )}
      {type === 'banshee' && (
        <group>
          <Cone p={[0, 0.66, -0.16]} rad={0.36} h={0.95} seg={9} mat={RimM('#7f9cff', '#b0c4ff', { intensity: 0.4 })} />
          <Cone p={[0, 1.08, -0.02]} rad={0.3} h={0.22} seg={9} r={[-0.3, 0, 0]} mat={RimM('#7f9cff', '#b0c4ff', { intensity: 0.4 })} />
        </group>
      )}
      {type === 'graf' && (
        <group>
          <Cyl p={[0, 1.13, 0]} rt={0.3} h={0.03} seg={12} mat={ink()} />
          <Cyl p={[0, 1.3, 0]} rt={0.18} rb={0.19} h={0.32} seg={12} mat={ink()} />
          <Cyl p={[0, 1.18, 0]} rt={0.195} h={0.06} seg={12} c="#b02a4a" />
          <Cape color="#5a1d6e" y={0.55} />
          <Torus p={[0.12, 0.84, 0.31]} rad={0.075} tube={0.015} mat={gold()} />
        </group>
      )}
      {type === 'ritter' && (
        <group>
          <Cyl p={[0, 0.58, 0.02]} rt={0.36} rb={0.4} h={0.36} seg={10} mat={M('#aeb8c4', { metal: 0.7, rough: 0.3 })} />
          <group position={[0.42, 0.62, 0.22]}>
            <Ball rad={0.17} w={9} hs={7} mat={M('#9aa7b4', { metal: 0.7, rough: 0.3 })} />
            <Box p={[0, 0.02, 0.15]} s={[0.2, 0.04, 0.04]} mat={glowEye('#8fe3ff')} cast={false} />
            <Cone p={[0, 0.2, -0.02]} rad={0.05} h={0.2} seg={4} c="#d23c3c" />
          </group>
        </group>
      )}
      {type === 'koenigin' && (
        <group>
          <Cyl p={[0, 1.15, 0]} rt={0.2} rb={0.18} h={0.12} seg={10} mat={gold()} />
          {[0, 1, 2, 3, 4].map(i => {
            const a = (i / 5) * Math.PI * 2;
            return <Cone key={i} p={[Math.sin(a) * 0.17, 1.26, Math.cos(a) * 0.17]} rad={0.045} h={0.12} seg={4} mat={gold()} />;
          })}
          <Ball p={[0, 1.18, 0.19]} rad={0.035} w={5} hs={4} mat={glowEye('#ff3b7a')} />
          <Cape color="#a8243d" y={0.5} r={0.52} h={0.8} />
        </group>
      )}
    </group>
  );
}

export function Skeleton() {
  const bone = M(BONE, { rough: 0.55, smooth: true });
  return (
    <group>
      <Box p={[0.1, 0.35, 0]} s={[0.07, 0.7, 0.07]} mat={bone} />
      <Box p={[-0.1, 0.35, 0]} s={[0.07, 0.7, 0.07]} mat={bone} />
      <Box p={[0, 0.72, 0]} s={[0.34, 0.1, 0.18]} mat={bone} />
      <Cyl p={[0, 0.95, 0]} rt={0.03} h={0.5} seg={5} mat={bone} />
      {[1.08, 0.97, 0.86].map((y, i) => (
        <Torus key={y} p={[0, y, 0]} rad={0.17 - i * 0.02} tube={0.025} r={[Math.PI / 2, 0, 0]} mat={bone} />
      ))}
      <Box p={[0.25, 1.0, 0.06]} s={[0.06, 0.4, 0.06]} r={[0.5, 0, 0.2]} mat={bone} />
      <Box p={[-0.25, 1.0, 0.06]} s={[0.06, 0.4, 0.06]} r={[0.5, 0, -0.2]} mat={bone} />
      <Ball p={[0, 1.42, 0]} rad={0.22} w={10} hs={8} mat={bone} />
      <Box p={[0, 1.24, 0.06]} s={[0.22, 0.1, 0.2]} mat={bone} />
      <Eyes y={1.44} z={0.18} r={0.055} tall={1} mat={glowEye('#7fffd4')} />
      <Cone p={[0.06, 1.16, 0.12]} rad={0.05} h={0.1} seg={4} r={[0, 0, Math.PI / 2]} c="#d2283f" />
      <Cone p={[-0.06, 1.16, 0.12]} rad={0.05} h={0.1} seg={4} r={[0, 0, -Math.PI / 2]} c="#d2283f" />
      <Cyl p={[0.03, 1.66, 0]} rt={0.2} h={0.025} seg={12} r={[0, 0, -0.15]} mat={ink()} />
      <Cyl p={[0.05, 1.77, 0]} rt={0.12} h={0.2} seg={12} r={[0, 0, -0.15]} mat={ink()} />
    </group>
  );
}

export function Witch() {
  return (
    <group>
      <Cone p={[0, 0.5, 0]} rad={0.42} h={1.0} seg={10} mat={M('#4b2a6a', { tx: 'fabric' })} />
      <Ball p={[0, 1.15, 0]} rad={0.21} w={10} hs={8} mat={M('#8fd16a', { smooth: true })} />
      <Cone p={[0, 1.12, 0.24]} rad={0.05} h={0.16} seg={5} r={[Math.PI / 2, 0, 0]} c="#7ab85a" />
      <Eyes y={1.2} z={0.18} r={0.035} />
      <Cone p={[0.2, 1.02, -0.05]} rad={0.1} h={0.4} seg={5} c="#ff7a2e" />
      <Cone p={[-0.2, 1.02, -0.05]} rad={0.1} h={0.4} seg={5} c="#ff7a2e" />
      <Cyl p={[0, 1.32, 0]} rt={0.4} h={0.04} seg={12} c="#231333" />
      <Cyl p={[0, 1.37, 0]} rt={0.21} h={0.07} seg={12} c="#ff7a2e" />
      <Cone p={[0.05, 1.66, -0.03]} rad={0.21} h={0.6} seg={10} r={[-0.25, 0, -0.2]} c="#231333" />
      <Box p={[0.3, 0.8, 0.14]} s={[0.1, 0.36, 0.1]} r={[0.9, 0, 0.3]} c="#4b2a6a" />
      <Box p={[-0.3, 0.8, 0.14]} s={[0.1, 0.36, 0.1]} r={[0.9, 0, -0.3]} c="#4b2a6a" />
      <Box p={[0.34, 0.9, 0.36]} s={[0.03, 0.03, 0.4]} r={[-0.6, 0, 0]} c="#8b5a33" />
      <Ball p={[0.34, 0.78, 0.52]} rad={0.06} w={5} hs={3} c="#5b5f6a" />
    </group>
  );
}

export function Zombie({ skin = '#8fbf6a', shirt = '#3f8f86' }) {
  return (
    <group>
      <Box p={[0.11, 0.25, 0]} s={[0.16, 0.5, 0.16]} mat={M('#34456b', { tx: 'fabric' })} />
      <Box p={[-0.11, 0.25, 0]} s={[0.16, 0.5, 0.16]} mat={M('#34456b', { tx: 'fabric' })} />
      <Box p={[0, 0.78, 0]} s={[0.46, 0.56, 0.3]} mat={M(shirt, { tx: 'fabric' })} />
      <Box p={[0, 1.24, 0.02]} s={[0.36, 0.36, 0.34]} mat={M(skin)} />
      <Box p={[0.09, 1.28, 0.19]} s={[0.1, 0.1, 0.02]} c="#ffffff" cast={false} />
      <Box p={[0.09, 1.28, 0.2]} s={[0.04, 0.04, 0.02]} c={INK} cast={false} />
      <Box p={[-0.09, 1.3, 0.19]} s={[0.06, 0.05, 0.02]} c={INK} cast={false} />
      <Box p={[0, 1.15, 0.19]} s={[0.16, 0.03, 0.02]} c="#4a2a2a" cast={false} />
      <Box p={[0.28, 0.95, 0.22]} s={[0.12, 0.12, 0.46]} mat={M(skin)} />
      <Box p={[-0.28, 0.95, 0.22]} s={[0.12, 0.12, 0.46]} mat={M(skin)} />
      <Box p={[0.3, 0.6, 0.45]} s={[0.04, 1.2, 0.04]} r={[0.35, 0, 0]} c="#8b5a33" />
      <Box p={[0.3, 0.05, 0.64]} s={[0.3, 0.1, 0.16]} mat={M('#cfd3d9', { tx: 'fabric' })} />
    </group>
  );
}

// ─── Dracula ─────────────────────────────────────────────────────────────────
function Bat() {
  const fur = M('#2a1a24');
  return (
    <group position={[0, 0.5, 0]}>
      <Ball p={[0, 0.3, 0]} rad={0.26} w={9} hs={7} sc={[1, 1.1, 0.9]} mat={fur} />
      <Cone p={[0.13, 0.6, 0]} rad={0.07} h={0.2} seg={4} mat={fur} />
      <Cone p={[-0.13, 0.6, 0]} rad={0.07} h={0.2} seg={4} mat={fur} />
      <Eyes y={0.35} z={0.2} gap={0.08} r={0.05} tall={1} mat={glowEye('#ffdd55')} />
      <Cone p={[0.05, 0.2, 0.22]} rad={0.02} h={0.06} seg={3} r={[Math.PI, 0, 0]} c="#ffffff" />
      <Cone p={[-0.05, 0.2, 0.22]} rad={0.02} h={0.06} seg={3} r={[Math.PI, 0, 0]} c="#ffffff" />
      {[1, -1].map(s => (
        <group key={s} position={[s * 0.22, 0.35, 0]} rotation={[0, 0, s * 0.25]}>
          <Box p={[s * 0.3, 0, 0]} s={[0.6, 0.03, 0.35]} mat={M('#3a2030')} />
          <Cone p={[s * 0.55, -0.08, 0]} rad={0.12} h={0.25} seg={3} r={[0, 0, Math.PI]} mat={M('#3a2030')} />
        </group>
      ))}
      <Box p={[0.3, 0.05, 0]} s={[0.35, 0.25, 0.08]} mat={M('#c9a26b', { tx: 'fabric' })} />
    </group>
  );
}

function Vampire({ def }) {
  const pale = '#e8e0ea';
  return (
    <group>
      <Body robe={def.color ?? '#2a2a3a'} skin={pale} h={1.1} />
      <Cape color={def.cape ?? '#b3122e'} y={0.62} r={0.5} h={1.05} collar />
      <Ball p={[0, 1.36, -0.04]} rad={0.21} w={10} hs={6} sc={[1.05, 0.7, 1.05]} mat={M('#141018')} />
      <Cone p={[0, 1.29, 0.18]} rad={0.05} h={0.12} seg={3} r={[Math.PI, 0, 0]} mat={M('#141018')} />
      <Eyes y={1.24} z={0.19} gap={0.07} r={0.035} tall={0.8} mat={glowEye('#ff2a3a')} />
      <Cone p={[0.04, 1.12, 0.2]} rad={0.015} h={0.05} seg={3} r={[Math.PI, 0, 0]} c="#ffffff" />
      <Cone p={[-0.04, 1.12, 0.2]} rad={0.015} h={0.05} seg={3} r={[Math.PI, 0, 0]} c="#ffffff" />
      <Box p={[0, 0.85, 0.21]} s={[0.12, 0.2, 0.02]} c="#ffffff" cast={false} />
      <Ball p={[0, 0.8, 0.24]} rad={0.05} w={6} hs={4} mat={def.crown ? M('#ff2a4a', { emissive: '#ff0022', intensity: 1.5 }) : gold()} />
      {def.crown && <Cyl p={[0, 1.48, -0.03]} rt={0.16} rb={0.14} h={0.1} seg={8} mat={gold()} />}
    </group>
  );
}

function Werewolf() {
  const fur = M('#6a4a34', { tx: 'grass', bump: 1 });
  const furLight = M('#9a7a5a');
  return (
    <group>
      <Box p={[0.13, 0.28, 0]} s={[0.18, 0.56, 0.2]} mat={M('#3a3a5a', { tx: 'fabric' })} />
      <Box p={[-0.13, 0.28, 0]} s={[0.18, 0.56, 0.2]} mat={M('#3a3a5a', { tx: 'fabric' })} />
      <Box p={[0, 0.85, 0]} s={[0.55, 0.6, 0.35]} mat={fur} />
      <Box p={[0, 0.8, 0.18]} s={[0.35, 0.4, 0.02]} mat={furLight} cast={false} />
      <Box p={[0, 1.3, 0.02]} s={[0.4, 0.36, 0.36]} mat={fur} />
      <Box p={[0, 1.24, 0.25]} s={[0.2, 0.16, 0.22]} mat={furLight} />
      <Ball p={[0, 1.28, 0.37]} rad={0.04} w={5} hs={4} mat={ink()} />
      <Cone p={[0.13, 1.56, 0]} rad={0.08} h={0.22} seg={4} mat={fur} />
      <Cone p={[-0.13, 1.56, 0]} rad={0.08} h={0.22} seg={4} mat={fur} />
      <Eyes y={1.36} z={0.19} gap={0.1} r={0.035} tall={0.8} mat={glowEye('#ffd23a')} />
      <Box p={[0.35, 0.85, 0.05]} s={[0.14, 0.5, 0.14]} r={[0.2, 0, 0.2]} mat={fur} />
      <Box p={[-0.35, 0.85, 0.05]} s={[0.14, 0.5, 0.14]} r={[0.2, 0, -0.2]} mat={fur} />
      <Cone p={[0, 0.55, -0.3]} rad={0.08} h={0.45} seg={5} r={[-1.1, 0, 0]} mat={fur} />
    </group>
  );
}

function Countess() {
  return (
    <group>
      <Cone p={[0, 0.55, 0]} rad={0.45} h={1.1} seg={12} mat={M('#8a0f22', { tx: 'fabric', rough: 0.4 })} />
      <Cyl p={[0, 1.1, 0]} rt={0.12} rb={0.16} h={0.2} seg={10} mat={M('#8a0f22', { tx: 'fabric' })} />
      <Ball p={[0, 1.36, 0]} rad={0.2} w={10} hs={8} mat={M('#efe6ee', { smooth: true })} />
      <Ball p={[0, 1.55, -0.1]} rad={0.15} w={8} hs={6} mat={M('#141018')} />
      <Ball p={[0, 1.42, -0.06]} rad={0.2} w={10} hs={6} sc={[1.05, 0.6, 1]} mat={M('#141018')} />
      <Eyes y={1.37} z={0.17} gap={0.07} r={0.03} tall={0.8} mat={glowEye('#ff2a3a')} />
      <Box p={[0, 1.27, 0.19]} s={[0.07, 0.02, 0.01]} c="#c0122a" cast={false} />
      <mesh position={[0, 1.3, -0.12]} rotation={[0.2, Math.PI, 0]} material={M('#1a1418')}>
        <coneGeometry args={[0.35, 0.5, 8, 1, true, -Math.PI / 2, Math.PI]} />
      </mesh>
      <Ball p={[0, 1.12, 0.14]} rad={0.05} w={6} hs={4} mat={glowEye('#ff2a4a')} />
    </group>
  );
}

function Nosferatu() {
  const skin = M('#b8c4b0', { smooth: true });
  return (
    <group rotation={[0.18, 0, 0]}>
      <Cyl p={[0, 0.5, 0]} rt={0.18} rb={0.32} h={1.0} seg={8} mat={M('#1a1418', { tx: 'fabric' })} />
      <Ball p={[0, 1.18, 0.05]} rad={0.21} w={10} hs={8} sc={[0.9, 1.25, 1]} mat={skin} />
      <Cone p={[0.2, 1.3, 0.02]} rad={0.07} h={0.25} seg={4} r={[0, 0, -1.1]} mat={skin} />
      <Cone p={[-0.2, 1.3, 0.02]} rad={0.07} h={0.25} seg={4} r={[0, 0, 1.1]} mat={skin} />
      <Eyes y={1.24} z={0.18} gap={0.07} r={0.035} tall={1} mat={glowEye('#fff7a0')} />
      <Box p={[0.03, 1.06, 0.2]} s={[0.02, 0.06, 0.01]} c="#ffffff" cast={false} />
      <Box p={[-0.03, 1.06, 0.2]} s={[0.02, 0.06, 0.01]} c="#ffffff" cast={false} />
      {[1, -1].map(s => (
        <group key={s} position={[s * 0.24, 0.8, 0.18]} rotation={[0.9, 0, s * 0.2]}>
          <Box s={[0.08, 0.4, 0.08]} mat={M('#1a1418')} />
          {[-0.03, 0, 0.03].map(f => <Box key={f} p={[f, -0.28, 0]} s={[0.015, 0.18, 0.015]} mat={skin} />)}
        </group>
      ))}
    </group>
  );
}

function Igor() {
  return (
    <group rotation={[0.25, 0, 0]}>
      <Body robe="#4a4238" skin="#d8c0a8" h={0.9} arms="#4a4238" />
      <Ball p={[0.05, 0.95, -0.2]} rad={0.2} w={8} hs={6} mat={M('#4a4238', { tx: 'fabric' })} />
      <Eyes y={1.08} z={0.18} gap={0.07} r={0.04} tall={1} />
      <Ball p={[0.08, 1.1, 0.18]} rad={0.055} w={6} hs={4} mat={M('#ffffff')} cast={false} />
      <Box p={[0, 1.25, 0]} s={[0.3, 0.06, 0.3]} mat={M('#3a3028')} />
    </group>
  );
}

function Ghoul() {
  return <Zombie skin="#9aa39a" shirt="#4a3a4a" />;
}

function Waiter() {
  return (
    <group>
      <Vampire def={{ color: '#141018', cape: '#2a0a12' }} />
      <group position={[0.35, 1.0, 0.25]}>
        <Cyl rt={0.22} h={0.03} seg={12} mat={gold()} />
        <Cyl p={[0, 0.12, 0]} rt={0.04} rb={0.05} h={0.2} seg={6} mat={M('#c0122a', { rough: 0.1, opacity: 0.85 })} />
      </group>
    </group>
  );
}

// ─── Pyramide ────────────────────────────────────────────────────────────────
function Beetle({ scale = 1 }) {
  const shell = M('#1fa39a', { metal: 0.8, rough: 0.2 });
  return (
    <group scale={scale}>
      <Ball p={[0, 0.3, 0]} rad={0.32} w={10} hs={7} sc={[1, 0.65, 1.25]} mat={shell} />
      <Box p={[0, 0.5, -0.05]} s={[0.02, 0.02, 0.6]} c="#0c3a38" cast={false} />
      <Ball p={[0, 0.3, 0.4]} rad={0.15} w={8} hs={6} mat={M('#0f5a56', { metal: 0.6, rough: 0.3 })} />
      <Eyes y={0.34} z={0.5} gap={0.07} r={0.03} tall={1} mat={glowEye('#ffd36b')} />
      {[-0.15, 0, 0.15].map(z => [1, -1].map(s => (
        <Box key={`${z}${s}`} p={[s * 0.33, 0.12, z]} s={[0.2, 0.03, 0.03]} r={[0, 0, s * -0.6]} c="#0c3a38" />
      )))}
      <Cone p={[0.07, 0.5, 0.48]} rad={0.02} h={0.2} seg={3} r={[0.5, 0, -0.3]} c="#0c3a38" />
      <Cone p={[-0.07, 0.5, 0.48]} rad={0.02} h={0.2} seg={3} r={[0.5, 0, 0.3]} c="#0c3a38" />
    </group>
  );
}

function BeetleCart() {
  return (
    <group>
      <Beetle />
      <Ball p={[0, 0.3, 0.75]} rad={0.28} w={8} hs={6} mat={M('#c9a46a', { tx: 'sand', bump: 2 })} />
    </group>
  );
}

function Mummy() {
  const wrap = M('#e0d6bc', { tx: 'fabric', bump: 1.5 });
  return (
    <group>
      <Box p={[0.1, 0.3, 0]} s={[0.16, 0.6, 0.18]} mat={wrap} />
      <Box p={[-0.1, 0.3, 0]} s={[0.16, 0.6, 0.18]} mat={wrap} />
      <Cyl p={[0, 0.85, 0]} rt={0.24} rb={0.22} h={0.6} seg={8} mat={wrap} />
      {[0.65, 0.8, 0.95, 1.1].map((y, i) => (
        <Torus key={y} p={[0, y, 0]} rad={0.24} tube={0.025} r={[Math.PI / 2 + (i % 2 ? 0.2 : -0.2), 0, 0]} mat={wrap} />
      ))}
      <Ball p={[0, 1.35, 0]} rad={0.22} w={10} hs={8} mat={wrap} />
      <Box p={[0, 1.37, 0.19]} s={[0.3, 0.08, 0.04]} c="#2a1e14" cast={false} />
      <Eyes y={1.37} z={0.21} gap={0.07} r={0.03} tall={1} mat={glowEye('#7fffd4')} />
      <Box p={[0.28, 1.0, 0.25]} s={[0.1, 0.1, 0.5]} mat={wrap} />
      <Box p={[-0.28, 1.0, 0.25]} s={[0.1, 0.1, 0.5]} mat={wrap} />
      <Box p={[0.2, 0.5, -0.12]} s={[0.05, 0.4, 0.03]} r={[0.3, 0, 0.3]} mat={wrap} />
    </group>
  );
}

function Cat() {
  const fur = M('#1a1418', { rough: 0.35 });
  return (
    <group>
      <Ball p={[0, 0.4, -0.1]} rad={0.3} w={10} hs={7} sc={[0.9, 1.1, 1.3]} mat={fur} />
      <Ball p={[0, 0.85, 0.15]} rad={0.22} w={10} hs={8} mat={fur} />
      <Cone p={[0.12, 1.1, 0.12]} rad={0.07} h={0.2} seg={4} mat={fur} />
      <Cone p={[-0.12, 1.1, 0.12]} rad={0.07} h={0.2} seg={4} mat={fur} />
      <Eyes y={0.9} z={0.33} gap={0.08} r={0.04} tall={1.2} mat={glowEye('#7fffd4')} />
      <Torus p={[0, 0.66, 0.1]} rad={0.17} tube={0.035} r={[Math.PI / 2 - 0.3, 0, 0]} mat={gold()} />
      <Ball p={[0, 0.58, 0.26]} rad={0.05} w={6} hs={4} mat={M('#3fe0e0', { emissive: '#1fb0b0', intensity: 1.4 })} />
      <Cyl p={[0, 0.3, -0.5]} rt={0.04} rb={0.06} h={0.6} seg={5} r={[-0.9, 0, 0]} mat={fur} />
      <Torus p={[0.2, 1.05, 0.12]} rad={0.05} tube={0.012} mat={gold()} />
    </group>
  );
}

function Anubis() {
  const black = M('#141018', { rough: 0.35 });
  return (
    <group>
      <Box p={[0.1, 0.3, 0]} s={[0.15, 0.6, 0.16]} mat={black} />
      <Box p={[-0.1, 0.3, 0]} s={[0.15, 0.6, 0.16]} mat={black} />
      <Cone p={[0, 0.55, 0]} rad={0.3} h={0.4} seg={4} r={[Math.PI, Math.PI / 4, 0]} mat={M('#f2ead8', { tx: 'fabric' })} />
      <Box p={[0, 0.95, 0]} s={[0.46, 0.5, 0.28]} mat={black} />
      <Cyl p={[0, 1.18, 0]} rt={0.32} rb={0.3} h={0.08} seg={12} mat={gold()} />
      <Box p={[0, 1.4, 0.05]} s={[0.26, 0.28, 0.3]} mat={black} />
      <Box p={[0, 1.34, 0.28]} s={[0.12, 0.12, 0.24]} mat={black} />
      <Cone p={[0.09, 1.7, 0]} rad={0.06} h={0.3} seg={4} mat={black} />
      <Cone p={[-0.09, 1.7, 0]} rad={0.06} h={0.3} seg={4} mat={black} />
      <Eyes y={1.45} z={0.2} gap={0.08} r={0.03} tall={0.8} mat={glowEye('#ffd36b')} />
      <Box p={[0.32, 0.95, 0.1]} s={[0.1, 0.45, 0.1]} r={[0.3, 0, 0.15]} mat={black} />
      <Box p={[-0.32, 0.95, 0.1]} s={[0.1, 0.45, 0.1]} r={[0.3, 0, -0.15]} mat={black} />
      <Cyl p={[0.4, 0.9, 0.25]} rt={0.025} h={1.6} seg={5} mat={gold()} />
    </group>
  );
}

function Priestess() {
  return (
    <group>
      <Cone p={[0, 0.55, 0]} rad={0.4} h={1.1} seg={12} mat={M('#f4eee0', { tx: 'fabric' })} />
      <Cyl p={[0, 1.02, 0]} rt={0.24} rb={0.28} h={0.1} seg={12} mat={gold()} />
      <Ball p={[0, 1.3, 0]} rad={0.2} w={10} hs={8} mat={M('#b07a4a', { smooth: true })} />
      <Box p={[0, 1.3, -0.08]} s={[0.44, 0.5, 0.25]} mat={M('#141018')} />
      <Cyl p={[0, 1.48, 0]} rt={0.21} h={0.06} seg={12} mat={gold()} />
      <Ball p={[0, 1.52, 0.2]} rad={0.05} w={6} hs={4} mat={glowEye('#3fe0e0')} />
      <Eyes y={1.32} z={0.17} gap={0.07} r={0.03} tall={0.8} />
      <Box p={[0.28, 0.85, 0.12]} s={[0.08, 0.4, 0.08]} r={[0.6, 0, 0.3]} mat={M('#b07a4a')} />
      <Box p={[-0.28, 0.85, 0.12]} s={[0.08, 0.4, 0.08]} r={[0.6, 0, -0.3]} mat={M('#b07a4a')} />
    </group>
  );
}

function Pharaoh() {
  return (
    <group>
      <Priestess />
      {/* nemes headdress */}
      <Box p={[0, 1.38, -0.05]} s={[0.5, 0.36, 0.38]} mat={M('#2a5aa8')} />
      {[1.26, 1.34, 1.42, 1.5].map(y => (
        <Box key={y} p={[0, y, -0.05]} s={[0.52, 0.03, 0.4]} mat={gold()} cast={false} />
      ))}
      <Box p={[0.22, 1.1, 0.05]} s={[0.1, 0.4, 0.12]} mat={M('#2a5aa8')} />
      <Box p={[-0.22, 1.1, 0.05]} s={[0.1, 0.4, 0.12]} mat={M('#2a5aa8')} />
      <Ball p={[0, 1.34, 0.08]} rad={0.19} w={10} hs={8} mat={gold()} />
      <Eyes y={1.36} z={0.25} gap={0.07} r={0.03} tall={0.8} />
      <Cone p={[0, 1.6, 0.18]} rad={0.04} h={0.14} seg={4} mat={gold()} />
      <Box p={[0, 1.13, 0.22]} s={[0.05, 0.14, 0.04]} mat={M('#2a5aa8')} />
      <Sprite p={[0, 1.4, 0]} size={1.4} color="#ffc94a" opacity={0.25} />
    </group>
  );
}

// ─── Eispalast ───────────────────────────────────────────────────────────────
function SnowSprite() {
  const snow = RimM('#ffffff', '#9fe8ff', { strength: 1.4, intensity: 0.25 });
  return (
    <group position={[0, 0.3, 0]}>
      <Ball p={[0, 0.45, 0]} rad={0.33} w={12} hs={9} mat={snow} />
      <Eyes y={0.5} z={0.29} gap={0.1} r={0.045} tall={1.4} />
      <Cone p={[0, 0.42, 0.33]} rad={0.035} h={0.14} seg={5} r={[Math.PI / 2, 0, 0]} c="#ff8a2e" />
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI - Math.PI / 2;
        return <Cone key={i} p={[Math.sin(a) * 0.2, 0.82, Math.cos(a) * 0.05]} rad={0.04} h={0.2} seg={4} mat={RimM('#bfe8ff', '#6fdcff')} />;
      })}
      <Sprite p={[0, 0.45, 0]} size={1.4} color="#9fe8ff" opacity={0.3} />
    </group>
  );
}

function Gnome() {
  return (
    <group scale={0.85}>
      <Cone p={[0, 0.4, 0]} rad={0.35} h={0.8} seg={10} mat={M('#2a6aa8', { tx: 'fabric' })} />
      <Ball p={[0, 0.9, 0]} rad={0.2} w={10} hs={8} mat={M('#f4d0b8', { smooth: true })} />
      <Cone p={[0, 0.72, 0.1]} rad={0.2} h={0.4} seg={8} r={[Math.PI + 0.3, 0, 0]} mat={M('#f4faff', { tx: 'snow' })} />
      <Ball p={[0, 0.88, 0.2]} rad={0.05} w={6} hs={4} c="#ff9a8a" />
      <Eyes y={0.96} z={0.17} gap={0.07} r={0.03} tall={1} />
      <Cone p={[0, 1.35, -0.05]} rad={0.2} h={0.6} seg={10} r={[-0.25, 0, 0]} mat={M('#8fe8ff', { tx: 'fabric' })} />
      <Ball p={[0, 1.62, -0.14]} rad={0.06} w={6} hs={4} mat={M('#ffffff', { emissive: '#9fe8ff', intensity: 1 })} />
    </group>
  );
}

function Penguin({ butler }) {
  const black = M('#1a1c28', { rough: 0.4, smooth: true });
  return (
    <group>
      <Ball p={[0, 0.5, 0]} rad={0.35} w={12} hs={9} sc={[0.95, 1.4, 0.9]} mat={black} />
      <Ball p={[0, 0.5, 0.12]} rad={0.28} w={10} hs={8} sc={[0.9, 1.35, 0.8]} mat={M('#f4f6fa', { smooth: true })} />
      <Ball p={[0, 1.08, 0.02]} rad={0.22} w={10} hs={8} mat={black} />
      <Eyes y={1.12} z={0.2} gap={0.08} r={0.035} tall={1} mat={M('#ffffff')} />
      <Cone p={[0, 1.04, 0.26]} rad={0.05} h={0.14} seg={5} r={[Math.PI / 2, 0, 0]} c="#ffa33a" />
      <Box p={[0.1, 0.03, 0.12]} s={[0.12, 0.05, 0.18]} c="#ffa33a" />
      <Box p={[-0.1, 0.03, 0.12]} s={[0.12, 0.05, 0.18]} c="#ffa33a" />
      <Box p={[0.34, 0.6, 0]} s={[0.06, 0.45, 0.2]} r={[0, 0, 0.3]} mat={black} />
      <Box p={[-0.34, 0.6, 0]} s={[0.06, 0.45, 0.2]} r={[0, 0, -0.3]} mat={black} />
      {butler ? (
        <group>
          <Cone p={[0.05, 0.86, 0.3]} rad={0.05} h={0.1} seg={4} r={[0, 0, Math.PI / 2]} c="#d2283f" />
          <Cone p={[-0.05, 0.86, 0.3]} rad={0.05} h={0.1} seg={4} r={[0, 0, -Math.PI / 2]} c="#d2283f" />
          <Torus p={[0.08, 1.14, 0.22]} rad={0.05} tube={0.01} mat={gold()} />
        </group>
      ) : (
        <Sprite p={[0, 0.7, 0]} size={1.6} color="#9fe8ff" opacity={0.25} />
      )}
    </group>
  );
}

function PenguinButler() {
  return <Penguin butler />;
}

function Yeti() {
  const fur = M('#f2f6fa', { tx: 'snow', bump: 2 });
  const face = M('#5a7aa8', { smooth: true });
  return (
    <group scale={1.15}>
      <Box p={[0.14, 0.25, 0]} s={[0.22, 0.5, 0.24]} mat={fur} />
      <Box p={[-0.14, 0.25, 0]} s={[0.22, 0.5, 0.24]} mat={fur} />
      <Ball p={[0, 0.85, 0]} rad={0.42} w={10} hs={8} sc={[1, 1.1, 0.85]} mat={fur} />
      <Ball p={[0, 1.35, 0.05]} rad={0.26} w={10} hs={8} mat={fur} />
      <Box p={[0, 1.3, 0.22]} s={[0.3, 0.24, 0.08]} mat={face} />
      <Eyes y={1.36} z={0.27} gap={0.07} r={0.03} tall={1} mat={M('#ffffff')} />
      <Box p={[0, 1.24, 0.27]} s={[0.1, 0.03, 0.01]} c="#1b1026" cast={false} />
      <Cone p={[0.2, 1.58, 0]} rad={0.05} h={0.18} seg={4} r={[0, 0, -0.5]} mat={M('#c0d0e0')} />
      <Cone p={[-0.2, 1.58, 0]} rad={0.05} h={0.18} seg={4} r={[0, 0, 0.5]} mat={M('#c0d0e0')} />
      <Box p={[0.44, 0.8, 0.05]} s={[0.18, 0.6, 0.2]} r={[0.2, 0, 0.25]} mat={fur} />
      <Box p={[-0.44, 0.8, 0.05]} s={[0.18, 0.6, 0.2]} r={[0.2, 0, -0.25]} mat={fur} />
    </group>
  );
}

function Elf() {
  const wing = RimM('#bff4ff', '#6fdcff', { strength: 1.6, intensity: 0.5, opacity: 0.55 });
  return (
    <group position={[0, 0.15, 0]}>
      <Cone p={[0, 0.5, 0]} rad={0.3} h={1.0} seg={12} mat={M('#8fe8ff', { tx: 'fabric', rough: 0.4 })} />
      <Ball p={[0, 1.18, 0]} rad={0.19} w={10} hs={8} mat={M('#e8f4ff', { smooth: true })} />
      <Cone p={[0.2, 1.24, 0]} rad={0.04} h={0.2} seg={4} r={[0, 0, -1.2]} mat={M('#e8f4ff')} />
      <Cone p={[-0.2, 1.24, 0]} rad={0.04} h={0.2} seg={4} r={[0, 0, 1.2]} mat={M('#e8f4ff')} />
      <Ball p={[0, 1.28, -0.06]} rad={0.2} w={10} hs={6} sc={[1.05, 0.7, 1.05]} mat={M('#e8fbff')} />
      <Eyes y={1.2} z={0.16} gap={0.065} r={0.03} tall={1.1} mat={glowEye('#3fd8ff')} />
      {[1, -1].map(s => (
        <group key={s} position={[s * 0.15, 0.95, -0.15]} rotation={[0, s * 0.5, s * 0.3]}>
          <Box p={[s * 0.3, 0.15, 0]} s={[0.6, 0.7, 0.02]} mat={wing} cast={false} />
        </group>
      ))}
      <Sprite p={[0, 0.9, -0.2]} size={1.8} color="#6fdcff" opacity={0.3} />
    </group>
  );
}

function IceQueen() {
  const ice = RimM('#bfe8ff', '#6fdcff', { strength: 1.5, intensity: 0.4 });
  return (
    <group>
      <Cone p={[0, 0.6, 0]} rad={0.48} h={1.2} seg={14} mat={M('#dff4ff', { tx: 'fabric', rough: 0.3 })} />
      <Cone p={[0, 0.5, -0.08]} rad={0.52} h={1.0} seg={14} mat={RimM('#9fdcff', '#4fd8ff', { opacity: 0.6, intensity: 0.4 })} />
      <Ball p={[0, 1.38, 0]} rad={0.2} w={10} hs={8} mat={M('#eef8ff', { smooth: true })} />
      <Ball p={[0, 1.43, -0.07]} rad={0.21} w={10} hs={6} sc={[1.05, 0.8, 1.1]} mat={M('#f8fcff')} />
      <Cone p={[0, 1.1, -0.2]} rad={0.2} h={0.7} seg={8} mat={M('#f8fcff')} />
      <Eyes y={1.38} z={0.17} gap={0.07} r={0.03} tall={1} mat={glowEye('#3fd8ff')} />
      {[0, 1, 2, 3, 4, 5, 6].map(i => {
        const a = (i / 6) * Math.PI - Math.PI / 2;
        return <Cone key={i} p={[Math.sin(a) * 0.18, 1.66 + (i === 3 ? 0.06 : 0), Math.cos(a) * 0.06]} rad={0.035} h={0.24 + (i === 3 ? 0.1 : 0)} seg={4} mat={ice} />;
      })}
      <Sprite p={[0, 1.2, 0]} size={2} color="#6fdcff" opacity={0.3} />
    </group>
  );
}

function Snowman() {
  const snow = M('#f4faff', { tx: 'snow', bump: 1.5 });
  return (
    <group>
      <Ball p={[0, 0.35, 0]} rad={0.38} w={12} hs={9} mat={snow} />
      <Ball p={[0, 0.9, 0]} rad={0.28} w={12} hs={9} mat={snow} />
      <Ball p={[0, 1.32, 0]} rad={0.2} w={10} hs={8} mat={snow} />
      <Eyes y={1.37} z={0.17} gap={0.07} r={0.03} tall={1} />
      <Cone p={[0, 1.3, 0.25]} rad={0.04} h={0.2} seg={5} r={[Math.PI / 2, 0, 0]} c="#ff8a2e" />
      <Cyl p={[0, 1.15, 0]} rt={0.22} h={0.08} seg={10} mat={M('#c0122a', { tx: 'fabric' })} />
      <Cyl p={[0, 1.55, 0]} rt={0.15} h={0.2} seg={10} mat={ink()} />
      <Cyl p={[0, 1.45, 0]} rt={0.24} h={0.03} seg={10} mat={ink()} />
      <Box p={[0.3, 0.6, 0.35]} s={[0.04, 1.1, 0.04]} r={[0.35, 0, 0]} c="#8b5a33" />
      <Box p={[0.3, 0.08, 0.55]} s={[0.35, 0.12, 0.12]} c="#c9a24a" />
    </group>
  );
}

// ─── registry ────────────────────────────────────────────────────────────────
const MODELS = {
  ghost: Ghost, bat: Bat, vampire: Vampire, werewolf: Werewolf, countess: Countess, nosferatu: Nosferatu,
  beetle: Beetle, mummy: Mummy, cat: Cat, anubis: Anubis, priestess: Priestess, pharaoh: Pharaoh,
  snowSprite: SnowSprite, gnome: Gnome, penguin: Penguin, yeti: Yeti, elf: Elf, iceQueen: IceQueen,
  skeleton: Skeleton, zombie: Zombie, witch: Witch, igor: Igor, ghoul: Ghoul, waiter: Waiter,
  beetleCart: BeetleCart, penguinButler: PenguinButler, snowman: Snowman,
};

/** Renders the model for a guest/staff definition (`{ model, ...opts }`). */
export default function Character({ def }) {
  const C = MODELS[def.model] ?? Ghost;
  return <C def={def} />;
}
