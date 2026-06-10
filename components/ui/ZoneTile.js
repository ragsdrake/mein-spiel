/**
 * components/ui/ZoneTile.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A single planet-surface zone tile for the Greenhouse "Planet Structure"
 * grid. Shows soil/damage info once explored, plant progress once planted,
 * and a locked state otherwise.
 *
 * Props:
 *   zone        – { id, soil, damage, explored, plantId, progress, repaired }
 *   exploreCost – number  energy cost to explore (shown when locked)
 *   plant       – plant def from plantData (if planted)
 *   onPress     – callback
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Font, Space } from '../../constants/theme';
import { DAMAGE_TYPES, SOIL_TYPES } from '../../features/worlds/plantData';
import { PLANT_SPRITES, SOIL_SPRITES } from '../../features/worlds/sprites';
import PixelSprite from '../graphics/PixelSprite';

const SPRITE_SIZE = 48;

export default function ZoneTile({ zone, exploreCost, plant, onPress }) {
  const damage = DAMAGE_TYPES[zone.damage];
  const soil   = SOIL_TYPES[zone.soil];

  if (!zone.explored) {
    return (
      <TouchableOpacity style={[styles.tile, styles.locked]} onPress={onPress} activeOpacity={0.75}>
        <Text style={styles.lockedIcon}>?</Text>
        <Text style={styles.lockedLabel}>EXPLORE</Text>
        <Text style={styles.lockedCost}>{exploreCost} ENERGY</Text>
      </TouchableOpacity>
    );
  }

  if (zone.repaired) {
    return (
      <View style={[styles.tile, { borderColor: Colors.green }]}>
        <View style={styles.spriteStack}>
          <PixelSprite {...SOIL_SPRITES[zone.soil]} size={SPRITE_SIZE} />
          {plant && (
            <View style={styles.plantOverlay}>
              <PixelSprite {...PLANT_SPRITES[plant.id]} size={SPRITE_SIZE} />
            </View>
          )}
        </View>
        <Text style={[styles.damageLabel, { color: Colors.green }]}>{plant?.name ?? 'REPAIRED'}</Text>
      </View>
    );
  }

  if (zone.plantId) {
    const pct = plant ? Math.min(1, zone.progress / plant.growTicks) : 0;
    return (
      <View style={[styles.tile, { borderColor: damage.color }]}>
        <View style={styles.spriteStack}>
          <PixelSprite {...SOIL_SPRITES[zone.soil]} size={SPRITE_SIZE} />
          {plant && (
            <View style={[styles.plantOverlay, { opacity: 0.3 + pct * 0.7 }]}>
              <PixelSprite {...PLANT_SPRITES[plant.id]} size={SPRITE_SIZE} />
            </View>
          )}
        </View>
        <Text style={[styles.damageLabel, { color: damage.color }]}>{plant?.name}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: damage.color }]} />
        </View>
        <Text style={styles.progressText}>{Math.floor(pct * 100)}%</Text>
      </View>
    );
  }

  // explored & empty — tappable to plant
  return (
    <TouchableOpacity
      style={[styles.tile, { borderColor: damage.color, borderStyle: 'dashed' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <PixelSprite {...SOIL_SPRITES[zone.soil]} size={SPRITE_SIZE} />
      <Text style={[styles.damageLabel, { color: damage.color }]}>{damage.label}</Text>
      <Text style={styles.plantPrompt}>+ PLANT</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width:           '31%',
    aspectRatio:     1,
    borderWidth:     1,
    borderColor:     Colors.gridLine,
    backgroundColor: Colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Space.sm,
    padding:         Space.xs,
  },
  locked: {
    backgroundColor: Colors.bg,
  },
  lockedIcon: {
    fontFamily: Font.mono,
    fontSize:   Font.sizes.xl,
    color:      Colors.textMuted,
  },
  lockedLabel: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.textSecond,
    letterSpacing: 2,
    marginTop:     Space.xs,
  },
  lockedCost: {
    fontFamily: Font.mono,
    fontSize:   9,
    color:      Colors.textMuted,
    marginTop:  2,
  },
  spriteStack: {
    width:  SPRITE_SIZE,
    height: SPRITE_SIZE,
  },
  plantOverlay: {
    position: 'absolute',
    top:      0,
    left:     0,
  },
  damageLabel: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    fontWeight:    'bold',
    letterSpacing: 1,
    textAlign:     'center',
    marginTop:     2,
  },
  plantPrompt: {
    fontFamily:    Font.mono,
    fontSize:      9,
    color:         Colors.textMuted,
    marginTop:     Space.xs,
    letterSpacing: 1,
  },
  progressTrack: {
    width:           '100%',
    height:          4,
    backgroundColor: '#0d1a16',
    marginTop:       Space.xs,
    overflow:        'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontFamily: Font.mono,
    fontSize:   9,
    color:      Colors.textMuted,
    marginTop:  2,
  },
});
