/**
 * features/worlds/worldData.js
 * Static world definitions. Each world drives its own resource rates,
 * upgrade costs, and visual theme. Dynamic state lives in the store.
 */

export const WORLDS = [
  {
    id:          'kepler9b',
    name:        'Kepler-9b',
    subtitle:    'System Status: Critical',
    theme:       'default',
    description: 'A carbon-rich world on the edge of biosphere collapse. Early thermal readings show residual magnetic shielding — there is still time.',
    unlocked:    true,
    // resource tick rates (per second per building level)
    rates: {
      solarPanel: { energy: 1,   biomass: 0    },
      hydroLab:   { energy: 0,   biomass: 0.5  },
    },
    // exponential cost base values
    costs: {
      solarPanel: { base: 10,  exponent: 1.15, currency: 'energy'  },
      hydroLab:   { base: 50,  exponent: 1.15, currency: 'energy'  },
    },
    // health restored per unit of biomass spent
    terraformRate: 0.02,
    maxHealth:     100,
    // greenhouse: built with energy once enough has been earned, then
    // produces seeds passively per second
    greenhouse: {
      buildCost:        { base: 500, exponent: 1.4, currency: 'energy' },
      seedRatePerLevel: 0.2,
    },
    // explorable surface zones — each has a soil type and an environmental
    // problem that only certain plants can repair
    zones: [
      { id: 'z1', soil: 'rock',        damage: 'erosion'   },
      { id: 'z2', soil: 'ash',         damage: 'erosion'   },
      { id: 'z3', soil: 'sand',        damage: 'drought'   },
      { id: 'z4', soil: 'toxicSludge', damage: 'toxicity'  },
      { id: 'z5', soil: 'rock',        damage: 'drought'   },
      { id: 'z6', soil: 'sand',        damage: 'toxicity'  },
    ],
    // continents are visited step by step — only the current one's zones
    // are explorable until fully repaired
    continents: [
      { id: 'c1', name: 'Ashen Reach',   zoneIds: ['z1', 'z2'] },
      { id: 'c2', name: 'Dust Basin',    zoneIds: ['z3', 'z4'] },
      { id: 'c3', name: 'Cracked Belt',  zoneIds: ['z5', 'z6'] },
    ],
  },
  {
    id:          'glacius4',
    name:        'Glacius IV',
    subtitle:    'System Status: Frozen',
    theme:       'ice',
    description: 'An ice giant with a subsurface ocean. Plasma collectors replace solar arrays; cryo-labs generate bio-thermal energy.',
    unlocked:    false,
    unlockCost:  { energy: 5000 },
    rates: {
      solarPanel: { energy: 1.5, biomass: 0    },
      hydroLab:   { energy: 0,   biomass: 0.75 },
    },
    costs: {
      solarPanel: { base: 20,  exponent: 1.18, currency: 'energy'  },
      hydroLab:   { base: 80,  exponent: 1.18, currency: 'energy'  },
    },
    terraformRate: 0.015,
    maxHealth:     120,
    greenhouse: {
      buildCost:        { base: 1500, exponent: 1.4, currency: 'energy' },
      seedRatePerLevel: 0.25,
    },
    zones: [
      { id: 'z1', soil: 'permafrost', damage: 'frost'     },
      { id: 'z2', soil: 'ice',        damage: 'frost'     },
      { id: 'z3', soil: 'permafrost', damage: 'radiation' },
      { id: 'z4', soil: 'ice',        damage: 'radiation' },
      { id: 'z5', soil: 'rock',       damage: 'erosion'   },
      { id: 'z6', soil: 'permafrost', damage: 'erosion'   },
    ],
    continents: [
      { id: 'c1', name: 'Frostfall Shelf', zoneIds: ['z1', 'z2'] },
      { id: 'c2', name: 'Glow Crater',     zoneIds: ['z3', 'z4'] },
      { id: 'c3', name: 'Shattered Ridge', zoneIds: ['z5', 'z6'] },
    ],
  },
  {
    id:          'vexprime',
    name:        'Vex Prime',
    subtitle:    'System Status: Toxic',
    theme:       'toxic',
    description: 'A gas giant choked in sulphuric clouds. Atmospheric harvesters channel storm energy; bio-vats convert toxins into raw biomass.',
    unlocked:    false,
    unlockCost:  { energy: 25000, biomass: 500 },
    rates: {
      solarPanel: { energy: 2.5, biomass: 0   },
      hydroLab:   { energy: 0,   biomass: 1.2 },
    },
    costs: {
      solarPanel: { base: 50,  exponent: 1.2, currency: 'energy'  },
      hydroLab:   { base: 200, exponent: 1.2, currency: 'energy'  },
    },
    terraformRate: 0.01,
    maxHealth:     200,
    greenhouse: {
      buildCost:        { base: 4000, exponent: 1.4, currency: 'energy' },
      seedRatePerLevel: 0.3,
    },
    zones: [
      { id: 'z1', soil: 'toxicSludge', damage: 'toxicity'  },
      { id: 'z2', soil: 'toxicSludge', damage: 'radiation' },
      { id: 'z3', soil: 'sand',        damage: 'toxicity'  },
      { id: 'z4', soil: 'sand',        damage: 'drought'   },
      { id: 'z5', soil: 'ice',         damage: 'radiation' },
      { id: 'z6', soil: 'toxicSludge', damage: 'drought'   },
    ],
    continents: [
      { id: 'c1', name: 'Sludge Flats',   zoneIds: ['z1', 'z2'] },
      { id: 'c2', name: 'Sand Choke',     zoneIds: ['z3', 'z4'] },
      { id: 'c3', name: 'Frozen Vent',    zoneIds: ['z5', 'z6'] },
    ],
  },
];

/** Look up a world by id. Throws if missing. */
export function getWorld(id) {
  const world = WORLDS.find(w => w.id === id);
  if (!world) throw new Error(`Unknown world id: "${id}"`);
  return world;
}

/** Building cost for count-th purchase */
export function buildingCost(worldId, buildingKey, currentCount) {
  const world = getWorld(worldId);
  const { base, exponent } = world.costs[buildingKey];
  return Math.floor(base * Math.pow(exponent, currentCount));
}

/** Greenhouse cost for count-th purchase */
export function greenhouseCost(worldId, currentCount) {
  const world = getWorld(worldId);
  const { base, exponent } = world.greenhouse.buildCost;
  return Math.floor(base * Math.pow(exponent, currentCount));
}
