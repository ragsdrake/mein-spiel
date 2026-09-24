/**
 * Cinematic post-processing ("Ultra" quality): bloom on everything that
 * glows, ACES tone mapping, subtle vignette and SMAA anti-aliasing.
 * Takes over rendering from react-three-fiber while mounted.
 */

import { useFrame, useThree } from '@react-three/fiber';
import {
  BloomEffect, EffectComposer, EffectPass, HueSaturationEffect, RenderPass, SMAAEffect,
  ToneMappingEffect, ToneMappingMode, VignetteEffect,
} from 'postprocessing';
import { useEffect, useMemo } from 'react';
import { HalfFloatType, NoToneMapping } from 'three';

export default function PostFX() {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { frameBufferType: HalfFloatType });
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new EffectPass(
      camera,
      new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.8, luminanceSmoothing: 0.2, intensity: 1.25, radius: 0.72 }),
      new HueSaturationEffect({ saturation: 0.12 }),
      new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
      new VignetteEffect({ offset: 0.32, darkness: 0.62 }),
      new SMAAEffect(),
    ));
    return c;
  }, [gl, scene, camera]);

  // the composer does tone mapping itself
  useEffect(() => {
    const prev = gl.toneMapping;
    gl.toneMapping = NoToneMapping;
    return () => { gl.toneMapping = prev; };
  }, [gl]);

  useEffect(() => composer.setSize(size.width, size.height), [composer, size]);
  useEffect(() => () => composer.dispose(), [composer]);

  useFrame((_, dt) => composer.render(dt), 1);
  return null;
}
