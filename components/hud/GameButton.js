/** Glossy gradient button with a highlight strip and press animation. */

import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { C, GRAD } from './theme';

export default function GameButton({ grad = 'green', disabled, onPress, style, children, radius = 14, hitSlop }) {
  const colors = GRAD[disabled ? 'grey' : grad] ?? GRAD.green;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [styles.wrap, { borderRadius: radius }, pressed && !disabled && styles.pressed, style]}
    >
      <LinearGradient colors={colors} style={[StyleSheet.absoluteFill, { borderRadius: radius - 2 }]} />
      <View style={[styles.shine, { borderTopLeftRadius: radius - 3, borderTopRightRadius: radius - 3 }]} />
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2.5,
    borderColor: C.border,
    overflow: 'hidden',
    boxShadow: '0px 3px 4px rgba(0, 0, 0, 0.45)',
  },
  shine: {
    position: 'absolute', left: 3, right: 3, top: 2, height: '38%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  content: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  pressed: { transform: [{ scale: 0.94 }] },
});
