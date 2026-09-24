/**
 * Shared hotel grounds in front of every building, coloured by the theme:
 * paved entrance path with red carpet and awning, hedges with flower beds
 * along the facade, benches and lanterns, a big hotel sign showing the
 * star rating, and a small parking lot beside the garden.
 */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { starsFor } from '../../../game/config';
import useHotel from '../../../game/store';
import { PopIn } from '../anim';
import { Vehicle } from '../Street';
import { GOLD } from '../Props';
import { Ball, Blob, Box, Cone, Cyl, M, Rock, rand } from '../primitives';
import { useTheme } from '../theme';

const Y = -0.5;               // garden ground level
const FLOWERS = ['#ff5a7a', '#ffd23a', '#ffffff', '#b77cff', '#ff8a3a'];

function Hedge({ from, to, h = 0.55, t = 0.5, flowers = true, seed = 0 }) {
  const [x0, z0] = from;
  const [x1, z1] = to;
  const len = Math.hypot(x1 - x0, z1 - z0);
  const along = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const n = Math.floor(len / 0.45);
  return (
    <group>
      <Box p={[cx, Y + h / 2, cz]} s={along ? [len, h, t] : [t, h, len]} c="#3fa04a" />
      <Box p={[cx, Y + h + 0.03, cz]} s={along ? [len - 0.1, 0.06, t - 0.1] : [t - 0.1, 0.06, len - 0.1]} c="#56bd5a" cast={false} />
      {flowers && Array.from({ length: n }, (_, i) => {
        const k = (i + 0.5) / n;
        const x = x0 + (x1 - x0) * k + (along ? 0 : (rand(i + seed) - 0.5) * 0.25);
        const z = z0 + (z1 - z0) * k + (along ? (rand(i + seed) - 0.5) * 0.25 : 0);
        return (
          <Ball key={i} p={[x, Y + h + 0.08, z]} rad={0.08} w={5} hs={3}
            mat={M(FLOWERS[Math.floor(rand(i * 3 + seed) * FLOWERS.length)])} cast={false} />
        );
      })}
    </group>
  );
}

function Bench({ p, r = 0 }) {
  const { palette } = useTheme();
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.4, 0]} s={[1.3, 0.08, 0.42]} mat={M(palette.wood)} />
      <Box p={[0, 0.72, -0.19]} s={[1.3, 0.3, 0.06]} mat={M(palette.wood)} />
      {[-0.55, 0.55].map(x => (
        <Box key={x} p={[x, 0.2, 0]} s={[0.08, 0.4, 0.4]} c="#3a3440" />
      ))}
      <Blob p={[0, 0.02, 0]} size={1.4} />
    </group>
  );
}

function Lantern({ p }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.05, 0]} rt={0.14} h={0.1} seg={6} c="#3a3440" />
      <Cyl p={[0, 0.7, 0]} rt={0.04} h={1.3} seg={5} c="#3a3440" />
      <Box p={[0, 1.45, 0]} s={[0.26, 0.3, 0.26]} mat={M('#fff3c0', { emissive: '#ffd88a', intensity: 0.8 })} />
      <Cone p={[0, 1.68, 0]} rad={0.22} h={0.18} seg={4} r={[0, Math.PI / 4, 0]} c="#3a3440" />
      <Blob p={[0, 0.02, 0]} size={0.5} />
    </group>
  );
}

function Topiary({ p }) {
  return (
    <group position={p}>
      <Box p={[0, 0.22, 0]} s={[0.45, 0.44, 0.45]} c="#d8d0c8" />
      <Rock p={[0, 0.72, 0]} rad={0.32} detail={0} c="#3fa04a" />
      <Rock p={[0, 1.12, 0]} rad={0.2} detail={0} c="#56bd5a" />
      <Blob p={[0, 0.02, 0]} size={0.8} />
    </group>
  );
}

/** Hotel sign by the sidewalk: bulb frame, accent board and the star rating. */
function HotelSign({ p }) {
  const { palette, pm, id } = useTheme();
  const stars = useHotel(s => starsFor(s.hotels[id]?.totalEarned ?? 0, pm));
  const bulbs = useRef([]);
  useFrame(({ clock }) => {
    const t = Math.floor(clock.elapsedTime * 4);
    bulbs.current.forEach((b, i) => { if (b) b.visible = (i + t) % 3 !== 0; });
  });
  const frame = [];
  for (let i = 0; i < 9; i++) frame.push([-1.2 + i * 0.3, 0.62], [-1.2 + i * 0.3, -0.62]);
  for (let i = 1; i < 4; i++) frame.push([-1.3, -0.62 + i * 0.31], [1.3, -0.62 + i * 0.31]);
  return (
    <group position={p}>
      {[-0.95, 0.95].map(x => <Box key={x} p={[x, 0.7, 0]} s={[0.14, 1.4, 0.14]} c="#3a3440" />)}
      <group position={[0, 2.0, 0]}>
        <Box s={[2.8, 1.45, 0.2]} mat={M(palette.woodDark)} />
        <Box p={[0, 0, 0.11]} s={[2.5, 1.15, 0.04]} mat={M(palette.rugHi)} cast={false} />
        {/* star rating */}
        {[0, 1, 2, 3, 4].map(i => (
          <group key={i} position={[-0.9 + i * 0.45, -0.18, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <Cone rad={0.17} h={0.05} seg={5} mat={i < stars ? GOLD() : M('#2a2436')} cast={false} />
          </group>
        ))}
        <Box p={[0, 0.3, 0.14]} s={[1.9, 0.26, 0.03]} mat={M('#ffffff')} cast={false} />
        {frame.map(([x, y], i) => (
          <Ball key={i} ref={el => { bulbs.current[i] = el; }} p={[x, y, 0.12]} rad={0.05} w={5} hs={3}
            mat={M('#fff6c0', { emissive: '#ffe070', intensity: 1 })} cast={false} />
        ))}
      </group>
      <Blob p={[0, 0.02, 0]} size={2.4} />
    </group>
  );
}

function ParkingLot() {
  const { palette } = useTheme();
  const colors = palette.cars ?? ['#2a2440', '#8a4ad0', '#e8703c'];
  const x0 = -8.6, x1 = -1.6, z0 = 13.2, z1 = 20.15;
  return (
    <group>
      <Box p={[(x0 + x1) / 2, Y + 0.02, (z0 + z1) / 2]} s={[x1 - x0, 0.04, z1 - z0]} mat={M(palette.road ?? '#5e5a6e')} cast={false} />
      <Box p={[(x0 + x1) / 2, Y + 0.05, z0 + 0.08]} s={[x1 - x0, 0.1, 0.16]} mat={M('#ffffff')} cast={false} />
      {/* 5 bays facing the road */}
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={i} p={[x0 + 0.35 + i * 1.26, Y + 0.045, z0 + 1.3]} s={[0.08, 0.01, 2.2]} mat={M('#ffffff')} cast={false} />
      ))}
      {[[0, 0], [2, 1], [3, 2]].map(([bay, c]) => (
        <group key={bay} position={[x0 + 0.98 + bay * 1.26, Y, z0 + 1.35]} rotation={[0, Math.PI / 2, 0]} scale={0.95}>
          <Vehicle color={colors[c % colors.length]} />
        </group>
      ))}
      {/* "P" sign */}
      <group position={[x1 - 0.3, Y, z1 - 0.6]}>
        <Box p={[0, 0.8, 0]} s={[0.08, 1.6, 0.08]} c="#3a3440" />
        <Box p={[0, 1.7, 0.02]} s={[0.55, 0.55, 0.06]} c="#2f7de0" />
        <Box p={[-0.07, 1.7, 0.06]} s={[0.08, 0.36, 0.02]} c="#ffffff" cast={false} />
        <Box p={[0.04, 1.8, 0.06]} s={[0.18, 0.16, 0.02]} c="#ffffff" cast={false} />
      </group>
    </group>
  );
}

export default function Grounds({ wing = 0 }) {
  const { palette } = useTheme();
  const carpet = M('#d8344a');
  return (
    <group>
      {/* paved entrance path with curbs + red carpet */}
      <Box p={[13, Y + 0.02, 16.3]} s={[2.2, 0.05, 7.8]} mat={M(palette.path, { tx: 'cleanTiles', rx: 2, ry: 8 })} cast={false} />
      {[11.85, 14.15].map(x => (
        <Box key={x} p={[x, Y + 0.06, 16.3]} s={[0.12, 0.12, 7.8]} mat={M(palette.wallTop)} cast={false} />
      ))}
      <Box p={[13, Y + 0.05, 14.1]} s={[1.2, 0.02, 3.4]} mat={carpet} cast={false} />
      {[12.38, 13.62].map(x => (
        <Box key={x} p={[x, Y + 0.055, 14.1]} s={[0.05, 0.02, 3.4]} mat={GOLD()} cast={false} />
      ))}

      {/* striped entrance awning */}
      <PopIn position={[12.9, 0, 13.2]} delay={1.5}>
        {[-1.05, 1.05].map(x => (
          <group key={x}>
            <Cyl p={[x, 0.9 + Y, 0.9]} rt={0.05} h={2.8} seg={6} mat={GOLD()} />
          </group>
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <Box key={i} p={[-1.08 + i * 0.36, 2.35, 0.2]} s={[0.36, 0.08, 1.7]} r={[-0.18, 0, 0]}
            mat={M(i % 2 ? '#ffffff' : palette.rugHi)} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <Box key={`v${i}`} p={[-1.08 + i * 0.36, 2.12, 1.05]} s={[0.36, 0.22, 0.04]} mat={M(i % 2 ? '#ffffff' : palette.rugHi)} cast={false} />
        ))}
      </PopIn>

      {/* hedges + flower beds along the facade */}
      <Hedge from={[0.2, 12.95]} to={[10.9, 12.95]} seed={1} />
      {!wing && <Hedge from={[14.95, 1]} to={[14.95, 11.6]} seed={5} />}
      {wing > 0 && wing < 8 && <Hedge from={[14.95, wing + 0.9]} to={[14.95, 11.6]} seed={5} />}
      {wing > 8 && <Hedge from={[14.9, wing + 0.9]} to={[20.4, wing + 0.9]} seed={9} />}

      {/* benches with lanterns beside the path (the themed gate pieces flank it closer in) */}
      <Bench p={[10.7, Y, 18.6]} r={Math.PI / 2} />
      <Bench p={[15.3, Y, 18.6]} r={-Math.PI / 2} />
      <Lantern p={[10.6, Y, 19.7]} />
      <Topiary p={[15.3, Y, 17.4]} />

      <HotelSign p={[16.9, Y, 19.2]} />
      <ParkingLot />
    </group>
  );
}
