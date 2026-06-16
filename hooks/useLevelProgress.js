/**
 * hooks/useLevelProgress.js
 * ────────────────────────────────────────────────────────────────
 * Hook for tracking level progress, checking win/loss conditions,
 * and managing level timer.
 * ────────────────────────────────────────────────────────────────
 */

import { useEffect, useCallback } from 'react';
import useGameStore from '../store/useGameStore';
import { GameStatus } from '../constants/levels';

export default function useLevelProgress() {
  const gameStatus = useGameStore(s => s.gameStatus);
  const currentLevel = useGameStore(s => s.currentLevel);
  const levelTimeRemaining = useGameStore(s => s.levelTimeRemaining);
  const checkLevelWin = useGameStore(s => s.checkLevelWin);
  const checkLevelLoss = useGameStore(s => s.checkLevelLoss);
  const completeLevel = useGameStore(s => s.completeLevel);
  const failLevel = useGameStore(s => s.failLevel);
  const getLevel = useGameStore(s => s.getLevel);

  // Check win condition every render
  useEffect(() => {
    if (gameStatus !== GameStatus.PLAYING) return;

    if (checkLevelWin()) {
      completeLevel();
    }
  }, [gameStatus, checkLevelWin, completeLevel]);

  // Check loss condition (timer expired)
  useEffect(() => {
    if (gameStatus !== GameStatus.PLAYING) return;

    if (checkLevelLoss()) {
      failLevel();
    }
  }, [levelTimeRemaining, gameStatus, checkLevelLoss, failLevel]);

  // Get current level data
  const level = currentLevel ? getLevel(currentLevel) : null;

  // Format time remaining (MM:SS)
  const formattedTime = useCallback(() => {
    if (levelTimeRemaining === null) return '--:--';
    const minutes = Math.floor(levelTimeRemaining / 60);
    const seconds = levelTimeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [levelTimeRemaining]);

  // Calculate time bar progress (0 to 1)
  const timeProgress = useCallback(() => {
    if (!level || levelTimeRemaining === null) return 1;
    return Math.max(0, levelTimeRemaining / level.timeLimit);
  }, [level, levelTimeRemaining]);

  // Determine warning state (red if < 30 seconds)
  const isTimeWarning = levelTimeRemaining !== null && levelTimeRemaining < 30;

  return {
    level,
    currentLevel,
    gameStatus,
    levelTimeRemaining,
    formattedTime: formattedTime(),
    timeProgress: timeProgress(),
    isTimeWarning,
    isWon: gameStatus === GameStatus.LEVEL_COMPLETE,
    isLost: gameStatus === GameStatus.LEVEL_FAILED,
    isPlaying: gameStatus === GameStatus.PLAYING,
  };
}
