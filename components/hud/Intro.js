/**
 * Launch splash: night sky, moon, a floating ghost, the logo letters
 * bouncing in one by one and a loading bar. Tapping skips it. When it fades
 * out it opens the intro gate, so the camera swoops in and the hotel builds
 * itself behind it.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeOut, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { intro, sceneReady } from '../../game/fx';
import { C } from './theme';
import Txt from './Txt';

const WORD_1 = 'SPUK';
const WORD_2 = 'HOTEL';
const DURATION = 2900;
const STARS = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, size: 2 + (i % 3),
}));

function Letter({ ch, i, color }) {
  return (
    <Animated.View entering={ZoomIn.delay(250 + i * 85).springify().damping(9)}>
      <Txt size={54} color={color} style={styles.letter}>{ch}</Txt>
    </Animated.View>
  );
}

export default function IntroSplash() {
  const [show, setShow] = useState(true);
  const float = useSharedValue(0);
  const bar = useSharedValue(0);
  const moon = useSharedValue(0.6);

  useEffect(() => {
    intro.hold = true;
    float.value = withRepeat(withSequence(
      withTiming(-12, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
    ), -1);
    bar.value = withDelay(300, withTiming(0.85, { duration: DURATION - 700, easing: Easing.out(Easing.cubic) }));
    moon.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.back(2)) });
    // leave once the minimum time is over AND the 3D scene is really drawing
    const started = Date.now();
    let closing = null;
    const poll = setInterval(() => {
      if (closing || Date.now() - started < DURATION - 400 || !sceneReady()) return;
      bar.value = withTiming(1, { duration: 350 });
      closing = setTimeout(finish, 420);
    }, 100);
    return () => { clearInterval(poll); clearTimeout(closing); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    intro.hold = false;
    setShow(false);
  };

  const ghostStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));
  const moonStyle = useAnimatedStyle(() => ({ transform: [{ scale: moon.value }] }));

  if (!show) return null;
  return (
    <Animated.View exiting={FadeOut.duration(550)} style={StyleSheet.absoluteFill}>
      <Pressable style={styles.root} onPress={finish}>
        <LinearGradient colors={['#1a1040', '#3a2a7a', '#6a4ab0']} style={StyleSheet.absoluteFill} />
        {STARS.map((s, i) => (
          <View key={i} style={[styles.star, { left: s.left, top: s.top, width: s.size, height: s.size }]} />
        ))}
        <Animated.View style={[styles.moon, moonStyle]} />

        <Animated.View entering={FadeIn.duration(500)} style={[styles.ghost, ghostStyle]}>
          <Icon name="ghost" size={96} color="#f4f0ff" />
        </Animated.View>

        <View style={styles.row}>
          {WORD_1.split('').map((ch, i) => <Letter key={i} ch={ch} i={i} color={C.gold} />)}
        </View>
        <View style={styles.row}>
          {WORD_2.split('').map((ch, i) => <Letter key={i} ch={ch} i={i + WORD_1.length} color="#ffffff" />)}
        </View>
        <Animated.View entering={FadeIn.delay(1100).duration(500)}>
          <Txt size={16} color="#e0d8f4" style={styles.center}>Das Idle-Hotel für Geister, Vampire & Co.</Txt>
        </Animated.View>

        <View style={styles.barWrap}>
          <Animated.View style={[styles.bar, barStyle]}>
            <LinearGradient colors={['#5fe07a', '#23964a']} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
        <Animated.View entering={FadeIn.delay(1500)}>
          <Txt size={13} color="#b8a8e8">Tippen zum Starten</Txt>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  star: { position: 'absolute', borderRadius: 3, backgroundColor: '#ffffff', opacity: 0.8 },
  moon: {
    position: 'absolute', top: '9%', right: '12%', width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#fff4c8', shadowColor: '#fff4c8', shadowOpacity: 0.8, shadowRadius: 30,
  },
  ghost: { marginBottom: 6 },
  row: { flexDirection: 'row', gap: 2 },
  letter: {
    textShadowColor: '#1a0f3a', textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 1,
    lineHeight: 62,
  },
  center: { textAlign: 'center', marginTop: 6 },
  barWrap: {
    marginTop: 30, width: 220, height: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2, borderColor: '#1a0f3a', overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: 6, overflow: 'hidden' },
});
