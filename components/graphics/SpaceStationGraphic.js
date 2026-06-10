/**
 * SpaceStationGraphic.js
 * ─────────────────────────────────────────────────────────────────────────────
 * An angular, structural orbital command center. Features:
 *   - Central hub octagon with layered structural rings
 *   - Four extending truss arms (N/E/S/W)
 *   - Comm-dish antenna
 *   - Glowing node beacons at arm tips
 *   - Subtle rotation animation (slow drift)
 *
 * Props:
 *   size    – bounding box (default 280)
 *   active  – whether station is online (affects glow)
 *   level   – 1–3, controls number of truss segments per arm
 *
 * Place in:  components/graphics/SpaceStationGraphic.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

// ─── design tokens ────────────────────────────────────────────────────────────
const C = {
  cyan:       '#00ffcc',
  cyanDim:    '#00ccaa',
  cyanDeep:   '#003322',
  cyanGlow:   '#00ffcc',
  red:        '#ff4444',
  redDim:     '#cc2222',
  struct:     '#111d1a',
  structDark: '#0a1512',
  truss:      '#0d2018',
  plate:      '#162820',
  plateBright:'#1e3830',
  outline:    '#00ffcc55',
};

// ─── reusable sub-shapes ──────────────────────────────────────────────────────

/** Regular polygon (octagon, hexagon, etc.) path string */
function polyPath(cx, cy, r, sides, rotOffset = 0) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * 2 * Math.PI + rotOffset;
    return `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`;
  });
  return pts.join(' ');
}

/** Truss arm: a rectangular lattice from (x1,y1) to (x2,y2) with crossbraces */
function TrussArm({ x1, y1, x2, y2, segments, halfW, color }) {
  const dx = (x2 - x1) / segments;
  const dy = (y2 - y1) / segments;
  // perpendicular unit
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx  = -(dy / len) * halfW;
  const ny  =  (dx / len) * halfW;

  const elements = [];

  for (let i = 0; i < segments; i++) {
    const ax1 = x1 + dx * i;
    const ay1 = y1 + dy * i;
    const ax2 = x1 + dx * (i + 1);
    const ay2 = y1 + dy * (i + 1);

    // top and bottom rails
    elements.push(
      <Line key={`rail-t-${i}`}
        x1={ax1 + nx} y1={ay1 + ny}
        x2={ax2 + nx} y2={ay2 + ny}
        stroke={color || C.cyanDim} strokeWidth={1.2} opacity={0.7} />,
      <Line key={`rail-b-${i}`}
        x1={ax1 - nx} y1={ay1 - ny}
        x2={ax2 - nx} y2={ay2 - ny}
        stroke={color || C.cyanDim} strokeWidth={1.2} opacity={0.7} />,
    );

    // cross braces (alternating X)
    if (i % 2 === 0) {
      elements.push(
        <Line key={`brace-a-${i}`}
          x1={ax1 + nx} y1={ay1 + ny}
          x2={ax2 - nx} y2={ay2 - ny}
          stroke={C.cyanDeep} strokeWidth={0.8} opacity={0.9} />,
      );
    } else {
      elements.push(
        <Line key={`brace-b-${i}`}
          x1={ax1 - nx} y1={ay1 - ny}
          x2={ax2 + nx} y2={ay2 + ny}
          stroke={C.cyanDeep} strokeWidth={0.8} opacity={0.9} />,
      );
    }

    // transverse bar at each joint
    elements.push(
      <Line key={`trans-${i}`}
        x1={ax1 + nx} y1={ay1 + ny}
        x2={ax1 - nx} y2={ay1 - ny}
        stroke={color || C.cyanDim} strokeWidth={1} opacity={0.5} />,
    );
  }

  // end cap
  elements.push(
    <Line key="rail-end"
      x1={x2 + nx} y1={y2 + ny}
      x2={x2 - nx} y2={y2 - ny}
      stroke={color || C.cyanDim} strokeWidth={1.2} opacity={0.7} />,
  );

  return <G>{elements}</G>;
}

/** Glowing tip node at arm end */
function NodeBeacon({ cx, cy, r = 5, color = C.cyan }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r + 4} fill={color} opacity={0.08} />
      <Circle cx={cx} cy={cy} r={r + 1.5} fill={color} opacity={0.18} />
      <Circle cx={cx} cy={cy} r={r}       fill={C.structDark} stroke={color} strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={r * 0.4} fill={color} opacity={0.9} />
    </G>
  );
}

/** Comm dish (parabolic arc) pointing at an angle */
function CommDish({ cx, cy, r = 28, angle = -45 }) {
  const rad = angle * (Math.PI / 180);
  // dish bowl — arc spanning 120° centred on `angle`
  const span = 60 * (Math.PI / 180);
  const startA = rad - span;
  const endA   = rad + span;
  const sx = cx + Math.cos(startA) * r;
  const sy = cy + Math.sin(startA) * r;
  const ex = cx + Math.cos(endA)   * r;
  const ey = cy + Math.sin(endA)   * r;
  // focus point
  const fr  = r * 0.42;
  const fcx = cx + Math.cos(rad) * fr;
  const fcy = cy + Math.sin(rad) * fr;
  // mast
  const base = { x: cx, y: cy };

  return (
    <G>
      {/* mast */}
      <Line x1={base.x} y1={base.y} x2={fcx} y2={fcy}
            stroke={C.cyanDim} strokeWidth={1.2} opacity={0.7} />
      {/* dish arc */}
      <Path
        d={`M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`}
        fill="none"
        stroke={C.cyan}
        strokeWidth={1.8}
        opacity={0.8}
      />
      {/* dish inner fill */}
      <Path
        d={`M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)} Z`}
        fill={C.cyanDeep}
        opacity={0.4}
      />
      {/* focal node */}
      <Circle cx={fcx} cy={fcy} r={3} fill={C.cyan} opacity={0.9} />
      <Circle cx={fcx} cy={fcy} r={6} fill={C.cyan} opacity={0.15} />
    </G>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
const AnimatedG = Animated.createAnimatedComponent(G);

export default function SpaceStationGraphic({
  size   = 280,
  active = true,
  level  = 2,         // 1–3 truss segments per arm
}) {
  const cx    = size / 2;
  const cy    = size / 2;
  const segs  = Math.min(3, Math.max(1, level));
  const armLen = size * 0.32;
  const armHW  = size * 0.028;    // truss half-width
  const hubR   = size * 0.105;

  // slow station rotation
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // blinking beacon pulse
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.delay(800),
      ])
    ).start();
  }, [active]);

  // arm endpoints (cardinal directions)
  const arms = [
    { dx: 0,  dy: -1, label: 'N' },   // top
    { dx: 1,  dy: 0,  label: 'E' },   // right
    { dx: 0,  dy: 1,  label: 'S' },   // bottom
    { dx: -1, dy: 0,  label: 'W' },   // left
  ].map(a => ({
    ...a,
    x2: cx + a.dx * armLen,
    y2: cy + a.dy * armLen,
    startX: cx + a.dx * hubR,
    startY: cy + a.dy * hubR,
  }));

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="hubGrad" cx="40%" cy="35%" r="65%">
          <Stop offset="0%"   stopColor={C.plateBright} stopOpacity="1" />
          <Stop offset="100%" stopColor={C.structDark}  stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor={C.cyan} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={C.cyan} stopOpacity="0"    />
        </RadialGradient>
      </Defs>

      {/* ── the rotating station body ─────────────────────────────── */}
      <AnimatedG style={{ transform: [{ rotate }] }}
                 originX={cx} originY={cy}>

        {/* ── truss arms ──────────────────────────────────────────── */}
        {arms.map(arm => (
          <TrussArm
            key={arm.label}
            x1={arm.startX} y1={arm.startY}
            x2={arm.x2}     y2={arm.y2}
            segments={segs}
            halfW={armHW}
          />
        ))}

        {/* ── arm tip nodes ───────────────────────────────────────── */}
        {arms.map(arm => (
          <NodeBeacon
            key={`node-${arm.label}`}
            cx={arm.x2} cy={arm.y2}
            r={6}
            color={arm.label === 'N' ? C.red : C.cyan}
          />
        ))}

        {/* ── hub outer glow ──────────────────────────────────────── */}
        <Circle cx={cx} cy={cy} r={hubR + 14} fill="url(#hubGlow)" />

        {/* ── hub structural rings ────────────────────────────────── */}
        <Polygon
          points={polyPath(cx, cy, hubR * 1.28, 8, Math.PI / 8)}
          fill={C.struct}
          stroke={C.cyan}
          strokeWidth={0.8}
          opacity={0.5}
        />
        <Polygon
          points={polyPath(cx, cy, hubR * 1.1, 8, Math.PI / 8)}
          fill={C.truss}
          stroke={C.cyanDim}
          strokeWidth={0.6}
          opacity={0.6}
        />

        {/* ── hub main body ───────────────────────────────────────── */}
        <Polygon
          points={polyPath(cx, cy, hubR, 8, Math.PI / 8)}
          fill="url(#hubGrad)"
        />
        <Polygon
          points={polyPath(cx, cy, hubR, 8, Math.PI / 8)}
          fill="none"
          stroke={C.cyan}
          strokeWidth={1.5}
          opacity={0.8}
        />

        {/* ── hub diagonal cross ──────────────────────────────────── */}
        {[0, 1, 2, 3].map(i => {
          const a1 = (i / 4) * Math.PI * 2 + Math.PI / 8;
          const a2 = a1 + Math.PI;
          return (
            <Line key={`cross-${i}`}
              x1={cx + Math.cos(a1) * hubR * 0.85}
              y1={cy + Math.sin(a1) * hubR * 0.85}
              x2={cx + Math.cos(a2) * hubR * 0.85}
              y2={cy + Math.sin(a2) * hubR * 0.85}
              stroke={C.cyanDim}
              strokeWidth={0.6}
              opacity={0.3}
            />
          );
        })}

        {/* ── hub inner ring ──────────────────────────────────────── */}
        <Circle cx={cx} cy={cy} r={hubR * 0.48}
          fill={C.structDark}
          stroke={C.cyan}
          strokeWidth={1.2}
          opacity={active ? 0.9 : 0.4}
        />

        {/* ── hub core reactor ────────────────────────────────────── */}
        <Circle cx={cx} cy={cy} r={hubR * 0.22}
          fill={active ? C.cyanDeep : C.structDark}
          stroke={C.cyan}
          strokeWidth={1}
          opacity={0.9}
        />
        {active && (
          <Circle cx={cx} cy={cy} r={hubR * 0.12}
            fill={C.cyan}
            opacity={0.9}
          />
        )}

      </AnimatedG>

      {/* ── comm dish (static, not rotating) ─────────────────────── */}
      <CommDish
        cx={cx + size * 0.1}
        cy={cy - size * 0.28}
        r={size * 0.1}
        angle={-70}
      />

      {/* ── blinking warning light on north pole ─────────────────── */}
      <AnimatedG style={{ opacity: blink }}>
        <Circle
          cx={cx}
          cy={cy - armLen - 12}
          r={4}
          fill={C.red}
          opacity={active ? 0.95 : 0.2}
        />
        <Circle
          cx={cx}
          cy={cy - armLen - 12}
          r={9}
          fill={C.red}
          opacity={0.15}
        />
      </AnimatedG>

      {/* ── orbit ring (dashed) ───────────────────────────────────── */}
      <Ellipse
        cx={cx} cy={cy}
        rx={size * 0.46}
        ry={size * 0.12}
        fill="none"
        stroke={C.cyan}
        strokeWidth={0.6}
        strokeDasharray="5 8"
        opacity={0.18}
      />
    </Svg>
  );
}
