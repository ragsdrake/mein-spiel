/**
 * app/world/[id].js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deep-link world detail screen — reachable via router.push('/world/kepler9b')
 * Shows expanded graphics + full upgrade tree for a specific world.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlanetGraphic   from '../../components/graphics/PlanetGraphic';
import SolarPanelGraphic from '../../components/graphics/SolarPanelGraphic';
import BuildingButton  from '../../components/ui/BuildingButton';
import PixelPanel      from '../../components/ui/PixelPanel';
import ResourceBar     from '../../components/ui/ResourceBar';
import TapButton       from '../../components/ui/TapButton';
import { Colors, Font, Space, WorldThemes } from '../../constants/theme';
import { getWorld }    from '../../features/worlds/worldData';
import useWorldResources from '../../hooks/useWorldResources';
import useGameStore    from '../../store/useGameStore';

const { width: W } = Dimensions.get('window');

export default function WorldDetailScreen() {
  const { id }   = useLocalSearchParams();
  const router   = useRouter();
  const setActive = useGameStore(s => s.setActiveWorld);

  let worldDef;
  try { worldDef = getWorld(id); }
  catch { return null; }

  const theme = WorldThemes[worldDef.theme] || WorldThemes.default;
  const res   = useWorldResources(id);

  const handleActivate = () => {
    setActive(id);
    router.replace('/(tabs)');
  };

  if (!res) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: theme.accent }]}>← BACK</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* world name */}
        <Text style={[styles.title, { color: theme.accent }]}>{worldDef.name.toUpperCase()}</Text>
        <Text style={styles.desc}>{worldDef.description}</Text>

        {/* planet */}
        <View style={styles.centred}>
          <PlanetGraphic size={Math.min(W * 0.8, 320)} health={res.health} />
        </View>

        {/* health bar */}
        <PixelPanel accentColor={theme.accent} style={styles.panel}>
          <ResourceBar label="PLANETARY HEALTH" value={res.health} max={100} color={theme.accent} showValue />
          <ResourceBar label="ENERGY"  value={res.energy}  max={Math.max(res.energy, res.solarCost * 3)} color={Colors.cyan}  showValue />
          <ResourceBar label="BIOMASS" value={res.biomass} max={Math.max(res.biomass, 200)}              color={Colors.green} showValue />
        </PixelPanel>

        {/* solar panel graphic */}
        <View style={styles.centred}>
          <SolarPanelGraphic size={220} level={res.solarCount} active={res.solarCount > 0} />
          <Text style={styles.graphicLabel}>SOLAR ARRAY  ·  {res.solarCount} PANELS</Text>
        </View>

        {/* tap */}
        <View style={styles.centred}>
          <TapButton onPress={res.tapEnergy} color={theme.accent} />
        </View>

        {/* upgrades */}
        <PixelPanel accentColor={Colors.cyan} style={styles.panel}>
        <Text style={styles.sectionLabel}>UPGRADES</Text>
        <BuildingButton
          title="Solar Collector"
          subtitle="+1 Energy/sec"
          cost={res.solarCost}
          count={res.solarCount}
          currency="Energy"
          disabled={!res.canBuySolar}
          onPress={res.buySolarPanel}
          accentColor={Colors.cyan}
        />
        <BuildingButton
          title="Hydro Lab"
          subtitle="+0.5 Biomass/sec"
          cost={res.labCost}
          count={res.labCount}
          currency="Energy"
          disabled={!res.canBuyLab}
          onPress={res.buyHydroLab}
          accentColor={Colors.green}
        />
        </PixelPanel>

        {/* activate button */}
        <TouchableOpacity
          style={[styles.activateBtn, { borderColor: theme.accent }]}
          onPress={handleActivate}
        >
          <Text style={[styles.activateBtnText, { color: theme.accent }]}>
            SET AS ACTIVE WORLD
          </Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    paddingHorizontal: Space.lg,
    paddingVertical:   Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gridLine,
  },
  backText: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.sm,
    letterSpacing: 2,
  },
  content: {
    padding: Space.lg,
  },
  title: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xl,
    fontWeight:    'bold',
    letterSpacing: 4,
    marginBottom:  Space.xs,
  },
  desc: {
    fontFamily:  Font.mono,
    fontSize:    Font.sizes.sm,
    color:       Colors.textSecond,
    lineHeight:  20,
    marginBottom: Space.lg,
  },
  centred: {
    alignItems:     'center',
    paddingVertical: Space.md,
  },
  graphicLabel: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.textSecond,
    letterSpacing: 2,
    marginTop:     Space.xs,
  },
  sectionLabel: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.textSecond,
    letterSpacing: 3,
    marginBottom:  Space.sm,
  },
  panel: {
    marginHorizontal: 0,
    marginVertical:   Space.sm,
  },
  activateBtn: {
    borderWidth:  1,
    paddingVertical: Space.md,
    alignItems:   'center',
    marginTop:    Space.lg,
  },
  activateBtnText: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.sm,
    fontWeight:    'bold',
    letterSpacing: 3,
  },
});
