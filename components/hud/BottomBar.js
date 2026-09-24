/** Round menu buttons at the bottom, like the reference game's icon row. */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { ROOM_MAX_LEVEL, ROOM_UNLOCK_COST, roomUpgradeCost } from '../../game/config';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import { TABS } from './BuildSheet';
import { C } from './theme';
import Txt from './Txt';

const COLORS = {
  rooms:  '#7a3fb0',
  bar:    '#2f8f5f',
  staff:  '#b0603f',
  guests: '#3f6fb0',
  boost:  '#b08a2f',
};

export default function BottomBar() {
  const openSheet = useUi(s => s.openSheet);
  // red dot when a crypt can be opened or upgraded right now
  const canBuyRoom = useHotel(s => s.rooms.some((lvl, i) => (lvl === 0
    ? (i === 0 || s.rooms[i - 1] > 0) && s.coins >= ROOM_UNLOCK_COST[i]
    : lvl < ROOM_MAX_LEVEL && s.coins >= roomUpgradeCost(i, lvl))));
  const boosted = useHotel(s => s.boostUntil > Date.now());

  return (
    <View style={styles.bar} pointerEvents="box-none">
      {TABS.map(t => (
        <Pressable
          key={t.id}
          onPress={() => openSheet(t.id)}
          style={({ pressed }) => [styles.btn, { backgroundColor: COLORS[t.id] }, pressed && styles.pressed]}
        >
          <Icon name={t.id === 'boost' && boosted ? 'timer-sand' : t.icon} size={28} color={C.white} />
          <Txt size={11} style={styles.label}>{t.label}</Txt>
          {t.id === 'rooms' && canBuyRoom && <View style={styles.dot} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 10, paddingBottom: 6,
  },
  btn: {
    width: 62, height: 62, borderRadius: 18, borderWidth: 3, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { marginTop: -2 },
  pressed: { transform: [{ scale: 0.92 }] },
  dot: {
    position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.red, borderWidth: 2, borderColor: C.border,
  },
});
