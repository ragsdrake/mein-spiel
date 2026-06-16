/**
 * store/useGameStore.js
 * ────────────────────────────────────────────────────────────────
 * Central Zustand store.  Manages per-world resources, building counts,
 * health, game-loop tick, AND level progression system.
 *
 * Install:  npm install zustand
 * ────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildingCost, getWorld, greenhouseCost, WORLDS } from '../features/worlds/worldData';
import { getPlant } from '../features/worlds/plantData';
import { GENES, getGene } from '../features/worlds/geneData';
import { LEVELS, GameStatus } from '../constants/levels';

/** Combined multiplier for `key` across a world's researched genes (defaults to 1). */
const geneMultiplier = (researchedGenes, key) =>
  researchedGenes.reduce((mult, geneId) => {
    const effect = getGene(geneId)?.effect;
    return effect && effect[key] != null ? mult * effect[key] : mult;
  }, 1);

// ─── initial world state factory ─────────────────────────────────────────────
const makeZoneState = (worldDef) =>
  Object.fromEntries(
    worldDef.zones.map(z => [z.id, { explored: false, plantId: null, progress: 0, repaired: false }])
  );

const makeWorldState = (worldDef) => ({
  id:             worldDef.id,
  energy:         0,
  biomass:        0,
  health:         worldDef.id === 'kepler9b' ? 35 : 0,   // first world starts damaged
  solarCount:     0,
  labCount:       0,
  unlocked:       worldDef.unlocked,
  terraformed:    false,
  greenhouseCount: 0,
  seeds:          0,
  zoneState:      makeZoneState(worldDef),
  researchedGenes: [],
  currentContinentIndex: 0,
});

// ─── helpers ──────────────────────────────────────────────────────────
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

// ─── store ───────────────────────────────────────────────────────────
const useGameStore = create(persist((set, get) => ({

  // ── state ───────────────────────────────────────────────────────────
  activeWorldId: 'kepler9b',
  seenIntros: [],
  worlds: Object.fromEntries(
    WORLDS.map(w => [w.id, makeWorldState(w)])
  ),
  tickIntervalId: null,

  // ── LEVEL SYSTEM STATE ───────────────────────────────────────────────
  gameStatus: GameStatus.MENU,
  currentLevel: null,
  completedLevels: [],
  totalXP: 0,
  levelStartTime: null,
  levelTimeRemaining: null,

  // ── selectors (derived) ────────────────────────────────────────────────────
  getActiveWorld() {
    return get().worlds[get().activeWorldId];
  },

  getSolarCost(worldId) {
    const id = worldId || get().activeWorldId;
    return buildingCost(id, 'solarPanel', get().worlds[id].solarCount);
  },

  getLabCost(worldId) {
    const id = worldId || get().activeWorldId;
    return buildingCost(id, 'hydroLab', get().worlds[id].labCount);
  },

  getGreenhouseCost(worldId) {
    const id = worldId || get().activeWorldId;
    return greenhouseCost(id, get().worlds[id].greenhouseCount);
  },

  getGeneCost(geneId) {
    return getGene(geneId)?.cost ?? Infinity;
  },

  getContinentProgress(worldId, continentIndex) {
    const id = worldId || get().activeWorldId;
    const worldDef  = getWorld(id);
    const continent = worldDef.continents[continentIndex];
    const zoneState = get().worlds[id].zoneState;
    if (!continent) return { total: 0, repaired: 0 };
    const total    = continent.zoneIds.length;
    const repaired = continent.zoneIds.filter(zid => zoneState[zid]?.repaired).length;
    return { total, repaired };
  },

  /** Get level by ID */
  getLevel(levelId) {
    return LEVELS.find(l => l.id === levelId);
  },

  /** Check if level is unlocked */
  isLevelUnlocked(levelId) {
    if (levelId === 1) return true;
    const prevLevel = LEVELS.find(l => l.id === levelId - 1);
    return prevLevel ? get().completedLevels.includes(prevLevel.id) : false;
  },

  /** Evaluate if current level is won */
  checkLevelWin() {
    const { currentLevel, gameStatus } = get();
    if (!currentLevel || gameStatus !== GameStatus.PLAYING) return false;

    const level = get().getLevel(currentLevel);
    if (!level) return false;

    const world = get().worlds[level.world];
    if (!world) return false;

    // Simple win condition check: health >= targetHealth
    return world.health >= level.targetHealth;
  },

  /** Evaluate if current level is lost (time expired) */
  checkLevelLoss() {
    const { levelTimeRemaining } = get();
    return levelTimeRemaining !== null && levelTimeRemaining <= 0;
  },

  // ── actions ──────────────────────────────────────────────────────────

  /** Mark a story intro as seen */
  markIntroSeen(introId) {
    if (get().seenIntros.includes(introId)) return;
    set(state => ({ seenIntros: [...state.seenIntros, introId] }));
  },

  /** Start a level */
  startLevel(levelId) {
    const level = get().getLevel(levelId);
    if (!level) return false;

    // Reset world state for this level
    const worldDef = getWorld(level.world);
    set(state => ({
      gameStatus: GameStatus.PLAYING,
      currentLevel: levelId,
      levelStartTime: Date.now(),
      levelTimeRemaining: level.timeLimit,
      worlds: {
        ...state.worlds,
        [level.world]: {
          ...makeWorldState(worldDef),
          energy: level.startResources.energy,
          biomass: level.startResources.biomass,
        },
      },
    }));
    return true;
  },

  /** Complete current level */
  completeLevel() {
    const { currentLevel } = get();
    if (!currentLevel) return false;

    const level = get().getLevel(currentLevel);
    if (!level) return false;

    set(state => ({
      gameStatus: GameStatus.LEVEL_COMPLETE,
      completedLevels: state.completedLevels.includes(currentLevel)
        ? state.completedLevels
        : [...state.completedLevels, currentLevel],
      totalXP: state.totalXP + level.reward.xp,
    }));
    return true;
  },

  /** Fail current level */
  failLevel() {
    set({ gameStatus: GameStatus.LEVEL_FAILED });
  },

  /** Return to menu */
  returnToMenu() {
    set({
      gameStatus: GameStatus.MENU,
      currentLevel: null,
      levelStartTime: null,
      levelTimeRemaining: null,
    });
  },

  /** Restart current level */
  restartLevel() {
    const { currentLevel } = get();
    if (currentLevel) {
      get().startLevel(currentLevel);
    }
  },

  /** Manual tap — grants +1 energy to active world */
  tapEnergy() {
    const id = get().activeWorldId;
    set(state => ({
      worlds: {
        ...state.worlds,
        [id]: {
          ...state.worlds[id],
          energy: state.worlds[id].energy + 1,
        },
      },
    }));
  },

  /** Buy one solar panel on active world */
  buySolarPanel(worldId) {
    const id   = worldId || get().activeWorldId;
    const cost = get().getSolarCost(id);
    const w    = get().worlds[id];
    if (w.energy < cost) return false;
    set(state => ({
      worlds: {
        ...state.worlds,
        [id]: {
          ...state.worlds[id],
          energy:     state.worlds[id].energy - cost,
          solarCount: state.worlds[id].solarCount + 1,
        },
      },
    }));
    return true;
  },

  /** Buy one hydro lab on active world */
  buyHydroLab(worldId) {
    const id   = worldId || get().activeWorldId;
    const cost = get().getLabCost(id);
    const w    = get().worlds[id];
    if (w.energy < cost) return false;
    set(state => ({
      worlds: {
        ...state.worlds,
        [id]: {
          ...state.worlds[id],
          energy:   state.worlds[id].energy - cost,
          labCount: state.worlds[id].labCount + 1,
        },
      },
    }));
    return true;
  },

  /** Build one greenhouse level on a world */
  buyGreenhouse(worldId) {
    const id   = worldId || get().activeWorldId;
    const cost = get().getGreenhouseCost(id);
    const w    = get().worlds[id];
    if (w.energy < cost) return false;
    set(state => ({
      worlds: {
        ...state.worlds,
        [id]: {
          ...state.worlds[id],
          energy:          state.worlds[id].energy - cost,
          greenhouseCount: state.worlds[id].greenhouseCount + 1,
        },
      },
    }));
    return true;
  },

  /** Spend energy to explore a planet zone */
  exploreZone(worldId, zoneId) {
    const id = worldId || get().activeWorldId;
    const w  = get().worlds[id];
    if (w.greenhouseCount < 1) return false;

    const zone = w.zoneState[zoneId];
    if (!zone || zone.explored) return false;

    const exploredCount = Object.values(w.zoneState).filter(z => z.explored).length;
    const cost = 100 * (exploredCount + 1);
    if (w.energy < cost) return false;

    set(state => ({
      worlds: {
        ...state.worlds,
        [id]: {
          ...state.worlds[id],
          energy: state.worlds[id].energy - cost,
          zoneState: {
            ...state.worlds[id].zoneState,
            [zoneId]: { ...state.worlds[id].zoneState[zoneId], explored: true },
          },
        },
      },
    }));
    return true;
  },

  /** Plant a seedling in an explored, empty zone */
  plantInZone(worldId, zoneId, plantId) {
    const id = worldId || get().activeWorldId;
    const w  = get().worlds[id];

    const zone = w.zoneState[zoneId];
    if (!zone || !zone.explored || zone.plantId) return false;

    const zoneDef = getWorld(id).zones.find(z => z.id === zoneId);
    const plant   = getPlant(plantId);
    if (!zoneDef || !plant || !plant.soils.includes(zoneDef.soil)) return false;

    const seedCost = plant.seedCost * geneMultiplier(w.researchedGenes, 'seedCost');
    if (w.seeds < seedCost) return false;

    set(state => ({
      worlds: {
        ...state.worlds,
        [id]: {
          ...state.worlds[id],
          seeds: state.worlds[id].seeds - seedCost,
          zoneState: {
            ...state.worlds[id].zoneState,
            [zoneId]: { ...state.worlds[id].zoneState[zoneId], plantId, progress: 0 },
          },
        },
      },
    }));
    return true;
  },

  /** Spend seeds to research a gene */
  researchGene(worldId, geneId) {
    const id   = worldId || get().activeWorldId;
    const w    = get().worlds[id];
    const gene = getGene(geneId);
    if (!gene || w.researchedGenes.includes(geneId)) return false;
    if (w.seeds < gene.cost) return false;

    set(state => ({
      worlds: {
        ...state.worlds,
        [id]: {
          ...state.worlds[id],
          seeds:           state.worlds[id].seeds - gene.cost,
          researchedGenes: [...state.worlds[id].researchedGenes, geneId],
        },
      },
    }));
    return true;
  },

  travelToNextContinent(worldId) {
    const id       = worldId || get().activeWorldId;
    const worldDef = getWorld(id);
    const w        = get().worlds[id];
    const continent = worldDef.continents[w.currentContinentIndex];
    if (!continent) return false;

    const allRepaired = continent.zoneIds.every(zid => w.zoneState[zid]?.repaired);
    if (!allRepaired) return false;

    const next = worldDef.continents[w.currentContinentIndex + 1];
    if (!next) return false;

    set(state => ({
      worlds: {
        ...state.worlds,
        [id]: {
          ...state.worlds[id],
          currentContinentIndex: state.worlds[id].currentContinentIndex + 1,
        },
      },
    }));
    return true;
  },

  /** Switch active world */
  setActiveWorld(worldId) {
    const w = get().worlds[worldId];
    if (!w || !w.unlocked) return;
    set({ activeWorldId: worldId });
  },

  /** Attempt to unlock a world */
  unlockWorld(worldId) {
    const worldDef = getWorld(worldId);
    if (!worldDef.unlockCost) return false;

    const active = get().getActiveWorld();
    const { energy: eCost = 0, biomass: bCost = 0 } = worldDef.unlockCost;
    if (active.energy < eCost || active.biomass < bCost) return false;

    set(state => ({
      worlds: {
        ...state.worlds,
        [get().activeWorldId]: {
          ...state.worlds[get().activeWorldId],
          energy:  active.energy  - eCost,
          biomass: active.biomass - bCost,
        },
        [worldId]: {
          ...state.worlds[worldId],
          unlocked: true,
          health:   15,
        },
      },
    }));
    return true;
  },

  // ── game loop ─────────────────────────────────────────────────────────

  startGameLoop() {
    if (get().tickIntervalId) return;

    const intervalId = setInterval(() => {
      get().tick();
    }, 1000);

    set({ tickIntervalId: intervalId });
  },

  stopGameLoop() {
    const id = get().tickIntervalId;
    if (id) {
      clearInterval(id);
      set({ tickIntervalId: null });
    }
  },

  /** 1-second tick: accrue resources + level timer */
  tick() {
    set(state => {
      const updatedWorlds = { ...state.worlds };

      // Update level timer
      if (state.gameStatus === GameStatus.PLAYING && state.levelTimeRemaining !== null) {
        state.levelTimeRemaining = Math.max(0, state.levelTimeRemaining - 1);
      }

      for (const worldId of Object.keys(updatedWorlds)) {
        const w = updatedWorlds[worldId];
        if (!w.unlocked) continue;

        const def   = getWorld(worldId);
        const rates = def.rates;

        const growMult     = geneMultiplier(w.researchedGenes, 'growTicks');
        const healthMult   = geneMultiplier(w.researchedGenes, 'healthGain');
        const seedRateMult = geneMultiplier(w.researchedGenes, 'seedRate');

        const dEnergy  = w.solarCount * rates.solarPanel.energy;
        const dBiomass = w.labCount   * rates.hydroLab.biomass;
        const dHealth  = dBiomass     * def.terraformRate;
        const dSeeds   = w.greenhouseCount * def.greenhouse.seedRatePerLevel * seedRateMult;

        let plantHealthGain = 0;
        const updatedZoneState = { ...w.zoneState };
        for (const [zoneId, zone] of Object.entries(w.zoneState)) {
          if (!zone.plantId || zone.repaired) continue;
          const plant = getPlant(zone.plantId);
          const progress = zone.progress + 1;
          if (progress >= plant.growTicks * growMult) {
            updatedZoneState[zoneId] = { ...zone, progress, repaired: true };
            plantHealthGain += plant.healthGain * healthMult;
          } else {
            updatedZoneState[zoneId] = { ...zone, progress };
          }
        }

        const newHealth = clamp(w.health + dHealth + plantHealthGain, 0, def.maxHealth);

        updatedWorlds[worldId] = {
          ...w,
          energy:      w.energy  + dEnergy,
          biomass:     w.biomass + dBiomass,
          seeds:       w.seeds   + dSeeds,
          health:      newHealth,
          terraformed: newHealth >= def.maxHealth,
          zoneState:   updatedZoneState,
        };
      }

      return { worlds: updatedWorlds, levelTimeRemaining: state.levelTimeRemaining };
    });
  },

}), {
  name:    'genesis-save-v1',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    activeWorldId: state.activeWorldId,
    seenIntros:    state.seenIntros,
    worlds:        state.worlds,
    completedLevels: state.completedLevels,
    totalXP: state.totalXP,
  }),
}));

export default useGameStore;
