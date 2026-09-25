/**
 * Guest-room interiors: a small catalog of low-poly furniture and one
 * furniture plan per room layout (see ROOM_LAYOUTS in game/config.js).
 * Every piece faces +z (towards the room's front wall) before its rotation.
 * Rooms fill up with level: each entry has the minimum room level it needs.
 */

import { PopIn } from './anim';
import { Candelabra, Candle, GOLD, Painting } from './Props';
import { Ball, Box, Cyl, M, Rock } from './primitives';

/** Dark jewel-tone wallpaper, a glowing accent and a rug colour per room. */
export const ROOM_COLORS = [
  { paper: '#5a3a6e', accent: '#ff7a1a', rug: '#8a3a1e' },
  { paper: '#2c5456', accent: '#5ae0a0', rug: '#1e6a52' },
  { paper: '#62283a', accent: '#ff4a62', rug: '#8a1e34' },
  { paper: '#46502a', accent: '#c8f05a', rug: '#5a6a1e' },
  { paper: '#2c386a', accent: '#8aa8ff', rug: '#34428a' },
  { paper: '#643a22', accent: '#ffb03a', rug: '#8a541e' },
]

// ─── pieces ──────────────────────────────────────────────────────────────────
function Nightstand({ pal }) {
  return (
    <group>
      <Box p={[0, 0.28, 0]} s={[0.45, 0.56, 0.4]} mat={M(pal.wood)} />
      <Box p={[0, 0.3, 0.205]} s={[0.3, 0.1, 0.02]} mat={M(pal.woodDark)} cast={false} />
      <Candle p={[0.08, 0.56, 0]} />
    </group>
  );
}

function Wardrobe({ pal, level }) {
  return (
    <group>
      <Box p={[0, 0.8, 0]} s={[0.9, 1.6, 0.45]} mat={M(pal.woodDark)} />
      <Box p={[0, 1.63, 0]} s={[0.98, 0.08, 0.5]} mat={M(pal.wood)} />
      <Box p={[0, 0.8, 0.23]} s={[0.02, 1.4, 0.02]} mat={M(pal.wood)} cast={false} />
      {[-0.08, 0.08].map(x => (
        <Box key={x} p={[x, 0.85, 0.235]} s={[0.04, 0.14, 0.03]} mat={level >= 4 ? GOLD() : M('#3a3440')} cast={false} />
      ))}
    </group>
  );
}

function Armchair({ color }) {
  const c = M(color);
  return (
    <group>
      <Box p={[0, 0.2, 0]} s={[0.6, 0.4, 0.55]} mat={c} />
      <Box p={[0, 0.55, -0.22]} s={[0.6, 0.55, 0.14]} mat={c} />
      <Box p={[0.27, 0.34, 0]} s={[0.09, 0.3, 0.55]} mat={c} />
      <Box p={[-0.27, 0.34, 0]} s={[0.09, 0.3, 0.55]} mat={c} />
      <Box p={[0, 0.42, 0.03]} s={[0.44, 0.06, 0.44]} mat={M('#ffffff')} cast={false} />
    </group>
  );
}

function Loveseat({ color }) {
  const c = M(color);
  return (
    <group>
      <Box p={[0, 0.2, 0]} s={[1.1, 0.4, 0.55]} mat={c} />
      <Box p={[0, 0.55, -0.22]} s={[1.1, 0.5, 0.14]} mat={c} />
      <Box p={[0.52, 0.34, 0]} s={[0.1, 0.32, 0.55]} mat={c} />
      <Box p={[-0.52, 0.34, 0]} s={[0.1, 0.32, 0.55]} mat={c} />
      <Box p={[-0.2, 0.52, -0.08]} s={[0.3, 0.26, 0.1]} r={[-0.2, 0, 0.1]} mat={M('#ffffff')} cast={false} />
    </group>
  );
}

function Suitcase({ color }) {
  return (
    <group>
      <Box p={[0, 0.24, 0]} s={[0.5, 0.46, 0.2]} mat={M(color)} />
      <Box p={[0, 0.24, 0]} s={[0.52, 0.06, 0.22]} mat={M('#ffffff')} cast={false} />
      <Box p={[0, 0.51, 0]} s={[0.18, 0.06, 0.05]} mat={M('#2c2433')} cast={false} />
    </group>
  );
}

function FloorLamp() {
  return (
    <group>
      <Cyl p={[0, 0.03, 0]} rt={0.14} h={0.06} seg={8} c="#3a3440" />
      <Cyl p={[0, 0.55, 0]} rt={0.025} h={1.05} seg={5} c="#3a3440" />
      <Cyl p={[0, 1.12, 0]} rt={0.13} rb={0.22} h={0.26} seg={8} mat={M('#fff4d8', { emissive: '#ffe0a0', intensity: 0.5 })} />
    </group>
  );
}

function Desk({ pal, color }) {
  return (
    <group>
      <Box p={[0, 0.6, 0]} s={[0.95, 0.07, 0.45]} mat={M(pal.wood)} />
      {[[-0.42, -0.18], [0.42, -0.18], [-0.42, 0.18], [0.42, 0.18]].map(([x, z]) => (
        <Box key={`${x}${z}`} p={[x, 0.3, z]} s={[0.06, 0.6, 0.06]} mat={M(pal.woodDark)} />
      ))}
      <Box p={[-0.2, 0.67, -0.05]} s={[0.3, 0.06, 0.22]} r={[0, 0.3, 0]} mat={M(color)} cast={false} />
      <Candle p={[0.3, 0.64, -0.1]} />
      {/* chair */}
      <group position={[0, 0, 0.45]}>
        <Box p={[0, 0.36, 0]} s={[0.38, 0.06, 0.36]} mat={M(color)} />
        <Box p={[0, 0.6, 0.17]} s={[0.38, 0.45, 0.05]} mat={M(pal.woodDark)} />
        {[[-0.16, -0.15], [0.16, -0.15], [-0.16, 0.15], [0.16, 0.15]].map(([x, z]) => (
          <Box key={`${x}${z}`} p={[x, 0.17, z]} s={[0.04, 0.34, 0.04]} mat={M(pal.woodDark)} cast={false} />
        ))}
      </group>
    </group>
  );
}

const BOOK_COLORS = ['#e05a5a', '#3f94d6', '#f2c230', '#4caf50', '#8a5ad0', '#ffffff'];

function Bookshelf({ pal }) {
  return (
    <group>
      <Box p={[0, 0.85, -0.02]} s={[1.0, 1.7, 0.36]} mat={M(pal.woodDark)} />
      {[0.35, 0.8, 1.25].map((y, row) => (
        <group key={y}>
          <Box p={[0, y - 0.13, 0.12]} s={[0.9, 0.04, 0.2]} mat={M(pal.wood)} cast={false} />
          {Array.from({ length: 6 }, (_, i) => (
            <Box key={i} p={[-0.36 + i * 0.14, y + 0.04, 0.12]} s={[0.1, 0.3 - ((i + row) % 3) * 0.04, 0.2]}
              mat={M(BOOK_COLORS[(i + row * 2) % BOOK_COLORS.length])} cast={false} />
          ))}
        </group>
      ))}
    </group>
  );
}

function Dresser({ pal }) {
  return (
    <group>
      <Box p={[0, 0.4, 0]} s={[1.0, 0.8, 0.42]} mat={M(pal.wood)} />
      {[0.22, 0.52].map(y => (
        <Box key={y} p={[0, y, 0.215]} s={[0.86, 0.22, 0.02]} mat={M(pal.woodDark)} cast={false} />
      ))}
      <Box p={[0, 1.3, -0.16]} s={[0.6, 0.8, 0.06]} mat={M(pal.woodDark)} />
      <Box p={[0, 1.3, -0.125]} s={[0.48, 0.66, 0.02]} mat={M('#cdeeff', { emissive: '#bfe6ff', intensity: 0.25 })} cast={false} />
      <Ball p={[0.32, 0.9, 0]} rad={0.09} w={6} hs={4} c="#f28fb0" />
    </group>
  );
}

function Bathtub({ color }) {
  return (
    <group>
      <Box p={[0, 0.32, 0]} s={[1.2, 0.5, 0.62]} mat={M('#ffffff')} />
      <Box p={[0, 0.555, 0]} s={[1.06, 0.02, 0.48]} mat={M('#8fd8f5', { emissive: '#8fd8f5', intensity: 0.2 })} cast={false} />
      {[[-0.5, -0.24], [0.5, -0.24], [-0.5, 0.24], [0.5, 0.24]].map(([x, z]) => (
        <Box key={`${x}${z}`} p={[x, 0.04, z]} s={[0.1, 0.08, 0.1]} mat={GOLD()} cast={false} />
      ))}
      <Cyl p={[-0.52, 0.72, 0]} rt={0.03} h={0.36} seg={5} mat={GOLD()} />
      <Ball p={[0.15, 0.6, 0.08]} rad={0.1} w={6} hs={4} c="#ffffff" />
      <Ball p={[0.3, 0.6, -0.05]} rad={0.08} w={6} hs={4} c="#ffffff" />
      <Box p={[0.75, 0.02, 0]} s={[0.4, 0.02, 0.6]} mat={M(color)} cast={false} />
    </group>
  );
}

function Fireplace({ pal }) {
  return (
    <group>
      <Box p={[0, 0.6, -0.05]} s={[0.95, 1.2, 0.34]} mat={M(pal.wallTop)} />
      <Box p={[0, 1.22, 0]} s={[1.05, 0.08, 0.44]} mat={M(pal.woodDark)} />
      <Box p={[0, 0.38, 0.1]} s={[0.55, 0.6, 0.06]} mat={M('#2c2433')} cast={false} />
      <Rock p={[0, 0.22, 0.12]} rad={0.14} sc={[1.4, 0.9, 0.8]} mat={M('#ffb33a', { emissive: '#ff8a1a', intensity: 0.9 })} cast={false} />
      <Rock p={[0.02, 0.36, 0.12]} rad={0.08} sc={[0.9, 1.4, 0.8]} mat={M('#ffe27a', { emissive: '#ffd24a', intensity: 1 })} cast={false} />
      <Candle p={[-0.35, 1.26, 0]} />
      <Candle p={[0.35, 1.26, 0]} />
    </group>
  );
}

function Plant() {
  return (
    <group>
      <Cyl p={[0, 0.2, 0]} rt={0.18} rb={0.13} h={0.4} seg={8} c="#c8643c" />
      <Rock p={[0, 0.6, 0]} rad={0.28} sc={[1, 1.3, 1]} c="#3fb84a" />
      <Rock p={[0.12, 0.85, 0.05]} rad={0.16} c="#5fd05a" />
    </group>
  );
}

function Trunk({ color, level }) {
  return (
    <group>
      <Box p={[0, 0.22, 0]} s={[0.7, 0.44, 0.42]} mat={M(color)} />
      <Box p={[0, 0.46, 0]} s={[0.72, 0.06, 0.44]} mat={M('#3a3440')} />
      <Box p={[0, 0.34, 0.215]} s={[0.1, 0.12, 0.02]} mat={level >= 7 ? GOLD() : M('#c9c2d0')} cast={false} />
    </group>
  );
}

function Rug({ color, s = [2, 1.4] }) {
  return (
    <group>
      <Box p={[0, 0.025, 0]} s={[s[0], 0.02, s[1]]} mat={M(color)} cast={false} />
      <Box p={[0, 0.03, 0]} s={[s[0] - 0.3, 0.02, s[1] - 0.3]} mat={M('#ffffff', { opacity: 0.25 })} cast={false} />
    </group>
  );
}

const PIECES = {
  nightstand: Nightstand, wardrobe: Wardrobe, armchair: Armchair, loveseat: Loveseat, suitcase: Suitcase,
  lamp: FloorLamp, desk: Desk, bookshelf: Bookshelf, dresser: Dresser, bathtub: Bathtub, fireplace: Fireplace,
  plant: Plant, trunk: Trunk, candelabra: ({ level }) => <Candelabra p={[0, 0, 0]} gold={level >= 7} />,
};

// ─── plans: [piece, x, z, rotY, minLevel] ────────────────────────────────────
const H = Math.PI / 2;

/** One furniture plan per ROOM_LAYOUTS entry (same index). */
const PLANS = [
  { // bed on the left, door right
    rug: [-0.2, -0.15, 2.3, 1.6], painting: [-0.35, 2.0],
    items: [
      ['nightstand', 1.0, -1.2, 0, 1], ['wardrobe', 1.18, -0.15, -H, 1], ['armchair', -1.0, 0.75, 0.7, 1],
      ['lamp', 0.5, -0.3, 0, 1], ['suitcase', -0.2, 1.1, 0.2, 1], ['plant', 1.2, 1.0, 0, 3],
      ['trunk', -1.1, -0.05, H, 4], ['candelabra', -0.45, 0.35, 0, 6],
    ],
  },
  { // mirrored: bed on the right, door left, dresser + loveseat
    rug: [0.2, -0.15, 2.3, 1.6], painting: [0.35, 2.0],
    items: [
      ['nightstand', -1.0, -1.2, 0, 1], ['dresser', -1.18, -0.05, H, 1], ['loveseat', 0.85, 0.85, -0.5, 1],
      ['lamp', -0.5, -0.3, 0, 1], ['suitcase', 0.25, 1.15, -0.3, 1], ['plant', -1.2, 1.0, 0, 3],
      ['trunk', 1.15, -0.1, -H, 4], ['candelabra', 0.45, 0.25, 0, 6],
    ],
  },
  { // bed with headboard on the back wall, fireplace corner
    rug: [0.25, 0.05, 1.9, 1.9], painting: [0.75, 2.1],
    items: [
      ['nightstand', -0.15, -1.2, 0, 1], ['fireplace', 0.75, -1.3, 0, 1], ['armchair', 0.7, -0.45, Math.PI - 0.3, 1],
      ['wardrobe', -1.18, 1.05, H, 1], ['lamp', 1.3, -0.75, 0, 1], ['suitcase', -0.25, 1.1, 0, 1],
      ['desk', 1.18, 0.55, -H, 3], ['candelabra', -0.2, 0.6, 0, 6],
    ],
  },
  { // bed on the right wall, bathtub + bookshelf
    rug: [-0.3, 0.1, 1.8, 1.8], painting: [-0.8, 2.15],
    items: [
      ['nightstand', 0.1, -1.2, 0, 1], ['bookshelf', -0.85, -1.28, 0, 1], ['bathtub', -1.0, 0.4, H, 1],
      ['lamp', 1.25, 1.05, 0, 1], ['suitcase', 0.65, 1.1, -0.2, 1], ['armchair', -0.3, -0.5, 0.4, 2],
      ['plant', -1.25, 1.25, 0, 3], ['candelabra', 0.15, -0.65, 0, 6],
    ],
  },
];

/** Furniture of one room for its layout, colours and level. */
export function RoomInterior({ layout, index, level, pal, back = -1.5, lowBack = false, delay = 0 }) {
  const plan = PLANS[layout];
  const { accent, rug } = ROOM_COLORS[index % ROOM_COLORS.length];
  const [rx, rz, rw, rd] = plan.rug;
  return (
    <group>
      <PopIn position={[rx, 0, rz]} delay={delay - 0.1} dur={0.35}><Rug color={rug} s={[rw, rd]} /></PopIn>
      {plan.items.map(([kind, x, z, r, min], i) => {
        if (level < min) return null;
        const C = PIECES[kind];
        return (
          <PopIn key={i} position={[x, 0, z]} rotation={[0, r, 0]} delay={delay + i * 0.07} drop={0.7}>
            <C pal={pal} level={level} color={accent} />
          </PopIn>
        );
      })}
      {level >= 2 && !lowBack && (
        <PopIn position={[plan.painting[0], plan.painting[1], back + 0.07]} delay={delay + 0.6}><Painting p={[0, 0, 0]} hue={accent} /></PopIn>
      )}
      {level >= 10 && (
        <PopIn position={[0, 2.3, 0]} delay={delay + 0.7}>
          <Ball p={[0, 0, 0]} rad={0.22} w={8} hs={6} mat={M('#f4fbff', { emissive: pal.windowGlow, intensity: 0.8 })} />
        </PopIn>
      )}
    </group>
  );
}
