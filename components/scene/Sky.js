/**
 * Backdrop: a camera-facing gradient sky, the moon with its halo, twinkling
 * stars and (for the ice palace) animated aurora ribbons.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three';
import { Ball, M, Sprite, rand } from './primitives';
import { useTheme } from './theme';

const SKY_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAG = `
uniform vec3 top;
uniform vec3 bottom;
varying vec2 vUv;
void main() {
  float t = smoothstep(0.0, 1.0, vUv.y);
  vec3 c = mix(bottom, top, t);
  // soft vignette towards the corners
  float v = 1.0 - 0.35 * length(vUv - vec2(0.5, 0.55));
  gl_FragColor = vec4(c * v, 1.0);
  #include <colorspace_fragment>
}`;

function Gradient() {
  const { palette } = useTheme();
  const { camera } = useThree();
  const ref = useRef();
  const mat = useMemo(() => new ShaderMaterial({
    uniforms: { top: { value: new Color(palette.skyTop) }, bottom: { value: new Color(palette.skyBottom) } },
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    depthWrite: false,
    fog: false,
  }), [palette.skyTop, palette.skyBottom]);

  useFrame(() => {
    if (!ref.current) return;
    // park the backdrop far behind the scene, always facing the camera
    const dir = camera.getWorldDirection(ref.current.position);
    ref.current.position.copy(camera.position).addScaledVector(dir, 250);
    ref.current.quaternion.copy(camera.quaternion);
  });

  return (
    <mesh ref={ref} material={mat} renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[400, 400]} />
    </mesh>
  );
}

function Stars() {
  const group = useRef();
  const stars = useMemo(() => Array.from({ length: 60 }, (_, i) => [
    -26 + rand(i) * 34, 7 + rand(i + 40) * 16, -26 + rand(i + 80) * 34, 0.06 + rand(i + 3) * 0.1, i,
  ]), []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((s, i) => {
      s.scale.setScalar(0.6 + Math.abs(Math.sin(clock.elapsedTime * (0.8 + (i % 5) * 0.3) + i)) * 0.8);
    });
  });
  return (
    <group ref={group}>
      {stars.map(([x, y, z, s, k]) => (
        <mesh key={k} position={[x, y, z]} material={M('#ffffff', { emissive: '#dfe8ff', intensity: 2.5 })}>
          <octahedronGeometry args={[s, 0]} />
        </mesh>
      ))}
    </group>
  );
}

function Moon() {
  const { palette } = useTheme();
  return (
    <group position={[-12, 17, -12]}>
      <Ball rad={2.4} w={16} hs={12} mat={M(palette.moon, { emissive: palette.moon, intensity: 1.6, smooth: true })} cast={false} />
      <Ball p={[0.6, 0.5, 1.6]} rad={0.5} w={8} hs={6} mat={M(palette.moon, { emissive: palette.moon, intensity: 1.1 })} cast={false} />
      <Ball p={[-0.8, -0.6, 1.7]} rad={0.35} w={8} hs={6} mat={M(palette.moon, { emissive: palette.moon, intensity: 1.1 })} cast={false} />
      <Sprite size={14} color={palette.moon} opacity={0.35} />
      <Sprite size={26} color={palette.moon} opacity={0.12} />
    </group>
  );
}

const AURORA_FRAG = `
uniform float time;
uniform vec3 colA;
uniform vec3 colB;
varying vec2 vUv;
void main() {
  float wave = sin(vUv.x * 12.0 + time * 0.8) * 0.12 + sin(vUv.x * 5.0 - time * 0.5) * 0.1;
  float band = smoothstep(0.0, 0.35, vUv.y + wave) * (1.0 - smoothstep(0.35, 1.0, vUv.y + wave));
  float streaks = 0.6 + 0.4 * sin(vUv.x * 80.0 + time * 2.0);
  vec3 c = mix(colA, colB, vUv.y);
  float edge = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
  gl_FragColor = vec4(c, band * streaks * edge * 0.55);
  #include <colorspace_fragment>
}`;

function Aurora() {
  const mats = useMemo(() => [['#3fffa0', '#6f7aff'], ['#4fd8ff', '#ff6ad8']].map(([a, b]) => new ShaderMaterial({
    uniforms: { time: { value: 0 }, colA: { value: new Color(a) }, colB: { value: new Color(b) } },
    vertexShader: SKY_VERT,
    fragmentShader: AURORA_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: false,
  })), []);
  useFrame(({ clock }) => {
    mats.forEach((m, i) => { m.uniforms.time.value = clock.elapsedTime + i * 3; });
  });
  return (
    <group>
      {/* far behind the hotel (x + y + z ≪ 0) and turned towards the camera */}
      <mesh position={[-16, 16, -18]} rotation={[0, Math.PI / 4, 0.08]} material={mats[0]}>
        <planeGeometry args={[60, 12, 1, 1]} />
      </mesh>
      <mesh position={[-22, 20, -16]} rotation={[0, Math.PI / 4, -0.06]} material={mats[1]}>
        <planeGeometry args={[50, 10, 1, 1]} />
      </mesh>
    </group>
  );
}

export default function Sky() {
  const { id } = useTheme();
  return (
    <group>
      <Gradient />
      <Stars />
      <Moon />
      {id === 'eispalast' && <Aurora />}
    </group>
  );
}
