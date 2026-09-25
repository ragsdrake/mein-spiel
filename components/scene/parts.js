/**
 * Part tags for the sprite pipeline (tools/sprites). The 3D scene is the
 * modelling source; every tagged group becomes its own pre-rendered sprite,
 * everything untagged is baked into the hotel's backdrop image.
 *
 *  kind:    'sprite' – standing object, depth-sorted against characters
 *           'flat'   – lies on the floor (rugs), drawn before all sprites
 *           'decal'  – hangs on a back wall (paintings), drawn before sprites
 *           'auto'   – container: each direct child becomes a sprite if it
 *                      reaches into the front garden/street, else backdrop
 *  station: what decides its variant at runtime: 'room:3', 'bar',
 *           'attr:1' … (omitted = static)
 *
 * The names/extras travel through glTF to Blender untouched and cost nothing
 * in the game.
 */

export function Part({ id, kind = 'sprite', station, extra, children, ...rest }) {
  return (
    <group name={`part:${id}`} userData={{ part: id, kind, station: station ?? '', ...extra }} {...rest}>
      {children}
    </group>
  );
}
