/**
 * The 3D view: isometric orthographic camera, per-hotel lighting and
 * atmosphere, the hotel and its inhabitants — and the simulation clock.
 * Graphics quality (Niedrig … Ultra) decides resolution, shadows,
 * particles and post-processing.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { PCFSoftShadowMap } from 'three';
import { cam, FIT_WIDTH } from '../../game/camera';
import { intro as introGate } from '../../game/fx';
import { getHotel } from '../../game/hotels';
import { QUALITY } from '../../game/quality';
import { step } from '../../game/sim';
import useHotel from '../../game/store';
import Actors from './Actors';
import { easeInOutCubic } from './anim';
import DevProbe from './DevProbe';
import { EventFx, FxLayer } from './Fx';
import { Canvas } from './GLCanvas';
import Hotel from './Hotel';
import Particles from './Particles';
import PostFX from './PostFX';
import { flickerMaterials } from './primitives';
import Sky from './Sky';
import { ThemeContext, useTheme } from './theme';

const CAM_DIST = 40;
export const CAM_HEIGHT = 1.3;



function CameraRig() {
  const { camera, size } = useThree();
  const intro = useRef(0);
  const hotelId = useHotel(s => s.activeHotel);
  const roomCount = useHotel(s => s.hotels[s.activeHotel].rooms.length);
  // centre the view on the whole building when a hotel is entered (wings are wider)
  useEffect(() => {
    cam.x = roomCount > 6 ? 11.6 : 8.6;
    cam.z = roomCount > 8 ? 8 : roomCount > 6 ? 7.6 : 8.4;
    cam.zoom = roomCount > 6 ? 0.84 : 1;
    intro.current = 0;
  }, [hotelId, roomCount]);
  useFrame(({ clock }, dt) => {
    introGate.frames += 1;
    step(dt);
    const t = clock.elapsedTime;
    flickerMaterials(t);

    // intro swoop whenever a hotel is (re)entered: the camera circles in from
    // the side, high up and zoomed out, while the hotel builds itself
    intro.current = introGate.hold ? 0 : Math.min(1, intro.current + Math.min(dt, 1 / 30) / 2.6);
    const e = easeInOutCubic(intro.current);
    const introZoom = 0.62 + 0.38 * e;
    const yaw = (1 - e) * 0.85;
    const lift = 1 + (1 - e) * 0.7;

    // steeper tycoon view (~42.6° pitch): more floor, less wall
    camera.position.set(
      cam.x + CAM_DIST * (Math.cos(yaw) + Math.sin(yaw)),
      CAM_DIST * CAM_HEIGHT * lift,
      cam.z + CAM_DIST * (Math.cos(yaw) - Math.sin(yaw)),
    );
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
  // plus a flat fill. The hotels are night scenes: cool moonlight as the key,
  // lower fill, and the warm glow comes from emissive windows and lanterns.
  return (
    <group>
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, palette.light?.hemi ?? 0.75]} />
      <ambientLight intensity={palette.light?.ambient ?? 0.55} />
      <directionalLight
        position={[12, 24, 3.5]}
        intensity={palette.light?.key ?? 2.3}
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

let lastWorldHotel = null;

function World({ hotelId, quality }) {
  const def = getHotel(hotelId);
  // entering another hotel: hold the build-up until its title card fades
  // (the card releases the gate); the very first mount waits for the splash
  useState(() => {
    if (lastWorldHotel && lastWorldHotel !== hotelId) introGate.hold = true;
    lastWorldHotel = hotelId;
  });
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
      <FxLayer />
      <EventFx />
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
