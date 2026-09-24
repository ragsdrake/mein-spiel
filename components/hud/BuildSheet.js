/**
 * Bottom sheet with every menu: rooms, operations (bar, reception,
 * attractions), staff, quests, hotel map, guest types, gem shop, settings.
 */

import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import {
  ATTRACTION_EFFECT, ATTRACTION_MAX_LEVEL, BAR_MAX_LEVEL, BOOST_COST_GEMS, BOOST_SECONDS,
  INSTANT_COST_GEMS, RECEPTION_MAX_LEVEL, ROOM_MAX_LEVEL, STAFF_HIRE_COST, STAFF_MAX_LEVEL,
  STAFF_ROLES, STAR_THRESHOLDS, attractionCost, autoCheckinSeconds, barStools, barUpgradeCost,
  drinkPrice, receptionUpgradeCost, roomPrice, roomUnlockCost, roomUpgradeCost, spawnInterval,
  staffSpeed, staffUpgradeCost, starsFor,
} from '../../game/config';
import { fmt } from '../../game/format';
import { HOTELS, getHotel } from '../../game/hotels';
import { QUEST_KINDS, questDone, questProgress } from '../../game/quests';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import { showRewardedAd } from '../../game/ads';
import { QUALITY } from '../../game/quality';
import GameButton from './GameButton';
import { C, GRAD } from './theme';
import Txt from './Txt';
import UpgradeCard from './UpgradeCard';

export const SHEETS = {
  rooms:    { title: 'Zimmer',    icon: 'bed-king' },
  ops:      { title: 'Betrieb',   icon: 'bell-ring' },
  staff:    { title: 'Personal',  icon: 'account-group' },
  quests:   { title: 'Aufträge',  icon: 'clipboard-check' },
  hotels:   { title: 'Hotels',    icon: 'map-marker-radius' },
  guests:   { title: 'Gäste',     icon: 'ghost' },
  shop:     { title: 'Kristall-Shop', icon: 'diamond-stone' },
  settings: { title: 'Einstellungen', icon: 'cog' },
};

const EFFECT_TEXT = {
  rooms: (l) => `+${Math.round(l * ATTRACTION_EFFECT.rooms * 100)} % Zimmer-Einnahmen`,
  bar:   (l) => `+${Math.round(l * ATTRACTION_EFFECT.bar * 100)} % Bar-Einnahmen`,
  spawn: (l) => `${Math.round(l * ATTRACTION_EFFECT.spawn * 100)} % schnellere Gäste`,
  tips:  (l) => `+${Math.round(l * ATTRACTION_EFFECT.tips * 100)} % Trinkgeld-Chance`,
};

// ─── building blocks ─────────────────────────────────────────────────────────
function Price({ cost, gems }) {
  return (
    <View style={styles.price}>
      <Icon name={gems ? 'diamond-stone' : 'circle-multiple'} size={15} color={gems ? '#e8d4ff' : '#fff3c4'} />
      <Txt size={15}>{fmt(cost)}</Txt>
    </View>
  );
}

function BuyButton({ cost, gems, onPress, label, disabled, grad = 'green' }) {
  const coins = useHotel(s => s.coins);
  const have = useHotel(s => s.gems);
  const afford = gems ? have >= cost : coins >= cost;
  return (
    <GameButton grad={gems ? 'purple' : grad} disabled={disabled || !afford} onPress={onPress} style={styles.buy}>
      {label ? <Txt size={12}>{label}</Txt> : null}
      <Price cost={cost} gems={gems} />
    </GameButton>
  );
}

function Tag({ text, grad = 'grey', icon }) {
  return (
    <View style={[styles.buy, styles.tag]}>
      <LinearGradient colors={GRAD[grad]} style={[StyleSheet.absoluteFill, { borderRadius: 11 }]} />
      <View style={styles.price}>
        <Txt size={13}>{text}</Txt>
        {icon ? <Icon name={icon} size={14} color="#e8d4ff" /> : null}
      </View>
    </View>
  );
}

function Stars({ n, max = 5, size = 11 }) {
  return (
    <View style={styles.levelDots}>
      {Array.from({ length: max }, (_, i) => (
        <Icon key={i} name="star" size={size} color={i < n ? C.gold : '#4a4468'} />
      ))}
    </View>
  );
}

function LevelBar({ level, max }) {
  return (
    <View style={styles.levelBar}>
      <View style={[styles.levelFill, { width: `${(level / max) * 100}%` }]} />
    </View>
  );
}

function Row({ icon, iconColor = C.white, title, subtitle, highlight, right, children }) {
  return (
    <View style={[styles.row, highlight && styles.rowHighlight]}>
      <LinearGradient colors={GRAD.card} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
      <View style={styles.rowIcon}><Icon name={icon} size={28} color={iconColor} /></View>
      <View style={styles.rowText}>
        <Txt size={16}>{title}</Txt>
        {subtitle ? <Txt size={12} color={C.muted} style={styles.sub}>{subtitle}</Txt> : null}
        {children}
      </View>
      {right}
    </View>
  );
}

function Section({ title }) {
  return <Txt size={14} color={C.gold} style={styles.section}>{title}</Txt>;
}

// ─── tabs ────────────────────────────────────────────────────────────────────
function RoomsTab({ focus }) {
  const def = useHotel(s => s.activeDef());
  const rooms = useHotel(s => s.hotels[s.activeHotel].rooms);
  const roomBonus = useHotel(s => s.bonus('rooms'));
  const unlockRoom = useHotel(s => s.unlockRoom);
  const upgradeRoom = useHotel(s => s.upgradeRoom);
  const pm = def.pm;
  return rooms.map((lvl, i) => {
    const locked = lvl === 0;
    const reachable = i === 0 || rooms[i - 1] > 0;
    let right;
    if (locked) right = <BuyButton cost={roomUnlockCost(i, pm)} label="Öffnen" disabled={!reachable} onPress={() => unlockRoom(i)} />;
    else if (lvl >= ROOM_MAX_LEVEL) right = <Tag text="MAX" grad="gold" />;
    else right = <BuyButton cost={roomUpgradeCost(i, lvl, pm)} label="Ausbauen" onPress={() => upgradeRoom(i)} />;
    const price = (l) => fmt(roomPrice(l, pm) * (1 + roomBonus));
    return (
      <Row
        key={i}
        icon={locked ? 'lock' : 'bed-king'}
        iconColor={locked ? C.muted : '#d9a3ff'}
        highlight={focus === i}
        title={def.rooms[i]}
        subtitle={locked
          ? (reachable ? 'Verstaubt – öffne es für neue Gäste' : 'Öffne zuerst das vorherige Zimmer')
          : `${price(lvl)} Münzen pro Übernachtung${lvl < ROOM_MAX_LEVEL ? ` → ${price(lvl + 1)}` : ''}`}
        right={right}
      >
        {!locked && <LevelBar level={lvl} max={ROOM_MAX_LEVEL} />}
      </Row>
    );
  });
}

function OpsTab() {
  const def = useHotel(s => s.activeDef());
  const h = useHotel(s => s.hotels[s.activeHotel]);
  const upgradeBar = useHotel(s => s.upgradeBar);
  const upgradeReception = useHotel(s => s.upgradeReception);
  const buyAttraction = useHotel(s => s.buyAttraction);
  const pm = def.pm;
  const { barLevel, receptionLevel, attractions } = h;

  return (
    <>
      <Section title="Betrieb" />
      <Row
        icon={def.bar.icon}
        iconColor={C.green}
        title={def.bar.name}
        subtitle={barLevel === 0
          ? `Ausgeschlafene Gäste gönnen sich ${def.bar.drink}`
          : `${fmt(drinkPrice(barLevel, pm))} pro ${def.bar.drink} · ${barStools(barLevel)} Hocker`}
        right={barLevel >= BAR_MAX_LEVEL ? <Tag text="MAX" grad="gold" /> : (
          <BuyButton cost={barUpgradeCost(barLevel, pm)} label={barLevel === 0 ? 'Eröffnen' : 'Ausbauen'} onPress={upgradeBar} />
        )}
      >
        {barLevel > 0 && <LevelBar level={barLevel} max={BAR_MAX_LEVEL} />}
      </Row>
      <Row
        icon="bell-ring"
        iconColor={C.gold}
        title="Rezeption"
        subtitle={`Neuer Gast alle ${spawnInterval(receptionLevel).toFixed(1)} s · Check-in ${autoCheckinSeconds(receptionLevel).toFixed(1)} s`}
        right={receptionLevel >= RECEPTION_MAX_LEVEL ? <Tag text="MAX" grad="gold" /> : (
          <BuyButton cost={receptionUpgradeCost(receptionLevel, pm)} label="Ausbauen" onPress={upgradeReception} />
        )}
      >
        <LevelBar level={receptionLevel} max={RECEPTION_MAX_LEVEL} />
      </Row>

      <Section title="Attraktionen im Garten" />
      {def.attractions.map((a, i) => {
        const lvl = attractions[i];
        return (
          <Row
            key={a.id}
            icon={a.icon}
            iconColor={lvl ? C.gold : C.muted}
            title={a.name}
            subtitle={lvl ? EFFECT_TEXT[a.effect](lvl) : `Bringt ${EFFECT_TEXT[a.effect](1)}`}
            right={lvl >= ATTRACTION_MAX_LEVEL ? <Tag text="MAX" grad="gold" /> : (
              <BuyButton cost={attractionCost(i, lvl, pm)} label={lvl ? 'Verbessern' : 'Bauen'} grad="teal" onPress={() => buyAttraction(i)} />
            )}
          >
            <Stars n={lvl} max={ATTRACTION_MAX_LEVEL} />
          </Row>
        );
      })}
    </>
  );
}

function StaffTab() {
  const def = useHotel(s => s.activeDef());
  const h = useHotel(s => s.hotels[s.activeHotel]);
  const upgradeStaff = useHotel(s => s.upgradeStaff);
  const pm = def.pm;
  return STAFF_ROLES.map(role => {
    const s = def.staff[role];
    const lvl = h.staff[role];
    const blocked = role === 'bar' && h.barLevel === 0;
    let right;
    if (lvl >= STAFF_MAX_LEVEL) right = <Tag text="MAX" grad="gold" />;
    else if (lvl === 0) right = <BuyButton cost={STAFF_HIRE_COST[role] * pm} label="Einstellen" disabled={blocked} onPress={() => upgradeStaff(role)} />;
    else right = <BuyButton cost={staffUpgradeCost(role, lvl, pm)} label="Schulen" grad="blue" onPress={() => upgradeStaff(role)} />;
    return (
      <Row
        key={role}
        icon={s.icon}
        iconColor={lvl ? C.green : C.white}
        title={s.name}
        subtitle={blocked ? `Braucht zuerst die ${def.bar.name}` : lvl
          ? `${s.job} · Tempo ×${staffSpeed(lvl).toFixed(1)}`
          : s.job}
        right={right}
      >
        {lvl > 0 && <Stars n={lvl} max={STAFF_MAX_LEVEL} />}
      </Row>
    );
  });
}

function QuestsTab() {
  const quests = useHotel(s => s.quests);
  const stats = useHotel(s => s.stats);
  const claim = useHotel(s => s.claimQuest);
  return (
    <>
      <Txt size={13} color={C.muted} style={styles.hint}>Erfülle Aufträge für Kristalle – danach kommt sofort ein neuer.</Txt>
      {quests.map(q => {
        const k = QUEST_KINDS[q.kind];
        const done = questDone(q, stats);
        const prog = questProgress(q, stats);
        return (
          <Row
            key={q.uid}
            icon={k.icon}
            iconColor={done ? C.green : C.gold}
            highlight={done}
            title={k.text(q.target)}
            subtitle={`${prog} / ${q.target}`}
            right={done ? (
              <GameButton grad="purple" onPress={() => claim(q.uid)} style={styles.buy}>
                <Txt size={12}>Abholen</Txt>
                <Price cost={q.reward} gems />
              </GameButton>
            ) : <Tag text={`+${q.reward}`} icon="diamond-stone" />}
          >
            <LevelBar level={prog} max={q.target} />
          </Row>
        );
      })}
    </>
  );
}

function HotelsTab() {
  const active = useHotel(s => s.activeHotel);
  const hotels = useHotel(s => s.hotels);
  const coins = useHotel(s => s.coins);
  const starsOf = useHotel(s => s.starsOf);
  const unlockHotel = useHotel(s => s.unlockHotel);
  const switchHotel = useHotel(s => s.switchHotel);
  const closeSheet = useUi(s => s.closeSheet);
  return (
    <>
      <Txt size={13} color={C.muted} style={styles.hint}>
        Hotels, die du nicht ansiehst, verdienen mit Rezeptionist nebenbei 50 % weiter.
      </Txt>
      {HOTELS.map(def => {
        const h = hotels[def.id];
        const stars = starsFor(h.totalEarned, def.pm);
        const req = def.unlock;
        const reqMet = req && starsOf(req.hotel) >= req.stars;
        let right;
        if (def.id === active) right = <Tag text="Hier bist du" grad="teal" />;
        else if (h.unlocked) {
          right = (
            <GameButton grad="blue" onPress={() => { switchHotel(def.id); closeSheet(); }} style={styles.buy}>
              <Txt size={14}>Reisen</Txt>
            </GameButton>
          );
        } else {
          right = (
            <GameButton grad="gold" disabled={!reqMet || coins < req.coins} onPress={() => unlockHotel(def.id)} style={styles.buy}>
              <Txt size={12}>Kaufen</Txt>
              <Price cost={req.coins} />
            </GameButton>
          );
        }
        return (
          <View key={def.id} style={[styles.hotelCard, def.id === active && styles.rowHighlight]}>
            <LinearGradient colors={[def.palette.skyBottom, def.palette.bg]} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
            <View style={[styles.hotelIcon, { backgroundColor: def.palette.trim }]}>
              <Icon name={h.unlocked ? def.icon : 'lock'} size={30} color={C.white} />
            </View>
            <View style={styles.rowText}>
              <Txt size={17}>{def.name}</Txt>
              <Txt size={12} color="#e0d8f4">{def.tagline}</Txt>
              {h.unlocked
                ? <Stars n={stars} size={13} />
                : <Txt size={12} color={reqMet ? C.green : C.red}>
                  Braucht {req.stars} ★ in {getHotel(req.hotel).short}
                </Txt>}
            </View>
            {right}
          </View>
        );
      })}
    </>
  );
}

function GuestsTab() {
  const def = useHotel(s => s.activeDef());
  const earned = useHotel(s => s.hotels[s.activeHotel].totalEarned);
  const stars = starsFor(earned, def.pm);
  return def.guests.map(t => {
    const unlocked = t.star <= stars;
    return (
      <Row
        key={t.id}
        icon={unlocked ? 'account-heart' : 'lock'}
        iconColor={unlocked ? C.gold : C.muted}
        title={t.name}
        subtitle={unlocked
          ? `Zahlt ×${t.mult} – checkt jetzt bei dir ein`
          : `Ab ${t.star} ★ (${fmt(STAR_THRESHOLDS[t.star - 1] * def.pm)} Münzen in diesem Hotel)`}
        right={<Txt size={16} color={unlocked ? C.gold : C.muted}>×{t.mult}</Txt>}
      />
    );
  });
}

function ShopTab() {
  const adChest = useHotel(s => s.adChest);
  const adBoost = useHotel(s => s.adBoost);
  const buyBoost = useHotel(s => s.buyBoost);
  const buyInstant = useHotel(s => s.buyInstant);
  const instant = useHotel(s => s.instantIncome());
  return (
    <>
      <Section title="Gratis" />
      <Row
        icon="treasure-chest"
        iconColor={C.gold}
        title="Gratis-Truhe"
        subtitle="Video ansehen: 10 Minuten Einnahmen sofort"
        right={(
          <GameButton grad="blue" style={styles.buy} onPress={async () => { if (await showRewardedAd('chest')) adChest(); }}>
            <Icon name="movie-open-play" size={20} color={C.white} />
            <Txt size={12}>Ansehen</Txt>
          </GameButton>
        )}
      />
      <Row
        icon="cash-multiple"
        iconColor={C.green}
        title="Einnahmen ×2"
        subtitle="Video ansehen: +4 Minuten, bis zu 4 Stunden stapelbar"
        right={(
          <GameButton grad="blue" style={styles.buy} onPress={async () => { if (await showRewardedAd('boost')) adBoost(); }}>
            <Icon name="movie-open-play" size={20} color={C.white} />
            <Txt size={12}>Ansehen</Txt>
          </GameButton>
        )}
      />
      <Section title="Mit Kristallen" />
      <Row
        icon="timer-sand"
        iconColor={C.gold}
        title="Geisterstunde ×2"
        subtitle={`Doppelte Einnahmen für ${BOOST_SECONDS / 60} Minuten`}
        right={<BuyButton gems cost={BOOST_COST_GEMS} label="Starten" onPress={buyBoost} />}
      />
      <Row
        icon="treasure-chest"
        iconColor={C.gold}
        title="Schatztruhe"
        subtitle={`Sofort ${fmt(instant)} Münzen (1 Stunde Einnahmen)`}
        right={<BuyButton gems cost={INSTANT_COST_GEMS} label="Öffnen" onPress={buyInstant} />}
      />
      <Row
        icon="diamond-stone"
        iconColor={C.purple}
        title="Kristalle verdienen"
        subtitle="Hotelsterne (+15) und Aufträge bringen Kristalle"
        right={null}
      />
    </>
  );
}

function SettingsTab() {
  const quality = useHotel(s => s.settings.quality);
  const setQuality = useHotel(s => s.setQuality);
  const resetGame = useHotel(s => s.resetGame);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Section title="Grafikqualität" />
      <View style={styles.segment}>
        {Object.entries(QUALITY).map(([id, q]) => (
          <GameButton key={id} grad={quality === id ? 'gold' : 'grey'} onPress={() => setQuality(id)} style={styles.segmentBtn}>
            <Txt size={14}>{q.label}</Txt>
          </GameButton>
        ))}
      </View>
      <Txt size={12} color={C.muted} style={styles.hint}>
        Hoch: weiche Schatten · Ultra: zusätzlich Leuchteffekte (Bloom) und Kantenglättung.
        Auf älteren Handys lieber „Mittel“.
      </Txt>
      <Section title="Spielstand" />
      <Row
        icon="restart"
        iconColor={C.red}
        title="Spielstand zurücksetzen"
        subtitle={confirm ? 'Wirklich? Alle Hotels gehen verloren!' : 'Neu anfangen mit leerem Hotel'}
        right={(
          <GameButton grad={confirm ? 'red' : 'grey'} style={styles.buy}
            onPress={() => { if (confirm) { resetGame(); setConfirm(false); } else setConfirm(true); }}>
            <Txt size={14}>{confirm ? 'Ja, löschen' : 'Zurücksetzen'}</Txt>
          </GameButton>
        )}
      />
    </>
  );
}

const TAB_VIEWS = {
  rooms: RoomsTab, ops: OpsTab, staff: StaffTab, quests: QuestsTab, hotels: HotelsTab,
  guests: GuestsTab, shop: ShopTab, settings: SettingsTab,
};

export default function BuildSheet() {
  const sheet = useUi(s => s.sheet);
  const focus = useUi(s => s.focusRoom);
  const closeSheet = useUi(s => s.closeSheet);
  const hotelName = useHotel(s => s.activeDef().short);
  if (sheet === 'upgrade') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={closeSheet} />
        <Animated.View entering={SlideInDown.duration(220)} exiting={SlideOutDown.duration(160)} style={styles.cardWrap}>
          <UpgradeCard />
        </Animated.View>
      </View>
    );
  }
  if (!sheet || !SHEETS[sheet]) return null;
  const meta = SHEETS[sheet];
  const View_ = TAB_VIEWS[sheet];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={closeSheet} />
      <Animated.View entering={SlideInDown.duration(240)} exiting={SlideOutDown.duration(180)} style={styles.sheet}>
        <LinearGradient colors={GRAD.panel} style={[StyleSheet.absoluteFill, styles.sheetBg]} />
        <View style={styles.header}>
          <View style={styles.headerIcon}><Icon name={meta.icon} size={24} color={C.gold} /></View>
          <View style={styles.rowText}>
            <Txt size={22}>{meta.title}</Txt>
            {['rooms', 'ops', 'staff', 'guests'].includes(sheet) && <Txt size={12} color={C.muted}>{hotelName}</Txt>}
          </View>
          <GameButton grad="red" onPress={closeSheet} radius={18} style={styles.close} hitSlop={8}>
            <Icon name="close" size={20} color={C.white} />
          </GameButton>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          <View_ focus={focus} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 4, 20, 0.4)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '68%',
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 3, borderColor: C.border,
    paddingBottom: 18, overflow: 'hidden',
  },
  sheetBg: { borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  cardWrap: { position: 'absolute', left: 8, right: 8, bottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.cardLight,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.border,
  },
  close: { width: 38, height: 38 },
  list: { padding: 10, gap: 8 },
  section: { marginTop: 6, marginLeft: 4 },
  hint: { marginHorizontal: 4, marginBottom: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    borderRadius: 14, borderWidth: 2, borderColor: C.border, overflow: 'hidden',
  },
  rowHighlight: { borderColor: C.gold },
  rowIcon: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  sub: { marginTop: 1 },
  buy: { minWidth: 96 },
  tag: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 13, borderWidth: 2, borderColor: C.border, overflow: 'hidden',
  },
  price: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.4)', overflow: 'hidden', marginTop: 4 },
  levelFill: { height: '100%', backgroundColor: C.gold, borderRadius: 3 },
  levelDots: { flexDirection: 'row', marginTop: 3 },
  hotelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16,
    borderWidth: 2, borderColor: C.border, overflow: 'hidden', minHeight: 86,
  },
  hotelIcon: {
    width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.border,
  },
  segment: { flexDirection: 'row', gap: 6 },
  segmentBtn: { flex: 1 },
});
