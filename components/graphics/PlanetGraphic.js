/**
 * PlanetGraphic.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A massive, blueprint-style wireframe planet showing a dying world with early
 * signs of terraforming. Renders in pure react-native-svg — zero external
 * assets. Accepts a `health` prop (0–100) that drives vein intensity.
 *
 * Place in:  components/graphics/PlanetGraphic.js
 * Install:   npx expo install react-native-svg
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

// ─── design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#0a0a0a',
  grid:      '#0d2e20',        // very dark green grid lines
  gridBright:'#0f3d26',
  vein:      '#00cc66',        // Bio Green
  veinGlow:  '#00ff88',
  crust:     '#111d14',
  atmosIn:   '#003316',
  atmosOut:  'transparent',
  coreFill:  '#060f09',
  scanline:  '#00cc6622',
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Builds a latitude/longitude wireframe clipped to a circle.
 * Returns an array of <Line> JSX elements.
 */
function WireframeLines({ cx, cy, r, health = 50 }) {
  const lines = [];
  const opacity = 0.18 + (health / 100) * 0.14;   // more visible as health grows

  // latitudes (horizontal ellipses approximated as lines through projection)
  const latCount = 10;
  for (let i = 1; i < latCount; i++) {
    const t   = (i / latCount) * 2 - 1;            // –1 → 1
    const y   = cy + t * r;
    const halfW = Math.sqrt(Math.max(0, r * r - (t * r) * (t * r)));
    if (halfW < 2) continue;
    lines.push(
      <Ellipse
        key={`lat-${i}`}
        cx={cx}
        cy={y}
        rx={halfW}
        ry={halfW * 0.18}        // squash to simulate foreshortening
        stroke={i % 2 === 0 ? C.gridBright : C.grid}
        strokeWidth={0.6}
        fill="none"
        opacity={opacity}
      />
    );
  }

  // longitudes (vertical ellipses)
  const lonCount = 12;
  for (let i = 0; i < lonCount; i++) {
    const angle = (i / lonCount) * Math.PI;
    const rx    = r * Math.abs(Math.sin(angle));
    if (rx < 2) continue;
    lines.push(
      <Ellipse
        key={`lon-${i}`}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={r}
        stroke={i % 3 === 0 ? C.gridBright : C.grid}
        strokeWidth={0.6}
        fill="none"
        opacity={opacity}
      />
    );
  }

  return <G>{lines}</G>;
}

/**
 * Organic vein paths representing early terraforming life-lines.
 * health (0–100) controls opacity and count.
 */
function TerraformingVeins({ cx, cy, r, health }) {
  const veins = [
    // main trunk from south pole upward-right
    `M ${cx} ${cy + r * 0.85}
     C ${cx + r * 0.2} ${cy + r * 0.5},
       ${cx + r * 0.45} ${cy + r * 0.1},
       ${cx + r * 0.55} ${cy - r * 0.3}`,

    // branch left from equator
    `M ${cx - r * 0.1} ${cy + r * 0.15}
     C ${cx - r * 0.3} ${cy - r * 0.05},
       ${cx - r * 0.5} ${cy - r * 0.2},
       ${cx - r * 0.6} ${cy - r * 0.45}`,

    // secondary right
    `M ${cx + r * 0.3} ${cy + r * 0.4}
     C ${cx + r * 0.5} ${cy + r * 0.2},
       ${cx + r * 0.65} ${cy},
       ${cx + r * 0.55} ${cy - r * 0.3}`,

    // fine capillary near north
    `M ${cx - r * 0.15} ${cy - r * 0.35}
     C ${cx + r * 0.05} ${cy - r * 0.55},
       ${cx + r * 0.3}  ${cy - r * 0.6},
       ${cx + r * 0.15} ${cy - r * 0.78}`,

    // horizontal tendril
    `M ${cx - r * 0.62} ${cy + r * 0.1}
     C ${cx - r * 0.3}  ${cy + r * 0.22},
       ${cx + r * 0.1}  ${cy + r * 0.18},
       ${cx + r * 0.3}  ${cy + r * 0.4}`,
  ];

  const baseOpacity = Math.max(0.05, health / 100);

  return (
    <G>
      {/* glow pass */}
      {veins.map((d, i) => (
        <Path
          key={`vein-glow-${i}`}
          d={d}
          stroke={C.veinGlow}
          strokeWidth={3.5}
          fill="none"
          opacity={baseOpacity * 0.35}
          strokeLinecap="round"
        />
      ))}
      {/* sharp pass */}
      {veins.map((d, i) => (
        <Path
          key={`vein-${i}`}
          d={d}
          stroke={C.vein}
          strokeWidth={1.2}
          fill="none"
          opacity={baseOpacity * 0.9}
          strokeLinecap="round"
        />
      ))}
    </G>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function PlanetGraphic({
  size   = 300,
  health = 35,       // 0–100
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = (size / 2) * 0.82;

  // subtle pulse on the atmosphere ring
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const atmosOpacity = pulse.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.18, 0.38],
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {/* clip everything to planet circle */}
        <ClipPath id="planetClip">
          <Circle cx={cx} cy={cy} r={r} />
        </ClipPath>

        {/* radial gradient for depth illusion */}
        <RadialGradient id="planetGrad" cx="38%" cy="35%" r="65%">
          <Stop offset="0%"   stopColor="#1a3520" stopOpacity="1" />
          <Stop offset="55%"  stopColor="#0c1e10" stopOpacity="1" />
          <Stop offset="100%" stopColor={C.coreFill} stopOpacity="1" />
        </RadialGradient>

        {/* atmosphere outer glow */}
        <RadialGradient id="atmosGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="75%"  stopColor="transparent"  stopOpacity="0" />
          <Stop offset="90%"  stopColor={C.atmosIn}    stopOpacity="0.5" />
          <Stop offset="100%" stopColor={C.atmosOut}   stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* ── planet body ─────────────────────────────────────────────── */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#planetGrad)" />

      {/* ── wireframe grid (clipped) ─────────────────────────────────── */}
      <G clipPath="url(#planetClip)">
        <WireframeLines cx={cx} cy={cy} r={r} health={health} />

        {/* scan-line overlay for a dying-world data-screen effect */}
        {Array.from({ length: Math.floor(size / 4) }).map((_, i) => (
          <Rect
            key={`scan-${i}`}
            x={0}
            y={i * 4}
            width={size}
            height={2}
            fill={C.scanline}
          />
        ))}

        {/* ── terraforming veins ───────────────────────────────────── */}
        <TerraformingVeins cx={cx} cy={cy} r={r} health={health} />
      </G>

      {/* ── planet outline ──────────────────────────────────────────── */}
      <Circle
        cx={cx} cy={cy} r={r}
        stroke={C.vein}
        strokeWidth={1.4}
        fill="none"
        opacity={0.55}
      />

      {/* ── specular highlight arc (top-left limb) ───────────────────── */}
      <Path
        d={`M ${cx - r * 0.6} ${cy - r * 0.7}
            A ${r} ${r} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.9}`}
        stroke="#ffffff"
        strokeWidth={0.8}
        fill="none"
        opacity={0.07}
        strokeLinecap="round"
      />

      {/* ── atmosphere glow ring ─────────────────────────────────────── */}
      <Circle cx={cx} cy={cy} r={r + 10} fill="url(#atmosGrad)" opacity={0.7} />

      {/* ── health indicator tick-marks around orbit ─────────────────── */}
      {Array.from({ length: 36 }).map((_, i) => {
        const ang  = ((i / 36) * 360 - 90) * (Math.PI / 180);
        const rOuter = r + 18;
        const rInner = rOuter - (i % 6 === 0 ? 8 : 4);
        const filled = i < Math.round((health / 100) * 36);
        return (
          <Line
            key={`tick-${i}`}
            x1={cx + Math.cos(ang) * rInner}
            y1={cy + Math.sin(ang) * rInner}
            x2={cx + Math.cos(ang) * rOuter}
            y2={cy + Math.sin(ang) * rOuter}
            stroke={filled ? C.vein : '#1a2e1d'}
            strokeWidth={filled ? 1.5 : 0.8}
            opacity={filled ? 0.9 : 0.4}
          />
        );
      })}
    </Svg>
  );
}
