/** One mesh of a model: picks material + optional ink outline from the active style. */

import { outlineMat, seg, styleMat, useStyle } from './styles';

function Geo({ g, a, sid }) {
  switch (g) {
    case 'sphere':  return <sphereGeometry args={[a[0], seg(sid, 8, 40), seg(sid, 6, 28)]} />;
    case 'capsule': return <capsuleGeometry args={[a[0], a[1], seg(sid, 3, 10), seg(sid, 8, 28)]} />;
    case 'cyl':     return <cylinderGeometry args={[a[0], a[1], a[2], seg(sid, 8, 32), 1, a[3] ?? false]} />;
    case 'cone':    return <coneGeometry args={[a[0], a[1], seg(sid, 6, 24)]} />;
    case 'box':     return <boxGeometry args={a} />;
    case 'torus':   return <torusGeometry args={[a[0], a[1], seg(sid, 5, 14), seg(sid, 10, 36), a[2] ?? Math.PI * 2]} />;
    default:        return null;
  }
}

/**
 * <Part g="sphere" a={[r]} p={[x,y,z]} s={[sx,sy,sz]} r={[rx,ry,rz]} c="#fff" />
 * `geometry` may be passed instead of g/a for custom shapes. `noLine` skips the outline
 * (eyes, highlights), `glow` makes the part emissive.
 */
export default function Part({ g, a = [0.5], geometry, p, s, r, c = '#ffffff', glow, noLine, opacity, rough, shadow = true }) {
  const style = useStyle();
  const mat = styleMat(style.id, c, { glow, opacity, rough });
  const t = style.outline;
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh material={mat} geometry={geometry} castShadow={shadow} receiveShadow>
        {!geometry && <Geo g={g} a={a} sid={style.id} />}
      </mesh>
      {t > 0 && !noLine && (
        <mesh material={outlineMat(t)} geometry={geometry}>
          {!geometry && <Geo g={g} a={a} sid={style.id} />}
        </mesh>
      )}
    </group>
  );
}
