/**
 * components/ui/TapButton.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The manual "tap to generate" button. Hexagonal shape, ripple animation,
 * +1 energy float-up feedback.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Colors, Font } from '../../constants/theme';

const HEX_SIZE = 68;

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * (Math.PI / 180);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

export default function TapButton({ onPress, color = Colors.cyan }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const ripple  = useRef(new Animated.Value(0)).current;
  const [floats, setFloats] = useState([]);

  const handlePress = () => {
    // scale bounce
    Animated.sequence([
      Animated.timing(scale,  { toValue: 0.9,  duration: 80,  useNativeDriver: true }),
      Animated.timing(scale,  { toValue: 1.04, duration: 80,  useNativeDriver: true }),
      Animated.timing(scale,  { toValue: 1,    duration: 60,  useNativeDriver: true }),
    ]).start();

    // ripple
    ripple.setValue(0);
    Animated.timing(ripple, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    // float-up text
    const id = Date.now();
    const floatY = new Animated.Value(0);
    const floatO = new Animated.Value(1);
    setFloats(prev => [...prev, { id, floatY, floatO }]);
    Animated.parallel([
      Animated.timing(floatY, { toValue: -50, duration: 700, useNativeDriver: true }),
      Animated.timing(floatO, { toValue: 0,   duration: 700, useNativeDriver: true }),
    ]).start(() => setFloats(prev => prev.filter(f => f.id !== id)));

    onPress?.();
  };

  const rippleScale   = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const cx = HEX_SIZE;
  const cy = HEX_SIZE;

  return (
    <View style={styles.wrapper}>
      {/* float-up +1 labels */}
      {floats.map(f => (
        <Animated.Text
          key={f.id}
          style={[
            styles.floatLabel,
            { color, transform: [{ translateY: f.floatY }], opacity: f.floatO },
          ]}
        >
          +1
        </Animated.Text>
      ))}

      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.hitArea}>
          {/* ripple */}
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity:   rippleOpacity,
                transform: [{ scale: rippleScale }],
                borderColor: color,
              },
            ]}
          />

          {/* hex button */}
          <Animated.View style={{ transform: [{ scale }] }}>
            <Svg
              width={HEX_SIZE * 2}
              height={HEX_SIZE * 2}
              viewBox={`0 0 ${HEX_SIZE * 2} ${HEX_SIZE * 2}`}
            >
              {/* outer glow hex */}
              <Polygon
                points={hexPoints(cx, cy, HEX_SIZE * 0.95)}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0.25}
              />
              {/* bg hex */}
              <Polygon
                points={hexPoints(cx, cy, HEX_SIZE * 0.78)}
                fill={Colors.surface}
                stroke={color}
                strokeWidth={1.5}
                opacity={0.95}
              />
              {/* inner hex fill */}
              <Polygon
                points={hexPoints(cx, cy, HEX_SIZE * 0.62)}
                fill={Colors.cyanDeep}
                opacity={0.7}
              />
            </Svg>

            {/* label overlay */}
            <View style={styles.labelOverlay}>
              <Text style={[styles.labelMain, { color }]}>TAP</Text>
              <Text style={styles.labelSub}>+1 ENERGY</Text>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  hitArea: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  ripple: {
    position:     'absolute',
    width:        HEX_SIZE * 2,
    height:       HEX_SIZE * 2,
    borderRadius: HEX_SIZE,
    borderWidth:  2,
  },
  labelOverlay: {
    position:       'absolute',
    top:            0,
    left:           0,
    right:          0,
    bottom:         0,
    alignItems:     'center',
    justifyContent: 'center',
  },
  labelMain: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.lg,
    fontWeight:    'bold',
    letterSpacing: 4,
  },
  labelSub: {
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.xs,
    color:         Colors.textSecond,
    letterSpacing: 2,
    marginTop:     2,
  },
  floatLabel: {
    position:      'absolute',
    top:           -10,
    fontFamily:    Font.mono,
    fontSize:      Font.sizes.lg,
    fontWeight:    'bold',
    letterSpacing: 2,
    zIndex:        99,
  },
});
