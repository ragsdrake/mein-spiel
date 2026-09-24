/** Big glossy menu buttons at the bottom, with red "something to do" dots. */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { ROOM_MAX_LEVEL, roomUnlockCost, roomUpgradeCost } from '../../game/config';
import { HOTELS, getHotel } from '../../game/hotels';
import { questDone } from '../../game/quests';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import GameButton from './GameButton';
import { C } from './theme';
import Txt from './Txt';

const BUTTONS = [
  { id: 'rooms',  label: 'Zimmer',   icon: 'bed-king',          grad: 'purple' },
  { id: 'ops',    label: 'Betrieb',  icon: 'bell-ring',         grad: 'teal' },
  { id: 'staff',  label: 'Personal', icon: 'account-group',     grad: 'orange' },
  { id: 'quests', label: 'Aufträge', icon: 'clipboard-check',   grad: 'blue' },
  { id: 'hotels', label: 'Hotels',   icon: 'map-marker-radius', grad: 'gold' },
];

export default function BottomBar() {
  const openSheet = useUi(s => s.openSheet);
  const canBuyRoom = useHotel(s => {
    const pm = getHotel(s.activeHotel).pm;
    const rooms = s.hotels[s.activeHotel].rooms;
    return rooms.some((lvl, i) => (lvl === 0
      ? (i === 0 || rooms[i - 1] > 0) && s.coins >= roomUnlockCost(i, pm)
      : lvl < ROOM_MAX_LEVEL && s.coins >= roomUpgradeCost(i, lvl, pm)));
  });
  const questReady = useHotel(s => s.quests.some(q => questDone(q, s.stats)));
  const hotelReady = useHotel(s => HOTELS.some(h => s.canUnlockHotel(h.id)));
  const dots = { rooms: canBuyRoom, quests: questReady, hotels: hotelReady };

  return (
    <View style={styles.bar} pointerEvents="box-none">
      {BUTTONS.map(b => (
        <View key={b.id}>
          <GameButton grad={b.grad} onPress={() => openSheet(b.id)} radius={18} style={styles.btn}>
            <Icon name={b.icon} size={28} color={C.white} />
            <Txt size={11} style={styles.label}>{b.label}</Txt>
          </GameButton>
          {dots[b.id] && <View style={styles.dot} pointerEvents="none" />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 10, paddingBottom: 6,
  },
  btn: { width: 64, height: 64 },
  label: { marginTop: -2 },
  dot: {
    position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.red, borderWidth: 2.5, borderColor: C.border,
  },
});
