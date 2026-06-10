/**
 * features/worlds/geneData.js
 * One-time gene/quality research unlocks, paid for with seeds. Each gene
 * applies a permanent multiplier to plant growth, repair strength, seed
 * cost, or seed production for that world.
 */

export const GENES = [
  {
    id:          'fastGrowth',
    name:        'Accelerated Growth',
    description: 'Plants mature 20% faster.',
    cost:        30,
    effect:      { growTicks: 0.8 },
  },
  {
    id:          'richHarvest',
    name:        'Rich Harvest',
    description: 'Plants repair 50% more planetary health on completion.',
    cost:        60,
    effect:      { healthGain: 1.5 },
  },
  {
    id:          'hardySeeds',
    name:        'Hardy Seeds',
    description: 'Planting costs 25% fewer seeds.',
    cost:        40,
    effect:      { seedCost: 0.75 },
  },
  {
    id:          'photosynthesis',
    name:        'Photosynthesis Boost',
    description: 'Greenhouse seed production increased by 30%.',
    cost:        80,
    effect:      { seedRate: 1.3 },
  },
];

export function getGene(id) {
  return GENES.find(g => g.id === id);
}
