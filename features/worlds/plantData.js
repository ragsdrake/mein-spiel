/**
 * features/worlds/plantData.js
 * Soil types, environmental damage types, and the plant catalog used by
 * the Greenhouse / planet-zone terraforming system.
 */

export const SOIL_TYPES = {
  rock:        { id: 'rock',        label: 'Rock' },
  ash:         { id: 'ash',         label: 'Ash' },
  permafrost:  { id: 'permafrost',  label: 'Permafrost' },
  ice:         { id: 'ice',         label: 'Ice Sheet' },
  sand:        { id: 'sand',        label: 'Sand' },
  toxicSludge: { id: 'toxicSludge', label: 'Toxic Sludge' },
};

export const DAMAGE_TYPES = {
  erosion:   { id: 'erosion',   label: 'Erosion',   color: '#cc8844' },
  frost:     { id: 'frost',     label: 'Frost',     color: '#66ccff' },
  toxicity:  { id: 'toxicity',  label: 'Toxicity',  color: '#aaff00' },
  drought:   { id: 'drought',   label: 'Drought',   color: '#ffcc44' },
  radiation: { id: 'radiation', label: 'Radiation', color: '#ff4488' },
};

/** Plant catalog. Each plant repairs one damage type and grows only on compatible soils. */
export const PLANTS = [
  {
    id:         'cryoLichen',
    name:       'Cryo Lichen',
    repairs:    'frost',
    soils:      ['permafrost', 'ice'],
    seedCost:   5,
    growTicks:  20,
    healthGain: 3,
  },
  {
    id:         'mossVine',
    name:       'Moss Vine',
    repairs:    'erosion',
    soils:      ['rock', 'ash'],
    seedCost:   8,
    growTicks:  30,
    healthGain: 4,
  },
  {
    id:         'neutralReed',
    name:       'Neutral Reed',
    repairs:    'toxicity',
    soils:      ['toxicSludge', 'sand'],
    seedCost:   12,
    growTicks:  40,
    healthGain: 5,
  },
  {
    id:         'duneGrass',
    name:       'Dune Grass',
    repairs:    'drought',
    soils:      ['sand', 'rock'],
    seedCost:   6,
    growTicks:  25,
    healthGain: 3,
  },
  {
    id:         'glowAlgae',
    name:       'Glow Algae',
    repairs:    'radiation',
    soils:      ['toxicSludge', 'ice'],
    seedCost:   15,
    growTicks:  50,
    healthGain: 6,
  },
];

/** Plants that can be planted on a given soil type. */
export function plantsForSoil(soilId) {
  return PLANTS.filter(p => p.soils.includes(soilId));
}

/** Look up a plant by id. */
export function getPlant(id) {
  return PLANTS.find(p => p.id === id);
}
