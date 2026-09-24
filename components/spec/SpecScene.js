/**
 * Engine-spec showcase scene ("Hyper-Casual Low-Poly 3D"):
 *  - strict orthographic camera, isometric: yaw 45°, pitch −35.26°;
 *    zoom = orthographic size (half the visible height), pan on X/Z
 *  - flat-shaded low-poly geometry, simple Lambert / unlit solid colours,
 *    no PBR, no UV textures, no shadow maps (cheap blob shadows instead)
 *  - everything placed on a 1×1 grid via cell()
 *  - world-space billboard UI (./worldUi)
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry, Color, MeshBasicMaterial, MeshLambertMaterial, Object3D,
} from 'three';
import { Canvas } from '../scene/GLCanvas';
import { LevelBadge, MoneyPopups, ProgressBar, UpgradeArrow, Zzz } from './worldUi';

// ─── grid ────────────────────────────────────────────────────────────────────
export const GRID = { w: 16, d: 16, cell: 1 };
/** Centre of grid cell (gx, gz) in world units. */
const cell = (gx, gz, y = 0) => [gx * GRID.cell + GRID.cell / 2, y, gz * GRID.cell + GRID.cell / 2];

// ─── materials: simple Lambert (lit) or Basic (unlit), solid colours ──────────
const matCache = new Map();
export const lam = (c) => {
  if (!matCache.has(c)) matCache.set(c, new MeshLambertMaterial({ color: c, flatShading: true }));
  return matCache.get(c);
};
const unlit = (c, opacity) => {
  const k = `u${c}${opacity}`;
  if (!matCache.has(k)) matCache.set(k, new MeshBasicMaterial({ color: c, transparent: opacity != null, opacity: opacity ?? 1, depthWrite: opacity == null }));
  return matCache.get(k);
};

const B = ({ p, s, c, r, mat }) => (
  <mesh position={p} rotation={r} material={mat ?? lam(c)}><boxGeometry args={s} /></mesh>
);
const Cy = ({ p, rt, rb, h, seg = 6, c, r }) => (
  <mesh position={p} rotation={r} material={lam(c)}><cylinderGeometry args={[rt, rb ?? rt, h, seg]} /></mesh>
);
const Co = ({ p, rad, h, seg = 5, c, r }) => (
  <mesh position={p} rotation={r} material={lam(c)}><coneGeometry args={[rad, h, seg]} /></mesh>
);
const Ico = ({ p, rad, c, s }) => (
  <mesh position={p} scale={s} material={lam(c)}><icosahedronGeometry args={[rad, 0]} /></mesh>
);
/** Cheap contact shadow instead of shadow maps. */
const Blob = ({ p, size = 0.8 }) => (
  <mesh position={[p[0], 0.051, p[2]]} rotation={[-Math.PI / 2, 0, 0]} material={unlit('#000000', 0.18)}>
    <circleGeometry args={[size / 2, 8]} />
  </mesh>
);

// ─── orthographic camera rig ─────────────────────────────────────────────────
export const rig = { x: 6.6, z: 7.4, size: 10.5, pitchDeg: -35.264, yawDeg: 45 };

function OrthoRig() {
  const { camera, size } = useThree();
  useFrame(() => {
    const aspect = size.width / size.height;
    // zoom = orthographic size (half visible height), never camera distance
    camera.left = -rig.size * aspect;
    camera.right = rig.size * aspect;
    camera.top = rig.size;
    camera.bottom = -rig.size;
    camera.zoom = 1;
    camera.near = -100;
    camera.far = 200;
    camera.rotation.order = 'YXZ';
    camera.rotation.set((rig.pitchDeg * Math.PI) / 180, (rig.yawDeg * Math.PI) / 180, 0);
    // fixed distance along the view axis; only x/z of the target move (pan)
    camera.position.set(rig.x, 0, rig.z);
    camera.translateZ(40);
    camera.updateProjectionMatrix();
  });
  return null;
}

// ─── floor as one instanced mesh (grid lines = gaps between tiles) ───────────
function Tiles({ cells }) {
  const ref = useRef();
  const geo = useMemo(() => new BoxGeometry(0.96, 0.1, 0.96), []);
  useLayoutEffect(() => {
    const o = new Object3D();
    const c = new Color();
    cells.forEach(([gx, gz, col], i) => {
      o.position.set(...cell(gx, gz, 0));
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      ref.current.setColorAt(i, c.set(col));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, [cells]);
  return <instancedMesh ref={ref} args={[geo, lam('#ffffff'), cells.length]} />;
}

// ─── props (all on grid cells) ───────────────────────────────────────────────
function Coffin({ at }) {
  const [x, , z] = cell(...at);
  return (
    <group position={[x + 0.5, 0, z]}>
      <B p={[0, 0.25, 0]} s={[1.8, 0.4, 0.8]} c="#7a4a32" />
      <B p={[0, 0.46, 0]} s={[1.6, 0.04, 0.62]} c="#b04ac8" />
      <B p={[-0.62, 0.52, 0]} s={[0.26, 0.1, 0.44]} c="#ffffff" />
      <Blob p={[0, 0, 0]} size={1.9} />
    </group>
  );
}

function Tree({ at, s = 1 }) {
  const p = cell(...at);
  return (
    <group position={p} scale={s}>
      <Cy p={[0, 0.4, 0]} rt={0.1} rb={0.14} h={0.8} seg={5} c="#8a5a3a" />
      <Co p={[0, 1.1, 0]} rad={0.55} h={0.9} c="#3fb84a" />
      <Co p={[0, 1.55, 0]} rad={0.4} h={0.7} c="#52cc5a" />
      <Blob p={[0, 0, 0]} size={1.1} />
    </group>
  );
}

function Grave({ at }) {
  const p = cell(...at);
  return (
    <group position={p}>
      <B p={[0, 0.35, 0]} s={[0.5, 0.6, 0.14]} c="#b8b4c8" />
      <B p={[0, 0.68, 0]} s={[0.36, 0.1, 0.14]} c="#b8b4c8" />
      <Blob p={[0, 0, 0]} size={0.7} />
    </group>
  );
}

function Pumpkin({ at }) {
  const p = cell(...at);
  return (
    <group position={p}>
      <Ico p={[0, 0.22, 0]} rad={0.28} s={[1, 0.8, 1]} c="#ff8a1f" />
      <B p={[0, 0.46, 0]} s={[0.06, 0.12, 0.06]} c="#3f8a2a" />
      <Blob p={[0, 0, 0]} size={0.6} />
    </group>
  );
}

// ─── blocky characters: rudimentary translation / bob animation ──────────────
function Person({ skin = '#f2c9a0', shirt = '#4a8ae0', pants = '#34456b', hat }) {
  return (
    <group>
      <B p={[0.08, 0.2, 0]} s={[0.12, 0.4, 0.14]} c={pants} />
      <B p={[-0.08, 0.2, 0]} s={[0.12, 0.4, 0.14]} c={pants} />
      <B p={[0, 0.6, 0]} s={[0.34, 0.42, 0.22]} c={shirt} />
      <B p={[0.22, 0.6, 0]} s={[0.09, 0.34, 0.1]} c={shirt} />
      <B p={[-0.22, 0.6, 0]} s={[0.09, 0.34, 0.1]} c={shirt} />
      <B p={[0, 0.96, 0]} s={[0.32, 0.3, 0.28]} c={skin} />
      <B p={[0.07, 0.98, 0.145]} s={[0.05, 0.07, 0.01]} c="#241a30" />
      <B p={[-0.07, 0.98, 0.145]} s={[0.05, 0.07, 0.01]} c="#241a30" />
      {hat && <B p={[0, 1.16, 0]} s={[0.34, 0.1, 0.3]} c={hat} />}
    </group>
  );
}

function Ghost() {
  return (
    <group position={[0, 0.2, 0]}>
      <B p={[0, 0.62, 0]} s={[0.46, 0.5, 0.4]} c="#f4f8ff" />
      <B p={[0, 0.28, 0]} s={[0.52, 0.3, 0.44]} c="#f4f8ff" />
      {[-0.17, 0, 0.17].map(x => <B key={x} p={[x, 0.08, 0.05]} s={[0.14, 0.14, 0.34]} c="#f4f8ff" />)}
      <B p={[0.1, 0.66, 0.205]} s={[0.07, 0.1, 0.01]} c="#241a30" />
      <B p={[-0.1, 0.66, 0.205]} s={[0.07, 0.1, 0.01]} c="#241a30" />
    </group>
  );
}

/** Walks a closed loop of grid cells (pure translation + small bob). */
function Walker({ loop, speed = 1.4, offset = 0, children, float }) {
  const ref = useRef();
  const pts = useMemo(() => loop.map(([gx, gz]) => cell(gx, gz)), [loop]);
  const lens = useMemo(() => pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return Math.hypot(q[0] - p[0], q[2] - p[2]);
  }), [pts]);
  const total = lens.reduce((a, b) => a + b, 0);
  useFrame(({ clock }) => {
    let d = ((clock.elapsedTime * speed + offset) % total + total) % total;
    let i = 0;
    while (d > lens[i]) { d -= lens[i]; i++; }
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const t = d / lens[i];
    ref.current.position.set(a[0] + (b[0] - a[0]) * t, float ? 0.25 + Math.sin(clock.elapsedTime * 3) * 0.08 : Math.abs(Math.sin(clock.elapsedTime * 10)) * 0.05, a[2] + (b[2] - a[2]) * t);
    ref.current.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]);
  });
  return (
    <group ref={ref}>
      {children}
      <Blob p={[0, float ? -0.2 : 0, 0]} size={0.6} />
    </group>
  );
}

// ─── level layout (grid coordinates) ─────────────────────────────────────────
const ROOMS = [
  { at: [0, 1], level: 12, x0: 0 },
  { at: [4, 1], level: 7, x0: 4 },
  { at: [8, 1], level: 3, x0: 8 },
];

function buildCells() {
  const cells = [];
  for (let gx = -3; gx < 17; gx++) {
    for (let gz = -3; gz < 18; gz++) {
      const inside = gx >= 0 && gx < 12 && gz >= 0 && gz < 9;
      const inRoom = inside && gz < 3;
      const path = !inside && gx === 10 && gz >= 9;
      let col;
      if (inRoom) col = (gx + gz) % 2 ? '#d86ee8' : '#c95edc';
      else if (inside) col = (gx + gz) % 2 ? '#f0c890' : '#e6b87c';
      else if (path) col = '#d8d2e2';
      else col = (gx + gz) % 2 ? '#7cd46a' : '#72ca60';
      cells.push([gx, gz, col]);
    }
  }
  return cells;
}

function Hotel() {
  const cells = useMemo(buildCells, []);
  return (
    <group>
      <B p={[6.5, -0.2, 7.5]} s={[21, 0.3, 22]} c="#4a3a5a" />
      <Tiles cells={cells} />
      {/* back + left walls on grid edges */}
      <B p={[6, 1.2, -0.1]} s={[12, 2.4, 0.2]} c="#9d93dc" />
      <B p={[-0.1, 1.2, 4.5]} s={[0.2, 2.4, 9]} c="#8c82cc" />
      <B p={[6, 2.45, -0.1]} s={[12.2, 0.14, 0.34]} c="#ff8a3d" />
      <B p={[-0.1, 2.45, 4.5]} s={[0.34, 0.14, 9.2]} c="#ff8a3d" />
      {/* room dividers on grid lines */}
      {[4, 8, 12].map(x => <B key={x} p={[x, 0.5, 1.5]} s={[0.14, 1, 3]} c="#b0a8e4" />)}
      <B p={[6, 0.5, 3]} s={[12, 1, 0.14]} c="#b0a8e4" />
      {/* windows (unlit = glowing) */}
      {[2, 6, 10].map(x => <B key={x} p={[x, 1.6, 0.01]} s={[1, 0.8, 0.04]} mat={unlit('#ffe07a')} />)}
      {ROOMS.map(r => <Coffin key={r.x0} at={[r.x0 + 1, 1]} />)}
      {/* reception desk + bar counter */}
      <B p={[9.5, 0.45, 6.5]} s={[3, 0.9, 0.9]} c="#c07a48" />
      <B p={[9.5, 0.92, 6.5]} s={[3.1, 0.08, 1]} c="#ff8a3d" />
      <B p={[3, 0.45, 5.5]} s={[4, 0.9, 0.9]} c="#c07a48" />
      <B p={[3, 0.92, 5.5]} s={[4.1, 0.08, 1]} c="#2ecc8a" />
      {[1.5, 2.5, 3.5, 4.5].map(x => <Cy key={x} p={[x, 0.3, 6.5]} rt={0.18} h={0.6} c="#ff5a8a" />)}
      <Cy p={[4.5, 1.1, 5.5]} rt={0.25} rb={0.2} h={0.35} seg={8} c="#3a3440" />
      <Cy p={[4.5, 1.29, 5.5]} rt={0.22} h={0.02} seg={8} c="#6aff8a" />
      {/* garden */}
      <Tree at={[1, 11]} /><Tree at={[13, 10]} s={1.2} /><Tree at={[14, 14]} /><Tree at={[3, 15]} s={0.9} />
      <Grave at={[4, 11]} /><Grave at={[6, 12]} /><Grave at={[2, 13]} />
      <Pumpkin at={[8, 11]} /><Pumpkin at={[12, 12]} /><Pumpkin at={[7, 14]} />
      {[...Array(12)].map((_, i) => <B key={i} p={[i + 0.5, 0.35, 16]} s={[0.08, 0.6, 0.08]} c="#5a4a6a" />)}
      <B p={[6, 0.5, 16]} s={[12, 0.06, 0.06]} c="#5a4a6a" />
    </group>
  );
}

function Actors() {
  return (
    <group>
      <Walker loop={[[10, 16], [10, 10], [10, 8], [7, 7], [4, 7], [4, 4], [10, 4], [10, 16]]} speed={1.3}>
        <Person shirt="#2a2440" skin="#ece4f4" hat="#1a1424" />
      </Walker>
      <Walker loop={[[10, 17], [10, 9], [6, 8], [2, 8], [2, 4], [6, 4], [10, 9], [10, 17]]} speed={1.1} offset={9}>
        <Person shirt="#efe3c4" pants="#efe3c4" skin="#efe3c4" />
      </Walker>
      <Walker loop={[[3, 7], [8, 7], [8, 4], [3, 4]]} speed={0.9} float>
        <Ghost />
      </Walker>
      <Walker loop={[[5, 9], [11, 9], [11, 7], [5, 7]]} speed={1.2} offset={4}>
        <Person shirt="#4ab0e0" pants="#34456b" skin="#8ab4e8" />
      </Walker>
      {/* staff (static, rudimentary idle) */}
      <group position={cell(9, 7)} rotation={[0, Math.PI, 0]}><Person shirt="#3a2a5a" skin="#f4ecd8" hat="#1a1424" /></group>
      <group position={cell(3, 4)}><Person shirt="#6a3a9a" skin="#8fd16a" hat="#2a1a3a" /></group>
      {/* sleeping ghost above coffin 1 */}
      <group position={[1.5 + 0.5, 0.35, 1.5]}><Ghost /></group>
    </group>
  );
}

function WorldUi() {
  const moneySources = useMemo(() => [
    [2, 1.3, 1.5], [6, 1.3, 1.5], [10, 1.3, 1.5], [3, 1.4, 5.5], [9.5, 1.4, 6.5],
  ], []);
  return (
    <group>
      {ROOMS.map((r, i) => (
        <group key={r.x0}>
          <LevelBadge position={[r.x0 + 2, 2.6, 1.5]} level={r.level} />
          <ProgressBar position={[r.x0 + 2, 2.2, 1.5]} period={3 + i} offset={i * 1.3} />
        </group>
      ))}
      <Zzz position={[2.2, 1.6, 1.5]} />
      <UpgradeArrow position={[6, 3.3, 1.5]} />
      <UpgradeArrow position={[3, 2.2, 5.5]} />
      <LevelBadge position={[9.5, 2.0, 6.5]} level={5} />
      <ProgressBar position={[9.5, 1.6, 6.5]} period={2.2} color="#3aa0ff" />
      <MoneyPopups sources={moneySources} />
    </group>
  );
}

export default function SpecScene() {
  return (
    <Canvas orthographic flat dpr={[1, 2]} gl={{ antialias: true }} style={{ flex: 1 }}>
      <color attach="background" args={['#5bb8f0']} />
      <OrthoRig />
      <hemisphereLight args={['#ffffff', '#8a8ab0', 1.6]} />
      <directionalLight position={[8, 20, 12]} intensity={1.6} />
      <Hotel />
      <Actors />
      <WorldUi />
    </Canvas>
  );
}

