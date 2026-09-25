"""
Shared Blender (bpy) helpers for the sprite pipeline: import the exported
hotel model, give it the soft "tycoon render" treatment (bevelled edges,
matte materials, glowing emitters), and set up the isometric camera, night
lighting and Cycles.

Coordinates: glTF (three.js) is Y-up; the importer maps (x, y, z) to Blender
(x, -z, y). The game camera looks from +x/+z, i.e. Blender +X/-Y, from above.
"""
import math

import bmesh
import bpy
from mathutils import Vector

# classic 2:1 isometric view: 30° elevation, 45° yaw
CAM_ROT = (math.radians(60), 0.0, math.radians(45))
# pixels per world unit horizontally = TILE_W / sqrt(2); TILE_W is the width
# of one floor tile's diamond on the sprite sheet
TILE_W = 96
PPU = TILE_W / math.sqrt(2)


def hex_lin(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_model(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


def soften(objects, bevel=0.022):
    """Merge split vertices, bevel hard edges, matte materials, stronger glow."""
    meshes = {o.data for o in objects if o.type == 'MESH'}
    for me in meshes:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
        bm.to_mesh(me)
        bm.free()
        for p in me.polygons:
            p.use_smooth = False
    for o in objects:
        if o.type != 'MESH':
            continue
        dims = o.dimensions
        if min(dims) > 0.02:
            m = o.modifiers.new('bevel', 'BEVEL')
            m.width = min(bevel, min(dims) * 0.2)
            m.segments = 2
            m.limit_method = 'ANGLE'
            m.harden_normals = False
    for mat in bpy.data.materials:
        # every material is adjusted exactly once, however often we import
        if not mat.use_nodes or mat.get('softened'):
            continue
        mat['softened'] = True
        b = mat.node_tree.nodes.get('Principled BSDF')
        if not b:
            continue
        b.inputs['Roughness'].default_value = 0.82
        b.inputs['Metallic'].default_value = 0.0
        # only glTF emissive materials (strength > 0) glow; Blender's default
        # emission colour is white with strength 0
        strength = b.inputs['Emission Strength']
        em = b.inputs['Emission Color']
        linked = em.is_linked
        if strength.default_value > 0 and (linked or sum(em.default_value[:3]) > 0.01):
            strength.default_value *= 4.0
        else:
            strength.default_value = 0.0


def setup_render(samples=64, transparent=True):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.render.film_transparent = transparent
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'


def setup_lights(palette):
    """Moonlight key + dim night sky; windows, candles and pumpkins emit the rest."""
    sc = bpy.context.scene
    sun_data = bpy.data.lights.new('Moon', 'SUN')
    sun_data.energy = palette.get('moon_energy', 1.6)
    sun_data.color = hex_lin(palette.get('key', '#c8c8ff'))
    sun_data.angle = math.radians(14)
    sun = bpy.data.objects.new('Moon', sun_data)
    sc.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(38), math.radians(-12), math.radians(-58))

    world = bpy.data.worlds.new('World')
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (*hex_lin(palette.get('sky', '#3a3470')), 1.0)
    bg.inputs['Strength'].default_value = palette.get('sky_strength', 0.9)


def make_camera(target, ortho_scale):
    sc = bpy.context.scene
    data = bpy.data.cameras.new('IsoCam')
    data.type = 'ORTHO'
    data.ortho_scale = ortho_scale
    cam = bpy.data.objects.new('IsoCam', data)
    sc.collection.objects.link(cam)
    cam.rotation_euler = CAM_ROT
    view_dir = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1))
    cam.location = Vector(target) - view_dir * 80
    data.clip_end = 400
    sc.camera = cam
    return cam
