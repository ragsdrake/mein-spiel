/**
 * White upgrade card for one station (room, bar or reception) in the
 * Codigames style: level badge, purple title, green/blue stat bars, big
 * purple "VERBESSERN" button with ×1 / ×10 / MAX, milestone track and the
 * matching staff row. Opens when a station is tapped in the 3D view.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BAR_MAX_LEVEL, RECEPTION_MAX_LEVEL, ROOM_MAX_LEVEL, STAFF_HIRE_COST, STAFF_MAX_LEVEL, STAY_SECONDS,
  barStools, barUpgradeCost, drinkPrice, receptionUpgradeCost, roomPrice, roomUnlockCost, roomUpgradeCost,
  spawnInterval, staffUpgradeCost,
} from '../../game/config';
import { fmt } from '../../game/format';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import { FONT } from './theme';

const PURPLE = '#5b3fd6';
const PURPLE_DARK = '#3f2aa8';
const GREEN = '#28c26a';
const BLUE = '#2f7bf0';

const MILESTONES = [2, 4, 6, 8, 10];
const MILESTONE_ICON = {
  room: ['image-frame', 'wardrobe', 'candelabra', 'flower', 'chandelier'],
  bar: ['bottle-wine', 'glass-cocktail', 'candelabra', 'account-multiple-plus', 'star'],
  reception: ['bell', 'speedometer', 'speedometer', 'speedometer-medium', 'rocket-launch'],
};

/** Everything the card needs for one station kind. */
function useStation(target) {
  const def = useHotel(s => s.activeDef());
  const h = useHotel(s => s.hotels[s.activeHotel]);
  const bonusRooms = useHotel(s => s.bonus('rooms'));
  const store = useHotel.getState();
  const pm = def.pm;

  if (target.kind === 'room') {
    const i = target.index;
    const lvl = h.rooms[i];
    return {
      title: def.rooms[i], icon: 'bed-king', color: '#b04ac8',
      text: 'Gemütliches Zimmer für müde Gäste. Jede Stufe erhöht den Preis pro Nacht.',
      level: lvl, max: ROOM_MAX_LEVEL, locked: lvl === 0,
      unlockCost: roomUnlockCost(i, pm), canUnlock: i === 0 || h.rooms[i - 1] > 0,
      cost: (l) => roomUpgradeCost(i, l, pm),
      statA: ['PREIS PRO NACHT', (l) => fmt(roomPrice(l, pm) * (1 + bonusRooms))],
      statB: ['GÄSTE PRO MINUTE', () => `${(60 / (STAY_SECONDS + 7)).toFixed(1)}/min`],
      unlock: () => store.unlockRoom(i),
      upgrade: () => store.upgradeRoom(i),
      staffRole: 'cleaner',
      milestones: MILESTONE_ICON.room,
    };
  }
  if (target.kind === 'bar') {
    const lvl = h.barLevel;
    return {
      title: def.bar.name, icon: def.bar.icon, color: GREEN,
      text: `Ausgeschlafene Gäste gönnen sich hier ${def.bar.drink}.`,
      level: lvl, max: BAR_MAX_LEVEL, locked: lvl === 0,
      unlockCost: barUpgradeCost(0, pm), canUnlock: true,
      cost: (l) => barUpgradeCost(l, pm),
      statA: [`PREIS PRO ${def.bar.drink.toUpperCase()}`, (l) => fmt(drinkPrice(Math.max(1, l), pm))],
      statB: ['HOCKER', (l) => `${barStools(Math.max(1, l))}`],
      unlock: () => store.upgradeBar(),
      upgrade: () => store.upgradeBar(),
      staffRole: 'bar',
      milestones: MILESTONE_ICON.bar,
    };
  }
  const lvl = h.receptionLevel;
  return {
    title: 'Rezeption', icon: 'bell-ring', color: '#f0a020',
    text: 'Hier checken die Gäste ein. Ausbauen bringt schneller neue Gäste.',
    level: lvl, max: RECEPTION_MAX_LEVEL, locked: false,
    cost: (l) => receptionUpgradeCost(l, pm),
    statA: ['NEUER GAST ALLE', (l) => `${spawnInterval(l).toFixed(1)} s`],
    statB: ['GÄSTE PRO MINUTE', (l) => `${(60 / spawnInterval(l)).toFixed(1)}/min`],
    upgrade: () => store.upgradeReception(),
    staffRole: 'reception',
    milestones: MILESTONE_ICON.reception,
  };
}

function Bar({ label, value, color, icon }) {
  return (
    <View style={[styles.bar, { backgroundColor: color }]}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barValue}>
        {icon ? <Icon name={icon} size={16} color="#fff" /> : null}
        <Text style={styles.barText}>{value}</Text>
      </View>
    </View>
  );
}

export default function UpgradeCard() {
  const target = useUi(s => s.target);
  if (!target) return null;
  return <Card target={target} />;
}

function Card({ target }) {
  const closeSheet = useUi(s => s.closeSheet);
  const coins = useHotel(s => s.coins);
  const def = useHotel(s => s.activeDef());
  const staffLvl = useHotel(s => s.hotels[s.activeHotel].staff);
  const barOpen = useHotel(s => s.hotels[s.activeHotel].barLevel > 0);
  const upgradeStaff = useHotel(s => s.upgradeStaff);
  const [mult, setMult] = useState(1);
  const st = useStation(target);

  // how many levels (and at what cost) the chosen multiplier buys right now
  let n = 0;
  let total = 0;
  const want = mult === 'max' ? 99 : mult;
  while (n < want && st.level + n < st.max) {
    const c = st.cost(st.level + n);
    if (mult === 'max' && total + c > coins) break;
    total += c;
    n++;
  }
  if (mult === 'max' && n === 0 && st.level < st.max) { n = 1; total = st.cost(st.level); }
  const nextLevel = Math.min(st.max, st.level + Math.max(1, n));
  const canBuy = n > 0 && coins >= total;

  const buy = () => {
    for (let k = 0; k < n; k++) if (!st.upgrade()) break;
  };

  const role = st.staffRole;
  const staff = def.staff[role];
  const sLvl = staffLvl[role] ?? 0;
  const staffBlocked = role === 'bar' && !barOpen;
  const staffCost = sLvl === 0 ? STAFF_HIRE_COST[role] * def.pm : staffUpgradeCost(role, sLvl, def.pm);

  return (
    <View style={styles.card}>
      <Pressable onPress={closeSheet} style={styles.close} hitSlop={10}>
        <Icon name="close" size={20} color="#fff" />
      </Pressable>

      <View style={styles.head}>
        <View style={styles.levelCol}>
          <Text style={styles.levelLabel}>LEVEL</Text>
          <View style={styles.levelPill}><Text style={styles.levelText}>{st.level}</Text></View>
          <View style={[styles.iconBox, { backgroundColor: st.color }]}>
            <Icon name={st.icon} size={40} color="#fff" />
          </View>
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{st.title.toUpperCase()}</Text>
          <Text style={styles.desc}>{st.text}</Text>
          <View style={styles.row}>
            <Text style={styles.key}>{st.statA[0]}</Text>
            <Icon name="cash" size={16} color={GREEN} />
            <Text style={styles.val}>{st.statA[1](st.level)}</Text>
          </View>
          {!st.locked && st.level < st.max && (
            <View style={styles.row}>
              <Text style={styles.key}>NÄCHSTE STUFE</Text>
              <Text style={[styles.val, { color: GREEN }]}>{st.statA[1](nextLevel)}</Text>
            </View>
          )}
        </View>
      </View>

      <Bar label={st.statA[0]} value={st.statA[1](st.level)} color={GREEN} icon="cash" />
      <Bar label={st.statB[0]} value={st.statB[1](st.level)} color={BLUE} icon="account-group" />

      {st.locked ? (
        <Pressable
          disabled={!st.canUnlock || coins < st.unlockCost}
          onPress={st.unlock}
          style={({ pressed }) => [styles.buyBtn, (!st.canUnlock || coins < st.unlockCost) && styles.buyOff, pressed && styles.pressed]}
        >
          <Text style={styles.buyText}>{st.canUnlock ? 'FREISCHALTEN' : 'ERST VORHERIGES ZIMMER'}</Text>
          <View style={styles.buyPrice}><Icon name="cash" size={18} color="#9bffb8" /><Text style={styles.buyPriceText}>{fmt(st.unlockCost)}</Text></View>
        </Pressable>
      ) : st.level >= st.max ? (
        <View style={[styles.buyBtn, styles.maxBtn]}><Text style={styles.buyText}>MAXIMALE STUFE</Text></View>
      ) : (
        <View style={styles.buyRow}>
          <View style={styles.multCol}>
            {[1, 10, 'max'].map(v => (
              <Pressable key={v} onPress={() => setMult(v)} style={[styles.mult, mult === v && styles.multOn]}>
                <Text style={[styles.multText, mult === v && styles.multTextOn]}>{v === 'max' ? 'MAX' : `×${v}`}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            disabled={!canBuy}
            onPress={buy}
            style={({ pressed }) => [styles.buyBtn, styles.flex, !canBuy && styles.buyOff, pressed && styles.pressed]}
          >
            <Text style={styles.buyText}>VERBESSERN {n > 1 ? `×${n}` : ''}</Text>
            <View style={styles.buyPrice}><Icon name="cash" size={18} color="#9bffb8" /><Text style={styles.buyPriceText}>{fmt(total)}</Text></View>
          </Pressable>
        </View>
      )}

      <Text style={styles.section}>MEILENSTEINE</Text>
      <View style={styles.track}>
        <View style={styles.trackLine} />
        {MILESTONES.map((lv, k) => {
          const done = st.level >= lv;
          return (
            <View key={lv} style={styles.stone}>
              <Text style={styles.stoneLv}>{lv}</Text>
              <View style={[styles.stoneDot, done && { borderColor: PURPLE, backgroundColor: '#efeaff' }]}>
                <Icon name={st.milestones[k]} size={20} color={done ? PURPLE : '#b8b4c8'} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.staffRow}>
        <View style={[styles.staffIcon, { backgroundColor: sLvl ? GREEN : '#c8c4d8' }]}>
          <Icon name={staff.icon} size={24} color="#fff" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.staffTitle}>{sLvl ? `${staff.name.toUpperCase()} · ST. ${sLvl}` : 'MITARBEITER EINSTELLEN'}</Text>
          <Text style={styles.staffSub}>{staffBlocked ? `Braucht zuerst die ${def.bar.name}` : staff.job}</Text>
        </View>
        {sLvl < STAFF_MAX_LEVEL ? (
          <Pressable
            disabled={staffBlocked || coins < staffCost}
            onPress={() => upgradeStaff(role)}
            style={({ pressed }) => [styles.staffBtn, (staffBlocked || coins < staffCost) && styles.buyOff, pressed && styles.pressed]}
          >
            <Icon name="cash" size={16} color="#9bffb8" />
            <Text style={styles.staffBtnText}>{fmt(staffCost)}</Text>
          </Pressable>
        ) : <Text style={styles.staffMax}>MAX</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff', borderRadius: 22, padding: 14, gap: 8,
    borderWidth: 3, borderColor: '#d8d4e8',
  },
  close: {
    position: 'absolute', right: 10, top: 10, width: 34, height: 34, borderRadius: 17, zIndex: 2,
    backgroundColor: '#ff5a6a', alignItems: 'center', justifyContent: 'center',
  },
  head: { flexDirection: 'row', gap: 12 },
  levelCol: { alignItems: 'center', gap: 2 },
  levelLabel: { fontFamily: FONT, fontSize: 12, color: PURPLE },
  levelPill: { backgroundColor: PURPLE_DARK, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 1 },
  levelText: { fontFamily: FONT, fontSize: 20, color: '#fff' },
  iconBox: { width: 70, height: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  headText: { flex: 1, paddingRight: 30, gap: 3 },
  title: { fontFamily: FONT, fontSize: 24, color: PURPLE },
  desc: { fontSize: 12, color: '#6a6680' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  key: { fontFamily: FONT, fontSize: 13, color: PURPLE },
  val: { fontFamily: FONT, fontSize: 14, color: '#3a3650' },
  bar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6,
  },
  barLabel: { fontFamily: FONT, fontSize: 14, color: '#fff' },
  barValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barText: { fontFamily: FONT, fontSize: 16, color: '#fff' },
  buyRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  multCol: { gap: 4 },
  mult: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#eeeaf8' },
  multOn: { backgroundColor: PURPLE },
  multText: { fontFamily: FONT, fontSize: 13, color: PURPLE, textAlign: 'center' },
  multTextOn: { color: '#fff' },
  buyBtn: {
    backgroundColor: PURPLE, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderBottomWidth: 5, borderBottomColor: PURPLE_DARK,
  },
  buyOff: { backgroundColor: '#b8b4c8', borderBottomColor: '#9894a8' },
  maxBtn: { backgroundColor: '#f0a020', borderBottomColor: '#c07a10' },
  buyText: { fontFamily: FONT, fontSize: 20, color: '#fff' },
  buyPrice: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  buyPriceText: { fontFamily: FONT, fontSize: 16, color: '#fff' },
  pressed: { transform: [{ scale: 0.97 }] },
  flex: { flex: 1 },
  section: { fontFamily: FONT, fontSize: 14, color: PURPLE, marginTop: 4 },
  track: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  trackLine: { position: 'absolute', left: 30, right: 30, top: 38, height: 4, backgroundColor: '#dcd6f0' },
  stone: { alignItems: 'center', gap: 2 },
  stoneLv: { fontFamily: FONT, fontSize: 13, color: PURPLE },
  stoneDot: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: '#dcd6f0', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  staffRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f4f2fa', borderRadius: 14, padding: 8, marginTop: 4,
  },
  staffIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  staffTitle: { fontFamily: FONT, fontSize: 14, color: PURPLE },
  staffSub: { fontSize: 11, color: '#6a6680' },
  staffBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: PURPLE, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 4, borderBottomColor: PURPLE_DARK,
  },
  staffBtnText: { fontFamily: FONT, fontSize: 14, color: '#fff' },
  staffMax: { fontFamily: FONT, fontSize: 16, color: '#f0a020' },
});
