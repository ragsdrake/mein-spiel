/**
 * components/ui/ResourceBar.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A blueprint-style labelled progress bar.
 *
 * Props:
 *   label      – string  e.g. "HEALTH"
 *   value      – number  current value
 *   max        – number  maximum value
 *   color      – hex     fill color (defaults to cyan)
 *   showValue  – bool    print "value / max" on the right
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Font, Space } from '../../constants/theme';

export default function ResourceBar({
  label     = '',
  value     = 0,
  max       = 100,
  color     = Colors.cyan,
  showValue = true,
}) {
  const pct = Math.min(1, Math.max(0, value / max));

  return (
    <View style={styles.wrapper}>
      {/* label row */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color }]}>{label}</Text>
        {showValue && (
          <Text style={styles.valueText}>
            {typeof value === 'number' && value % 1 !== 0
              ? value.toFixed(1)
              : Math.floor(value)}
            {' / '}
            {max}
          </Text>
        )}
      </View>

      {/* track */}
      <View style={styles.track}>
        {/* tick marks */}
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.tick,
              { left: `${(i / 20) * 100}%` },
              i % 5 === 0 && styles.tickMajor,
            ]}
          />
        ))}

        {/* fill */}
        <View
          style={[
            styles.fill,
            {
              width:           `${pct * 100}%`,
              backgroundColor: color,
            },
          ]}
        />

        {/* glow overlay on fill */}
        <View
          style={[
            styles.fillGlow,
            {
              width:           `${pct * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Space.sm,
  },
  labelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   3,
  },
  label: {
    fontFamily: Font.mono,
    fontSize:   Font.sizes.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  valueText: {
    fontFamily: Font.mono,
    fontSize:   Font.sizes.xs,
    color:      Colors.textSecond,
    letterSpacing: 1,
  },
  track: {
    height:          8,
    backgroundColor: '#0d1a16',
    borderWidth:     1,
    borderColor:     '#0f2820',
    position:        'relative',
    overflow:        'hidden',
  },
  tick: {
    position:        'absolute',
    top:             0,
    width:           1,
    height:          3,
    backgroundColor: '#1a3a28',
  },
  tickMajor: {
    height:          5,
    backgroundColor: '#204a34',
  },
  fill: {
    position: 'absolute',
    top:      0,
    left:     0,
    height:   '100%',
    opacity:  0.85,
  },
  fillGlow: {
    position: 'absolute',
    top:      0,
    left:     0,
    height:   '100%',
    opacity:  0.18,
    // simulate blur glow with extra height bleed — no blur API in RN
    marginTop: -4,
    height:    16,
  },
});
