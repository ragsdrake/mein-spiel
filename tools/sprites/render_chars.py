"""
Renders the character sheet of a hotel (every guest/staff model in every
pose and direction, see app/export.js ?chars=1) into sprites.

Usage: python render_chars.py <hotel-chars.glb> <hotel> <outDir> [--samples N]
Output: <outDir>/c/<id>-<pose>-<dir>.png and <outDir>/chars.json with the
        image offset relative to the character's foot point (px at TILE_W).
"""
import json
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import blender_common as bc  # noqa: E402
from render_hotel import LIGHTS, RIGHT, UP, meshes_under, screen_rect, set_region, world_bbox  # noqa: E402


def main():
    a = sys.argv[1:]
    samples = 32
    if '--samples' in a:
        i = a.index('--samples')
        samples = int(a[i + 1])
        a = a[:i] + a[i + 2:]
    glb, hotel, out = a
    os.makedirs(os.path.join(out, 'c'), exist_ok=True)
    t0 = time.time()
    bc.reset()
    objs = bc.import_model(glb)
    bc.soften(objs, bevel=0.012)
    bc.setup_render(samples, transparent=True)
    light = dict(LIGHTS.get(hotel, LIGHTS['nachtruh']))
    light['sky_strength'] = light['sky_strength'] * 1.4   # characters must read well
    bc.setup_lights(light)
    # soft fill from the camera side so faces are never black
    fill = bpy.data.lights.new('Fill', 'AREA')
    fill.energy = 250
    fill.size = 6
    fill_o = bpy.data.objects.new('Fill', fill)
    bpy.context.scene.collection.objects.link(fill_o)
    cam = bc.make_camera((0, 0, 0), 10)
    ppu = bc.PPU
    sc = bpy.context.scene
    sc.render.use_persistent_data = False

    parts = [o for o in objs if 'part' in o.keys()]
    meshes = {p['part']: meshes_under(p) for p in parts}
    all_meshes = [o for o in objs if o.type == 'MESH']
    sheet = {}
    for n, p in enumerate(parts):
        pid = p['part']
        ms = meshes[pid]
        for o in all_meshes:
            o.hide_render = True
        for o in ms:
            o.hide_render = False
        ox, oz = p['ox'], p['oz']
        foot = Vector((ox, -oz, 0))
        # fill light follows the character, in front of it towards the camera
        fill_o.location = foot + Vector((3, -3, 3))
        fill_o.rotation_euler = (math.radians(55), 0, math.radians(45))
        lo, hi = world_bbox(ms)
        rect = screen_rect(lo, hi, ppu, pad=2)
        set_region(cam, rect, ppu)
        sc.render.filepath = os.path.join(out, 'c', pid[len('char-'):] + '.png')
        bpy.ops.render.render(write_still=True)
        fx = RIGHT.dot(foot) * ppu
        fy = -UP.dot(foot) * ppu
        sheet[pid[len('char-'):]] = {'x': round(rect[0] - fx, 1), 'y': round(rect[1] - fy, 1),
                                     'w': rect[2] - rect[0], 'h': rect[3] - rect[1]}
        print(f'[char {n + 1}/{len(parts)}] {pid}')
    with open(os.path.join(out, 'chars.json'), 'w') as f:
        json.dump(sheet, f, indent=1)
    print(f'[done] {time.time() - t0:.0f}s')


if __name__ == '__main__':
    main()
