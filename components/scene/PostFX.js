/**
 * Post-processing for "Ultra" quality: SMAA anti-aliasing plus a soft bloom
 * on the brightest emissive bits (windows, pumpkins, lanterns) for the
 * night scenes. No tone mapping.
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
      new BloomEffect({ intensity: 0.9, luminanceThreshold: 0.72, luminanceSmoothing: 0.2, mipmapBlur: true, radius: 0.6 }),
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
