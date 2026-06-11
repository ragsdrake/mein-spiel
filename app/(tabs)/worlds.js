/**
 * app/(tabs)/worlds.js
 * ─────────────────────────────────────────────────────────────────────────────
 * WORLDS tab — lists all planets, shows health/status,
 * lets player switch active world or unlock new ones.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpaceStationGraphic from '../../components/graphics/SpaceStationGraphic';
import PixelPanel          from '../../components/ui/PixelPanel';
import WorldCard           from '../../components/ui/WorldCard';
import { Colors, Font, Space } from '../../constants/theme';
import { WORLDS }          from '../../features/worlds/worldData';
import useGameStore        from '../../store/useGameStore';

const { width: W } = Dimensions.get('window');

export default function WorldsScreen() {
  const router      = useRouter();
  const activeId    = useGameStore(s => s.activeWorldId);
  const worldStates = useGameStore(s => s.worlds);
  const setActive   = useGameStore(s => s.setActiveWorld);
  const unlock      = useGameStore(s => s.unlockWorld);

  const handleSelect = useCallback((worldId) => {
    const ws = worldStates[worldId];
    if (!ws?.unlocked) {
      // attempt unlock
      const success = unlock(worldId);
      if (!success) {
        Alert.alert(
          'Insufficient Resources',
          'You do not have enough resources to unlock this world.',
          [{ text: 'OK' }]
        );
      }
      return;
    }
    setActive(worldId);
  }, [worldStates, unlock, setActive]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>PROJEKT GENESIS</Text>
        <Text style={styles.subtitle}>PLANETARY SYSTEMS — SELECT ACTIVE WORLD</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* station graphic */}
        <PixelPanel accentColor={Colors.cyan} style={styles.stationPanel}>
          <View style={styles.stationWrapper}>
            <SpaceStationGraphic
              size={Math.min(W * 0.65, 260)}
              active={true}
              level={2}
            />
            <Text style={styles.stationLabel}>ORBITAL COMMAND — STATION ALPHA</Text>
          </View>
        </PixelPanel>

        {/* world cards */}
        {WORLDS.map(world => (
          <WorldCard
            key={world.id}
            world={world}
            worldState={worldStates[world.id]}
            active={world.id === activeId}
            onPress={() => handleSelect(world.id)}
            onDetails={() => router.push(`/world/${world.id}`)}
          />
        ))}

        <View style={{ height: Space.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Space.lg,
    paddingVertical:   Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gridLine,
  },
  title: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.md,
    fontWeight:    'bold',
    color:         Colors.cyan,
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.textSecond,
    letterSpacing: 2,
    marginTop:     2,
  },
  scroll: { flex: 1 },
  content: {
    padding: Space.lg,
  },
  stationPanel: {
    marginHorizontal: 0,
    marginBottom:     Space.lg,
  },
  stationWrapper: {
    alignItems: 'center',
  },
  stationLabel: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.textSecond,
    letterSpacing: 2,
    marginTop:     Space.xs,
  },
});
