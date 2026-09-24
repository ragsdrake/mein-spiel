/**
 * Street in front of every hotel (like the parking lots / roads in the
 * tycoon references): sidewalk with curb, road with lane markings, street
 * lamps, parked and driving vehicles in the hotel's colours.
 */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Blob, Box, Cyl, M } from './primitives';
import { useTheme } from './theme';

const Z_WALK = 20.2;   // sidewalk from here …
const Z_ROAD = 21.9;   // … road from here …
const Z_FAR = 26.1;    // … far sidewalk from here
const X0 = -14;
const X1 = 30;

/** Blocky van / hearse / carriage-car. Faces +x. */
export function Vehicle({ color = '#2a2440' }) {
  const glass = M('#bfe6ff');
  const tyre = M('#26222c');
  return (
    <group>
      <Box p={[0, 0.42, 0]} s={[1.9, 0.5, 0.95]} mat={M(color)} />
      <Box p={[-0.2, 0.86, 0]} s={[1.2, 0.42, 0.85]} mat={M(color)} />
      <Box p={[0.41, 0.86, 0]} s={[0.02, 0.32, 0.72]} mat={glass} cast={false} />
      <Box p={[-0.2, 0.86, 0.43]} s={[1.0, 0.3, 0.02]} mat={glass} cast={false} />
      <Box p={[-0.2, 0.86, -0.43]} s={[1.0, 0.3, 0.02]} mat={glass} cast={false} />
      <Box p={[0.96, 0.45, 0.3]} s={[0.02, 0.1, 0.16]} mat={M('#fff6c0', { emissive: '#fff0a0', intensity: 0.6 })} cast={false} />
      <Box p={[0.96, 0.45, -0.3]} s={[0.02, 0.1, 0.16]} mat={M('#fff6c0', { emissive: '#fff0a0', intensity: 0.6 })} cast={false} />
      {[[0.6, 0.48], [-0.6, 0.48], [0.6, -0.48], [-0.6, -0.48]].map(([x, z]) => (
        <Cyl key={`${x}${z}`} p={[x, 0.2, z]} rt={0.2} h={0.14} seg={8} r={[Math.PI / 2, 0, 0]} mat={tyre} />
      ))}
      <Blob p={[0, 0.02, 0]} size={2.2} />
    </group>
  );
}

function Traffic({ colors }) {
  const cars = useRef([]);
  const lanes = [
    { z: 23.9, dir: 1, speed: 2.4, offset: 0 },
    { z: 25.3, dir: -1, speed: 2.0, offset: 17 },
    { z: 23.9, dir: 1, speed: 2.4, offset: 24 },
  ];
  useFrame(({ clock }) => {
    const span = X1 - X0;
    lanes.forEach((l, i) => {
      const c = cars.current[i];
      if (!c) return;
      const d = (clock.elapsedTime * l.speed + l.offset) % span;
      c.position.set(l.dir > 0 ? X0 + d : X1 - d, -0.5, l.z);
      c.rotation.y = l.dir > 0 ? 0 : Math.PI;
    });
  });
  return lanes.map((_, i) => (
    <group key={i} ref={el => { cars.current[i] = el; }}>
      <Vehicle color={colors[i % colors.length]} />
    </group>
  ));
}

export default function Street() {
  const { palette } = useTheme();
  const colors = palette.cars ?? ['#2a2440', '#8a4ad0', '#e8703c'];
  const len = X1 - X0;
  const cx = (X0 + X1) / 2;
  return (
    <group>
      {/* sidewalk + curb */}
      <Box p={[cx, -0.48, (Z_WALK + Z_ROAD) / 2]} s={[len, 0.06, Z_ROAD - Z_WALK]} mat={M(palette.path)} cast={false} />
      <Box p={[cx, -0.44, Z_ROAD - 0.06]} s={[len, 0.1, 0.12]} mat={M('#ffffff')} cast={false} />
      {/* road with dashed centre line and edge lines */}
      <Box p={[cx, -0.5, (Z_ROAD + Z_FAR) / 2]} s={[len, 0.04, Z_FAR - Z_ROAD]} mat={M(palette.road ?? '#5e5a6e')} cast={false} />
      {Array.from({ length: Math.floor(len / 1.6) }, (_, i) => (
        <Box key={i} p={[X0 + 0.4 + i * 1.6, -0.475, (Z_ROAD + Z_FAR) / 2]} s={[0.8, 0.01, 0.12]} mat={M('#ffffff')} cast={false} />
      ))}
      <Box p={[cx, -0.475, Z_ROAD + 0.2]} s={[len, 0.01, 0.06]} mat={M('#ffd24a')} cast={false} />
      <Box p={[cx, -0.475, Z_FAR - 0.2]} s={[len, 0.01, 0.06]} mat={M('#ffd24a')} cast={false} />
      {/* far sidewalk */}
      <Box p={[cx, -0.48, Z_FAR + 0.7]} s={[len, 0.06, 1.4]} mat={M(palette.path)} cast={false} />
      {/* street lamps */}
      {[-8, -2, 4, 9, 16, 22].map(x => (
        <group key={x} position={[x, -0.45, Z_WALK + 0.3]}>
          <Cyl p={[0, 0.9, 0]} rt={0.05} h={1.8} seg={5} c="#3a3440" />
          <Box p={[0, 1.85, 0.15]} s={[0.1, 0.06, 0.4]} c="#3a3440" />
          <Box p={[0, 1.78, 0.32]} s={[0.22, 0.12, 0.22]} mat={M('#fff6c0', { emissive: '#ffe08a', intensity: 0.6 })} />
          <Blob p={[0, 0.02, 0]} size={0.5} />
        </group>
      ))}
      {/* parked vehicles on the near lane */}
      {[[-6, 0], [2, 1], [18, 2]].map(([x, c]) => (
        <group key={x} position={[x, -0.5, 22.5]}>
          <Vehicle color={colors[c % colors.length]} />
        </group>
      ))}
      <Traffic colors={colors} />
    </group>
  );
}
