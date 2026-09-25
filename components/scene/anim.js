/**
 * Code-driven build-up animations: pieces pop in with overshoot, stations
 * squash when upgraded, and a construction site (scaffolding, barrier tape,
 * hammering, dust) covers anything that is being built.
 */

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MeshBasicMaterial } from 'three';
import { burst, intro } from '../../game/fx';
import { Box, Cyl, M, RENDER_MODE } from './primitives';

export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const easeOutBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);
export const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const TINY = 0.0001;

/**
 * Scales its children in from nothing (with overshoot) `delay` seconds after
 * mounting — or after the intro gate opens. `drop` lets it fall from above.
 */
export function PopIn({ delay = 0, dur = 0.5, drop = 0, squash = false, rise = false, children, ...rest }) {
  if (RENDER_MODE.export) return <group {...rest}>{children}</group>;
  return <PopInAnimated {...{ delay, dur, drop, squash, rise, ...rest }}>{children}</PopInAnimated>;
}

function PopInAnimated({ delay, dur, drop, squash, rise, children, ...rest }) {
  const ref = useRef();
  const time = useRef(null);
  const done = useRef(false);
  useFrame((_, dt) => {
    if (done.current || !ref.current) return;
    if (time.current == null) {
      if (intro.hold) return;
      time.current = 0;
    }
    // clamped steps: a shader-compile hitch must not skip the animation
    time.current += Math.min(dt, 1 / 30);
    const k = clamp01((time.current - delay) / dur);
    const s = k <= 0 ? TINY : easeOutBack(k);
    if (rise) ref.current.scale.set(1, Math.max(TINY, s), 1);
    else if (squash) ref.current.scale.set(1 + (1 - s) * 0.4, Math.max(TINY, s), 1 + (1 - s) * 0.4);
    else ref.current.scale.setScalar(Math.max(TINY, s));
    ref.current.position.y = drop * (1 - easeOutCubic(k));
    if (k >= 1) {
      ref.current.scale.setScalar(1);
      ref.current.position.y = 0;
      done.current = true;
    }
  });
  return <group ref={ref} scale={TINY} {...rest}>{children}</group>;
}

/** PopIn around a pivot on the floor (children keep their world coordinates). */
export function PopAt({ at, children, ...rest }) {
  return (
    <group position={[at[0], 0, at[1]]}>
      <PopIn {...rest}>
        <group position={[-at[0], 0, -at[1]]}>{children}</group>
      </PopIn>
    </group>
  );
}

/**
 * Tracks a station's level: unlocking (0 → n) shows a construction site for
 * `buildMs`, then its contents pop in; upgrades just re-pop. Bursts dust,
 * confetti and sparkles at `pos` (world). Returns { building, delay }, where
 * `delay` is the pop-in delay for the contents (the intro stagger at first).
 */
export function useBuildPhase(level, pos, introDelay = 0, buildMs = 1500) {
  const prev = useRef(level);
  const [state, setState] = useState({ building: false, delay: introDelay });
  useEffect(() => {
    const before = prev.current;
    prev.current = level;
    if (before === level) return undefined;
    if (before === 0 && level > 0) {
      setState({ building: true, delay: 0 });
      burst('dust', [pos[0], 0.3, pos[1]]);
      const t = setTimeout(() => {
        setState({ building: false, delay: 0 });
        burst('dust', [pos[0], 0.3, pos[1]]);
        burst('confetti', [pos[0], 1.2, pos[1]], 0.15);
      }, buildMs);
      return () => { clearTimeout(t); setState({ building: false, delay: 0 }); };
    }
    setState({ building: false, delay: 0 });
    burst('sparkle', [pos[0], 1.2, pos[1]]);
    return undefined;
  }, [level]);   // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

/** Squash-and-stretch whenever `trigger` changes (upgrades). */
export function Bump({ trigger, children }) {
  const ref = useRef();
  const t = useRef(-1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    t.current = 0;
  }, [trigger]);
  useFrame((_, dt) => {
    if (t.current < 0 || !ref.current) return;
    t.current += dt;
    const k = clamp01(t.current / 0.6);
    // damped spring: stretch up, squash down, settle
    const w = Math.sin(k * Math.PI * 3) * (1 - k) * 0.22;
    ref.current.scale.set(1 - w * 0.5, 1 + w, 1 - w * 0.5);
    if (k >= 1) { ref.current.scale.setScalar(1); t.current = -1; }
  });
  return <group ref={ref}>{children}</group>;
}

const POLE = '#f2a71b';

/**
 * Construction site of `w` × `d` (centred, local frame): scaffolding that
 * pops up, barrier tape, a bouncing hammer and rising dust puffs.
 */
export function Construction({ w = 2.8, d = 2.8, h = 2 }) {
  const hammer = useRef();
  const puffs = useRef([]);
  const mats = useMemo(() => Array.from({ length: 6 }, () => (
    new MeshBasicMaterial({ color: '#efe6d8', transparent: true, opacity: 0.8, depthWrite: false })
  )), []);
  useEffect(() => () => mats.forEach(m => m.dispose()), [mats]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (hammer.current) hammer.current.rotation.z = -0.3 - Math.abs(Math.sin(t * 9)) * 1.1;
    puffs.current.forEach((p, i) => {
      if (!p) return;
      const k = ((t * 0.9 + i / 6) % 1);
      p.position.y = 0.2 + k * 1.4;
      p.scale.setScalar(0.15 + k * 0.35);
      mats[i].opacity = 0.6 * (1 - k);
    });
  });

  const hw = w / 2, hd = d / 2;
  const corners = [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]];
  const tape = Array.from({ length: Math.round(w / 0.3) }, (_, i) => i);
  return (
    <PopIn dur={0.4} squash>
      {corners.map(([x, z]) => (
        <Cyl key={`${x}${z}`} p={[x, h / 2, z]} rt={0.08} h={h} seg={6} c={POLE} />
      ))}
      {[0.8, h - 0.05].map(y => (
        <group key={y}>
          <Box p={[0, y, -hd]} s={[w, 0.11, 0.11]} c={POLE} />
          <Box p={[0, y, hd]} s={[w, 0.11, 0.11]} c={POLE} />
          <Box p={[-hw, y, 0]} s={[0.11, 0.11, d]} c={POLE} />
          <Box p={[hw, y, 0]} s={[0.11, 0.11, d]} c={POLE} />
        </group>
      ))}
      {/* planks on the upper level + a diagonal brace */}
      <Box p={[0, h + 0.06, -hd + 0.3]} s={[w, 0.08, 0.55]} c="#c98a4a" />
      <Box p={[0, h + 0.06, hd - 0.3]} s={[w, 0.08, 0.55]} c="#b87a3a" />
      {/* yellow warning sign */}
      <group position={[hw - 0.35, 1.25, hd + 0.08]} rotation={[0, 0, Math.PI / 4]}>
        <Box s={[0.5, 0.5, 0.04]} c="#ffcc1a" cast={false} />
        <Box p={[0, 0, 0.025]} s={[0.36, 0.36, 0.01]} c="#2a2436" cast={false} />
        <Box p={[0, 0, 0.03]} s={[0.3, 0.3, 0.01]} c="#ffcc1a" cast={false} />
      </group>
      <Box p={[-hw, h / 2, 0]} s={[0.05, 0.05, Math.hypot(d, h)]} r={[Math.atan2(h, d), 0, 0]} c={POLE} />
      {/* red/white barrier tape at the front */}
      {tape.map(i => (
        <Box key={i} p={[-hw + 0.15 + i * 0.3, 0.55, hd + 0.02]} s={[0.3, 0.1, 0.02]}
          mat={M(i % 2 ? '#ffffff' : '#e53935')} cast={false} />
      ))}
      {/* crate + hammer */}
      <Box p={[0.3, 0.2, 0.2]} s={[0.5, 0.4, 0.5]} c="#b07a44" />
      <group ref={hammer} position={[0.3, 0.45, 0.2]}>
        <Box p={[0.22, 0, 0]} s={[0.44, 0.05, 0.05]} c="#8a5a33" cast={false} />
        <Box p={[0.44, 0, 0]} s={[0.1, 0.16, 0.1]} c="#5a5a66" cast={false} />
      </group>
      {!RENDER_MODE.export && mats.map((m, i) => (
        <mesh key={i} ref={el => { puffs.current[i] = el; }} position={[(i % 3 - 1) * hw * 0.6, 0.3, (Math.floor(i / 3) - 0.5) * hd]}
          material={m} renderOrder={5}>
          <icosahedronGeometry args={[0.5, 0]} />
        </mesh>
      ))}
    </PopIn>
  );
}
