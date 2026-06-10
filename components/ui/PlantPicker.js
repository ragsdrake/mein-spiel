/**
 * components/ui/PlantPicker.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Inline panel listing plants compatible with a zone's soil. Lets the player
 * spend seeds to plant one in the selected zone.
 *
 * Props:
 *   zone     – { id, soil, damage }
 *   seeds    – number  current seed count
 *   onPlant  – (plantId) => void
 *   onClose  – () => void
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Font, Space } from '../../constants/theme';
import { DAMAGE_TYPES, SOIL_TYPES, plantsForSoil } from '../../features/worlds/plantData';

export default function PlantPicker({ zone, seeds, onPlant, onClose }) {
  const options = plantsForSoil(zone.soil);
  const soil    = SOIL_TYPES[zone.soil];
  const damage  = DAMAGE_TYPES[zone.damage];

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {soil.label.toUpperCase()} · {damage.label.toUpperCase()}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      {options.map(plant => {
        const affordable = seeds >= plant.seedCost;
        const matches    = plant.repairs === zone.damage;
        return (
          <TouchableOpacity
            key={plant.id}
            style={[styles.option, !affordable && styles.optionDisabled]}
            disabled={!affordable}
            onPress={() => onPlant(plant.id)}
            activeOpacity={0.75}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionName}>{plant.name}</Text>
              <Text style={[styles.optionRepairs, matches && { color: Colors.green }]}>
                repairs {DAMAGE_TYPES[plant.repairs].label}
              </Text>
            </View>
            <Text style={[styles.optionCost, !affordable && { color: Colors.red }]}>
              {plant.seedCost} SEEDS
            </Text>
          </TouchableOpacity>
        );
      })}

      {options.length === 0 && (
        <Text style={styles.empty}>No plants available for this soil.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth:     1,
    borderColor:     Colors.purple,
    backgroundColor: Colors.surface,
    padding:         Space.sm,
    marginBottom:    Space.sm,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Space.sm,
  },
  title: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.purple,
    letterSpacing: 2,
  },
  close: {
    fontFamily: Font.mono,
    fontSize:   Font.sizes.md,
    color:      Colors.textSecond,
  },
  option: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingVertical:  Space.xs,
    borderTopWidth:   1,
    borderTopColor:   Colors.gridLine,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontFamily: Font.mono,
    fontSize:   Font.sizes.sm,
    color:      Colors.textPrimary,
  },
  optionRepairs: {
    fontFamily: Font.mono,
    fontSize:   9,
    color:      Colors.textSecond,
    marginTop:  2,
  },
  optionCost: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.purple,
    letterSpacing: 1,
  },
  empty: {
    fontFamily: Font.mono,
    fontSize:   Font.sizes.xs,
    color:      Colors.textMuted,
    paddingVertical: Space.sm,
  },
});
