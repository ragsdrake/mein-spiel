/**
 * features/worlds/sprites.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hand-authored 12×12 pixel-art patterns + palettes for the greenhouse,
 * plants, and soil tiles. Rendered via components/graphics/PixelSprite.js
 * (no external image assets — original blocky Pokémon/Minecraft/Terraria
 * style sprites).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Shared diamond-blob silhouette used for every plant (12×12).
// 'a' = outer body, 'b' = inner glow/core.
const PLANT_DIAMOND = [
  '............',
  '.....aa.....',
  '....aaaa....',
  '...aaaaaa...',
  '..aaabbaaa..',
  '.aaabbbbaaa.',
  '.aaabbbbaaa.',
  '..aaabbaaa..',
  '...aaaaaa...',
  '....aaaa....',
  '.....aa.....',
  '............',
];

export const PLANT_SPRITES = {
  cryoLichen: {
    pattern: PLANT_DIAMOND,
    palette: { a: '#66ccff', b: '#e0fff5' },
  },
  mossVine: {
    pattern: PLANT_DIAMOND,
    palette: { a: '#009944', b: '#00ff88' },
  },
  neutralReed: {
    pattern: PLANT_DIAMOND,
    palette: { a: '#557700', b: '#aaff00' },
  },
  duneGrass: {
    pattern: PLANT_DIAMOND,
    palette: { a: '#cc9922', b: '#ffcc44' },
  },
  glowAlgae: {
    pattern: PLANT_DIAMOND,
    palette: { a: '#aa3366', b: '#ff66cc' },
  },
};

// Shared speckled ground texture (12×12). 'a' = base, 'b' = speckle.
const SOIL_TEXTURE = [
  'aaaaaaaaaaaa',
  'aabaaaaabaaa',
  'aaaaaaaaaaaa',
  'aaaaabaaaaaa',
  'abaaaaaaaaab',
  'aaaaaaaaaaaa',
  'aaaabaaaaaaa',
  'aaaaaaaabaaa',
  'aaaaaaaaaaaa',
  'aabaaaaaaaaa',
  'aaaaaaaabaaa',
  'aaaaaaaaaaaa',
];

export const SOIL_SPRITES = {
  rock:        { pattern: SOIL_TEXTURE, palette: { a: '#3a3a3a', b: '#5a5a5a' } },
  ash:         { pattern: SOIL_TEXTURE, palette: { a: '#2a2622', b: '#4a4038' } },
  permafrost:  { pattern: SOIL_TEXTURE, palette: { a: '#2a3a44', b: '#4a6a7a' } },
  ice:         { pattern: SOIL_TEXTURE, palette: { a: '#1a3a55', b: '#aaddff' } },
  sand:        { pattern: SOIL_TEXTURE, palette: { a: '#ccaa66', b: '#e0cc99' } },
  toxicSludge: { pattern: SOIL_TEXTURE, palette: { a: '#2a3a1a', b: '#669933' } },
};

// Glass-dome greenhouse building (12×12).
// 'a' = frame, 'b' = glass highlight, 'c' = glass panel, 'd' = foundation.
export const GREENHOUSE_SPRITE = {
  pattern: [
    '....aaaa....',
    '...abbbba...',
    '..abbbbbba..',
    '.abbbbbbbba.',
    'acccccccccca',
    'acccccccccca',
    'acccccccccca',
    'acccccccccca',
    'acccccccccca',
    'dddddddddddd',
    'dddddddddddd',
    '............',
  ].map(row => row.padEnd(12, '.').slice(0, 12)),
  palette: { a: '#cc66ff', b: '#e0fff5', c: '#1a3a33', d: '#444444' },
};
