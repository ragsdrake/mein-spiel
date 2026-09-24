/**
 * Redesigned characters for the style study: chibi proportions (head ≈ ½ of
 * the height), big expressive eyes with highlights, readable silhouettes and
 * one strong accessory per character. Built from <Part>, so the same model
 * renders in every smooth style (soft / toon / ink).
 */

import { useMemo } from 'react';
import { ConeGeometry, LatheGeometry, Vector2 } from 'three';
import Part from './Part';

const INK = '#1a1024';

// ─── face kit ────────────────────────────────────────────────────────────────
/** Anime-style eye: white, coloured iris, pupil, two highlights. */
function Eye({ p, size = 0.1, iris = '#3a2a5a', look = [0, 0], tall = 1.25, lid }) {
  const [lx, ly] = look;
  return (
    <group position={p}>
      <Part g="sphere" a={[size]} s={[1, tall, 0.45]} c="#ffffff" noLine />
      <Part g="sphere" a={[size * 0.72]} p={[lx * size * 0.3, ly * size * 0.3 - size * 0.05, size * 0.3]} s={[1, tall, 0.4]} c={iris} noLine shadow={false} />
      <Part g="sphere" a={[size * 0.4]} p={[lx * size * 0.35, ly * size * 0.35 - size * 0.05, size * 0.4]} s={[1, tall, 0.4]} c={INK} noLine shadow={false} />
      <Part g="sphere" a={[size * 0.2]} p={[size * 0.25, size * 0.35, size * 0.46]} c="#ffffff" noLine shadow={false} />
      <Part g="sphere" a={[size * 0.09]} p={[-size * 0.2, -size * 0.25, size * 0.46]} c="#ffffff" noLine shadow={false} />
      {lid && <Part g="sphere" a={[size * 1.05]} p={[0, size * 0.55, 0.01]} s={[1.05, 0.55, 0.5]} c={lid} noLine />}
    </group>
  );
}

function Eyes({ y, z, gap = 0.15, size, iris, lid, tall }) {
  // sit the eyes slightly proud of the head surface so they always read
  const zz = z + 0.05;
  const sz = size * 1.2;
  return (
    <group>
      <Eye p={[gap, y, zz]} size={sz} iris={iris} lid={lid} tall={tall} />
      <Eye p={[-gap, y, zz]} size={sz} iris={iris} lid={lid} tall={tall} />
    </group>
  );
}

function Blush({ y, z, gap = 0.26 }) {
  return (
    <group>
      <Part g="sphere" a={[0.06]} p={[gap, y, z]} s={[1.3, 0.7, 0.3]} c="#ff9ab8" noLine shadow={false} />
      <Part g="sphere" a={[0.06]} p={[-gap, y, z]} s={[1.3, 0.7, 0.3]} c="#ff9ab8" noLine shadow={false} />
    </group>
  );
}

function Smile({ y, z, w = 0.07, open }) {
  return open
    ? <Part g="sphere" a={[w]} p={[0, y, z]} s={[1, 0.8, 0.35]} c="#5a1a2a" noLine shadow={false} />
    : <Part g="torus" a={[w, 0.014, Math.PI]} p={[0, y, z]} r={[0, 0, Math.PI]} c={INK} noLine shadow={false} />;
}

function Feet({ c, gap = 0.13 }) {
  return (
    <group>
      <Part g="sphere" a={[0.11]} p={[gap, 0.07, 0.04]} s={[1, 0.6, 1.3]} c={c} />
      <Part g="sphere" a={[0.11]} p={[-gap, 0.07, 0.04]} s={[1, 0.6, 1.3]} c={c} />
    </group>
  );
}

// ─── characters ──────────────────────────────────────────────────────────────
export function ChibiGhost() {
  const body = useMemo(() => {
    const pts = [
      [0.001, 1.28], [0.2, 1.24], [0.36, 1.12], [0.47, 0.94], [0.52, 0.72],
      [0.54, 0.5], [0.58, 0.28], [0.64, 0.1],
    ].reverse().map(([x, y]) => new Vector2(x, y));   // bottom → top = outward faces
    const g = new LatheGeometry(pts, 48);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < 0.3) {
        const a = Math.atan2(pos.getZ(i), pos.getX(i));
        pos.setY(i, y + Math.sin(a * 6) * 0.08 * (0.3 - y) / 0.2);
      }
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={[0, 0.25, 0]}>
      <Part geometry={body} c="#f4f8ff" />
      <Part g="sphere" a={[0.13]} p={[0.55, 0.6, 0.12]} c="#f4f8ff" />
      <Part g="sphere" a={[0.13]} p={[-0.55, 0.62, 0.12]} c="#f4f8ff" />
      <Eyes y={0.86} z={0.44} gap={0.17} size={0.11} iris="#1a1024" tall={1.45} />
      <Blush y={0.7} z={0.46} gap={0.3} />
      <Smile y={0.66} z={0.52} w={0.05} open />
      <Part g="sphere" a={[0.9]} p={[0, -0.2, 0]} s={[0.6, 0.05, 0.6]} c="#9fd4ff" glow="#6fbfff" noLine shadow={false} opacity={0.35} />
    </group>
  );
}

export function ChibiVampire() {
  const cape = useMemo(() => new ConeGeometry(0.5, 0.95, 32, 1, true, Math.PI / 2, Math.PI), []);
  return (
    <group>
      <Feet c="#1f1a2a" />
      <Part geometry={cape} p={[0, 0.55, -0.04]} c="#b3122e" />
      <Part g="capsule" a={[0.27, 0.3]} p={[0, 0.48, 0]} c="#2a2440" />
      <Part g="sphere" a={[0.16]} p={[0, 0.58, 0.16]} s={[1, 1.2, 0.5]} c="#ffffff" noLine />
      <Part g="cone" a={[0.06, 0.12]} p={[0.06, 0.72, 0.26]} r={[0, 0, Math.PI / 2]} c="#d11a3a" />
      <Part g="cone" a={[0.06, 0.12]} p={[-0.06, 0.72, 0.26]} r={[0, 0, -Math.PI / 2]} c="#d11a3a" />
      <Part g="capsule" a={[0.08, 0.2]} p={[0.33, 0.52, 0.04]} r={[0, 0, 0.35]} c="#2a2440" />
      <Part g="capsule" a={[0.08, 0.2]} p={[-0.33, 0.52, 0.04]} r={[0, 0, -0.35]} c="#2a2440" />
      {/* collar */}
      <Part g="box" a={[0.28, 0.42, 0.04]} p={[0.28, 0.95, -0.1]} r={[0.2, 0.5, -0.3]} c="#b3122e" />
      <Part g="box" a={[0.28, 0.42, 0.04]} p={[-0.28, 0.95, -0.1]} r={[0.2, -0.5, 0.3]} c="#b3122e" />
      {/* head */}
      <Part g="sphere" a={[0.42]} p={[0, 1.18, 0]} c="#e9e0f7" />
      <Part g="sphere" a={[0.44]} p={[0, 1.3, -0.05]} s={[1, 0.72, 1]} c="#221a33" />
      <Part g="cone" a={[0.09, 0.2]} p={[0, 1.44, 0.36]} r={[Math.PI + 0.5, 0, 0]} c="#221a33" />
      <Part g="cone" a={[0.07, 0.2]} p={[0.42, 1.2, 0]} r={[0, 0, -1.3]} c="#e9e0f7" />
      <Part g="cone" a={[0.07, 0.2]} p={[-0.42, 1.2, 0]} r={[0, 0, 1.3]} c="#e9e0f7" />
      <Eyes y={1.16} z={0.34} gap={0.15} size={0.1} iris="#e0203a" lid="#e9e0f7" />
      <Part g="box" a={[0.12, 0.025, 0.02]} p={[0.15, 1.3, 0.38]} r={[0, 0, -0.35]} c={INK} noLine />
      <Part g="box" a={[0.12, 0.025, 0.02]} p={[-0.15, 1.3, 0.38]} r={[0, 0, 0.35]} c={INK} noLine />
      <Smile y={1.0} z={0.4} w={0.06} />
      <Part g="cone" a={[0.018, 0.06]} p={[0.035, 0.97, 0.4]} r={[Math.PI, 0, 0]} c="#ffffff" noLine />
      <Part g="cone" a={[0.018, 0.06]} p={[-0.035, 0.97, 0.4]} r={[Math.PI, 0, 0]} c="#ffffff" noLine />
      <Blush y={1.04} z={0.36} gap={0.25} />
    </group>
  );
}

export function ChibiMummy() {
  const wrap = '#efe3c4';
  const shade = '#d6c7a2';
  return (
    <group>
      <Feet c={wrap} />
      <Part g="capsule" a={[0.27, 0.3]} p={[0, 0.48, 0]} c={wrap} />
      {[0.34, 0.5, 0.66].map((y, i) => (
        <Part key={y} g="torus" a={[0.275, 0.025]} p={[0, y, 0]} r={[Math.PI / 2 + (i - 1) * 0.2, 0, 0]} c={shade} noLine />
      ))}
      <Part g="capsule" a={[0.08, 0.26]} p={[0.3, 0.62, 0.2]} r={[1.3, 0, 0.2]} c={wrap} />
      <Part g="capsule" a={[0.08, 0.26]} p={[-0.3, 0.62, 0.2]} r={[1.3, 0, -0.2]} c={wrap} />
      <Part g="sphere" a={[0.42]} p={[0, 1.15, 0]} c={wrap} />
      {[[1.32, 0.395, 0.2], [0.99, 0.405, -0.2]].map(([y, rad, tilt]) => (
        <Part key={y} g="torus" a={[rad, 0.035]} p={[0, y, 0]} r={[Math.PI / 2 + tilt, 0, 0]} c={shade} noLine />
      ))}
      <Part g="sphere" a={[0.4]} p={[0, 1.17, 0.03]} s={[1, 0.35, 1]} c="#3a2a1e" noLine />
      <Eyes y={1.17} z={0.36} gap={0.15} size={0.09} iris="#7cffb0" />
      <Part g="box" a={[0.08, 0.45, 0.02]} p={[0.32, 0.9, 0.22]} r={[0.3, 0.4, 0.4]} c={wrap} />
      <Smile y={0.98} z={0.39} w={0.05} />
    </group>
  );
}

export function ChibiYeti() {
  const fur = '#f2f7ff';
  const tufts = [[0.45, 0.8, 0.15], [-0.45, 0.8, 0.15], [0.3, 0.35, 0.35], [-0.3, 0.35, 0.35], [0, 0.95, -0.35]];
  return (
    <group>
      <Feet c="#9fb8d8" gap={0.18} />
      <Part g="sphere" a={[0.55]} p={[0, 0.62, 0]} s={[1, 0.95, 0.9]} c={fur} />
      {tufts.map(([x, y, z], i) => <Part key={i} g="sphere" a={[0.16]} p={[x, y, z]} c={fur} />)}
      <Part g="capsule" a={[0.12, 0.25]} p={[0.55, 0.62, 0.1]} r={[0, 0, 0.5]} c={fur} />
      <Part g="capsule" a={[0.12, 0.25]} p={[-0.55, 0.62, 0.1]} r={[0, 0, -0.5]} c={fur} />
      <Part g="sphere" a={[0.44]} p={[0, 1.25, 0]} c={fur} />
      <Part g="sphere" a={[0.3]} p={[0, 1.2, 0.2]} s={[1.1, 0.95, 0.6]} c="#8ab4e8" />
      <Part g="cone" a={[0.06, 0.18]} p={[0.26, 1.62, 0]} r={[0, 0, -0.4]} c="#cfd8e8" />
      <Part g="cone" a={[0.06, 0.18]} p={[-0.26, 1.62, 0]} r={[0, 0, 0.4]} c="#cfd8e8" />
      <Eyes y={1.26} z={0.37} gap={0.12} size={0.09} iris="#2a6ad0" />
      <Smile y={1.06} z={0.4} w={0.08} open />
      <Part g="box" a={[0.05, 0.05, 0.02]} p={[0.03, 1.1, 0.42]} c="#ffffff" noLine />
      <Blush y={1.12} z={0.36} gap={0.22} />
    </group>
  );
}

export function ChibiSkeleton() {
  const bone = '#f4ecd8';
  return (
    <group>
      <Feet c={bone} gap={0.1} />
      <Part g="cyl" a={[0.035, 0.035, 0.5]} p={[0.1, 0.3, 0]} c={bone} />
      <Part g="cyl" a={[0.035, 0.035, 0.5]} p={[-0.1, 0.3, 0]} c={bone} />
      <Part g="capsule" a={[0.2, 0.22]} p={[0, 0.66, 0]} c="#3a2a5a" />
      <Part g="sphere" a={[0.12]} p={[0, 0.72, 0.14]} s={[1, 1.4, 0.4]} c="#ffffff" noLine />
      <Part g="cone" a={[0.07, 0.14]} p={[0.07, 0.86, 0.2]} r={[0, 0, Math.PI / 2]} c="#e0203a" />
      <Part g="cone" a={[0.07, 0.14]} p={[-0.07, 0.86, 0.2]} r={[0, 0, -Math.PI / 2]} c="#e0203a" />
      <Part g="capsule" a={[0.05, 0.28]} p={[0.28, 0.68, 0.12]} r={[0.9, 0, 0.3]} c={bone} />
      <Part g="capsule" a={[0.05, 0.28]} p={[-0.28, 0.68, 0.05]} r={[0.2, 0, -0.35]} c={bone} />
      {/* service bell in the right hand */}
      <Part g="sphere" a={[0.1]} p={[0.32, 0.72, 0.42]} s={[1, 0.8, 1]} c="#ffc94a" glow="#ff9d00" />
      {/* skull */}
      <Part g="sphere" a={[0.44]} p={[0, 1.22, 0]} s={[1.05, 1, 1]} c={bone} />
      <Part g="sphere" a={[0.26]} p={[0, 0.97, 0.1]} s={[1.05, 0.6, 1]} c="#e6dcc4" />
      {[-0.08, -0.027, 0.027, 0.08].map(x => <Part key={x} g="box" a={[0.04, 0.06, 0.03]} p={[x, 0.95, 0.35]} c="#ffffff" noLine />)}
      {[0.16, -0.16].map(x => (
        <group key={x}>
          <Part g="sphere" a={[0.14]} p={[x, 1.2, 0.36]} s={[1, 1.2, 0.45]} c="#2a1a3a" noLine />
          <Part g="sphere" a={[0.045]} p={[x + 0.02, 1.22, 0.43]} c="#7fffd4" glow="#3fffc0" noLine />
          <Part g="sphere" a={[0.018]} p={[x + 0.045, 1.26, 0.45]} c="#ffffff" noLine />
        </group>
      ))}
      <Part g="cone" a={[0.05, 0.08]} p={[0, 1.05, 0.42]} r={[Math.PI, 0, 0]} c="#2a1a3a" noLine />
      <Part g="sphere" a={[0.2]} p={[0, 1.34, 0.22]} s={[1.6, 0.35, 0.6]} c="#e6dcc4" noLine />
      {/* top hat */}
      <Part g="cyl" a={[0.3, 0.3, 0.035]} p={[0.04, 1.58, 0]} r={[0, 0, -0.15]} c="#221a33" />
      <Part g="cyl" a={[0.19, 0.2, 0.34]} p={[0.07, 1.76, 0]} r={[0, 0, -0.15]} c="#221a33" />
      <Part g="cyl" a={[0.205, 0.205, 0.07]} p={[0.055, 1.64, 0]} r={[0, 0, -0.15]} c="#7a3ac0" />
    </group>
  );
}

export const CHIBI_LINEUP = [ChibiGhost, ChibiVampire, ChibiMummy, ChibiYeti, ChibiSkeleton];
