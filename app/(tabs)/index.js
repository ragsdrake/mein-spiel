/**
 * app/(tabs)/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Main COMMAND screen.
 *
 * Layout (top → bottom):
 *   ┌────────────────────────────────────────┐
 *   │  WORLD NAME + STATUS                   │  header strip
 *   ├────────────────────────────────────────┤
 *   │         [PlanetGraphic]                │  centred planet
 *   ├────────────────────────────────────────┤
 *   │  HEALTH ████░░░░░░  35 / 100           │  resource bars
 *   │  ENERGY ████████░░  800                │
 *   │  BIOMASS ████░░░░░  24.5               │
 *   ├────────────────────────────────────────┤
 *   │           [ TAP ]                      │  hex tap button
 *   ├────────────────────────────────────────┤
 *   │  ▣ Solar Collector  (3)  COST: 46 ⚡   │  upgrade buttons
 *   │  ▣ Hydro Lab        (1)  COST: 58 ⚡   │
 *   └────────────────────────────────────────┘
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlanetGraphic   from '../../components/graphics/PlanetGraphic';
import PixelSprite     from '../../components/graphics/PixelSprite';
import BuildingButton  from '../../components/ui/BuildingButton';
import GeneCard        from '../../components/ui/GeneCard';
import PlantPicker     from '../../components/ui/PlantPicker';
import ResourceBar     from '../../components/ui/ResourceBar';
import TapButton       from '../../components/ui/TapButton';
import ZoneTile        from '../../components/ui/ZoneTile';
import { Colors, Font, Space, WorldThemes } from '../../constants/theme';
import { getWorld }    from '../../features/worlds/worldData';
import { getPlant }    from '../../features/worlds/plantData';
import { GENES }       from '../../features/worlds/geneData';
import { GREENHOUSE_SPRITE } from '../../features/worlds/sprites';
import useGameStore    from '../../store/useGameStore';
import useWorldResources from '../../hooks/useWorldResources';

const { width: SCREEN_W } = Dimensions.get('window');
const PLANET_SIZE = Math.min(SCREEN_W * 0.72, 300);

// ─── scanline overlay ─────────────────────────────────────────────────────────
function ScanLines() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 40 }).map((_, i) => (
        <View key={i} style={[styles.scanLine, { top: i * 8 }]} />
      ))}
    </View>
  );
}

// ─── separator ────────────────────────────────────────────────────────────────
function Sep({ color = Colors.gridLine }) {
  return <View style={[styles.sep, { backgroundColor: color }]} />;
}

// ─── main component ───────────────────────────────────────────────────────────
export default function CommandScreen() {
  const activeId  = useGameStore(s => s.activeWorldId);
  const worldDef  = getWorld(activeId);
  const theme     = WorldThemes[worldDef.theme] || WorldThemes.default;
  const res       = useWorldResources(activeId);
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  const handleBuySolar = useCallback(() => res?.buySolarPanel(), [res]);
  const handleBuyLab   = useCallback(() => res?.buyHydroLab(),   [res]);

  if (!res) return null;

  // energy generation rate label
  const energyRate  = res.solarCount * 1;
  const biomassRate = (res.labCount  * 0.5).toFixed(1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScanLines />

      {/* ── header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[styles.worldName, { color: theme.accent }]}>
          {worldDef.name.toUpperCase()}
        </Text>
        <Text style={[styles.worldStatus, { color: res.terraformed ? Colors.green : Colors.red }]}>
          {res.terraformed ? '◈ TERRAFORMED' : '⚠ CRITICAL'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── planet graphic ──────────────────────────────────────── */}
        <View style={styles.planetWrapper}>
          <PlanetGraphic size={PLANET_SIZE} health={res.health} />

          {/* coordinate label */}
          <Text style={styles.coordLabel}>
            {`SOL·${activeId.slice(0, 4).toUpperCase()} // LAT:${(res.health * 0.9).toFixed(1)}°`}
          </Text>
        </View>

        <Sep color={theme.accent + '33'} />

        {/* ── resource readouts ───────────────────────────────────── */}
        <View style={styles.section}>
          <ResourceBar
            label="PLANETARY HEALTH"
            value={res.health}
            max={100}
            color={theme.accent}
            showValue
          />
          <ResourceBar
            label={`ENERGY  +${energyRate}/s`}
            value={res.energy}
            max={Math.max(res.energy, res.solarCost * 3)}
            color={Colors.cyan}
            showValue
          />
          <ResourceBar
            label={`BIOMASS  +${biomassRate}/s`}
            value={res.biomass}
            max={Math.max(res.biomass, res.labCost)}
            color={Colors.green}
            showValue
          />
        </View>

        <Sep />

        {/* ── tap button ──────────────────────────────────────────── */}
        <View style={styles.tapSection}>
          <TapButton onPress={res.tapEnergy} color={theme.accent} />
        </View>

        <Sep />

        {/* ── upgrade panel ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INFRASTRUCTURE</Text>

          <BuildingButton
            title="Solar Collector"
            subtitle={`+1 Energy/sec  ·  ${res.solarCount} deployed`}
            cost={res.solarCost}
            count={res.solarCount}
            currency="Energy"
            disabled={!res.canBuySolar}
            onPress={handleBuySolar}
            accentColor={Colors.cyan}
          />

          <BuildingButton
            title="Hydro Lab"
            subtitle={`+0.5 Biomass/sec  ·  ${res.labCount} deployed`}
            cost={res.labCost}
            count={res.labCount}
            currency="Energy"
            disabled={!res.canBuyLab}
            onPress={handleBuyLab}
            accentColor={Colors.green}
          />
        </View>

        <Sep />

        {/* ── greenhouse ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.greenhouseHeader}>
            <PixelSprite {...GREENHOUSE_SPRITE} size={56} />
            <Text style={[styles.sectionLabel, styles.greenhouseLabel]}>GREENHOUSE</Text>
          </View>

          {res.greenhouseCount === 0 ? (
            <BuildingButton
              title="Build Greenhouse"
              subtitle="Unlocks seed production & planet exploration"
              cost={res.greenhouseCost}
              count={res.greenhouseCount}
              currency="Energy"
              disabled={!res.canBuyGreenhouse}
              onPress={res.buyGreenhouse}
              accentColor={Colors.purple}
            />
          ) : (
            <>
              <ResourceBar label="SEEDS" value={res.seeds} max={Math.max(res.seeds, 50)} color={Colors.purple} showValue />
              <BuildingButton
                title="Expand Greenhouse"
                subtitle="+ Seed production"
                cost={res.greenhouseCost}
                count={res.greenhouseCount}
                currency="Energy"
                disabled={!res.canBuyGreenhouse}
                onPress={res.buyGreenhouse}
                accentColor={Colors.purple}
              />

              <Text style={styles.sectionLabel}>PLANET STRUCTURE</Text>
              <View style={styles.zoneGrid}>
                {res.zones.map(zone => (
                  <ZoneTile
                    key={zone.id}
                    zone={zone}
                    exploreCost={res.nextExploreCost}
                    plant={zone.plantId ? getPlant(zone.plantId) : null}
                    onPress={() => {
                      if (!zone.explored) {
                        res.exploreZone(zone.id);
                      } else if (!zone.plantId) {
                        setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id);
                      }
                    }}
                  />
                ))}
              </View>

              {selectedZoneId && (
                <PlantPicker
                  zone={res.zones.find(z => z.id === selectedZoneId)}
                  seeds={res.seeds}
                  onPlant={(plantId) => {
                    res.plantInZone(selectedZoneId, plantId);
                    setSelectedZoneId(null);
                  }}
                  onClose={() => setSelectedZoneId(null)}
                />
              )}

              <Text style={styles.sectionLabel}>GENE RESEARCH</Text>
              {GENES.map(gene => (
                <GeneCard
                  key={gene.id}
                  gene={gene}
                  researched={res.researchedGenes.includes(gene.id)}
                  affordable={res.seeds >= gene.cost}
                  onPress={() => res.researchGene(gene.id)}
                />
              ))}
            </>
          )}
        </View>

        {/* spacer for tab bar */}
        <View style={{ height: Space.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: Space.lg,
    paddingVertical:  Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gridLine,
  },
  worldName: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.md,
    fontWeight:    'bold',
    letterSpacing: 3,
  },
  worldStatus: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    letterSpacing: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Space.xl,
  },
  planetWrapper: {
    alignItems:     'center',
    paddingVertical: Space.md,
  },
  coordLabel: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.textSecond,
    letterSpacing: 2,
    marginTop:     Space.xs,
  },
  section: {
    paddingHorizontal: Space.lg,
    paddingVertical:   Space.md,
  },
  sectionLabel: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.textSecond,
    letterSpacing: 3,
    marginBottom:  Space.sm,
  },
  greenhouseHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Space.sm,
  },
  greenhouseLabel: {
    marginBottom: 0,
    marginLeft:   Space.sm,
  },
  zoneGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    justifyContent: 'space-between',
  },
  tapSection: {
    alignItems:     'center',
    paddingVertical: Space.lg,
  },
  sep: {
    height:           1,
    backgroundColor:  Colors.gridLine,
    marginHorizontal: Space.lg,
  },
  scanLine: {
    position:        'absolute',
    left:            0,
    right:           0,
    height:          1,
    backgroundColor: '#00ffcc04',
  },
});
