/**
 * constants/levels.js
 * ────────────────────────────────────────────────────────────────
 * Defines level progression, win/loss conditions, and difficulty.
 * ────────────────────────────────────────────────────────────────
 */

/** Level definitions: progressive difficulty */
export const LEVELS = [
  {
    id: 1,
    name: 'Genesis Protocol',
    description: 'Establish basic infrastructure on Kepler-9b',
    world: 'kepler9b',
    winCondition: 'health >= 50',
    targetHealth: 50,
    timeLimit: 300, // 5 minutes in seconds
    startResources: {
      energy: 50,
      biomass: 0,
    },
    objectives: [
      'Build 2 Solar Collectors',
      'Reach 50% planetary health',
    ],
    difficulty: 'tutorial',
    reward: {
      xp: 100,
      unlock: 'level2',
    },
  },
  {
    id: 2,
    name: 'Biomass Initiative',
    description: 'Develop biological systems',
    world: 'kepler9b',
    winCondition: 'biomass >= 20 && health >= 60',
    targetHealth: 60,
    timeLimit: 420, // 7 minutes
    startResources: {
      energy: 80,
      biomass: 0,
    },
    objectives: [
      'Build 1 Hydro Lab',
      'Acquire 20 Biomass',
      'Reach 60% planetary health',
    ],
    difficulty: 'easy',
    reward: {
      xp: 250,
      unlock: 'level3',
    },
  },
  {
    id: 3,
    name: 'Terraform Accelerant',
    description: 'Maximize production efficiency',
    world: 'kepler9b',
    winCondition: 'health >= 80',
    targetHealth: 80,
    timeLimit: 600, // 10 minutes
    startResources: {
      energy: 100,
      biomass: 5,
    },
    objectives: [
      'Build 3 Solar Collectors',
      'Build 2 Hydro Labs',
      'Reach 80% planetary health',
    ],
    difficulty: 'medium',
    reward: {
      xp: 500,
      unlock: 'level4',
    },
  },
];

/** Game status enum */
export const GameStatus = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'levelComplete',
  LEVEL_FAILED: 'levelFailed',
  GAME_OVER: 'gameOver',
};

/** Animation durations (ms) */
export const AnimationDuration = {
  SHORT: 200,
  MEDIUM: 400,
  LONG: 600,
  VICTORY: 1200,
};
