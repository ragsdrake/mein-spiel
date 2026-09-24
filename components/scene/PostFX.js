/**
 * Post-processing for "Ultra" quality: a light bloom on real light sources
 * and SMAA anti-aliasing (the flat tycoon look uses no tone mapping).
 * Takes over rendering from react-three-fiber while mounted.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect } from 'postprocessing';
import { useEffect, useMemo } from 'react';
import { HalfFloatType, NoToneMapping } from 'three';

export default function PostFX() {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { frameBufferType: HalfFloatType });
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new EffectPass(
      camera,
      // only real light sources (emissive > 1) glow; the rest stays crisp and flat
      new BloomEffect({ mipmapBlur: true, luminanceThreshold: 1.05, luminanceSmoothing: 0.1, intensity: 0.6, radius: 0.6 }),
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
