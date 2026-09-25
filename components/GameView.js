/**
 * Picks the renderer for the active hotel: pre-rendered Blender sprites
 * (Skia) when the hotel has a sprite pack, else the real-time 3D scene.
 */

import PACKS from '../assets/sprites';
import useHotel from '../game/store';
import IsoScene from './iso/IsoScene';
import HotelScene from './scene/HotelScene';

export default function GameView() {
  const hotel = useHotel(s => s.activeHotel);
  return PACKS[hotel] ? <IsoScene key={hotel} /> : <HotelScene />;
}
