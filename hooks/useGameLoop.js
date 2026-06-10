/**
 * hooks/useGameLoop.js
 * Starts the store game-loop when mounted, stops on unmount.
 * Call this once at the root layout level.
 */

import { useEffect } from 'react';
import useGameStore from '../store/useGameStore';

export default function useGameLoop() {
  const start = useGameStore(s => s.startGameLoop);
  const stop  = useGameStore(s => s.stopGameLoop);

  useEffect(() => {
    start();
    return () => stop();
  }, []);
}
