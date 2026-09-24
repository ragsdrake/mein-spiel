/**
 * The 3D view: isometric orthographic camera, per-hotel lighting and
 * atmosphere, the hotel and its inhabitants — and the simulation clock.
 * Graphics quality (Niedrig … Ultra) decides resolution, shadows,
 * particles and post-processing.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { PCFSoftShadowMap } from 'three';
import { cam, FIT_WIDTH } from '../../game/camera';
import { getHotel } from '../../game/hotels';
import { QUALITY } from '../../game/quality';
import { step } from '../../game/sim';
import useHotel from '../../game/store';
import Actors from './Actors';
import DevProbe from './DevProbe';
import { Canvas } from './GLCanvas';
import Hotel from './Hotel';
import Particles from './Particles';
import PostFX from './PostFX';
import { flickerMaterials } from './primitives';
import Sky from './Sky';
import { ThemeContext, useTheme } from './theme';

const CAM_DIST = 40;
export const CAM_HEIGHT = 1.3;


const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

function CameraRig() {
  const { camera, size } = useThree();
  const intro = useRef(0);
  useFrame(({ clock }, dt) => {
    step(dt);
    const t = clock.elapsedTime;
    flickerMaterials(t);

    // gentle zoom-in whenever a hotel is (re)entered
    intro.current = Math.min(1, intro.current + dt / 1.6);
    const introZoom = 0.72 + 0.28 * easeOutCubic(intro.current);

    // steeper tycoon view (~42.6° pitch): more floor, less wall
    camera.position.set(cam.x + CAM_DIST, CAM_DIST * CAM_HEIGHT, cam.z + CAM_DIST);
    camera.lookAt(cam.x, 0, cam.z);
    const zoom = (size.width / FIT_WIDTH) * cam.zoom * introZoom;
    if (Math.abs(camera.zoom - zoom) > 1e-3) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function Lights({ shadows }) {
  const { palette } = useTheme();
  // Classic three-tone tycoon shading: one strong sun from above/right so every
  // block shows a bright top, a mid-tone right side and a darker left side,
  // plus a flat fill. No point lights, no glow.
  return (
    <group>
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, 0.75]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[12, 24, 3.5]}
        intensity={2.3}
        color={palette.key}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0012}
        shadow-normalBias={0.03}
        shadow-radius={3}
      />
    </group>
  );
}

function World({ hotelId, quality }) {
  const def = getHotel(hotelId);
  const q = QUALITY[quality] ?? QUALITY.medium;
  return (
    <ThemeContext.Provider value={def}>
      <color attach="background" args={[def.palette.bg]} />
      <fog attach="fog" args={[def.palette.fog, 95, 170]} />
      <CameraRig key={hotelId} />
      <Lights shadows={q.shadows} />
      <Sky />
      <Hotel />
      <Actors />
      <Particles density={q.particles} />
      {q.post && <PostFX />}
      {__DEV__ && <DevProbe />}
    </ThemeContext.Provider>
  );
}

export default function HotelScene() {
  const hotelId = useHotel(s => s.activeHotel);
  const quality = useHotel(s => s.settings.quality);
  const q = QUALITY[quality] ?? QUALITY.medium;
  const bg = getHotel(hotelId).palette.bg;
  const dpr = Platform.OS === 'web' ? [1, q.dpr] : Math.min(q.dpr, 2);

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <Canvas
        key={quality}
        orthographic
        flat
        dpr={dpr}
        shadows={q.shadows ? { type: PCFSoftShadowMap } : false}
        gl={{ antialias: !q.post, powerPreference: 'high-performance' }}
        camera={{ position: [CAM_DIST, CAM_DIST, CAM_DIST], zoom: 30, near: 0.1, far: 400 }}
        style={styles.canvas}
      >
        <World key={hotelId} hotelId={hotelId} quality={quality} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { flex: 1 },
  canvas: { flex: 1 },
});
