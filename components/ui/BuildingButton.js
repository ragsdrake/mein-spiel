/**
 * components/ui/BuildingButton.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Styled upgrade/building purchase button.
 *
 * Props:
 *   title      – main label  e.g. "Solar Collector"
 *   subtitle   – secondary   e.g. "+1 Energy/sec"
 *   cost       – number      current purchase cost
 *   count      – number      how many are built
 *   currency   – string      "Energy" | "Biomass"
 *   disabled   – bool
 *   onPress    – callback
 *   accentColor– hex
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Font, Space } from '../../constants/theme';

export default function BuildingButton({
  title       = '',
  subtitle    = '',
  cost        = 0,
  count       = 0,
  currency    = 'Energy',
  disabled    = false,
  onPress,
  accentColor = Colors.cyan,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled || !onPress) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 70,  useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.75}
      onPress={handlePress}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.container,
          {
            borderColor:       disabled ? Colors.gridLine : accentColor,
            borderLeftWidth:   3,
            borderLeftColor:   disabled ? Colors.gridLine : accentColor,
            opacity:           disabled ? 0.45 : 1,
          },
          { transform: [{ scale }] },
        ]}
      >
        {/* count badge */}
        <View style={[styles.badge, { backgroundColor: disabled ? '#111' : Colors.cyanDeep }]}>
          <Text style={[styles.badgeText, { color: disabled ? Colors.textMuted : accentColor }]}>
            {count}
          </Text>
        </View>

        {/* text block */}
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: disabled ? Colors.textSecond : Colors.textPrimary }]}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>

        {/* cost */}
        <View style={styles.costBlock}>
          <Text style={[styles.costValue, { color: disabled ? Colors.textMuted : accentColor }]}>
            {cost.toLocaleString()}
          </Text>
          <Text style={styles.costLabel}>{currency.toUpperCase()}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderRadius:    2,
    marginBottom:    Space.sm,
    paddingVertical:  Space.sm,
    paddingHorizontal: Space.md,
  },
  badge: {
    width:          36,
    height:         36,
    borderRadius:   2,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    Space.md,
  },
  badgeText: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.md,
    fontWeight:    'bold',
    letterSpacing: 1,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: Font.mono,
    fontSize:   Font.sizes.xs,
    color:      Colors.textSecond,
    marginTop:  2,
  },
  costBlock: {
    alignItems: 'flex-end',
    marginLeft: Space.sm,
  },
  costValue: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.md,
    fontWeight:    'bold',
    letterSpacing: 1,
  },
  costLabel: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs - 1,
    color:         Colors.textSecond,
    letterSpacing: 2,
  },
});
