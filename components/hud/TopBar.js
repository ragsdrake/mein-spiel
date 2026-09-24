/**
 * HUD header: coins, guests, gems, hotel stars, nightly balance and the clock.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import { starProgress, starsFor } from '../../game/config';
import { fmt, fmtDuration } from '../../game/format';
import { useSim } from '../../game/sim';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import { C } from './theme';
import Txt from './Txt';

function clockLabel(minute) {
  const m = minute % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function GainPopup() {
  const gain = useSim(s => s.lastGain);
  const y = useSharedValue(0);
  const o = useSharedValue(0);
  useEffect(() => {
    if (!gain) return;
    y.value = 0;
    o.value = 1;
    y.value = withTiming(-26, { duration: 900 });
    o.value = withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 400 }));
  }, [gain, o, y]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));
  if (!gain) return null;
  return (
    <Animated.View style={[styles.gain, style]} pointerEvents="none">
      <Txt size={16} color={C.gold}>+{fmt(gain.amount)}</Txt>
    </Animated.View>
  );
}

export default function TopBar() {
  const coins = useHotel(s => s.coins);
  const gems = useHotel(s => s.gems);
  const totalEarned = useHotel(s => s.totalEarned);
  const nightEarned = useHotel(s => s.nightEarned);
  const rooms = useHotel(s => s.rooms);
  const boostUntil = useHotel(s => s.boostUntil);
  const guests = useSim(s => s.guestIds.length);
  const minute = useSim(s => s.minute);
  const openSheet = useUi(s => s.openSheet);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stars = starsFor(totalEarned);
  const progress = starProgress(totalEarned);
  const capacity = rooms.filter(Boolean).length;
  const boostLeft = (boostUntil - now) / 1000;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.row} pointerEvents="box-none">
        <View style={styles.pill}>
          <View style={styles.stat}>
            <Icon name="circle-multiple" size={22} color={C.gold} />
            <Txt size={18}>{fmt(coins)}</Txt>
            <GainPopup />
          </View>
          <View style={styles.stat}>
            <Icon name="ghost" size={20} color="#dfeaff" />
            <Txt size={16}>{guests}/{capacity}</Txt>
          </View>
          <Pressable style={styles.stat} onPress={() => openSheet('boost')}>
            <Icon name="diamond-stone" size={20} color={C.purple} />
            <Txt size={16}>{gems}</Txt>
            <View style={styles.plus}><Icon name="plus" size={14} color={C.white} /></View>
          </Pressable>
        </View>

        <Pressable style={styles.stars} onPress={() => openSheet('guests')}>
          <View style={styles.starRow}>
            {[0, 1, 2, 3, 4].map(i => (
              <Icon key={i} name="star" size={19} color={i < stars ? C.gold : '#4a4468'} />
            ))}
          </View>
          <View style={styles.progress}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </Pressable>
      </View>

      <View style={styles.row} pointerEvents="box-none">
        <View style={[styles.pill, styles.small]}>
          <Icon name="weather-night" size={18} color={C.gold} />
          <Txt size={15}>Nachtbilanz: </Txt>
          <Txt size={15} color={C.green}>+{fmt(nightEarned)}</Txt>
        </View>
        <View style={[styles.pill, styles.small]}>
          <Icon name="clock-outline" size={18} color={C.white} />
          <Txt size={16}>{clockLabel(minute)}</Txt>
        </View>
      </View>

      {boostLeft > 0 && (
        <View style={[styles.pill, styles.small, styles.boost]}>
          <Icon name="timer-sand" size={16} color={C.gold} />
          <Txt size={14}>Geisterstunde ×2  {fmtDuration(boostLeft)}</Txt>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  pill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: C.panel,
    borderRadius:    14,
    borderWidth:     2,
    borderColor:     C.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink:      1,
  },
  small: { gap: 6, paddingVertical: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  plus: {
    backgroundColor: C.orange, borderRadius: 6, width: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', marginLeft: 2,
  },
  stars: {
    backgroundColor: C.panel, borderRadius: 14, borderWidth: 2, borderColor: C.border,
    paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center',
  },
  starRow: { flexDirection: 'row' },
  progress: {
    marginTop: 3, height: 6, width: '100%', borderRadius: 3, backgroundColor: '#3a3358', overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.gold },
  boost: { alignSelf: 'flex-start', borderColor: C.goldDark },
  gain: { position: 'absolute', left: 26, top: 22 },
});
