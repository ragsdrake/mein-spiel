/**
 * components/ui/StoryIntro.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen narrative overlay in the pixel-art look: dark backdrop, a
 * PixelPanel dialog box with speaker label + paged story text, and a
 * blinking "WEITER ▸" prompt. Last page shows "MISSION STARTEN".
 *
 * Props:
 *   intro    – { title, pages: [{ speaker, text }] }
 *   accent   – accent color (world theme)
 *   onDone   – called after the last page is confirmed
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Font, Space } from '../../constants/theme';
import PixelPanel from './PixelPanel';

export default function StoryIntro({ intro, accent = Colors.cyan, onDone }) {
  const [pageIndex, setPageIndex] = useState(0);
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  if (!intro) return null;

  const page   = intro.pages[pageIndex];
  const isLast = pageIndex === intro.pages.length - 1;

  const handleNext = () => {
    if (isLast) onDone?.();
    else setPageIndex(i => i + 1);
  };

  return (
    <View style={styles.backdrop}>
      <Text style={[styles.title, { color: accent }]}>{intro.title}</Text>

      <PixelPanel accentColor={accent} style={styles.panel}>
        <Text style={[styles.speaker, { color: accent }]}>{page.speaker}</Text>
        <Text style={styles.text}>{page.text}</Text>

        {/* page dots */}
        <View style={styles.dots}>
          {intro.pages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === pageIndex ? accent : Colors.gridLine },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.75}>
          <Animated.Text style={[styles.next, { color: accent, opacity: blink }]}>
            {isLast ? '▸ MISSION STARTEN' : 'WEITER ▸'}
          </Animated.Text>
        </TouchableOpacity>
      </PixelPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#030508f2',
    justifyContent:  'center',
    zIndex:          100,
  },
  title: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xl,
    fontWeight:    'bold',
    letterSpacing: 6,
    textAlign:     'center',
    marginBottom:  Space.lg,
  },
  panel: {
    marginHorizontal: Space.lg,
  },
  speaker: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    letterSpacing: 2,
    marginBottom:  Space.sm,
  },
  text: {
    fontFamily:   Font.mono,
    fontSize:     Font.sizes.sm,
    color:        Colors.textPrimary,
    lineHeight:   22,
    marginBottom: Space.md,
  },
  dots: {
    flexDirection:  'row',
    justifyContent: 'center',
    marginBottom:   Space.md,
  },
  dot: {
    width:            6,
    height:           6,
    marginHorizontal: 3,
  },
  next: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.sm,
    fontWeight:    'bold',
    letterSpacing: 3,
    textAlign:     'center',
  },
});
