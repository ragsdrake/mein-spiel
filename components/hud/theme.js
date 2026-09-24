import { StyleSheet } from 'react-native';

export const FONT = 'LilitaOne_400Regular';

export const C = {
  panel:     'rgba(20, 14, 38, 0.88)',
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
  muted:     '#a99cc9',
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
