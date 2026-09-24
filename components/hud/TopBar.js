/**
 * Tycoon-style HUD header (Codigames layout): money + income per second top
 * left, gems top right, clock/boost pills, hotel rating, and a column of
 * white square shortcut buttons on the right edge.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { starProgress, starsFor } from '../../game/config';
import { fmt, fmtDuration } from '../../game/format';
import { HOTELS } from '../../game/hotels';
import { questDone } from '../../game/quests';
import { useSim } from '../../game/sim';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import { FONT } from './theme';

const PANEL = 'rgba(20, 28, 60, 0.72)';
const MONEY = '#3fd06a';

function clockLabel(minute) {
  const m = minute % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function T({ size = 16, color = '#fff', style, children }) {
  return <Text style={[styles.t, { fontSize: size, color }, style]}>{children}</Text>;
}

function GainPopup() {
  const gain = useSim(s => s.lastGain);
  const y = useSharedValue(0);
  const o = useSharedValue(0);
  useEffect(() => {
    if (!gain) return;
    y.value = 0;
    o.value = 1;
    y.value = withTiming(-22, { duration: 900 });
    o.value = withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 400 }));
  }, [gain, o, y]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));
  if (!gain) return null;
  return (
    <Animated.View style={[styles.gain, style]} pointerEvents="none">
      <T size={15} color={MONEY}>+{fmt(gain.amount)}</T>
    </Animated.View>
  );
}

/** Money counter that pops whenever cash comes in. */
function Money() {
  const coins = useHotel(s => s.coins);
  const perSec = useHotel(s => s.totalIncomePerSecond());
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSequence(withTiming(1.12, { duration: 80 }), withSpring(1));
  }, [coins, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={styles.moneyPanel}>
      <View style={styles.row}>
        <Animated.View style={style}><Icon name="cash" size={26} color={MONEY} /></Animated.View>
        <T size={20}>{fmt(coins)}</T>
      </View>
      <View style={styles.row}>
        <Icon name="chart-line" size={18} color={MONEY} />
        <T size={14} color={MONEY}>+{fmt(perSec)}/s</T>
      </View>
      <GainPopup />
    </View>
  );
}

function SideButton({ icon, color = '#2f6fe0', onPress, dot }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.side, pressed && styles.pressed]}>
      <Icon name={icon} size={26} color={color} />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export default function TopBar() {
  const def = useHotel(s => s.activeDef());
  const gems = useHotel(s => s.gems);
  const earned = useHotel(s => s.hotels[s.activeHotel].totalEarned);
  const boostUntil = useHotel(s => s.boostUntil);
  const questReady = useHotel(s => s.quests.some(q => questDone(q, s.stats)));
  const hotelReady = useHotel(s => HOTELS.some(h => s.canUnlockHotel(h.id)));
  const guests = useSim(s => s.guestIds.length);
  const minute = useSim(s => s.minute);
  const openSheet = useUi(s => s.openSheet);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stars = starsFor(earned, def.pm);
  const progress = starProgress(earned, def.pm);
  const boostLeft = (boostUntil - now) / 1000;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.top} pointerEvents="box-none">
        <View style={styles.leftCol} pointerEvents="box-none">
          <Money />
          <View style={styles.row} pointerEvents="box-none">
            <View style={styles.clock}>
              <Icon name="clock-outline" size={16} color="#fff" />
              <T size={15}>{clockLabel(minute)}</T>
              <Icon name="weather-night" size={16} color="#fff" />
            </View>
            {boostLeft > 0 && (
              <View style={[styles.clock, styles.boost]}>
                <Icon name="cash-multiple" size={16} color="#fff" />
                <T size={14}>×2 {fmtDuration(boostLeft)}</T>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightCol} pointerEvents="box-none">
          <Pressable style={styles.gemPanel} onPress={() => openSheet('shop')}>
            <Icon name="diamond-stone" size={22} color="#ffb52a" />
            <T size={18}>{gems}</T>
            <View style={styles.plus}><Icon name="plus" size={16} color="#fff" /></View>
          </Pressable>
          <Pressable style={styles.ratingPanel} onPress={() => openSheet('guests')}>
            <View style={styles.row}>
              {[0, 1, 2, 3, 4].map(i => (
                <Icon key={i} name="star" size={15} color={i < stars ? '#ffc94a' : 'rgba(255,255,255,0.25)'} />
              ))}
            </View>
            <View style={styles.progress}><View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} /></View>
            <View style={styles.row}>
              <Icon name="account-group" size={14} color="#cfe0ff" />
              <T size={12} color="#cfe0ff">{guests} Gäste</T>
            </View>
          </Pressable>
          <View style={styles.sideCol} pointerEvents="box-none">
            <SideButton icon="map-marker-radius" onPress={() => openSheet('hotels')} dot={hotelReady} />
            <SideButton icon="clipboard-check" color="#28a85a" onPress={() => openSheet('quests')} dot={questReady} />
            <SideButton icon="chart-bar" color="#8a4ae0" onPress={() => openSheet('guests')} />
            <SideButton icon="cog" color="#6a7090" onPress={() => openSheet('settings')} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  leftCol: { gap: 6, alignItems: 'flex-start' },
  rightCol: { gap: 6, alignItems: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  t: {
    fontFamily: FONT, color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 1,
  },
  moneyPanel: { backgroundColor: PANEL, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, gap: 1, minWidth: 150 },
  gemPanel: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PANEL, borderRadius: 10,
    paddingLeft: 10, paddingRight: 5, paddingVertical: 5,
  },
  plus: {
    width: 24, height: 24, borderRadius: 6, backgroundColor: '#ff9a1a', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 3, borderBottomColor: '#c86a0a',
  },
  ratingPanel: { backgroundColor: PANEL, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center', gap: 3 },
  progress: { height: 6, width: 90, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#ffc94a' },
  clock: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f5a623', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderBottomWidth: 3, borderBottomColor: '#c07a10',
  },
  boost: { backgroundColor: '#28b45a', borderBottomColor: '#1a8040' },
  sideCol: { gap: 8, marginTop: 4 },
  side: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: '#c8d0e4',
  },
  pressed: { transform: [{ scale: 0.93 }] },
  dot: {
    position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#ff3b4a', borderWidth: 2, borderColor: '#fff',
  },
  gain: { position: 'absolute', left: 40, top: 30 },
});
