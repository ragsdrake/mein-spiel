/**
 * Tycoon-style bottom buttons (Codigames layout): yellow shop and the
 * rewarded-video ×2 button on the left, square beige management buttons on
 * the right. Red dots show that something can be done.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ROOM_MAX_LEVEL, roomUnlockCost, roomUpgradeCost } from '../../game/config';
import { getHotel } from '../../game/hotels';
import { showRewardedAd } from '../../game/ads';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import { FONT } from './theme';

function Square({ icon, label, color = '#6a4a2a', bg = '#f3e3c3', edge = '#cdb285', onPress, dot, size = 58 }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.square, { width: size, height: size, backgroundColor: bg, borderBottomColor: edge }, pressed && styles.pressed,
    ]}>
      <Icon name={icon} size={size * 0.5} color={color} />
      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export default function BottomBar() {
  const openSheet = useUi(s => s.openSheet);
  const adBoost = useHotel(s => s.adBoost);
  const canBuyRoom = useHotel(s => {
    const pm = getHotel(s.activeHotel).pm;
    const rooms = s.hotels[s.activeHotel].rooms;
    return rooms.some((lvl, i) => (lvl === 0
      ? (i === 0 || rooms[i - 1] > 0) && s.coins >= roomUnlockCost(i, pm)
      : lvl < ROOM_MAX_LEVEL && s.coins >= roomUpgradeCost(i, lvl, pm)));
  });

  const watchAd = async () => {
    if (await showRewardedAd('boost')) adBoost();
  };

  return (
    <View style={styles.bar} pointerEvents="box-none">
      <View style={styles.group} pointerEvents="box-none">
        <Square icon="cart" bg="#ffcc2e" edge="#d09a10" color="#7a4a00" onPress={() => openSheet('shop')} />
        <Pressable onPress={watchAd} style={({ pressed }) => [styles.adWrap, pressed && styles.pressed]}>
          <View style={[styles.square, styles.adBtn]}>
            <Icon name="movie-open-play" size={28} color="#6a4a2a" />
          </View>
          <View style={styles.adPill}>
            <Icon name="cash" size={16} color="#3fd06a" />
            <Text style={styles.adText}>×2</Text>
          </View>
        </Pressable>
      </View>
      <View style={styles.group} pointerEvents="box-none">
        <Square icon="bed-king" label="Zimmer" onPress={() => openSheet('rooms')} dot={canBuyRoom} />
        <Square icon="storefront" label="Betrieb" onPress={() => openSheet('ops')} />
        <Square icon="account-tie" label="Personal" onPress={() => openSheet('staff')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingBottom: 8,
  },
  group: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  square: {
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5,
  },
  label: { fontFamily: FONT, fontSize: 10, marginTop: -3 },
  pressed: { transform: [{ scale: 0.93 }] },
  dot: {
    position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#ff3b4a', borderWidth: 2.5, borderColor: '#fff',
  },
  adWrap: { flexDirection: 'row', alignItems: 'center' },
  adBtn: { width: 58, height: 58, backgroundColor: '#f3e3c3', borderBottomColor: '#cdb285' },
  adPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: -4, backgroundColor: 'rgba(20, 28, 60, 0.78)',
    borderTopRightRadius: 8, borderBottomRightRadius: 8, paddingHorizontal: 7, paddingVertical: 4,
  },
  adText: { fontFamily: FONT, fontSize: 16, color: '#fff' },
});
