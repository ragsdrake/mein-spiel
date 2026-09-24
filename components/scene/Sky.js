/**
 * Backdrop: a camera-facing gradient sky and the moon with its halo.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, ShaderMaterial } from 'three';
import { Ball, M, Sprite } from './primitives';
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

export default function Sky() {
  return (
    <group>
      <Gradient />
      <Moon />
    </group>
  );
}
