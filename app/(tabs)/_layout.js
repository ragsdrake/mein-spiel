/**
 * app/(tabs)/_layout.js
 * Two-tab navigator: main game command screen + world selection map.
 */

import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Colors, Font } from '../../constants/theme';

// Minimal text-icon tab indicator — no icon library dependency
function TabIcon({ label, focused, color }) {
  return (
    <Text style={[styles.tabIcon, { color, opacity: focused ? 1 : 0.4 }]}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:            false,
        tabBarStyle:            styles.tabBar,
        tabBarActiveTintColor:  Colors.cyan,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle:       styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:       'COMMAND',
          tabBarIcon:  ({ color, focused }) =>
            <TabIcon label="⬡" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="worlds"
        options={{
          title:       'WORLDS',
          tabBarIcon:  ({ color, focused }) =>
            <TabIcon label="◎" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:  '#080d0b',
    borderTopWidth:   1,
    borderTopColor:   '#0d2e20',
    paddingBottom:    4,
    height:           52,
  },
  tabLabel: {
    fontFamily:    Font.mono,
    fontSize:      9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tabIcon: {
    fontSize: 18,
  },
});
