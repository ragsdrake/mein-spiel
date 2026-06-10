/**
 * components/graphics/PixelSprite.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generic blocky pixel-art renderer — Pokémon/Minecraft/Terraria style sprites
 * drawn purely with react-native-svg <Rect> cells. No external image assets.
 *
 * Props:
 *   pattern   – array of equal-length strings, one char per pixel.
 *               '.' is transparent, any other char looks up `palette`.
 *   palette   – { [char]: hexColor }
 *   size      – rendered width/height in px (square). Default 96.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import Svg, { Rect } from 'react-native-svg';

export default function PixelSprite({ pattern, palette, size = 96 }) {
  const rows = pattern.length;
  const cols = pattern[0]?.length || 0;
  const cell = size / Math.max(rows, cols);

  const cells = [];
  for (let y = 0; y < rows; y++) {
    const row = pattern[y];
    for (let x = 0; x < cols; x++) {
      const ch = row[x];
      if (ch === '.' || !palette[ch]) continue;
      cells.push(
        <Rect
          key={`${x}-${y}`}
          x={x * cell}
          y={y * cell}
          width={cell}
          height={cell}
          fill={palette[ch]}
        />
      );
    }
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${cols * cell} ${rows * cell}`}>
      {cells}
    </Svg>
  );
}
