/**
 * constants/theme.js
 * Central design token file — single source of truth for palette,
 * typography scale, spacing, and world-specific accent overrides.
 */

// ─── base palette ─────────────────────────────────────────────────────────────
export const Colors = {
  // Backgrounds
  void:       '#030508',    // deepest space black
  bg:         '#0a0a0a',    // primary screen bg
  surface:    '#0f1a15',    // card / panel bg
  surfaceAlt: '#111d18',    // slightly lighter surface

  // Neon accents
  cyan:       '#00ffcc',    // Tech Cyan  — energy / solar
  cyanDim:    '#00ccaa',
  cyanDeep:   '#003322',

  green:      '#00cc66',    // Bio Green  — biomass / life
  greenDim:   '#009944',
  greenDeep:  '#002211',

  red:        '#ff4444',    // Warning Red — damage / critical
  redDim:     '#cc2222',

  purple:     '#cc66ff',    // Greenhouse / seeds / flora
  purpleDim:  '#9944cc',
  purpleDeep: '#1a0d22',

  // Neutrals
  gridLine:   '#0d2e20',
  textPrimary:'#e0fff5',
  textSecond: '#4a8070',
  textMuted:  '#1e3830',
};

// ─── world-specific accent overrides ─────────────────────────────────────────
export const WorldThemes = {
  mars: {
    id:      'mars',
    name:    'Mars-7',
    accent:  '#ff6633',     // rust orange
    grid:    '#2e1a0d',
    vein:    '#ff6633',
  },
  ice: {
    id:      'ice',
    name:    'Glacius IV',
    accent:  '#66ccff',     // ice blue
    grid:    '#0d1e2e',
    vein:    '#66ccff',
  },
  toxic: {
    id:      'toxic',
    name:    'Vex Prime',
    accent:  '#aaff00',     // toxic yellow-green
    grid:    '#1a2200',
    vein:    '#aaff00',
  },
  default: {
    id:      'default',
    name:    'Kepler-9b',
    accent:  Colors.cyan,
    grid:    Colors.gridLine,
    vein:    Colors.green,
  },
};

// ─── spacing scale ────────────────────────────────────────────────────────────
export const Space = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  40,
  xxl: 64,
};

// ─── typography ───────────────────────────────────────────────────────────────
export const Font = {
  mono: 'Courier',         // monospace data readouts
  body: 'System',
  sizes: {
    xs:   10,
    sm:   12,
    md:   14,
    lg:   18,
    xl:   24,
    hero: 36,
  },
};
