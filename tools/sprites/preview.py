"""
Preview render of a whole exported hotel (look development).
Usage: python preview.py <model.glb> <out.png> [size] [samples]
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
import bpy  # noqa: E402
import blender_common as bc  # noqa: E402

model, out = sys.argv[1], sys.argv[2]
size = int(sys.argv[3]) if len(sys.argv) > 3 else 1200
samples = int(sys.argv[4]) if len(sys.argv) > 4 else 64

bc.reset()
objs = bc.import_model(model)
bc.soften(objs)
bc.setup_render(samples, transparent=False)
bc.setup_lights({'key': '#cfc8ff', 'sky': '#4a4488', 'sky_strength': 1.3, 'moon_energy': 2.6})
# glTF (x, y, z) -> Blender (x, -z, y): hotel centre around x 9, z 9
bc.make_camera((8.5, -8.0, 0.0), 22)
sc = bpy.context.scene
sc.render.resolution_x = size
sc.render.resolution_y = size
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('rendered', out)
