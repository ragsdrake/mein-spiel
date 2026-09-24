/**
 * Modal moments: offline earnings, star-ups, end-of-night summary and the
 * first-launch tutorial hint.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { GEMS_PER_STAR, GUEST_TYPES } from '../../game/config';
import { fmt, fmtDuration } from '../../game/format';
import { dismissNightSummary, useSim } from '../../game/sim';
import useHotel from '../../game/store';
import { C } from './theme';
import Txt from './Txt';

function Dialog({ icon, iconColor, title, children, actions }) {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
      <Animated.View entering={ZoomIn.springify()} style={styles.card}>
        <View style={styles.badge}><Icon name={icon} size={42} color={iconColor} /></View>
        <Txt size={24} style={styles.center}>{title}</Txt>
        <View style={styles.body}>{children}</View>
        <View style={styles.actions}>{actions}</View>
      </Animated.View>
    </Animated.View>
  );
}

function Btn({ label, icon, color = '#3aa35c', onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, { backgroundColor: disabled ? '#4a4468' : color }, pressed && styles.pressed]}
    >
      {icon ? <Icon name={icon} size={18} color={C.white} /> : null}
      <Txt size={16}>{label}</Txt>
    </Pressable>
  );
}

export function OfflinePopup() {
  const offline = useHotel(s => s.offline);
  const gems = useHotel(s => s.gems);
  const collect = useHotel(s => s.collectOffline);
  if (!offline) return null;
  return (
    <Dialog
      icon="weather-night"
      iconColor={C.gold}
      title="Willkommen zurück!"
      actions={(
        <>
          <Btn label="Einsammeln" onPress={() => collect(false)} />
          <Btn label="×2 für 5" icon="diamond-stone" color="#7a45c9" disabled={gems < 5} onPress={() => collect(true)} />
        </>
      )}
    >
      <Txt size={15} color={C.muted} style={styles.center}>
        Deine Geister haben {fmtDuration(offline.seconds)} lang weiter gespukt und bezahlt:
      </Txt>
      <View style={styles.amount}>
        <Icon name="circle-multiple" size={28} color={C.gold} />
        <Txt size={30} color={C.gold}>{fmt(offline.amount)}</Txt>
      </View>
    </Dialog>
  );
}

export function StarUpPopup() {
  const starUp = useHotel(s => s.starUp);
  const dismiss = useHotel(s => s.dismissStarUp);
  if (!starUp) return null;
  const guest = GUEST_TYPES.find(t => t.star === starUp.stars);
  return (
    <Dialog
      icon="star"
      iconColor={C.gold}
      title={`${starUp.stars} ★ Spukhotel!`}
      actions={<Btn label="Juhu!" onPress={dismiss} />}
    >
      <Txt size={15} color={C.muted} style={styles.center}>
        Dein Hotel spricht sich im Jenseits herum.
      </Txt>
      {guest && (
        <Txt size={17} style={styles.center}>Neue Gäste: {guest.name} (zahlt ×{guest.mult})</Txt>
      )}
      <View style={styles.amount}>
        <Icon name="diamond-stone" size={24} color={C.purple} />
        <Txt size={22} color={C.purple}>+{GEMS_PER_STAR}</Txt>
      </View>
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
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.toast} pointerEvents="none">
      <Icon name="weather-sunset-up" size={22} color={C.gold} />
      <Txt size={16}>Die Nacht ist vorbei! Bilanz: </Txt>
      <Txt size={16} color={C.green}>+{fmt(summary.amount)}</Txt>
    </Animated.View>
  );
}

export function TutorialHint() {
  const seen = useHotel(s => s.seenTutorial);
  const finish = useHotel(s => s.finishTutorial);
  const totalEarned = useHotel(s => s.totalEarned);
  useEffect(() => {
    if (!seen && totalEarned >= 60) finish();
  }, [seen, totalEarned, finish]);
  if (seen) return null;
  return (
    <Animated.View entering={FadeIn.delay(800)} exiting={FadeOut} style={styles.hint}>
      <Icon name="gesture-tap" size={26} color={C.gold} />
      <View style={styles.hintText}>
        <Txt size={15}>Tippe auf Geister mit <Txt size={15} color={C.red}>!</Txt> zum Einchecken</Txt>
        <Txt size={13} color={C.muted}>Grünen Schleim antippen zum Putzen · Ziehen zum Umsehen</Txt>
      </View>
      <Pressable onPress={finish} hitSlop={12}><Icon name="close" size={20} color={C.muted} /></Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 4, 20, 0.6)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: C.panelSolid, borderRadius: 24,
    borderWidth: 3, borderColor: C.border, padding: 20, paddingTop: 44, alignItems: 'center',
  },
  badge: {
    position: 'absolute', top: -34, width: 68, height: 68, borderRadius: 34,
    backgroundColor: C.card, borderWidth: 3, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  body: { marginVertical: 14, gap: 8, alignItems: 'center' },
  amount: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, borderWidth: 2, borderColor: C.border,
  },
  pressed: { transform: [{ scale: 0.95 }] },
  toast: {
    position: 'absolute', top: '40%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    gap: 4, backgroundColor: C.panel, borderRadius: 16, borderWidth: 2, borderColor: C.goldDark,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  hint: {
    position: 'absolute', left: 12, right: 12, bottom: 96, flexDirection: 'row', alignItems: 'center',
    gap: 10, backgroundColor: C.panel, borderRadius: 16, borderWidth: 2, borderColor: C.goldDark,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  hintText: { flex: 1 },
});
