/**
 * World-space ("holographic") UI for the engine-spec showcase:
 * billboards that always face the orthographic camera, level badges,
 * progress bars, Zzz symbols, upgrade arrows and rising money text.
 *
 * Labels are drawn once into small canvas textures (web). On native the
 * same components would use a pre-baked font atlas instead.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CanvasTexture, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three';

const FONT = '"Lilita One", "Arial Black", sans-serif';
const PLANE = new PlaneGeometry(1, 1);

// ─── tween curves (code-driven, no keyframes) ────────────────────────────────
export const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outBack:  (t, s = 1.9) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
};

// ─── canvas label textures ───────────────────────────────────────────────────
const texCache = new Map();

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Text (optionally on a rounded pill) rendered to a texture. Returns { tex, aspect }. */
export function labelTexture({ text, fg = '#ffffff', bg, stroke = '#1a1030', size = 64, padX = 26, padY = 12, radius = 26 }) {
  const key = `${text}|${fg}|${bg}|${stroke}|${size}`;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `${size}px ${FONT}`;
  const tw = Math.ceil(ctx.measureText(text).width);
  c.width = tw + padX * 2;
  c.height = size + padY * 2;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (bg) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, 2, 6, c.width - 4, c.height - 8, radius);
    ctx.fill();
    ctx.fillStyle = bg;
    roundRect(ctx, 2, 2, c.width - 4, c.height - 8, radius);
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = size * 0.16;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, c.width / 2, c.height / 2 - (bg ? 3 : 0));
  }
  ctx.fillStyle = fg;
  ctx.fillText(text, c.width / 2, c.height / 2 - (bg ? 3 : 0));
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const out = { tex, aspect: c.width / c.height };
  texCache.set(key, out);
  return out;
}

/** Circle icon (upgrade arrow) texture. */
function arrowTexture() {
  if (texCache.has('arrow')) return texCache.get('arrow');
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.arc(64, 70, 56, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2ecc5a';
  ctx.beginPath(); ctx.arc(64, 64, 56, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(64, 26); ctx.lineTo(96, 62); ctx.lineTo(76, 62); ctx.lineTo(76, 98);
  ctx.lineTo(52, 98); ctx.lineTo(52, 62); ctx.lineTo(32, 62); ctx.closePath(); ctx.fill();
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const out = { tex, aspect: 1 };
  texCache.set('arrow', out);
  return out;
}

const uiMat = (map, color) => new MeshBasicMaterial({
  map, color, transparent: true, depthTest: false, depthWrite: false,
});

// ─── billboard ───────────────────────────────────────────────────────────────
/** Keeps its children facing the (orthographic) camera every frame. */
export function Billboard({ position, children, bob = 0, speed = 3 }) {
  const ref = useRef();
  const { camera } = useThree();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.quaternion.copy(camera.quaternion);
    if (bob) ref.current.position.y = position[1] + Math.abs(Math.sin(clock.elapsedTime * speed + position[0])) * bob;
  });
  return <group ref={ref} position={position} renderOrder={10}>{children}</group>;
}

/** A flat textured quad inside a billboard (height in world units). */
function Quad({ tex, aspect, h = 0.4, y = 0, opacityRef }) {
  const mat = useMemo(() => uiMat(tex), [tex]);
  if (opacityRef) opacityRef.current = mat;
  return <mesh geometry={PLANE} material={mat} position={[0, y, 0]} scale={[h * aspect, h, 1]} renderOrder={10} />;
}

// ─── widgets ─────────────────────────────────────────────────────────────────
export function LevelBadge({ position, level }) {
  const { tex, aspect } = useMemo(() => labelTexture({ text: `LV ${level}`, bg: '#5b3fd6', size: 56 }), [level]);
  return (
    <Billboard position={position}>
      <Quad tex={tex} aspect={aspect} h={0.42} />
    </Billboard>
  );
}

/** Service timer bar; `period` seconds per fill. */
export function ProgressBar({ position, period = 4, offset = 0, color = '#39d353', w = 1.3 }) {
  const fill = useRef();
  const bg = useMemo(() => uiMat(null, '#1a1030'), []);
  const fg = useMemo(() => uiMat(null, color), [color]);
  useFrame(({ clock }) => {
    const p = ((clock.elapsedTime + offset) % period) / period;
    fill.current.scale.x = Math.max(0.001, p * (w - 0.08));
    fill.current.position.x = -(w - 0.08) / 2 + fill.current.scale.x / 2;
  });
  return (
    <Billboard position={position}>
      <mesh geometry={PLANE} material={bg} scale={[w, 0.2, 1]} renderOrder={10} />
      <mesh ref={fill} geometry={PLANE} material={fg} position={[0, 0, 0.01]} scale={[w - 0.08, 0.13, 1]} renderOrder={11} />
    </Billboard>
  );
}

export function Zzz({ position }) {
  const a = useMemo(() => labelTexture({ text: 'Z', fg: '#ffffff', stroke: '#3a3aa0', size: 60, padX: 8, padY: 6 }), []);
  const refs = [useRef(), useRef(), useRef()];
  useFrame(({ clock }) => {
    refs.forEach((r, i) => {
      if (!r.current) return;
      const t = (clock.elapsedTime * 0.5 + i / 3) % 1;
      r.current.position.set(t * 0.35, t * 0.7, 0);
      r.current.scale.setScalar(0.18 + t * 0.2);
      r.current.material.opacity = t < 0.8 ? 1 : (1 - t) / 0.2;
    });
  });
  const mats = useMemo(() => refs.map(() => uiMat(a.tex)), [a.tex]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Billboard position={position}>
      {refs.map((r, i) => (
        <mesh key={i} ref={r} geometry={PLANE} material={mats[i]} renderOrder={12} />
      ))}
    </Billboard>
  );
}

export function UpgradeArrow({ position }) {
  const { tex } = useMemo(() => arrowTexture(), []);
  return (
    <Billboard position={position} bob={0.18}>
      <Quad tex={tex} aspect={1} h={0.5} />
    </Billboard>
  );
}

/**
 * Pool of rising money labels. Every `every` seconds one spawns at a random
 * source, pops in with an overshoot (easeOutBack), rises (easeOutCubic) and fades.
 */
export function MoneyPopups({ sources, every = 0.7, life = 1.4 }) {
  const { camera } = useThree();
  const pool = useRef([...Array(10)].map(() => ({ t: -1, src: 0, amount: 0 })));
  const meshes = useRef([]);
  const clock = useRef(0);
  const amounts = [45, 120, 380, 95, 1250, 60];
  const textures = useMemo(() => amounts.map(a => labelTexture({
    text: `+$${a.toLocaleString('de-DE')}`, fg: '#5dff7a', stroke: '#0e3a1a', size: 72, padX: 16, padY: 8,
  })), []); // eslint-disable-line react-hooks/exhaustive-deps
  const mats = useMemo(() => pool.current.map(() => uiMat(null)), []);

  useFrame((_, dt) => {
    clock.current += dt;
    if (clock.current >= every) {
      clock.current = 0;
      const free = pool.current.find(p => p.t < 0);
      if (free) {
        free.t = 0;
        free.src = Math.floor(Math.random() * sources.length);
        free.amount = Math.floor(Math.random() * textures.length);
      }
    }
    pool.current.forEach((p, i) => {
      const m = meshes.current[i];
      if (!m) return;
      if (p.t < 0) { m.visible = false; return; }
      p.t += dt / life;
      if (p.t >= 1) { p.t = -1; m.visible = false; return; }
      const { tex, aspect } = textures[p.amount];
      if (mats[i].map !== tex) { mats[i].map = tex; mats[i].needsUpdate = true; }
      const [x, y, z] = sources[p.src];
      m.visible = true;
      m.position.set(x, y + ease.outCubic(p.t) * 1.4, z);
      m.quaternion.copy(camera.quaternion);
      const s = ease.outBack(Math.min(1, p.t / 0.25)) * 0.42;
      m.scale.set(s * aspect, s, 1);
      mats[i].opacity = p.t < 0.6 ? 1 : 1 - (p.t - 0.6) / 0.4;
    });
  });

  return pool.current.map((_, i) => (
    <mesh key={i} ref={el => { meshes.current[i] = el; }} geometry={PLANE} material={mats[i]} visible={false} renderOrder={13} />
  ));
}
