/** Graphics presets (see components/scene/HotelScene.js). */
export const QUALITY = {
  low:    { label: 'Niedrig', dpr: 1,   shadows: false, particles: 0,   post: false },
  medium: { label: 'Mittel',  dpr: 1.5, shadows: false, particles: 0.6, post: false },
  high:   { label: 'Hoch',    dpr: 2,   shadows: true,  particles: 1,   post: false },
  ultra:  { label: 'Ultra',   dpr: 2,   shadows: true,  particles: 1.2, post: true },
};
