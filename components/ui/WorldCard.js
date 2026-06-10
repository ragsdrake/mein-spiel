/**
 * components/ui/WorldCard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Compact card used in the world-select list.
 *
 * Props:
 *   world       – world definition object (from worldData.js)
 *   worldState  – live state slice from store
 *   active      – bool, is this the currently selected world?
 *   onPress     – callback
 *   onDetails   – callback, opens the world detail screen
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Font, Space, WorldThemes } from '../../constants/theme';
import ResourceBar from './ResourceBar';

export default function WorldCard({ world, worldState, active, onPress, onDetails }) {
  const theme  = WorldThemes[world.theme] || WorldThemes.default;
  const locked = !worldState?.unlocked;

  return (
    <TouchableOpacity
      onPress={locked ? undefined : onPress}
      activeOpacity={locked ? 1 : 0.8}
      style={[
        styles.card,
        active && { borderColor: theme.accent, borderWidth: 1.5 },
        locked && styles.locked,
      ]}
    >
      {/* header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.name, { color: locked ? Colors.textMuted : theme.accent }]}>
            {world.name}
          </Text>
          <Text style={styles.subtitle}>{world.subtitle}</Text>
        </View>
        {active && (
          <View style={[styles.activePill, { borderColor: theme.accent }]}>
            <Text style={[styles.activePillText, { color: theme.accent }]}>ACTIVE</Text>
          </View>
        )}
        {locked && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>LOCKED</Text>
          </View>
        )}
      </View>

      {/* health bar */}
      {!locked && (
        <ResourceBar
          label="PLANETARY HEALTH"
          value={worldState?.health ?? 0}
          max={100}
          color={theme.accent}
          showValue
        />
      )}

      {/* unlock cost if locked */}
      {locked && world.unlockCost && (
        <View style={styles.unlockRow}>
          <Text style={styles.unlockLabel}>UNLOCK COST</Text>
          {world.unlockCost.energy && (
            <Text style={[styles.unlockCost, { color: Colors.cyan }]}>
              {world.unlockCost.energy.toLocaleString()} ENERGY
            </Text>
          )}
          {world.unlockCost.biomass && (
            <Text style={[styles.unlockCost, { color: Colors.green }]}>
              {world.unlockCost.biomass.toLocaleString()} BIOMASS
            </Text>
          )}
        </View>
      )}

      {/* details link */}
      {!locked && onDetails && (
        <TouchableOpacity style={styles.detailsBtn} onPress={onDetails}>
          <Text style={[styles.detailsBtnText, { color: theme.accent }]}>VIEW DETAILS →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.gridLine,
    borderRadius:    2,
    padding:         Space.md,
    marginBottom:    Space.sm,
  },
  locked: {
    opacity: 0.5,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Space.sm,
  },
  name: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.md,
    fontWeight:    'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: Font.mono,
    fontSize:   Font.sizes.xs,
    color:      Colors.textSecond,
    marginTop:  2,
    letterSpacing: 1,
  },
  activePill: {
    borderWidth:  1,
    paddingHorizontal: Space.sm,
    paddingVertical:   2,
  },
  activePillText: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    letterSpacing: 2,
  },
  lockedBadge: {
    backgroundColor: '#1a0808',
    paddingHorizontal: Space.sm,
    paddingVertical:   2,
    borderWidth:  1,
    borderColor:  Colors.redDim,
  },
  lockedText: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.redDim,
    letterSpacing: 2,
  },
  unlockRow: {
    marginTop: Space.xs,
  },
  unlockLabel: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.textMuted,
    letterSpacing: 2,
    marginBottom:  3,
  },
  unlockCost: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.sm,
    letterSpacing: 1,
  },
  detailsBtn: {
    marginTop:        Space.sm,
    paddingTop:       Space.sm,
    borderTopWidth:   1,
    borderTopColor:   Colors.gridLine,
    alignItems:       'flex-end',
  },
  detailsBtnText: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    letterSpacing: 2,
  },
});
