/**
 * SolarPanelGraphic.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A sleek, isometric-projection modular solar array. Uses flat isometric
 * geometry — no external assets, no images. Sharp angles, tech-cyan energy
 * cells, and a subtle glow on active cell edges.
 *
 * Props:
 *   size    – bounding box width/height (default 240)
 *   level   – integer 0–5, controls how many panel columns are deployed
 *   active  – bool, whether the array is generating power
 *
 * Place in:  components/graphics/SolarPanelGraphic.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, {
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

// ─── tokens ───────────────────────────────────────────────────────────────────
const C = {
  cyan:      '#00ffcc',
  cyanDim:   '#00ccaa',
  cyanDeep:  '#005544',
  cyanGlow:  '#00ffcc33',
  frame:     '#1a2e2b',
  frameDark: '#0d1a18',
  struct:    '#0f2420',
  gridLine:  '#00ffcc18',
  shadow:    '#00110c',
};

// ─── isometric helpers ────────────────────────────────────────────────────────
// Standard iso: x-right = (√3/2, 1/2), x-left = (-√3/2, 1/2), y-up = (0, -1)
const ISO_SCALE = 0.577;   // tan(30°)

function isoProject(x, y, z, originX, originY, tileW) {
  const hw = tileW / 2;
  const hh = hw * ISO_SCALE;
  return {
    px: originX + (x - y) * hw,
    py: originY + (x + y) * hh - z * tileW * ISO_SCALE,
  };
}

/**
 * A single isometric panel cell (top face + two side faces).
 * topColor is the cell surface, darker variants auto-derived.
 */
function IsoPanel({
  gx, gy,               // grid position
  tileW, tileH,         // tile dimensions in isometric space
  depth,                // extrusion depth (z height of body)
  originX, originY,
  topColor,
  sideXColor,
  sideYColor,
  innerLines = true,    // draw sub-grid on face
  glowOpacity = 0,
}) {
  const project = (x, y, z) => isoProject(x, y, z, originX, originY, tileW);

  // 4 corners at z=depth (top face)
  const tl = project(gx,       gy,       depth);
  const tr = project(gx + 1,   gy,       depth);
  const br = project(gx + 1,   gy + 1,   depth);
  const bl = project(gx,       gy + 1,   depth);

  // same corners at z=0 (bottom)
  const tl0 = project(gx,       gy,       0);
  const tr0 = project(gx + 1,   gy,       0);
  const br0 = project(gx + 1,   gy + 1,   0);
  const bl0 = project(gx,       gy + 1,   0);

  const ptStr = (pts) => pts.map(p => `${p.px.toFixed(2)},${p.py.toFixed(2)}`).join(' ');

  return (
    <G>
      {/* ── right side face (x+) */}
      <Polygon points={ptStr([tr, br, br0, tr0])} fill={sideXColor} />

      {/* ── front side face (y+) */}
      <Polygon points={ptStr([bl, br, br0, bl0])} fill={sideYColor} />

      {/* ── top face glow */}
      {glowOpacity > 0 && (
        <Polygon points={ptStr([tl, tr, br, bl])} fill={C.cyanGlow} opacity={glowOpacity} />
      )}

      {/* ── top face */}
      <Polygon points={ptStr([tl, tr, br, bl])} fill={topColor} opacity={0.92} />

      {/* ── sub-grid on top (photovoltaic cell lines) */}
      {innerLines && (
        <G>
          {/* horizontal dividers */}
          {[0.33, 0.66].map(t => {
            const a = project(gx,     gy + t, depth);
            const b = project(gx + 1, gy + t, depth);
            return (
              <Line key={`h${t}`}
                x1={a.px} y1={a.py} x2={b.px} y2={b.py}
                stroke={C.cyan} strokeWidth={0.5} opacity={0.35} />
            );
          })}
          {/* vertical dividers */}
          {[0.33, 0.66].map(t => {
            const a = project(gx + t, gy,     depth);
            const b = project(gx + t, gy + 1, depth);
            return (
              <Line key={`v${t}`}
                x1={a.px} y1={a.py} x2={b.px} y2={b.py}
                stroke={C.cyan} strokeWidth={0.5} opacity={0.35} />
            );
          })}
        </G>
      )}

      {/* ── top-face border */}
      <Polygon
        points={ptStr([tl, tr, br, bl])}
        fill="none"
        stroke={C.cyan}
        strokeWidth={0.8}
        opacity={0.55}
      />
    </G>
  );
}

/**
 * A single panel column = array of stacked rows.
 */
function PanelColumn({ col, rows, tileW, depth, originX, originY, active }) {
  return (
    <G>
      {Array.from({ length: rows }).map((_, row) => (
        <IsoPanel
          key={`cell-${col}-${row}`}
          gx={col}
          gy={row}
          tileW={tileW}
          tileH={tileW * ISO_SCALE}
          depth={depth}
          originX={originX}
          originY={originY}
          topColor={active ? C.cyanDeep : C.struct}
          sideXColor={active ? '#003322' : '#0a1a16'}
          sideYColor={active ? '#002218' : '#07120e'}
          glowOpacity={active ? 0.55 : 0}
          innerLines={true}
        />
      ))}
    </G>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function SolarPanelGraphic({
  size   = 240,
  level  = 3,           // 0–5 columns deployed
  active = true,
}) {
  const maxColumns = 5;
  const cols = Math.min(maxColumns, Math.max(0, level));
  const rows = 3;

  // The array sits on an isometric grid. Scale tileW to the bounding box.
  const tileW   = size * 0.17;
  const depth   = tileW * 0.25;

  // origin: centre the array visually
  // iso extent: columns extend right-down, rows extend left-down
  const originX = size / 2;
  const originY = size * 0.28;

  // energy pulse animation
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  const project = (x, y, z) => isoProject(x, y, z, originX, originY, tileW);

  // base platform corners
  const bw = maxColumns + 0.2;
  const bd = rows + 0.2;
  const baseTL = project(-0.1,    -0.1,    0);
  const baseTR = project(bw,      -0.1,    0);
  const baseBR = project(bw,      bd,      0);
  const baseBL = project(-0.1,    bd,      0);
  const baseBtTL = project(-0.1,  -0.1,   -0.2);
  const baseBtTR = project(bw,    -0.1,   -0.2);
  const baseBtBR = project(bw,    bd,     -0.2);
  const baseBtBL = project(-0.1,  bd,     -0.2);
  const ptStr = pts => pts.map(p => `${p.px.toFixed(2)},${p.py.toFixed(2)}`).join(' ');

  // support strut top/bottom for each column
  function strut(col) {
    const mid = rows / 2;
    const top = project(col + 0.5, mid, depth + 0.6);
    const bot = project(col + 0.5, mid, -0.22);
    return { top, bot };
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor={C.cyanDim} stopOpacity="0.6" />
          <Stop offset="50%"  stopColor={C.cyan}    stopOpacity="1"   />
          <Stop offset="100%" stopColor={C.cyanDim} stopOpacity="0.6" />
        </LinearGradient>
      </Defs>

      {/* ── base platform ─────────────────────────────────────────── */}
      <Polygon points={ptStr([baseTR, baseBR, baseBtBR, baseBtTR])} fill="#050f0c" />
      <Polygon points={ptStr([baseBL, baseBR, baseBtBR, baseBtBL])} fill="#040c09" />
      <Polygon points={ptStr([baseTL, baseTR, baseBR, baseBL])}     fill={C.frameDark} />
      <Polygon
        points={ptStr([baseTL, baseTR, baseBR, baseBL])}
        fill="none" stroke={C.cyan} strokeWidth={0.7} opacity={0.3}
      />

      {/* ── base grid ─────────────────────────────────────────────── */}
      {Array.from({ length: maxColumns + 1 }).map((_, i) => {
        const a = project(i, -0.1, 0);
        const b = project(i, bd,   0);
        return <Line key={`bg-v${i}`} x1={a.px} y1={a.py} x2={b.px} y2={b.py}
                     stroke={C.gridLine} strokeWidth={0.5} />;
      })}
      {Array.from({ length: rows + 1 }).map((_, i) => {
        const a = project(-0.1, i, 0);
        const b = project(bw,   i, 0);
        return <Line key={`bg-h${i}`} x1={a.px} y1={a.py} x2={b.px} y2={b.py}
                     stroke={C.gridLine} strokeWidth={0.5} />;
      })}

      {/* ── support struts ────────────────────────────────────────── */}
      {Array.from({ length: cols }).map((_, col) => {
        const s = strut(col);
        return (
          <Line key={`strut-${col}`}
            x1={s.top.px} y1={s.top.py}
            x2={s.bot.px} y2={s.bot.py}
            stroke={C.cyan} strokeWidth={1.2} opacity={0.4}
          />
        );
      })}

      {/* ── panel columns (back-to-front paint order) ─────────────── */}
      {Array.from({ length: cols })
        .map((_, i) => cols - 1 - i)   // reverse for painter's order
        .map(col => (
          <PanelColumn
            key={`col-${col}`}
            col={col}
            rows={rows}
            tileW={tileW}
            depth={depth}
            originX={originX}
            originY={originY}
            active={active}
          />
        ))}

      {/* ── empty slot outlines for un-deployed columns ───────────── */}
      {Array.from({ length: maxColumns - cols }).map((_, idx) => {
        const col = cols + idx;
        const tl = project(col,     0,    0);
        const tr = project(col + 1, 0,    0);
        const br = project(col + 1, rows, 0);
        const bl = project(col,     rows, 0);
        return (
          <Polygon key={`empty-${col}`}
            points={ptStr([tl, tr, br, bl])}
            fill="none" stroke={C.cyanDeep} strokeWidth={0.6}
            strokeDasharray="3 3" opacity={0.5}
          />
        );
      })}

      {/* ── energy output line at top ─────────────────────────────── */}
      {active && cols > 0 && (() => {
        const lineStart = project(0,    -0.5, depth + 0.5);
        const lineEnd   = project(cols, -0.5, depth + 0.5);
        return (
          <Line
            x1={lineStart.px} y1={lineStart.py}
            x2={lineEnd.px}   y2={lineEnd.py}
            stroke="url(#cyanGrad)" strokeWidth={1.5} opacity={0.7}
          />
        );
      })()}

      {/* ── label: "SOLAR ARRAY" ──────────────────────────────────── */}
      {/* NOTE: react-native-svg Text requires import; add if needed  */}
    </Svg>
  );
}
