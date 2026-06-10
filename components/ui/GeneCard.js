/**
 * components/ui/GeneCard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time gene/quality research item — name, description, seed cost, and a
 * researched/disabled/buy state.
 *
 * Props:
 *   gene        – { id, name, description, cost }
 *   researched  – bool
 *   affordable  – bool
 *   onPress     – callback
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Font, Space } from '../../constants/theme';

export default function GeneCard({ gene, researched, affordable, onPress }) {
  const disabled = researched || !affordable;

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.75}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.container,
        {
          borderColor:     researched ? Colors.purple : Colors.gridLine,
          borderLeftWidth: 3,
          borderLeftColor: researched ? Colors.purple : Colors.purpleDim,
          opacity:         !researched && !affordable ? 0.45 : 1,
        },
      ]}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{gene.name}</Text>
        <Text style={styles.description}>{gene.description}</Text>
      </View>
      <Text style={[styles.cost, { color: researched ? Colors.purple : Colors.textSecond }]}>
        {researched ? 'RESEARCHED' : `${gene.cost} SEEDS`}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    backgroundColor:  Colors.surface,
    borderWidth:      1,
    paddingVertical:  Space.sm,
    paddingHorizontal: Space.md,
    marginBottom:     Space.xs,
  },
  info: {
    flex: 1,
    paddingRight: Space.sm,
  },
  name: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.sm,
    color:         Colors.textPrimary,
    letterSpacing: 1,
  },
  description: {
    fontFamily: Font.mono,
    fontSize:   9,
    color:      Colors.textSecond,
    marginTop:  2,
  },
  cost: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    letterSpacing: 1,
  },
});
