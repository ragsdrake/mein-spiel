/**
 * Dev-only (web) test hook: exposes the screen positions of everything that
 * currently wants a tap, plus a state snapshot, so browser automation can
 * play the game like a person would. Renders nothing; no-op in production.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { Platform } from 'react-native';
import { Vector3 } from 'three';
import { ROOMS } from '../../game/config';
import { sim } from '../../game/sim';
import useHotel from '../../game/store';

const v = new Vector3();

export default function DevProbe() {
  const { camera, size } = useThree();
  useFrame(() => {
    if (!__DEV__ || Platform.OS !== 'web') return;
    const toScreen = (x, y, z) => {
      v.set(x, y, z).project(camera);
      return [Math.round((v.x + 1) / 2 * size.width), Math.round((1 - v.y) / 2 * size.height)];
    };
    window.__tapTargets = () => {
      const pts = [];
      for (const g of sim.guests.values()) {
        if (g.tip || g.bubble === 'checkin' || g.bubble === 'drink') pts.push(toScreen(g.pos[0], 0.9, g.pos[1]));
      }
      sim.roomDirty.forEach((d, r) => {
        if (!d) return;
        const room = ROOMS[r];
        // puddle sits at local (0.2, 0.55) in the (possibly rotated) room frame
        const c = Math.cos(room.rot), s = Math.sin(room.rot);
        pts.push(toScreen(room.center[0] + 0.2 * c + 0.55 * s, 0.1, room.center[1] - 0.2 * s + 0.55 * c));
      });
      return pts;
    };
    window.__debugState = () => {
      const { coins, gems, activeHotel, hotels, stats } = useHotel.getState();
      const { totalEarned, rooms, barLevel, staff, attractions } = hotels[activeHotel];
      return {
        activeHotel, coins, gems, totalEarned, rooms, barLevel, staff, attractions, stats,
        guests: [...sim.guests.values()].map(g => `${g.type}:${g.state}`),
        dirty: sim.roomDirty,
      };
    };
  });
  return null;
}
