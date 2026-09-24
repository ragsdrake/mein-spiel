import { StyleSheet } from 'react-native';

export const FONT = 'LilitaOne_400Regular';

export const C = {
  panel:     'rgba(22, 30, 64, 0.78)',
  panelSolid:'#1d1535',
  card:      '#2a1f48',
  cardLight: '#382a5e',
  border:    '#0c0818',
  gold:      '#ffc94a',
  goldDark:  '#c47a12',
  green:     '#6dff9e',
  purple:    '#b57bff',
  red:       '#ff5a5a',
  orange:    '#ff8a2e',
  white:     '#ffffff',
  muted:     '#b8c4f0',
};

/** Glossy two-stop gradients for buttons, keyed by purpose. */
export const GRAD = {
  green:  ['#5fe07a', '#23964a'],
  gold:   ['#ffd96b', '#d08a14'],
  purple: ['#b57bff', '#6a32c0'],
  red:    ['#ff7a7a', '#c02a3a'],
  blue:   ['#6ab0ff', '#2a5ac0'],
  teal:   ['#4fe0d0', '#1f8a86'],
  orange: ['#ffa35a', '#d0561a'],
  grey:   ['#5a5478', '#3a3458'],
  panel:  ['#35478c', '#243168'],
  card:   ['#4257a6', '#34468a'],
};

/** Chunky outlined game text, like the reference screenshot. */
export const text = StyleSheet.create({
  base: {
    fontFamily:       FONT,
    color:            C.white,
    textShadowColor:  '#0c0818',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
});
