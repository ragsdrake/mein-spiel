/**
 * The 3D view: isometric orthographic camera, moody night lighting,
 * the hotel, its inhabitants — and the simulation clock (one step per frame).
 */

import { useFrame, useThree } from '@react-three/fiber';
import { Platform, StyleSheet, View } from 'react-native';
import { cam, FIT_WIDTH } from '../../game/camera';
import { step } from '../../game/sim';
import Actors from './Actors';
import DevProbe from './DevProbe';
import { Canvas } from './GLCanvas';
import Hotel from './Hotel';

const BG = '#171230';
const CAM_DIST = 40;

function CameraRig() {
  const { camera, size } = useThree();
  useFrame((_, dt) => {
    step(dt);
    camera.position.set(cam.x + CAM_DIST, CAM_DIST * 1.02, cam.z + CAM_DIST);
    camera.lookAt(cam.x, 0, cam.z);
    const zoom = (size.width / FIT_WIDTH) * cam.zoom;
    if (Math.abs(camera.zoom - zoom) > 1e-3) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function Lights() {
  const shadows = Platform.OS === 'web';
  return (
    <group>
      <hemisphereLight args={['#9d8cff', '#3a2436', 1.1]} />
      <ambientLight color="#5b4a8a" intensity={0.55} />
      <directionalLight
        position={[18, 26, 12]}
        intensity={1.6}
        color="#ffe2c4"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0015}
      />
      {/* warm candle light in the lounge + reception, green glow at the bar */}
      <pointLight position={[6.5, 2.2, 10]} color="#ffae5b" intensity={14} distance={9} decay={1.6} />
      <pointLight position={[10.5, 2.2, 9.6]} color="#ffae5b" intensity={10} distance={7} decay={1.6} />
      <pointLight position={[8.4, 1.8, 4.3]} color="#58ff7a" intensity={8} distance={6} decay={1.6} />
      <pointLight position={[12.8, 2, 13]} color="#ff9a3b" intensity={10} distance={7} decay={1.6} />
    </group>
  );
}

export default function HotelScene() {
  return (
    <View style={styles.wrap}>
      <Canvas
        orthographic
        shadows={Platform.OS === 'web'}
        camera={{ position: [CAM_DIST, CAM_DIST, CAM_DIST], zoom: 30, near: 0.1, far: 300 }}
        style={styles.canvas}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 78, 130]} />
        <CameraRig />
        <Lights />
        <Hotel />
        <Actors />
        {__DEV__ && <DevProbe />}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { flex: 1, backgroundColor: BG },
  canvas: { flex: 1 },
});
