/**
 * Style study scene: the same guest-room corner with five characters,
 * rendered in one of the styles from ./styles. Used by app/stylelab.js to
 * produce side-by-side renders for art-direction decisions.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { NoToneMapping, ACESFilmicToneMapping, PCFSoftShadowMap } from 'three';
import { Canvas } from '../scene/GLCanvas';
import Character from '../scene/Characters';
import { HOTELS } from '../../game/hotels';
import Bed from '../scene/Beds';
import { ThemeContext } from '../scene/theme';
import { Box, M } from '../scene/primitives';
import { CHIBI_LINEUP } from './Chibi';
import Part from './Part';
import { STYLES, StyleContext } from './styles';

const [NACHTRUH, DRACULA, PYRAMIDE, EIS] = HOTELS;

/** Old (current game) models for the low-poly column. */
const OLD_LINEUP = [
  NACHTRUH.guests[0], DRACULA.guests[5], PYRAMIDE.guests[1], EIS.guests[3], NACHTRUH.staff.reception,
];

const SPOTS = [[1.9, 5.3], [3.1, 4.2], [4.3, 3.1], [5.5, 2.0], [6.7, 0.9]];

function Rig({ zoom }) {
  const { camera, size } = useThree();
  useFrame(() => {
    camera.position.set(4.4 + 30, 30 * 0.9, 3.4 + 30);
    camera.lookAt(4.4, 0.9, 3.4);
    camera.zoom = (size.width / 8.4) * zoom;
    camera.updateProjectionMatrix();
  });
  return null;
}

function Bob({ p, i, children }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 2 + i)) * 0.03;
  });
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, Math.PI / 4, 0]}>
      <group ref={ref}>{children}</group>
    </group>
  );
}

/** Room corner in smooth styles: flat colours, rounded props. */
function SmoothRoom() {
  return (
    <group>
      {Array.from({ length: 9 }, (_, i) => (
        <Part key={i} g="box" a={[0.98, 0.12, 7]} p={[i + 0.5, -0.06, 3.5]} c={i % 2 ? '#8a5236' : '#7a4630'} noLine />
      ))}
      <Part g="box" a={[9, 3.2, 0.3]} p={[4.5, 1.6, -0.15]} c="#7c6c9e" noLine />
      <Part g="box" a={[0.3, 3.2, 7]} p={[-0.15, 1.6, 3.5]} c="#6c5e8e" noLine />
      <Part g="box" a={[9.3, 0.25, 0.5]} p={[4.5, 3.25, -0.1]} c="#e0773a" />
      <Part g="box" a={[0.5, 0.25, 7.3]} p={[-0.1, 3.25, 3.5]} c="#e0773a" />
      {[2.2, 6.8].map(x => (
        <group key={x} position={[x, 2, 0.05]}>
          <Part g="box" a={[1.1, 1.3, 0.1]} c="#5a3322" />
          <Part g="box" a={[0.86, 1.06, 0.06]} p={[0, 0, 0.05]} c="#d9a8ff" glow="#b06bff" noLine />
          <Part g="box" a={[0.08, 1.06, 0.05]} p={[0, 0, 0.1]} c="#5a3322" noLine />
        </group>
      ))}
      <Part g="cyl" a={[1.6, 1.6, 0.04]} p={[4.3, 0.02, 3.2]} s={[1.3, 1, 0.9]} c="#6e2f7a" noLine />
      {/* coffin bed */}
      <group position={[4.4, 0, 0.9]}>
        <Part g="box" a={[2, 0.45, 0.8]} p={[0, 0.25, 0]} c="#4a2a22" />
        <Part g="box" a={[1.8, 0.06, 0.64]} p={[0, 0.5, 0]} c="#9b3fc0" noLine />
        <Part g="capsule" a={[0.12, 0.3]} p={[-0.7, 0.58, 0]} r={[Math.PI / 2, 0, 0]} c="#fff0fa" />
      </group>
      <group position={[0.8, 0, 2.8]}>
        <Part g="cyl" a={[0.25, 0.3, 0.7]} p={[0, 0.35, 0]} c="#5a3322" />
        <Part g="cyl" a={[0.06, 0.06, 0.25]} p={[0, 0.83, 0]} c="#fff4dc" />
        <Part g="sphere" a={[0.06]} p={[0, 1.0, 0]} s={[1, 1.6, 1]} c="#ffd36b" glow="#ffa53b" noLine />
      </group>
    </group>
  );
}

/** Same corner with the current game's textured low-poly props. */
function LowpolyRoom() {
  return (
    <ThemeContext.Provider value={NACHTRUH}>
      <Box p={[4.5, -0.06, 3.5]} s={[9, 0.12, 7]} mat={M('#7a4a33', { tx: 'planks', rx: 4.5, ry: 3.5, bump: 1.2 })} cast={false} />
      <Box p={[4.5, 1.6, -0.15]} s={[9, 3.2, 0.3]} mat={M('#8a7f9c', { tx: 'bricks', rx: 4.5, ry: 1.6, bump: 2 })} />
      <Box p={[-0.15, 1.6, 3.5]} s={[0.3, 3.2, 7]} mat={M('#8a7f9c', { tx: 'bricks', rx: 3.5, ry: 1.6, bump: 2 })} />
      <Box p={[4.5, 3.25, -0.1]} s={[9.3, 0.25, 0.5]} c="#d0662f" />
      <Box p={[-0.1, 3.25, 3.5]} s={[0.5, 0.25, 7.3]} c="#d0662f" />
      {[2.2, 6.8].map(x => (
        <group key={x} position={[x, 2, 0.05]}>
          <Box s={[1.1, 1.3, 0.1]} c="#5c2f1d" />
          <Box p={[0, 0, 0.04]} s={[0.86, 1.06, 0.06]} mat={M('#c58bff', { emissive: '#a45bff', intensity: 1.6 })} />
        </group>
      ))}
      <group position={[4.4, 0.03, 0.9]}><Bed kind="coffin" level={4} /></group>
    </ThemeContext.Provider>
  );
}

function Lights({ sid }) {
  const toon = sid === 'toon' || sid === 'ink';
  return (
    <group>
      <hemisphereLight args={[toon ? '#ffffff' : '#b0a0ff', '#402a40', toon ? 0.9 : 1.1]} />
      <ambientLight intensity={toon ? 0.6 : 0.35} color="#8070b0" />
      <directionalLight
        position={[14, 22, 12]} intensity={toon ? 2.2 : 1.8} color="#ffe6cf" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10}
        shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-0.001} shadow-normalBias={0.02}
      />
      {!toon && <directionalLight position={[-10, 8, 16]} intensity={0.7} color="#9fb4ff" />}
      <pointLight position={[0.8, 1.6, 2.8]} color="#ffae5b" intensity={toon ? 4 : 8} distance={6} decay={1.5} />
      <pointLight position={[4.5, 2.2, 1]} color="#c58bff" intensity={toon ? 3 : 6} distance={6} decay={1.5} />
    </group>
  );
}

export default function StyleLab({ style = 'toon', zoom = 1, bg = '#2a1f48' }) {
  const s = STYLES[style] ?? STYLES.toon;
  const toon = s.id === 'toon' || s.id === 'ink';
  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      shadows={{ type: PCFSoftShadowMap }}
      gl={{ antialias: true, toneMapping: toon ? NoToneMapping : ACESFilmicToneMapping }}
      camera={{ position: [30, 30, 30], zoom: 60, near: 0.1, far: 200 }}
      style={{ flex: 1 }}
    >
      <color attach="background" args={[bg]} />
      <StyleContext.Provider value={s}>
        <Rig zoom={zoom} />
        <Lights sid={s.id} />
        {s.id === 'lowpoly' ? <LowpolyRoom /> : <SmoothRoom />}
        {SPOTS.map((p, i) => {
          const Chibi = CHIBI_LINEUP[i];
          return (
            <Bob key={i} p={p} i={i}>
              {s.id === 'lowpoly'
                ? <group scale={1.15}><Character def={OLD_LINEUP[i]} /></group>
                : <Chibi />}
            </Bob>
          );
        })}
      </StyleContext.Provider>
    </Canvas>
  );
}
