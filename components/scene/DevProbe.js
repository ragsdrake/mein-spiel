/**
 * Dev-only (web) test hook: exposes the screen positions of everything that
 * currently wants a tap, plus a state snapshot, so browser automation can
 * play the game like a person would. Renders nothing; no-op in production.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { Platform } from 'react-native';
import { Vector3 } from 'three';
import { ROOMS } from '../../game/config';
import { cam } from '../../game/camera';
import { intro } from '../../game/fx';
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
        // the puddle lies on the room's cleaning spot
        pts.push(toScreen(ROOMS[r].clean[0], 0.1, ROOMS[r].clean[1]));
      });
      return pts;
    };
    window.__project = (x, y, z) => toScreen(x, y, z);
    window.__cam = cam;
    window.__store = useHotel;
    window.__intro = intro;
    window.__camPos = () => camera.position.toArray().map(v => Math.round(v * 10) / 10);
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
