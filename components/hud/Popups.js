/**
 * Modal moments: offline earnings, star-ups, end-of-night summary, the
 * hotel-change title card and the first-launch tutorial hint.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  BounceIn, Easing, FadeIn, FadeInDown, FadeOut, ZoomIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { GEMS_PER_STAR } from '../../game/config';
import { fmt, fmtDuration } from '../../game/format';
import { getHotel } from '../../game/hotels';
import { AD_PLACEMENTS, finishAd, showRewardedAd } from '../../game/ads';
import { intro } from '../../game/fx';
import { dismissNightSummary, useSim } from '../../game/sim';
import useUi from '../../game/ui';
import useHotel from '../../game/store';
import GameButton from './GameButton';
import { C, GRAD } from './theme';
import Txt from './Txt';

/** Slowly turning sunburst behind celebration dialogs. */
function Rays({ color = 'rgba(255, 214, 90, 0.13)' }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 9000, easing: Easing.linear }), -1);
  }, [spin]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.rays, style]}>
      {Array.from({ length: 12 }, (_, i) => (
        <View key={i} style={[styles.ray, { backgroundColor: color, transform: [{ rotate: `${i * 15}deg` }] }]} />
      ))}
    </Animated.View>
  );
}

function Dialog({ icon, iconColor, title, children, actions, celebrate = false }) {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
      {celebrate && <Rays />}
      <Animated.View entering={ZoomIn.springify().damping(10)} style={styles.card}>
        <LinearGradient colors={GRAD.panel} style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
        <Animated.View entering={BounceIn.delay(250)} style={styles.badge}>
          <LinearGradient colors={GRAD.card} style={[StyleSheet.absoluteFill, { borderRadius: 34 }]} />
          <Icon name={icon} size={42} color={iconColor} />
        </Animated.View>
        <Txt size={24} style={styles.center}>{title}</Txt>
        <View style={styles.body}>{children}</View>
        <View style={styles.actions}>{actions}</View>
      </Animated.View>
    </Animated.View>
  );
}

function Btn({ label, icon, grad = 'green', onPress, disabled }) {
  return (
    <GameButton grad={grad} onPress={onPress} disabled={disabled} style={styles.btn}>
      <View style={styles.btnRow}>
        {icon ? <Icon name={icon} size={18} color={C.white} /> : null}
        <Txt size={16}>{label}</Txt>
      </View>
    </GameButton>
  );
}

export function OfflinePopup() {
  const offline = useHotel(s => s.offline);
  const gems = useHotel(s => s.gems);
  const collect = useHotel(s => s.collectOffline);
  const collectAd = useHotel(s => s.collectOfflineAd);
  if (!offline) return null;
  const parts = offline.perHotel.filter(([, a]) => a > 0);
  return (
    <Dialog
      icon="weather-night"
      iconColor={C.gold}
      title="Willkommen zurück!"
      actions={(
        <>
          <Btn label="Einsammeln" onPress={() => collect(false)} />
          <Btn label="×2" icon="movie-open-play" grad="blue"
            onPress={async () => { if (await showRewardedAd('offline')) collectAd(); }} />
          <Btn label="×2" icon="diamond-stone" grad="purple" disabled={gems < 5} onPress={() => collect(true)} />
        </>
      )}
    >
      <Txt size={15} color={C.muted} style={styles.center}>
        Deine Gäste haben {fmtDuration(offline.seconds)} lang weiter bezahlt:
      </Txt>
      <View style={styles.amount}>
        <Icon name="circle-multiple" size={28} color={C.gold} />
        <Txt size={30} color={C.gold}>{fmt(offline.amount)}</Txt>
      </View>
      {parts.length > 1 && parts.map(([id, a]) => (
        <Txt key={id} size={13} color={C.muted}>{getHotel(id).short}: +{fmt(a)}</Txt>
      ))}
    </Dialog>
  );
}

/**
 * Placeholder for a rewarded video (see game/ads.js). Counts down like a real
 * ad; closing early forfeits the reward. Replaced by AdMob in a dev build.
 */
export function AdOverlay() {
  const ad = useUi(s => s.ad);
  const [left, setLeft] = useState(3);
  useEffect(() => {
    if (!ad) return undefined;
    setLeft(3);
    const t = setInterval(() => setLeft(l => {
      if (l <= 1) { clearInterval(t); setTimeout(() => finishAd(true), 0); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [ad]);
  if (!ad) return null;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.ad}>
      <Icon name="movie-open-play" size={64} color="#fff" />
      <Txt size={22}>Werbung (Platzhalter)</Txt>
      <Txt size={15} color={C.muted}>Belohnung: {AD_PLACEMENTS[ad.placement] ?? ad.placement}</Txt>
      <Txt size={40} color={C.gold}>{left}</Txt>
      <Pressable onPress={() => finishAd(false)} style={styles.adClose} hitSlop={10}>
        <Icon name="close" size={22} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

export function StarUpPopup() {
  const starUp = useHotel(s => s.starUp);
  const dismiss = useHotel(s => s.dismissStarUp);
  if (!starUp) return null;
  const def = getHotel(starUp.hotel);
  const guest = def.guests.find(t => t.star === starUp.stars);
  return (
    <Dialog
      icon="star"
      iconColor={C.gold}
      celebrate
      title={`${def.short}: ${starUp.stars} ★`}
      actions={<Btn label="Juhu!" onPress={dismiss} />}
    >
      <Txt size={15} color={C.muted} style={styles.center}>
        Dein Hotel spricht sich im Jenseits herum.
      </Txt>
      {guest && (
        <Txt size={17} style={styles.center}>Neue Gäste: {guest.name} (zahlt ×{guest.mult})</Txt>
      )}
      {starUp.stars === 3 && def.id !== 'eispalast' && (
        <Txt size={14} color={C.green} style={styles.center}>Ein neues Hotel kann freigeschaltet werden!</Txt>
      )}
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <Animated.View key={n} entering={ZoomIn.delay(300 + n * 120).springify().damping(8)}>
            <Icon name={n <= starUp.stars ? 'star' : 'star-outline'} size={n === starUp.stars ? 40 : 28}
              color={n <= starUp.stars ? C.gold : C.muted} />
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={FadeInDown.delay(1000)} style={styles.amount}>
        <Icon name="diamond-stone" size={24} color={C.purple} />
        <Txt size={22} color={C.purple}>+{GEMS_PER_STAR}</Txt>
      </Animated.View>
    </Dialog>
  );
}

export function NightSummaryToast() {
  const summary = useSim(s => s.nightSummary);
  useEffect(() => {
    if (!summary) return;
    const t = setTimeout(dismissNightSummary, 4500);
    return () => clearTimeout(t);
  }, [summary]);
  if (!summary) return null;
  return (
    <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.toast} pointerEvents="none">
      <LinearGradient colors={GRAD.panel} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
      <Icon name="weather-sunset-up" size={22} color={C.gold} />
      <Txt size={16}>Die Nacht ist vorbei! Bilanz: </Txt>
      <Txt size={16} color={C.green}>+{fmt(summary.amount)}</Txt>
    </Animated.View>
  );
}

/** Title card while travelling to another hotel. */
export function HotelTransition() {
  const active = useHotel(s => s.activeHotel);
  const first = useRef(true);
  const [show, setShow] = useState(null);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    // hold the camera swoop + build-up until the card starts to fade
    intro.hold = true;
    setShow(active);
    const open = setTimeout(() => { intro.hold = false; }, 1500);
    const t = setTimeout(() => setShow(null), 2000);
    return () => { clearTimeout(open); clearTimeout(t); intro.hold = false; };
  }, [active]);
  if (!show) return null;
  const def = getHotel(show);
  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(600)} style={styles.transition} pointerEvents="none">
      <LinearGradient colors={[def.palette.bg, def.palette.skyBottom, def.palette.bg]} style={StyleSheet.absoluteFill} />
      <Rays color="rgba(255, 255, 255, 0.08)" />
      <View style={styles.transitionInner}>
        <Animated.View entering={BounceIn.duration(700)}>
          <Icon name={def.icon} size={72} color={def.palette.window} />
        </Animated.View>
        <Animated.View entering={ZoomIn.delay(200).springify().damping(9)}>
          <Txt size={34} style={styles.center}>{def.name}</Txt>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(450)}>
          <Txt size={16} color="#e0d8f4" style={styles.center}>{def.tagline}</Txt>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export function TutorialHint() {
  const seen = useHotel(s => s.seenTutorial);
  const finish = useHotel(s => s.finishTutorial);
  const earned = useHotel(s => s.stats.earned);
  useEffect(() => {
    if (!seen && earned >= 60) finish();
  }, [seen, earned, finish]);
  if (seen) return null;
  return (
    <Animated.View entering={FadeIn.delay(800)} exiting={FadeOut} style={styles.hint}>
      <LinearGradient colors={GRAD.panel} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
      <Icon name="gesture-tap" size={26} color={C.gold} />
      <View style={styles.hintText}>
        <Txt size={15}>Tippe auf Gäste mit <Txt size={15} color={C.red}>!</Txt> zum Einchecken</Txt>
        <Txt size={13} color={C.muted}>Goldmünzen = Trinkgeld · Schleim antippen = putzen · Ziehen zum Umsehen</Txt>
      </View>
      <Pressable onPress={finish} hitSlop={12}><Icon name="close" size={20} color={C.muted} /></Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 4, 20, 0.62)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 360, borderRadius: 24,
    borderWidth: 3, borderColor: C.border, padding: 20, paddingTop: 44, alignItems: 'center',
  },
  badge: {
    position: 'absolute', top: -34, width: 68, height: 68, borderRadius: 34,
    borderWidth: 3, borderColor: C.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  center: { textAlign: 'center' },
  rays: { position: 'absolute', width: 900, height: 900, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 70, height: 900 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  body: { marginVertical: 14, gap: 6, alignItems: 'center' },
  amount: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { minWidth: 88 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  toast: {
    position: 'absolute', top: '40%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    gap: 4, borderRadius: 16, borderWidth: 2, borderColor: C.goldDark, overflow: 'hidden',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  transition: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ad: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  adClose: { position: 'absolute', top: 50, right: 20 },
  transitionInner: { alignItems: 'center', gap: 6, paddingHorizontal: 24 },
  hint: {
    position: 'absolute', left: 12, right: 12, bottom: 100, flexDirection: 'row', alignItems: 'center',
    gap: 10, borderRadius: 16, borderWidth: 2, borderColor: C.goldDark, overflow: 'hidden',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  hintText: { flex: 1 },
});
