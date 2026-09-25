/**
 * Web variant of GameView: CanvasKit (Skia's WebAssembly build, served from
 * /canvaskit.wasm) must be loaded before any Skia module is evaluated, so the
 * sprite renderer is required only after LoadSkiaWeb has finished.
 */

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { useEffect, useState } from 'react';
import PACKS from '../assets/sprites';
import useHotel from '../game/store';
import HotelScene from './scene/HotelScene';

let skiaPromise = null;

export default function GameView() {
  const hotel = useHotel(s => s.activeHotel);
  const [Iso, setIso] = useState(null);
  const wantsSprites = Boolean(PACKS[hotel]);

  useEffect(() => {
    if (!wantsSprites || Iso) return;
    skiaPromise ??= LoadSkiaWeb({ locateFile: (file) => `/${file}` });
    skiaPromise.then(() => setIso(() => require('./iso/IsoScene').default));
  }, [wantsSprites, Iso]);

  if (!wantsSprites) return <HotelScene />;
  return Iso ? <Iso key={hotel} /> : null;
}
