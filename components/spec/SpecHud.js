/**
 * Screen-space UI (overlay) for the engine-spec showcase: rounded panels,
 * bold sans-serif type, high-contrast green/orange buttons with white text.
 * All feedback is code-driven tweening: overshoot on press, elastic popup,
 * bouncing counters — no keyframe animation.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { FONT } from '../hud/theme';
import { rig } from './SpecScene';

const PANEL = 'rgba(24, 32, 70, 0.78)';

function T({ size = 16, color = '#fff', style, children }) {
  return <Text style={[styles.t, { fontSize: size, color }, style]}>{children}</Text>;
}

/** Button with overshoot "squash & bounce" tween on press. */
function TweenButton({ color, edge, onPress, children, style }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const press = () => {
    s.value = withSequence(withTiming(0.86, { duration: 70 }), withSpring(1, { damping: 4, stiffness: 320, mass: 0.6 }));
    onPress?.();
  };
  return (
    <Animated.View style={[anim, style]}>
      <Pressable onPress={press} style={[styles.btn, { backgroundColor: color, borderBottomColor: edge }]}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

/** Money counter: value tweens (ease-out) towards the target, icon bounces. */
function Money({ value }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const bump = useSharedValue(1);
  useEffect(() => {
    const start = Date.now();
    const a = from.current;
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 500);
      const e = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(a + (value - a) * e));
      if (t >= 1) { clearInterval(id); from.current = value; }
    }, 16);
    bump.value = withSequence(withTiming(1.25, { duration: 90 }), withSpring(1, { damping: 5, stiffness: 300 }));
    return () => clearInterval(id);
  }, [value, bump]);
  const iconAnim = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <Animated.View style={iconAnim}><Icon name="cash" size={28} color="#3fd06a" /></Animated.View>
        <T size={22}>{shown.toLocaleString('de-DE')}</T>
      </View>
      <View style={styles.row}>
        <Icon name="chart-line" size={18} color="#3fd06a" />
        <T size={15} color="#3fd06a">+1.250/s</T>
      </View>
    </View>
  );
}

/** "LEVEL UP" card: scales in with an elastic tween, content staggered with back-overshoot. */
function LevelUpPopup({ onClose }) {
  const s = useSharedValue(0);
  const star = useSharedValue(0);
  useEffect(() => {
    s.value = withTiming(1, { duration: 750, easing: Easing.elastic(1.3) });
    star.value = withDelay(250, withTiming(1, { duration: 450, easing: Easing.back(3) }));
  }, [s, star]);
  const card = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const starStyle = useAnimatedStyle(() => ({ transform: [{ scale: star.value }, { rotate: `${(1 - star.value) * 90}deg` }] }));
  return (
    <View style={styles.popupWrap} pointerEvents="box-none">
      <Animated.View style={[styles.popup, card]}>
        <Animated.View style={[styles.starBadge, starStyle]}>
          <Icon name="star" size={54} color="#ffc94a" />
        </Animated.View>
        <T size={30} color="#5b3fd6" style={styles.noShadow}>LEVEL UP!</T>
        <Text style={styles.popupText}>Gruft 2 ist jetzt Stufe 8</Text>
        <View style={styles.rewardRow}>
          <View style={styles.reward}><Icon name="cash" size={22} color="#28c26a" /><T size={18} color="#28c26a" style={styles.noShadow}>+25 %</T></View>
          <View style={styles.reward}><Icon name="diamond-stone" size={22} color="#ffb52a" /><T size={18} color="#f0a020" style={styles.noShadow}>+5</T></View>
        </View>
        <TweenButton color="#28c26a" edge="#1a8a48" onPress={onClose} style={styles.fullBtn}>
          <T size={20}>SUPER!</T>
        </TweenButton>
      </Animated.View>
    </View>
  );
}

export default function SpecHud({ popup: initialPopup }) {
  const [money, setMoney] = useState(128450);
  const [popup, setPopup] = useState(initialPopup);
  useEffect(() => {
    const id = setInterval(() => setMoney(m => m + 1250), 1000);
    return () => clearInterval(id);
  }, []);

  // pan on X/Z by dragging, zoom = orthographic size (wheel / buttons)
  const last = useRef({ dx: 0, dy: 0 });
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
    onPanResponderGrant: () => { last.current = { dx: 0, dy: 0 }; },
    onPanResponderMove: (_, g) => {
      const k = (rig.size * 2) / 800;                       // world units per pixel (approx.)
      const dx = (g.dx - last.current.dx) * k;
      const dy = (g.dy - last.current.dy) * k / 0.577;
      rig.x += -dx * Math.SQRT1_2 - dy * Math.SQRT1_2;
      rig.z += dx * Math.SQRT1_2 - dy * Math.SQRT1_2;
      last.current = { dx: g.dx, dy: g.dy };
    },
  })).current;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />
      <View style={styles.top} pointerEvents="box-none">
        <Money value={money} />
        <View style={[styles.panel, styles.row]}>
          <Icon name="diamond-stone" size={22} color="#ffb52a" />
          <T size={20}>320</T>
          <View style={styles.plus}><Icon name="plus" size={16} color="#fff" /></View>
        </View>
      </View>
      <View style={styles.zoomCol} pointerEvents="box-none">
        <TweenButton color="#ffffff" edge="#c8d0e4" onPress={() => { rig.size = Math.max(3.5, rig.size - 1); }}>
          <Icon name="magnify-plus" size={24} color="#2f6fe0" />
        </TweenButton>
        <TweenButton color="#ffffff" edge="#c8d0e4" onPress={() => { rig.size = Math.min(12, rig.size + 1); }}>
          <Icon name="magnify-minus" size={24} color="#2f6fe0" />
        </TweenButton>
      </View>
      <View style={styles.bottom} pointerEvents="box-none">
        <TweenButton color="#ff8a1f" edge="#c8600a" onPress={() => setPopup(true)} style={styles.flex}>
          <View style={styles.row}><Icon name="movie-open-play" size={24} color="#fff" /><T size={20}>×2 BOOST</T></View>
        </TweenButton>
        <TweenButton color="#28c26a" edge="#1a8a48" onPress={() => setPopup(true)} style={styles.flex}>
          <View style={styles.row}><Icon name="arrow-up-bold" size={24} color="#fff" /><T size={20}>UPGRADE</T></View>
        </TweenButton>
      </View>
      {popup && <LevelUpPopup onClose={() => setPopup(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  t: { fontFamily: FONT, color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1 },
  noShadow: { textShadowColor: 'transparent' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  top: { position: 'absolute', top: 14, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  panel: { backgroundColor: PANEL, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, gap: 2 },
  plus: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: '#ff8a1f', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 3, borderBottomColor: '#c8600a',
  },
  zoomCol: { position: 'absolute', right: 10, top: 110, gap: 10 },
  bottom: { position: 'absolute', left: 12, right: 12, bottom: 18, flexDirection: 'row', gap: 12 },
  btn: {
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 6,
  },
  popupWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10, 14, 40, 0.45)' },
  popup: {
    width: 290, backgroundColor: '#ffffff', borderRadius: 26, alignItems: 'center', paddingTop: 50,
    paddingBottom: 18, paddingHorizontal: 18, gap: 8,
  },
  starBadge: {
    position: 'absolute', top: -42, width: 86, height: 86, borderRadius: 43, backgroundColor: '#5b3fd6',
    alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: '#ffffff',
  },
  popupText: { fontSize: 15, color: '#6a6680', fontWeight: '700' },
  rewardRow: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f2f0fa', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  fullBtn: { alignSelf: 'stretch' },
});
