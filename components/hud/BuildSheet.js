/**
 * Bottom sheet with every upgrade: crypts, bar & reception, staff,
 * guest types and the gem shop.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import {
  BAR_MAX_LEVEL, BAR_UNLOCK_COST, BOOST_COST_GEMS, BOOST_SECONDS, GUEST_TYPES, RECEPTION_MAX_LEVEL,
  ROOM_MAX_LEVEL, ROOM_NAMES, ROOM_UNLOCK_COST, STAFF, STAR_THRESHOLDS, autoCheckinSeconds,
  barStools, barUpgradeCost, drinkPrice, receptionUpgradeCost, roomPrice, roomUpgradeCost,
  spawnInterval, starsFor,
} from '../../game/config';
import { fmt } from '../../game/format';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import { C } from './theme';
import Txt from './Txt';

export const TABS = [
  { id: 'rooms',  label: 'Zimmer',   icon: 'coffin' },
  { id: 'bar',    label: 'Bar',      icon: 'glass-cocktail' },
  { id: 'staff',  label: 'Personal', icon: 'skull' },
  { id: 'guests', label: 'Gäste',    icon: 'ghost' },
  { id: 'boost',  label: 'Shop',     icon: 'diamond-stone' },
];

function BuyButton({ cost, gems, onPress, label, disabled }) {
  const coins = useHotel(s => s.coins);
  const have = useHotel(s => s.gems);
  const afford = gems ? have >= cost : coins >= cost;
  const off = disabled || !afford;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [styles.buy, off && styles.buyOff, pressed && styles.pressed]}
    >
      {label ? <Txt size={13}>{label}</Txt> : null}
      <View style={styles.buyCost}>
        <Icon name={gems ? 'diamond-stone' : 'circle-multiple'} size={15} color={gems ? C.purple : C.gold} />
        <Txt size={15}>{fmt(cost)}</Txt>
      </View>
    </Pressable>
  );
}

function Maxed() {
  return <View style={[styles.buy, styles.buyOff]}><Txt size={14}>MAX</Txt></View>;
}

function Row({ icon, iconColor = C.white, title, subtitle, highlight, right }) {
  return (
    <View style={[styles.row, highlight && styles.rowHighlight]}>
      <View style={styles.rowIcon}><Icon name={icon} size={28} color={iconColor} /></View>
      <View style={styles.rowText}>
        <Txt size={16}>{title}</Txt>
        {subtitle ? <Txt size={12} color={C.muted} style={styles.sub}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

function RoomsTab({ focus }) {
  const rooms = useHotel(s => s.rooms);
  const unlockRoom = useHotel(s => s.unlockRoom);
  const upgradeRoom = useHotel(s => s.upgradeRoom);
  return rooms.map((lvl, i) => {
    const locked = lvl === 0;
    const reachable = i === 0 || rooms[i - 1] > 0;
    let right;
    if (locked) right = <BuyButton cost={ROOM_UNLOCK_COST[i]} label="Öffnen" disabled={!reachable} onPress={() => unlockRoom(i)} />;
    else if (lvl >= ROOM_MAX_LEVEL) right = <Maxed />;
    else right = <BuyButton cost={roomUpgradeCost(i, lvl)} label="Ausbauen" onPress={() => upgradeRoom(i)} />;
    return (
      <Row
        key={i}
        icon={locked ? 'lock' : 'coffin'}
        iconColor={locked ? C.muted : '#d9a3ff'}
        highlight={focus === i}
        title={`${ROOM_NAMES[i]}${locked ? '' : `  · Stufe ${lvl}`}`}
        subtitle={locked
          ? (reachable ? 'Verstaubt – öffne sie für neue Gäste' : 'Öffne zuerst die vorherige Gruft')
          : `${fmt(roomPrice(lvl))} Münzen pro Übernachtung${lvl < ROOM_MAX_LEVEL ? ` → ${fmt(roomPrice(lvl + 1))}` : ''}`}
        right={right}
      />
    );
  });
}

function BarTab() {
  const barLevel = useHotel(s => s.barLevel);
  const receptionLevel = useHotel(s => s.receptionLevel);
  const upgradeBar = useHotel(s => s.upgradeBar);
  const upgradeReception = useHotel(s => s.upgradeReception);

  const barRight = barLevel >= BAR_MAX_LEVEL ? <Maxed /> : (
    <BuyButton
      cost={barLevel === 0 ? BAR_UNLOCK_COST : barUpgradeCost(barLevel)}
      label={barLevel === 0 ? 'Eröffnen' : 'Ausbauen'}
      onPress={upgradeBar}
    />
  );
  const recRight = receptionLevel >= RECEPTION_MAX_LEVEL ? <Maxed /> : (
    <BuyButton cost={receptionUpgradeCost(receptionLevel)} label="Ausbauen" onPress={upgradeReception} />
  );

  return (
    <>
      <Row
        icon="glass-cocktail"
        iconColor={C.green}
        title={`Nebeltee-Bar${barLevel ? `  · Stufe ${barLevel}` : ''}`}
        subtitle={barLevel === 0
          ? 'Ausgeschlafene Geister gönnen sich einen Drink'
          : `${fmt(drinkPrice(barLevel))} pro Drink · ${barStools(barLevel)} Hocker`}
        right={barRight}
      />
      <Row
        icon="bell-ring"
        iconColor={C.gold}
        title={`Rezeption  · Stufe ${receptionLevel}`}
        subtitle={`Neuer Gast alle ${spawnInterval(receptionLevel).toFixed(1)} s · Check-in ${autoCheckinSeconds(receptionLevel).toFixed(1)} s`}
        right={recRight}
      />
    </>
  );
}

function StaffTab() {
  const staff = useHotel(s => s.staff);
  const barLevel = useHotel(s => s.barLevel);
  const hire = useHotel(s => s.hire);
  return STAFF.map(s => {
    const blocked = s.needsBar && barLevel === 0;
    return (
      <Row
        key={s.id}
        icon={s.icon}
        iconColor={staff[s.id] ? C.green : C.white}
        title={s.name}
        subtitle={blocked ? 'Braucht zuerst die Nebeltee-Bar' : s.job}
        right={staff[s.id]
          ? <View style={[styles.buy, styles.hired]}><Txt size={14}>Im Dienst</Txt></View>
          : <BuyButton cost={s.cost} label="Einstellen" disabled={blocked} onPress={() => hire(s.id)} />}
      />
    );
  });
}

function GuestsTab() {
  const totalEarned = useHotel(s => s.totalEarned);
  const stars = starsFor(totalEarned);
  return GUEST_TYPES.map(t => {
    const unlocked = t.star <= stars;
    return (
      <Row
        key={t.id}
        icon={unlocked ? 'ghost' : 'lock'}
        iconColor={unlocked ? t.glow : C.muted}
        title={t.name}
        subtitle={unlocked
          ? `Zahlt ×${t.mult} – checkt jetzt bei dir ein`
          : `Ab ${t.star} ★ (${fmt(STAR_THRESHOLDS[t.star - 1])} Münzen verdient)`}
        right={<Txt size={15} color={unlocked ? C.gold : C.muted}>×{t.mult}</Txt>}
      />
    );
  });
}

function BoostTab() {
  const buyBoost = useHotel(s => s.buyBoost);
  const resetGame = useHotel(s => s.resetGame);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Row
        icon="timer-sand"
        iconColor={C.gold}
        title="Geisterstunde ×2"
        subtitle={`Doppelte Einnahmen für ${BOOST_SECONDS / 60} Minuten`}
        right={<BuyButton gems cost={BOOST_COST_GEMS} label="Starten" onPress={buyBoost} />}
      />
      <Row
        icon="diamond-stone"
        iconColor={C.purple}
        title="Kristalle verdienen"
        subtitle="Jeder neue Hotelstern bringt 15 Kristalle"
        right={null}
      />
      <Row
        icon="restart"
        iconColor={C.red}
        title="Spielstand zurücksetzen"
        subtitle={confirm ? 'Wirklich? Alles geht verloren!' : 'Neu anfangen mit leerem Hotel'}
        right={(
          <Pressable
            style={[styles.buy, { backgroundColor: confirm ? C.red : C.cardLight }]}
            onPress={() => { if (confirm) { resetGame(); setConfirm(false); } else setConfirm(true); }}
          >
            <Txt size={14}>{confirm ? 'Ja, löschen' : 'Zurücksetzen'}</Txt>
          </Pressable>
        )}
      />
    </>
  );
}

export default function BuildSheet() {
  const sheet = useUi(s => s.sheet);
  const focus = useUi(s => s.focusRoom);
  const openSheet = useUi(s => s.openSheet);
  const closeSheet = useUi(s => s.closeSheet);
  if (!sheet) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={closeSheet} />
      <Animated.View entering={SlideInDown.duration(220)} exiting={SlideOutDown.duration(180)} style={styles.sheet}>
        <View style={styles.tabs}>
          {TABS.map(t => (
            <Pressable key={t.id} onPress={() => openSheet(t.id)} style={[styles.tab, sheet === t.id && styles.tabOn]}>
              <Icon name={t.icon} size={20} color={sheet === t.id ? C.gold : C.muted} />
              <Txt size={12} color={sheet === t.id ? C.white : C.muted}>{t.label}</Txt>
            </Pressable>
          ))}
          <Pressable onPress={closeSheet} style={styles.close}>
            <Icon name="close" size={22} color={C.white} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {sheet === 'rooms' && <RoomsTab focus={focus} />}
          {sheet === 'bar' && <BarTab />}
          {sheet === 'staff' && <StaffTab />}
          {sheet === 'guests' && <GuestsTab />}
          {sheet === 'boost' && <BoostTab />}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 4, 20, 0.35)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '62%',
    backgroundColor: C.panelSolid, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderWidth: 3, borderColor: C.border, paddingBottom: 18,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 10, gap: 4, alignItems: 'center' },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 12, gap: 1,
  },
  tabOn: { backgroundColor: C.card },
  close: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.red,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.border,
  },
  list: { padding: 10, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 2, borderColor: C.border,
  },
  rowHighlight: { borderColor: C.gold },
  rowIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: C.cardLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1 },
  sub: { marginTop: 2 },
  buy: {
    minWidth: 92, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#3aa35c', borderRadius: 12, borderWidth: 2, borderColor: C.border,
  },
  buyOff: { backgroundColor: '#4a4468' },
  hired: { backgroundColor: '#2f6f8f' },
  buyCost: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pressed: { transform: [{ scale: 0.95 }] },
});
