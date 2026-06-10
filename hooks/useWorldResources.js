/**
 * hooks/useWorldResources.js
 * Returns formatted resource data for a given worldId (defaults to active).
 */

import useGameStore from '../store/useGameStore';
import { getWorld } from '../features/worlds/worldData';

export default function useWorldResources(worldId) {
  const activeId      = useGameStore(s => s.activeWorldId);
  const id            = worldId || activeId;
  const world         = useGameStore(s => s.worlds[id]);
  const solarCost     = useGameStore(s => s.getSolarCost(id));
  const labCost       = useGameStore(s => s.getLabCost(id));
  const greenhouseCost = useGameStore(s => s.getGreenhouseCost(id));
  const buySolar      = useGameStore(s => s.buySolarPanel);
  const buyLab        = useGameStore(s => s.buyHydroLab);
  const buyGreenhouse = useGameStore(s => s.buyGreenhouse);
  const exploreZone   = useGameStore(s => s.exploreZone);
  const plantInZone   = useGameStore(s => s.plantInZone);
  const researchGene  = useGameStore(s => s.researchGene);
  const tapEnergy     = useGameStore(s => s.tapEnergy);

  if (!world) return null;

  const worldDef = getWorld(id);
  const exploredCount = Object.values(world.zoneState).filter(z => z.explored).length;
  const nextExploreCost = 100 * (exploredCount + 1);

  const zones = worldDef.zones.map(zoneDef => ({
    ...zoneDef,
    ...world.zoneState[zoneDef.id],
  }));

  return {
    energy:         Math.floor(world.energy),
    biomass:        parseFloat(world.biomass.toFixed(1)),
    health:         parseFloat(world.health.toFixed(1)),
    seeds:          parseFloat(world.seeds.toFixed(1)),
    solarCount:     world.solarCount,
    labCount:       world.labCount,
    greenhouseCount: world.greenhouseCount,
    solarCost,
    labCost,
    greenhouseCost,
    nextExploreCost,
    zones,
    researchedGenes: world.researchedGenes,
    canBuySolar:      world.energy >= solarCost,
    canBuyLab:        world.energy >= labCost,
    canBuyGreenhouse: world.energy >= greenhouseCost,
    terraformed:      world.terraformed,
    buySolarPanel:  () => buySolar(id),
    buyHydroLab:    () => buyLab(id),
    buyGreenhouse:  () => buyGreenhouse(id),
    exploreZone:    (zoneId) => exploreZone(id, zoneId),
    plantInZone:    (zoneId, plantId) => plantInZone(id, zoneId, plantId),
    researchGene:   (geneId) => researchGene(id, geneId),
    tapEnergy,
  };
}
