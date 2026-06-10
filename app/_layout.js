/**
 * app/_layout.js
 * Root layout — starts the game loop, sets dark background,
 * and configures the Stack navigator.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import useGameLoop from '../hooks/useGameLoop';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  useGameLoop();   // start the 1-second resource tick

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor={Colors.void} />
      <Stack
        screenOptions={{
          headerShown:      false,
          contentStyle:     { backgroundColor: Colors.bg },
          animation:        'fade',
        }}
      >
        <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
        <Stack.Screen name="world/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.void,
  },
});
