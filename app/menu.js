/**
 * app/menu.js
 * ────────────────────────────────────────────────────────────────
 * Main menu screen with level selection, continue game, and settings.
 * ────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors, Font, Space } from '../constants/theme';
import { LEVELS, AnimationDuration } from '../constants/levels';
import useGameStore from '../store/useGameStore';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Animated Title Component ───────────────────────────────────────────
function AnimatedTitle() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: AnimationDuration.MEDIUM });
    translateY.value = withTiming(0, { duration: AnimationDuration.MEDIUM });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Text style={styles.title}>PROJEKT GENESIS</Text>
      <Text style={styles.subtitle}>Level Select</Text>
    </Animated.View>
  );
}

// ─── Level Button Component ───────────────────────────────────────────
function LevelButton({ level, index, isUnlocked, isCompleted, onPress }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withDelay(
      index * 100,
      withTiming(1, { duration: AnimationDuration.SHORT })
    );
    scale.value = withDelay(
      index * 100,
      withTiming(1, { duration: AnimationDuration.SHORT, easing: Easing.out(Easing.back(1.5)) })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const backgroundColor = isCompleted ? Colors.greenDeep : isUnlocked ? Colors.surface : Colors.surfaceAlt;
  const borderColor = isUnlocked ? Colors.cyan : Colors.gridLine;
  const textColor = isUnlocked ? Colors.textPrimary : Colors.textMuted;

  return (
    <Animated.View style={[animStyle, styles.levelButtonWrapper]}>
      <TouchableOpacity
        style={[styles.levelButton, { backgroundColor, borderColor }]}
        onPress={onPress}
        disabled={!isUnlocked}
        activeOpacity={isUnlocked ? 0.7 : 1}
      >
        <View style={styles.levelHeader}>
          <Text style={[styles.levelNumber, { color: textColor }]}>
            LEVEL {level.id}
          </Text>
          {isCompleted && <Text style={[styles.badge, { color: Colors.green }]}>✓</Text>}
        </View>

        <Text style={[styles.levelName, { color: textColor }]}>{level.name}</Text>
        <Text style={[styles.levelDesc, { color: Colors.textSecond }]}>
          {level.description}
        </Text>

        <View style={styles.levelMeta}>
          <Text style={[styles.meta, { color: Colors.textSecond }]}>
            ⏱ {level.timeLimit}s
          </Text>
          <Text style={[styles.meta, { color: Colors.textSecond }]}>
            XP +{level.reward.xp}
          </Text>
        </View>

        {!isUnlocked && (
          <Text style={[styles.locked, { color: Colors.red }]}>🔒 LOCKED</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Menu Component ───────────────────────────────────────────
export default function MenuScreen() {
  const router = useRouter();
  const completedLevels = useGameStore(s => s.completedLevels);
  const totalXP = useGameStore(s => s.totalXP);
  const startLevel = useGameStore(s => s.startLevel);
  const isLevelUnlocked = useGameStore(s => s.isLevelUnlocked);

  const handleLevelPress = (levelId) => {
    if (startLevel(levelId)) {
      router.push('/level');
    }
  };

  const handleContinueGame = () => {
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Background scanlines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} style={[styles.scanLine, { top: i * 8 }]} />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AnimatedTitle />
          <View style={styles.stats}>
            <Text style={styles.statText}>XP: {totalXP}</Text>
            <Text style={styles.statText}>CLEARED: {completedLevels.length}/{LEVELS.length}</Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinueGame}
        >
          <Text style={styles.continueBtnText}>↻ CONTINUE TO SANDBOX</Text>
        </TouchableOpacity>

        {/* Level Grid */}
        <View style={styles.levelGrid}>
          {LEVELS.map((level, index) => {
            const unlocked = isLevelUnlocked(level.id);
            const completed = completedLevels.includes(level.id);

            return (
              <LevelButton
                key={level.id}
                level={level}
                index={index}
                isUnlocked={unlocked}
                isCompleted={completed}
                onPress={() => handleLevelPress(level.id)}
              />
            );
          })}
        </View>

        <View style={{ height: Space.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Space.xl,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#00ffcc04',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Space.lg,
    paddingTop: Space.lg,
    paddingBottom: Space.md,
  },
  title: {
    fontFamily: Font.mono,
    fontSize: Font.sizes.hero,
    fontWeight: 'bold',
    color: Colors.cyan,
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Font.mono,
    fontSize: Font.sizes.md,
    color: Colors.textSecond,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: Space.xs,
  },
  stats: {
    flexDirection: 'row',
    marginTop: Space.md,
    gap: Space.lg,
  },
  statText: {
    fontFamily: Font.mono,
    fontSize: Font.sizes.sm,
    color: Colors.textSecond,
    letterSpacing: 1,
  },
  continueBtn: {
    marginHorizontal: Space.lg,
    marginVertical: Space.md,
    paddingVertical: Space.md,
    paddingHorizontal: Space.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.green,
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: Font.mono,
    fontSize: Font.sizes.sm,
    color: Colors.green,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  levelGrid: {
    paddingHorizontal: Space.lg,
    gap: Space.md,
  },
  levelButtonWrapper: {
    width: '100%',
  },
  levelButton: {
    borderWidth: 1,
    padding: Space.md,
    borderRadius: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.sm,
  },
  levelNumber: {
    fontFamily: Font.mono,
    fontSize: Font.sizes.sm,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  badge: {
    fontSize: Font.sizes.lg,
  },
  levelName: {
    fontFamily: Font.mono,
    fontSize: Font.sizes.md,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Space.xs,
  },
  levelDesc: {
    fontFamily: Font.mono,
    fontSize: Font.sizes.xs,
    lineHeight: 14,
    marginBottom: Space.sm,
  },
  levelMeta: {
    flexDirection: 'row',
    gap: Space.md,
    marginBottom: Space.sm,
  },
  meta: {
    fontFamily: Font.mono,
    fontSize: Font.sizes.xs,
    letterSpacing: 1,
  },
  locked: {
    fontFamily: Font.mono,
    fontSize: Font.sizes.xs,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
