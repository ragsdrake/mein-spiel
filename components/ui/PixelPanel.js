/**
 * components/ui/PixelPanel.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Blocky retro-pixel panel: thick accent border with cut-pixel corner notches,
 * used to wrap sections of the UI in the Pokémon/Minecraft/Terraria-inspired
 * pixel-art reskin.
 *
 * Props:
 *   accentColor – border/notch color (default cyan)
 *   style       – extra styles for the outer container
 *   children
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Space } from '../../constants/theme';

const NOTCH = 6;

export default function PixelPanel({ accentColor = Colors.cyan, style, children }) {
  return (
    <View style={[styles.outer, { borderColor: accentColor }, style]}>
      {/* corner notches — punch out the border corners with bg-colored squares */}
      <View style={[styles.notch, styles.notchTL, { backgroundColor: Colors.bg }]} />
      <View style={[styles.notch, styles.notchTR, { backgroundColor: Colors.bg }]} />
      <View style={[styles.notch, styles.notchBL, { backgroundColor: Colors.bg }]} />
      <View style={[styles.notch, styles.notchBR, { backgroundColor: Colors.bg }]} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth:     2,
    backgroundColor: Colors.surface,
    marginHorizontal: Space.lg,
    marginVertical:   Space.sm,
    position: 'relative',
  },
  inner: {
    padding: Space.md,
  },
  notch: {
    position: 'absolute',
    width:    NOTCH,
    height:   NOTCH,
    zIndex:   1,
  },
  notchTL: { top: -2, left: -2 },
  notchTR: { top: -2, right: -2 },
  notchBL: { bottom: -2, left: -2 },
  notchBR: { bottom: -2, right: -2 },
});
