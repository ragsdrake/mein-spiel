/**
 * HUD header: coins, guests, gems, hotel stars, nightly balance, clock,
 * hotel name and settings.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { starProgress, starsFor } from '../../game/config';
import { fmt, fmtDuration } from '../../game/format';
import { useSim } from '../../game/sim';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import GameButton from './GameButton';
import { C, GRAD } from './theme';
import Txt from './Txt';

function clockLabel(minute) {
  const m = minute % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function Pill({ children, style, onPress }) {
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap onPress={onPress} style={[styles.pill, style]}>
      <LinearGradient colors={GRAD.panel} style={[StyleSheet.absoluteFill, { borderRadius: 13 }]} />
      {children}
    </Wrap>
  );
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

/** Coin counter that pops whenever money comes in. */
function Coins() {
  const coins = useHotel(s => s.coins);
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSequence(withTiming(1.15, { duration: 90 }), withSpring(1));
  }, [coins, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={styles.stat}>
      <Animated.View style={style}><Icon name="circle-multiple" size={22} color={C.gold} /></Animated.View>
      <Txt size={18}>{fmt(coins)}</Txt>
      <GainPopup />
    </View>
  );
}

export default function TopBar() {
  const def = useHotel(s => s.activeDef());
  const gems = useHotel(s => s.gems);
  const earned = useHotel(s => s.hotels[s.activeHotel].totalEarned);
  const rooms = useHotel(s => s.hotels[s.activeHotel].rooms);
  const nightEarned = useHotel(s => s.nightEarned);
  const boostUntil = useHotel(s => s.boostUntil);
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
  const capacity = rooms.filter(Boolean).length;
  const boostLeft = (boostUntil - now) / 1000;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.row} pointerEvents="box-none">
        <Pill>
          <Coins />
          <View style={styles.stat}>
            <Icon name="account-group" size={20} color="#dfeaff" />
            <Txt size={16}>{guests}/{capacity}</Txt>
          </View>
          <Pressable style={styles.stat} onPress={() => openSheet('shop')}>
            <Icon name="diamond-stone" size={20} color={C.purple} />
            <Txt size={16}>{gems}</Txt>
            <View style={styles.plus}><Icon name="plus" size={14} color={C.white} /></View>
          </Pressable>
        </Pill>

        <Pill style={styles.stars} onPress={() => openSheet('guests')}>
          <View style={styles.starRow}>
            {[0, 1, 2, 3, 4].map(i => (
              <Icon key={i} name="star" size={19} color={i < stars ? C.gold : '#4a4468'} />
            ))}
          </View>
          <View style={styles.progress}>
            <LinearGradient colors={GRAD.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </Pill>
      </View>

      <View style={styles.row} pointerEvents="box-none">
        <Pill style={styles.small}>
          <Icon name="weather-night" size={18} color={C.gold} />
          <Txt size={15}>Nachtbilanz: </Txt>
          <Txt size={15} color={C.green}>+{fmt(nightEarned)}</Txt>
        </Pill>
        <View style={styles.rightCol} pointerEvents="box-none">
          <Pill style={styles.small}>
            <Icon name="clock-outline" size={18} color={C.white} />
            <Txt size={16}>{clockLabel(minute)}</Txt>
          </Pill>
          <GameButton grad="grey" radius={14} onPress={() => openSheet('settings')} style={styles.gear}>
            <Icon name="cog" size={20} color={C.white} />
          </GameButton>
        </View>
      </View>

      <View style={styles.row} pointerEvents="box-none">
        <Pill style={styles.small} onPress={() => openSheet('hotels')}>
          <Icon name={def.icon} size={18} color={def.palette.window} />
          <Txt size={14}>{def.name}</Txt>
          <Icon name="chevron-down" size={16} color={C.muted} />
        </Pill>
        {boostLeft > 0 && (
          <Pill style={[styles.small, styles.boost]}>
            <Icon name="timer-sand" size={16} color={C.gold} />
            <Txt size={14}>×2  {fmtDuration(boostLeft)}</Txt>
          </Pill>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  rightCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    borderRadius:    15,
    borderWidth:     2,
    borderColor:     C.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink:      1,
    overflow:        'visible',
  },
  small: { gap: 6, paddingVertical: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  plus: {
    backgroundColor: C.orange, borderRadius: 6, width: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', marginLeft: 2, borderWidth: 1.5, borderColor: C.border,
  },
  stars: { flexDirection: 'column', gap: 0, paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center' },
  starRow: { flexDirection: 'row' },
  progress: {
    marginTop: 3, height: 7, width: '100%', borderRadius: 4, backgroundColor: '#2a2446', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  boost: { borderColor: C.goldDark },
  gear: { width: 38, height: 34 },
  gain: { position: 'absolute', left: 26, top: 22 },
});
