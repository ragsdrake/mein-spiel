/**
 * components/ui/ContinentMap.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Horizontal pixel-art map showing each continent of the active world as a
 * small landmass tile (locked / current / completed), plus a "TRAVEL →"
 * button to advance to the next continent once the current one is repaired.
 *
 * Props:
 *   continents – array of { id, name, total, repaired, unlocked, current, completed }
 *   onTravel   – callback
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Font, Space } from '../../constants/theme';
import PixelSprite from '../graphics/PixelSprite';
import { CONTINENT_SPRITE_PATTERN, continentPalette } from '../../features/worlds/sprites';

export default function ContinentMap({ continents, onTravel }) {
  const current = continents.find(c => c.current);
  const canTravel = !!current && current.repaired === current.total && current.total > 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {continents.map(c => {
          const status = c.completed ? 'completed' : c.current ? 'current' : 'locked';
          return (
            <View key={c.id} style={styles.tile}>
              <PixelSprite
                pattern={CONTINENT_SPRITE_PATTERN}
                palette={continentPalette(status)}
                size={48}
              />
              <Text
                style={[
                  styles.tileName,
                  { color: status === 'locked' ? Colors.textMuted : Colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {c.name}
              </Text>
              <Text style={styles.tileProgress}>{c.repaired}/{c.total}</Text>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={canTravel ? 0.75 : 1}
        disabled={!canTravel}
        onPress={onTravel}
        style={[
          styles.travelBtn,
          { borderColor: canTravel ? Colors.cyan : Colors.gridLine, opacity: canTravel ? 1 : 0.45 },
        ]}
      >
        <Text style={[styles.travelText, { color: canTravel ? Colors.cyan : Colors.textMuted }]}>
          TRAVEL →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Space.md,
  },
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   Space.sm,
  },
  tile: {
    alignItems: 'center',
    flex:       1,
  },
  tileName: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs - 1,
    letterSpacing: 1,
    marginTop:     Space.xs,
    textAlign:     'center',
  },
  tileProgress: {
    fontFamily: Font.mono,
    fontSize:   Font.sizes.xs - 1,
    color:      Colors.textSecond,
  },
  travelBtn: {
    borderWidth:     1,
    paddingVertical: Space.sm,
    alignItems:      'center',
  },
  travelText: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.sm,
    fontWeight:    'bold',
    letterSpacing: 3,
  },
});
