/**
 * Blocky characters in the Codigames look (Idle Supermarket / Prison Empire):
 * small people built from boxes, flat colours, dot eyes, readable at a
 * distance. Humanoids swing arms and legs while walking (via `motion`).
 *
 * Every guest/staff `model` id from game/hotels.js maps to a builder below.
 */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Box, M, RimM } from './primitives';

const INK = '#241a30';
const GOLD = '#ffc94a';
const m = (c, o) => M(c, o);
const glow = (c) => M(c, { emissive: c, intensity: 1.6 });

function Eyes({ y, z, gap = 0.075, c = INK, s = 0.05 }) {
  return (
    <group>
      <Box p={[gap, y, z]} s={[s, s * 1.3, 0.02]} mat={c === INK ? m(INK) : glow(c)} cast={false} />
      <Box p={[-gap, y, z]} s={[s, s * 1.3, 0.02]} mat={c === INK ? m(INK) : glow(c)} cast={false} />
    </group>
  );
}

/**
 * Generic blocky person.
 *  skin, shirt, pants, shoes: colours · hair: colour or null · long: long hair
 *  dress: colour → skirt instead of legs · cape: colour · eyes: glowing eye colour
 *  children: extra parts in body space (hats, props…)
 */
export function Person({
  skin = '#f2c9a0', shirt = '#4a8ae0', pants = '#34456b', shoes = '#2a2230', hair = '#5a3a2a', long,
  dress, cape, eyes, head = [0.34, 0.32, 0.3], motion, children, hunch = 0,
}) {
  const legL = useRef();
  const legR = useRef();
  const armL = useRef();
  const armR = useRef();
  useFrame(({ clock }) => {
    const mv = motion?.current;
    // fixed poses for the sprite export: { swing } or { sit }
    const pose = mv?.pose;
    const a = pose ? (pose.swing ?? 0) : mv?.moving ? Math.sin(clock.elapsedTime * 11 + (mv.phase ?? 0)) * 0.6 : 0;
    if (legL.current) {
      legL.current.rotation.x = pose?.sit ? -1.45 : a;
      legR.current.rotation.x = pose?.sit ? -1.45 : -a;
    }
    armL.current.rotation.x = -a * 0.8 + (mv?.carry ? -1.2 : 0);
    armR.current.rotation.x = a * 0.8 + (mv?.carry ? -1.2 : 0);
  });
  const [hw, hh, hd] = head;
  const hy = 1.0;
  return (
    <group rotation={[hunch, 0, 0]}>
      {dress ? (
        <Box p={[0, 0.26, 0]} s={[0.4, 0.52, 0.3]} mat={m(dress)} />
      ) : (
        <group>
          <group ref={legL} position={[0.09, 0.42, 0]}>
            <Box p={[0, -0.18, 0]} s={[0.14, 0.36, 0.16]} mat={m(pants)} />
            <Box p={[0, -0.39, 0.02]} s={[0.15, 0.07, 0.2]} mat={m(shoes)} />
          </group>
          <group ref={legR} position={[-0.09, 0.42, 0]}>
            <Box p={[0, -0.18, 0]} s={[0.14, 0.36, 0.16]} mat={m(pants)} />
            <Box p={[0, -0.39, 0.02]} s={[0.15, 0.07, 0.2]} mat={m(shoes)} />
          </group>
        </group>
      )}
      <Box p={[0, 0.64, 0]} s={[0.36, 0.44, 0.22]} mat={m(shirt)} />
      <group ref={armL} position={[0.24, 0.82, 0]}>
        <Box p={[0, -0.16, 0]} s={[0.1, 0.34, 0.12]} mat={m(shirt)} />
        <Box p={[0, -0.36, 0]} s={[0.09, 0.08, 0.1]} mat={m(skin)} />
      </group>
      <group ref={armR} position={[-0.24, 0.82, 0]}>
        <Box p={[0, -0.16, 0]} s={[0.1, 0.34, 0.12]} mat={m(shirt)} />
        <Box p={[0, -0.36, 0]} s={[0.09, 0.08, 0.1]} mat={m(skin)} />
      </group>
      {cape && (
        <group>
          <Box p={[0, 0.58, -0.14]} s={[0.46, 0.66, 0.04]} r={[0.08, 0, 0]} mat={m(cape)} />
          <Box p={[0.16, 0.9, -0.08]} s={[0.12, 0.22, 0.04]} r={[0.2, 0.5, 0]} mat={m(cape)} />
          <Box p={[-0.16, 0.9, -0.08]} s={[0.12, 0.22, 0.04]} r={[0.2, -0.5, 0]} mat={m(cape)} />
        </group>
      )}
      <Box p={[0, hy, 0]} s={head} mat={m(skin)} />
      <Eyes y={hy + 0.02} z={hd / 2 + 0.005} c={eyes ?? INK} />
      {hair && (
        <group>
          <Box p={[0, hy + hh / 2 + 0.03, -0.01]} s={[hw + 0.03, 0.08, hd + 0.03]} mat={m(hair)} />
          <Box p={[0, hy + 0.02, -hd / 2 - 0.01]} s={[hw + 0.03, hh + 0.02, 0.05]} mat={m(hair)} />
          {long && <Box p={[0, hy - 0.2, -hd / 2 - 0.02]} s={[hw + 0.02, 0.4, 0.06]} mat={m(hair)} />}
        </group>
      )}
      {children}
    </group>
  );
}

// ─── accessories ─────────────────────────────────────────────────────────────
const TopHat = ({ y = 1.2, c = INK, band = '#b02a4a' }) => (
  <group>
    <Box p={[0, y, 0]} s={[0.42, 0.03, 0.38]} mat={m(c)} />
    <Box p={[0, y + 0.13, 0]} s={[0.26, 0.24, 0.24]} mat={m(c)} />
    <Box p={[0, y + 0.04, 0]} s={[0.27, 0.05, 0.25]} mat={m(band)} />
  </group>
);

const Crown = ({ y = 1.2, c = GOLD, gem = '#ff3b7a' }) => (
  <group>
    <Box p={[0, y, 0]} s={[0.3, 0.08, 0.28]} mat={m(c, { metal: 0.5, rough: 0.4 })} />
    {[-0.11, 0, 0.11].map(x => <Box key={x} p={[x, y + 0.08, 0.1]} s={[0.05, 0.1, 0.04]} mat={m(c)} />)}
    <Box p={[0, y + 0.02, 0.145]} s={[0.05, 0.05, 0.02]} mat={glow(gem)} />
  </group>
);

const BowTie = ({ y = 0.8, c = '#e0203a' }) => (
  <group>
    <Box p={[0.05, y, 0.12]} s={[0.08, 0.07, 0.03]} r={[0, 0, 0.3]} mat={m(c)} />
    <Box p={[-0.05, y, 0.12]} s={[0.08, 0.07, 0.03]} r={[0, 0, -0.3]} mat={m(c)} />
  </group>
);

// ─── Nachtruh ────────────────────────────────────────────────────────────────
function Ghost({ def }) {
  const body = RimM(def.color ?? '#f4f8ff', def.glow ?? '#9fd4ff', { strength: 0.8, intensity: 0.15, opacity: 0.92 });
  const id = def.id;
  return (
    <group position={[0, 0.2, 0]}>
      {id !== 'ritter' && <Box p={[0, 0.72, 0]} s={[0.48, 0.52, 0.42]} mat={body} />}
      <Box p={[0, 0.34, 0]} s={[0.54, 0.34, 0.46]} mat={body} />
      {[[-0.18, 0.1], [0, 0.07], [0.18, 0.1]].map(([x, y]) => (
        <Box key={x} p={[x, y + 0.05, 0.05]} s={[0.15, 0.14, 0.36]} mat={body} />
      ))}
      <Box p={[0.31, 0.45, 0.05]} s={[0.1, 0.1, 0.1]} mat={body} />
      <Box p={[-0.31, 0.45, 0.05]} s={[0.1, 0.1, 0.1]} mat={body} />
      {id !== 'ritter' && (
        <group>
          <Eyes y={0.76} z={0.215} gap={0.1} s={0.07} />
          <Box p={[0, 0.6, 0.215]} s={[0.07, 0.06, 0.02]} mat={m('#5a1a2a')} cast={false} />
        </group>
      )}
      {id === 'poltergeist' && [0, 1, 2].map(i => (
        <Box key={i} p={[0.36, 0.38 - i * 0.1, 0.05]} s={[0.07, 0.07, 0.07]} r={[0, i, 0.5]} mat={m('#8b8f9c', { metal: 0.6 })} />
      ))}
      {id === 'banshee' && <Box p={[0, 0.66, -0.24]} s={[0.5, 0.7, 0.08]} mat={m('#7f9cff')} />}
      {id === 'graf' && (
        <group>
          <TopHat y={1.0} />
          <Box p={[0, 0.5, -0.25]} s={[0.56, 0.62, 0.04]} mat={m('#6a2a8a')} />
        </group>
      )}
      {id === 'ritter' && (
        <group>
          <Box p={[0, 0.66, 0]} s={[0.46, 0.4, 0.42]} mat={m('#aeb8c4', { metal: 0.6, rough: 0.35 })} />
          <Box p={[0.34, 0.5, 0.18]} s={[0.22, 0.22, 0.22]} mat={m('#9aa7b4', { metal: 0.6, rough: 0.35 })} />
          <Box p={[0.34, 0.52, 0.295]} s={[0.16, 0.03, 0.02]} mat={glow('#8fe3ff')} />
          <Box p={[0.34, 0.66, 0.18]} s={[0.04, 0.12, 0.1]} mat={m('#d23c3c')} />
        </group>
      )}
      {id === 'koenigin' && (
        <group>
          <Crown y={1.02} />
          <Box p={[0, 0.5, -0.25]} s={[0.56, 0.62, 0.04]} mat={m('#c8243d')} />
        </group>
      )}
    </group>
  );
}

function Skeleton({ motion }) {
  const bone = '#f4ecd8';
  return (
    <Person skin={bone} shirt="#3a2a5a" pants={bone} shoes={bone} hair={null} motion={motion}>
      <Box p={[0.075, 1.02, 0.152]} s={[0.09, 0.1, 0.02]} mat={m('#2a1a3a')} cast={false} />
      <Box p={[-0.075, 1.02, 0.152]} s={[0.09, 0.1, 0.02]} mat={m('#2a1a3a')} cast={false} />
      <Box p={[0.075, 1.02, 0.163]} s={[0.035, 0.035, 0.01]} mat={glow('#7fffd4')} cast={false} />
      <Box p={[-0.075, 1.02, 0.163]} s={[0.035, 0.035, 0.01]} mat={glow('#7fffd4')} cast={false} />
      <Box p={[0, 0.9, 0.152]} s={[0.16, 0.04, 0.02]} mat={m('#ffffff')} cast={false} />
      <BowTie />
      <TopHat y={1.2} c={INK} band="#7a3ac0" />
    </Person>
  );
}

function Zombie({ motion, skin = '#8fcf6a', shirt = '#3fb0a0' }) {
  return (
    <Person skin={skin} shirt={shirt} pants="#3a4a8a" hair="#4a6a3a" motion={motion}>
      <Box p={[0.3, 0.55, 0.3]} s={[0.04, 1.0, 0.04]} r={[0.4, 0, 0]} mat={m('#9b6a3a')} />
      <Box p={[0.3, 0.08, 0.5]} s={[0.26, 0.08, 0.14]} mat={m('#e8ecf2')} />
    </Person>
  );
}

function Witch({ motion }) {
  return (
    <Person skin="#8fd16a" shirt="#6a3a9a" dress="#5a2a8a" hair="#ff7a2e" long motion={motion}>
      <Box p={[0, 1.19, 0]} s={[0.5, 0.04, 0.46]} mat={m('#2a1a3a')} />
      <Box p={[0, 1.33, 0]} s={[0.26, 0.24, 0.24]} mat={m('#2a1a3a')} />
      <Box p={[0.02, 1.5, -0.02]} s={[0.14, 0.14, 0.14]} r={[0.2, 0, 0.2]} mat={m('#2a1a3a')} />
      <Box p={[0, 1.23, 0]} s={[0.27, 0.05, 0.25]} mat={m('#ff7a2e')} />
    </Person>
  );
}

// ─── Dracula ─────────────────────────────────────────────────────────────────
function Bat() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const f = Math.sin(clock.elapsedTime * 18) * 0.7;
    ref.current.children[0].rotation.z = f;
    ref.current.children[1].rotation.z = -f;
  });
  return (
    <group position={[0, 0.6, 0]}>
      <Box p={[0, 0.3, 0]} s={[0.34, 0.34, 0.3]} mat={m('#3a2438')} />
      <Box p={[0.1, 0.52, 0]} s={[0.08, 0.12, 0.06]} mat={m('#3a2438')} />
      <Box p={[-0.1, 0.52, 0]} s={[0.08, 0.12, 0.06]} mat={m('#3a2438')} />
      <Eyes y={0.34} z={0.155} gap={0.07} c="#ffdd55" />
      <group ref={ref} position={[0, 0.32, 0]}>
        <group position={[0.17, 0, 0]}><Box p={[0.2, 0, 0]} s={[0.4, 0.03, 0.26]} mat={m('#5a3050')} /></group>
        <group position={[-0.17, 0, 0]}><Box p={[-0.2, 0, 0]} s={[0.4, 0.03, 0.26]} mat={m('#5a3050')} /></group>
      </group>
      <Box p={[0.24, 0.12, 0.05]} s={[0.24, 0.18, 0.1]} mat={m('#d9a86a')} />
    </group>
  );
}

function Vampire({ def, motion }) {
  return (
    <Person skin="#ece4f4" shirt={def?.color ?? '#2a2440'} pants={def?.color ?? '#2a2440'} hair="#1a1424"
      cape={def?.cape ?? '#b3122e'} eyes="#ff2a3a" motion={motion}>
      <Box p={[0, 0.72, 0.112]} s={[0.12, 0.2, 0.01]} mat={m('#ffffff')} cast={false} />
      <BowTie y={0.8} />
      <Box p={[0, 1.2, 0.13]} s={[0.08, 0.08, 0.06]} r={[0, 0, Math.PI / 4]} mat={m('#1a1424')} />
      {def?.crown && <Crown y={1.24} gem="#ff0a2a" />}
    </Person>
  );
}

function Werewolf({ motion }) {
  const fur = '#8a5a3a';
  return (
    <Person skin={fur} shirt="#6a7aa8" pants="#3a3a5a" hair={null} eyes="#ffd23a" head={[0.36, 0.34, 0.32]} motion={motion}>
      <Box p={[0, 0.96, 0.22]} s={[0.18, 0.14, 0.16]} mat={m('#b08060')} />
      <Box p={[0, 1.0, 0.305]} s={[0.06, 0.05, 0.02]} mat={m(INK)} />
      <Box p={[0.12, 1.24, 0]} s={[0.08, 0.14, 0.06]} mat={m(fur)} />
      <Box p={[-0.12, 1.24, 0]} s={[0.08, 0.14, 0.06]} mat={m(fur)} />
      <Box p={[0, 0.45, -0.2]} s={[0.08, 0.08, 0.3]} r={[0.6, 0, 0]} mat={m(fur)} />
    </Person>
  );
}

function Countess({ motion }) {
  return (
    <Person skin="#f2e8f0" shirt="#c21a3a" dress="#a8122e" hair="#1a1424" long eyes="#ff2a3a" motion={motion}>
      <Box p={[0, 1.28, -0.08]} s={[0.18, 0.16, 0.16]} mat={m('#1a1424')} />
      <Box p={[0, 1.02, -0.2]} s={[0.46, 0.4, 0.04]} mat={m('#1a1424')} />
      <Box p={[0, 0.8, 0.115]} s={[0.07, 0.07, 0.02]} mat={glow('#ff2a4a')} />
    </Person>
  );
}

function Nosferatu({ motion }) {
  const skin = '#b8c4b0';
  return (
    <Person skin={skin} shirt="#1a1418" pants="#1a1418" hair={null} eyes="#fff7a0" head={[0.3, 0.36, 0.3]} hunch={0.2} motion={motion}>
      <Box p={[0.19, 1.04, 0]} s={[0.06, 0.16, 0.05]} r={[0, 0, -0.5]} mat={m(skin)} />
      <Box p={[-0.19, 1.04, 0]} s={[0.06, 0.16, 0.05]} r={[0, 0, 0.5]} mat={m(skin)} />
      <Box p={[0, 0.4, 0]} s={[0.4, 0.5, 0.26]} mat={m('#1a1418')} />
    </Person>
  );
}

function Igor({ motion }) {
  return (
    <Person skin="#e0c8a8" shirt="#5a5448" pants="#3a3430" hair="#3a3028" hunch={0.25} motion={motion}>
      <Box p={[0.06, 0.86, -0.16]} s={[0.24, 0.22, 0.14]} mat={m('#5a5448')} />
      <Box p={[0.07, 1.04, 0.152]} s={[0.07, 0.07, 0.02]} mat={m('#ffffff')} cast={false} />
    </Person>
  );
}

function Waiter({ motion }) {
  return (
    <group>
      <Vampire def={{ color: '#141018', cape: '#3a0a18' }} motion={motion} />
      <Box p={[0.28, 0.72, 0.24]} s={[0.3, 0.03, 0.3]} mat={m(GOLD, { metal: 0.5 })} />
      <Box p={[0.28, 0.8, 0.24]} s={[0.07, 0.14, 0.07]} mat={m('#c0122a', { opacity: 0.85 })} />
    </group>
  );
}

function Ghoul(props) {
  return <Zombie {...props} skin="#a8b0a0" shirt="#5a4a5a" />;
}

function BeetleCart() {
  return <Beetle cart />;
}

// ─── Pyramide ────────────────────────────────────────────────────────────────
function Beetle({ cart }) {
  const shell = m('#1fb0a8', { metal: 0.5, rough: 0.35 });
  return (
    <group>
      <Box p={[0, 0.22, 0]} s={[0.46, 0.26, 0.56]} mat={shell} />
      <Box p={[0, 0.36, -0.02]} s={[0.02, 0.02, 0.5]} mat={m('#0c5a56')} cast={false} />
      <Box p={[0, 0.22, 0.34]} s={[0.26, 0.18, 0.14]} mat={m('#0f6a66')} />
      <Eyes y={0.25} z={0.415} gap={0.07} c="#ffd36b" />
      {[-0.15, 0, 0.15].map(z => [1, -1].map(sx => (
        <Box key={`${z}${sx}`} p={[sx * 0.27, 0.08, z]} s={[0.14, 0.04, 0.04]} r={[0, 0, sx * -0.5]} mat={m('#0c3a38')} />
      )))}
      {cart && <Box p={[0, 0.24, 0.62]} s={[0.4, 0.4, 0.4]} mat={m('#e8c080')} />}
    </group>
  );
}

function Mummy({ motion }) {
  const wrap = '#efe3c4';
  return (
    <Person skin={wrap} shirt={wrap} pants={wrap} shoes="#d6c7a2" hair={null} eyes="#7cffb0" motion={motion}>
      {[0.5, 0.64, 0.78, 0.94, 1.1].map((y, i) => (
        <Box key={y} p={[0, y, 0]} s={[i > 2 ? 0.35 : 0.37, 0.03, i > 2 ? 0.31 : 0.23]} r={[0, 0, (i % 2 ? 1 : -1) * 0.1]} mat={m('#d6c7a2')} cast={false} />
      ))}
      <Box p={[0.2, 0.9, -0.16]} s={[0.05, 0.3, 0.02]} r={[0.3, 0, 0.5]} mat={m(wrap)} />
    </Person>
  );
}

function Cat() {
  const fur = m('#1c1820');
  return (
    <group>
      <Box p={[0, 0.25, -0.05]} s={[0.3, 0.3, 0.5]} mat={fur} />
      <Box p={[0, 0.5, 0.2]} s={[0.3, 0.28, 0.28]} mat={fur} />
      <Box p={[0.09, 0.69, 0.2]} s={[0.07, 0.12, 0.05]} mat={fur} />
      <Box p={[-0.09, 0.69, 0.2]} s={[0.07, 0.12, 0.05]} mat={fur} />
      <Eyes y={0.53} z={0.345} gap={0.07} c="#7fffd4" />
      <Box p={[0, 0.38, 0.2]} s={[0.32, 0.05, 0.3]} mat={m(GOLD, { metal: 0.5 })} />
      <Box p={[0, 0.4, -0.38]} s={[0.06, 0.06, 0.3]} r={[-0.8, 0, 0]} mat={fur} />
      {[[0.1, 0.12], [-0.1, 0.12], [0.1, -0.22], [-0.1, -0.22]].map(([x, z]) => (
        <Box key={`${x}${z}`} p={[x, 0.05, z]} s={[0.08, 0.1, 0.08]} mat={fur} />
      ))}
    </group>
  );
}

function Anubis({ motion }) {
  return (
    <Person skin="#1c1820" shirt="#1c1820" pants="#f4eee0" shoes={GOLD} hair={null} eyes="#ffd36b" motion={motion}>
      <Box p={[0, 0.84, 0]} s={[0.44, 0.08, 0.28]} mat={m(GOLD, { metal: 0.5 })} />
      <Box p={[0, 0.96, 0.22]} s={[0.14, 0.12, 0.16]} mat={m('#1c1820')} />
      <Box p={[0.09, 1.26, -0.02]} s={[0.07, 0.22, 0.06]} mat={m('#1c1820')} />
      <Box p={[-0.09, 1.26, -0.02]} s={[0.07, 0.22, 0.06]} mat={m('#1c1820')} />
      <Box p={[0.34, 0.8, 0.14]} s={[0.035, 1.3, 0.035]} mat={m(GOLD, { metal: 0.5 })} />
    </Person>
  );
}

function Priestess({ motion }) {
  return (
    <Person skin="#c89060" shirt="#f4eee0" dress="#f4eee0" hair="#1a1418" long motion={motion}>
      <Box p={[0, 1.1, 0]} s={[0.37, 0.04, 0.33]} mat={m(GOLD, { metal: 0.5 })} />
      <Box p={[0, 1.11, 0.16]} s={[0.05, 0.05, 0.02]} mat={glow('#3fe0e0')} />
      <Box p={[0, 0.82, 0.01]} s={[0.4, 0.06, 0.25]} mat={m(GOLD, { metal: 0.5 })} />
    </Person>
  );
}

function Pharaoh({ motion }) {
  return (
    <Person skin="#c89060" shirt="#f4eee0" pants="#f4eee0" shoes={GOLD} hair={null} motion={motion}>
      <Box p={[0, 1.08, -0.02]} s={[0.4, 0.4, 0.36]} mat={m('#2a5aa8')} />
      {[0.94, 1.04, 1.14, 1.24].map(y => (
        <Box key={y} p={[0, y, -0.02]} s={[0.41, 0.035, 0.37]} mat={m(GOLD, { metal: 0.5 })} cast={false} />
      ))}
      <Box p={[0, 1.0, 0.13]} s={[0.3, 0.26, 0.08]} mat={m('#c89060')} />
      <Eyes y={1.03} z={0.175} />
      <Box p={[0, 0.86, 0.17]} s={[0.05, 0.12, 0.04]} mat={m('#2a5aa8')} />
      <Box p={[0, 0.82, 0.01]} s={[0.44, 0.07, 0.27]} mat={m(GOLD, { metal: 0.5 })} />
    </Person>
  );
}

// ─── Eispalast ───────────────────────────────────────────────────────────────
function SnowSprite() {
  const snow = RimM('#ffffff', '#9fe8ff', { strength: 0.8, intensity: 0.15 });
  return (
    <group position={[0, 0.35, 0]}>
      <Box p={[0, 0.4, 0]} s={[0.44, 0.44, 0.44]} mat={snow} />
      <Eyes y={0.45} z={0.225} gap={0.09} s={0.06} />
      <Box p={[0, 0.36, 0.25]} s={[0.05, 0.05, 0.1]} mat={m('#ff8a2e')} />
      {[-0.12, 0, 0.12].map(x => <Box key={x} p={[x, 0.68, 0]} s={[0.06, 0.14 + (x === 0 ? 0.06 : 0), 0.06]} mat={RimM('#bfe8ff', '#6fdcff')} />)}
    </group>
  );
}

function Gnome({ motion }) {
  return (
    <group scale={0.8}>
      <Person skin="#f4d0b8" shirt="#2a6ad0" pants="#8fe8ff" hair="#ffffff" motion={motion}>
        <Box p={[0, 0.9, 0.14]} s={[0.3, 0.2, 0.06]} mat={m('#ffffff')} />
        <Box p={[0, 1.24, 0]} s={[0.34, 0.14, 0.32]} mat={m('#8fe8ff')} />
        <Box p={[0, 1.38, -0.02]} s={[0.22, 0.14, 0.22]} mat={m('#8fe8ff')} />
        <Box p={[0, 1.5, -0.05]} s={[0.1, 0.12, 0.1]} mat={m('#8fe8ff')} />
      </Person>
    </group>
  );
}

function Penguin({ butler }) {
  const black = m('#1c2030');
  return (
    <group>
      <Box p={[0, 0.42, 0]} s={[0.42, 0.66, 0.36]} mat={black} />
      <Box p={[0, 0.38, 0.17]} s={[0.3, 0.5, 0.04]} mat={m('#f6f8fc')} />
      <Box p={[0, 0.88, 0]} s={[0.36, 0.3, 0.32]} mat={black} />
      <Eyes y={0.92} z={0.165} c="#ffffff" />
      <Box p={[0, 0.84, 0.2]} s={[0.1, 0.06, 0.1]} mat={m('#ffa33a')} />
      <Box p={[0.1, 0.04, 0.08]} s={[0.12, 0.05, 0.18]} mat={m('#ffa33a')} />
      <Box p={[-0.1, 0.04, 0.08]} s={[0.12, 0.05, 0.18]} mat={m('#ffa33a')} />
      <Box p={[0.25, 0.5, 0]} s={[0.06, 0.36, 0.18]} r={[0, 0, 0.3]} mat={black} />
      <Box p={[-0.25, 0.5, 0]} s={[0.06, 0.36, 0.18]} r={[0, 0, -0.3]} mat={black} />
      {butler && <BowTie y={0.7} c="#e0203a" />}
    </group>
  );
}

function PenguinButler() {
  return <Penguin butler />;
}

function Yeti({ motion }) {
  return (
    <group scale={1.2}>
      <Person skin="#f4f8ff" shirt="#f4f8ff" pants="#f4f8ff" shoes="#9fb8d8" hair={null} head={[0.38, 0.34, 0.32]} motion={motion}>
        <Box p={[0, 0.99, 0.15]} s={[0.26, 0.22, 0.04]} mat={m('#8ab4e8')} />
        <Box p={[0.14, 1.23, 0]} s={[0.06, 0.12, 0.06]} r={[0, 0, -0.4]} mat={m('#cfd8e8')} />
        <Box p={[-0.14, 1.23, 0]} s={[0.06, 0.12, 0.06]} r={[0, 0, 0.4]} mat={m('#cfd8e8')} />
        <Box p={[0, 0.9, 0.172]} s={[0.1, 0.04, 0.01]} mat={m(INK)} cast={false} />
      </Person>
    </group>
  );
}

function Elf({ motion }) {
  const wing = RimM('#d8f8ff', '#6fdcff', { strength: 1, intensity: 0.3, opacity: 0.6 });
  return (
    <Person skin="#eef6ff" shirt="#8fe8ff" dress="#6ad0f0" hair="#ffffff" long eyes="#3fb8ff" motion={motion}>
      <Box p={[0.2, 1.03, 0]} s={[0.05, 0.12, 0.04]} r={[0, 0, -0.9]} mat={m('#eef6ff')} />
      <Box p={[-0.2, 1.03, 0]} s={[0.05, 0.12, 0.04]} r={[0, 0, 0.9]} mat={m('#eef6ff')} />
      <Box p={[0.22, 0.78, -0.18]} s={[0.36, 0.44, 0.02]} r={[0, 0.5, 0.3]} mat={wing} cast={false} />
      <Box p={[-0.22, 0.78, -0.18]} s={[0.36, 0.44, 0.02]} r={[0, -0.5, -0.3]} mat={wing} cast={false} />
    </Person>
  );
}

function IceQueen({ motion }) {
  const ice = RimM('#bfe8ff', '#6fdcff', { strength: 1, intensity: 0.3 });
  return (
    <Person skin="#eef8ff" shirt="#dff4ff" dress="#9fdcff" hair="#f8fcff" long eyes="#3fb8ff" motion={motion}>
      {[-0.12, -0.06, 0, 0.06, 0.12].map(x => (
        <Box key={x} p={[x, 1.24 + (x === 0 ? 0.05 : 0), 0.05]} s={[0.04, 0.14 + (x === 0 ? 0.1 : 0), 0.04]} mat={ice} />
      ))}
      <Box p={[0, 0.6, -0.17]} s={[0.5, 0.8, 0.03]} mat={RimM('#9fdcff', '#4fd8ff', { opacity: 0.6 })} cast={false} />
    </Person>
  );
}

function Snowman() {
  const snow = m('#f8fcff');
  return (
    <group>
      <Box p={[0, 0.22, 0]} s={[0.44, 0.44, 0.44]} mat={snow} />
      <Box p={[0, 0.6, 0]} s={[0.34, 0.32, 0.34]} mat={snow} />
      <Box p={[0, 0.9, 0]} s={[0.28, 0.26, 0.28]} mat={snow} />
      <Eyes y={0.93} z={0.145} />
      <Box p={[0, 0.88, 0.2]} s={[0.05, 0.05, 0.14]} mat={m('#ff8a2e')} />
      <Box p={[0, 0.76, 0]} s={[0.36, 0.06, 0.36]} mat={m('#e0203a')} />
      <TopHat y={1.05} />
      <Box p={[0.3, 0.5, 0.25]} s={[0.04, 0.9, 0.04]} r={[0.35, 0, 0]} mat={m('#9b6a3a')} />
      <Box p={[0.3, 0.08, 0.42]} s={[0.26, 0.1, 0.12]} mat={m('#c9a24a')} />
    </group>
  );
}

// ─── registry ────────────────────────────────────────────────────────────────
const MODELS = {
  ghost: Ghost, bat: Bat, vampire: Vampire, werewolf: Werewolf, countess: Countess, nosferatu: Nosferatu,
  beetle: Beetle, mummy: Mummy, cat: Cat, anubis: Anubis, priestess: Priestess, pharaoh: Pharaoh,
  snowSprite: SnowSprite, gnome: Gnome, penguin: Penguin, yeti: Yeti, elf: Elf, iceQueen: IceQueen,
  skeleton: Skeleton, zombie: Zombie, witch: Witch, igor: Igor, ghoul: Ghoul,
  waiter: Waiter, beetleCart: BeetleCart, penguinButler: PenguinButler, snowman: Snowman,
};

/** Models that hover instead of walking. */
export const FLOATING = new Set(['ghost', 'bat', 'snowSprite']);

/** Renders the blocky model for a guest/staff definition. `motion` drives the walk cycle. */
export default function Blocky({ def, motion }) {
  const C = MODELS[def.model] ?? Ghost;
  return <C def={def} motion={motion} />;
}
