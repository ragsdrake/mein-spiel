"""
Renders one hotel into pre-rendered isometric sprites.

Usage (bpy module python):
  python render_hotel.py <glbDir> <hotel> <outDir> [--samples N] [--only backdrop|sprites] [--limit N]

Input:  <glbDir>/<hotel>-L<level>.glb for levels 0,1,2,3,4,6,7,10 and
        <hotel>-doors.glb (see export-glb.js)
Output: <outDir>/backdrop-<col>-<row>.jpg   baked environment in 1024 px chunks
        <outDir>/s/<name>.png               one image per sprite / variant
        <outDir>/s/<name>.sh.png            floor shadow of dynamic sprites
        <outDir>/manifest.json

Scheme: the whole hotel is loaded as lighting context. For every render only
the wanted meshes are visible to the camera; all static geometry still casts
shadows and bounces light, so every sprite is lit exactly like in the full
scene. Dynamic parts (they change with a station's level) are hidden while
other parts render, and get their own floor shadow image drawn under them.

Screen coordinates (px at TILE_W): sx = (x - z) * 0.7071 * PPU,
sy = (x + z) * 0.3536 * PPU - y * 0.8660 * PPU  (three.js world, y up).
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

LEVELS = [0, 1, 2, 3, 4, 6, 7, 10]
BASE_LEVEL = 10
FRONT_Z = 11.5          # auto parts reaching beyond this (three z) become sprites
FLAT_H = 0.16           # auto parts lower than this are ground (backdrop)
# region of the world baked into the backdrop (three coords)
REGION = {'x0': -14, 'x1': 36, 'z0': -12, 'z1': 32}
BACKDROP_SCALE = 1.0    # backdrop pixels per sprite pixel
CHUNK = 1024

RIGHT = Vector((math.sqrt(0.5), math.sqrt(0.5), 0.0))
UP = Vector((-0.5 * math.sqrt(0.5), 0.5 * math.sqrt(0.5), math.sqrt(0.75)))

LIGHTS = {
    'nachtruh':  {'key': '#cfc8ff', 'sky': '#4a4488', 'sky_strength': 1.3, 'moon_energy': 2.6},
    'dracula':   {'key': '#ffc8d0', 'sky': '#5a2a44', 'sky_strength': 1.2, 'moon_energy': 2.5},
    'pyramide':  {'key': '#ffd6b0', 'sky': '#5a3a4a', 'sky_strength': 1.3, 'moon_energy': 2.7},
    'eispalast': {'key': '#c8dcff', 'sky': '#2a4a7a', 'sky_strength': 1.3, 'moon_energy': 2.4},
}


def args():
    a = sys.argv[1:]
    opts = {'samples': 48, 'only': None, 'limit': None}
    pos = []
    i = 0
    while i < len(a):
        if a[i] == '--samples':
            opts['samples'] = int(a[i + 1]); i += 2
        elif a[i] == '--only':
            opts['only'] = a[i + 1]; i += 2
        elif a[i] == '--limit':
            opts['limit'] = int(a[i + 1]); i += 2
        else:
            pos.append(a[i]); i += 1
    return pos, opts


def meshes_under(o):
    return [c for c in [o, *o.children_recursive] if c.type == 'MESH']


def world_bbox(objs):
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, p))
            hi = Vector(map(max, hi, p))
    return lo, hi


def footprint(lo, hi):
    """Blender bbox -> three.js footprint [x0, x1, z0, z1] and height."""
    return [round(lo.x, 3), round(hi.x, 3), round(-hi.y, 3), round(-lo.y, 3)], round(hi.z, 3)


def screen_rect(lo, hi, ppu, pad=3):
    xs, ys = [], []
    for cx in (lo.x, hi.x):
        for cy in (lo.y, hi.y):
            for cz in (lo.z, hi.z):
                p = Vector((cx, cy, cz))
                xs.append(RIGHT.dot(p) * ppu)
                ys.append(-UP.dot(p) * ppu)
    return (math.floor(min(xs)) - pad, math.floor(min(ys)) - pad,
            math.ceil(max(xs)) + pad, math.ceil(max(ys)) + pad)


def set_region(cam, rect, ppu):
    l, t, r, b = rect
    w, h = r - l, b - t
    sc = bpy.context.scene
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    cam.data.ortho_scale = max(w, h) / ppu
    cam.data.shift_x = ((l + r) / 2 / ppu) / cam.data.ortho_scale
    cam.data.shift_y = (-(t + b) / 2 / ppu) / cam.data.ortho_scale


def vis(objs, camera=True, render=True, catcher=False):
    for o in objs:
        o.hide_render = not render
        o.visible_camera = camera
        o.is_shadow_catcher = catcher


def signature(objs):
    """Geometry + colours, but not positions: animated props (floating,
    spinning) sit elsewhere in every export and must not count as a change."""
    items = []
    for o in objs:
        col = ''
        if o.data.materials and o.data.materials[0] and o.data.materials[0].node_tree:
            b = o.data.materials[0].node_tree.nodes.get('Principled BSDF')
            if b:
                col = ','.join(f'{v:.2f}' for v in b.inputs['Base Color'].default_value[:3])
        items.append(f'{len(o.data.vertices)}:{col}')
    return '|'.join(sorted(items))


def collect_parts(objs):
    """part name -> (meta, [meshes]) ; auto containers are split into children."""
    parts = {}
    part_meshes = set()
    for o in objs:
        if 'part' not in o.keys():
            continue
        meta = {'id': o['part'], 'kind': o['kind'], 'station': o['station'] or None}
        if meta['kind'] == 'auto':
            # the tagged group wraps the component's root group
            roots = o.children if len(o.children) != 1 else o.children[0].children
            for n, child in enumerate(roots):
                ms = meshes_under(child)
                if not ms:
                    continue
                lo, hi = world_bbox(ms)
                if hi.z < FLAT_H or -lo.y < FRONT_Z:
                    continue                      # ground or behind the walkways -> backdrop
                if (hi.x - lo.x) > 4 and (hi.y - lo.y) > 4:
                    continue                      # hills and other big terrain -> backdrop
                parts[f"{meta['id']}-{n}"] = ({'id': f"{meta['id']}-{n}", 'kind': 'sprite', 'station': None}, ms)
                part_meshes.update(ms)
            continue
        ms = meshes_under(o)
        # nested parts belong to the innermost tag
        parts[meta['id']] = (meta, ms)
        part_meshes.update(ms)
    # a mesh inside nested tags: keep it only in the innermost part
    owner = {}
    for pid, (meta, ms) in parts.items():
        for m in ms:
            prev = owner.get(m.name)
            if prev is None or len(parts[prev][1]) > len(ms):
                owner[m.name] = pid
    for pid, (meta, ms) in list(parts.items()):
        parts[pid] = (meta, [m for m in ms if owner[m.name] == pid])
    return parts, part_meshes


def main():
    (glb_dir, hotel, out), opts = args()
    os.makedirs(os.path.join(out, 's'), exist_ok=True)
    t0 = time.time()
    bc.reset()
    ppu = bc.PPU

    # ── base scene (level 10) = lighting context + static parts ──
    base = bc.import_model(os.path.join(glb_dir, f'{hotel}-L{BASE_LEVEL}.glb'))
    bc.soften(base)
    parts, part_meshes = collect_parts(base)
    static_parts = {k: v for k, v in parts.items() if not v[0]['station']}
    dyn_base = {k: v for k, v in parts.items() if v[0]['station']}
    all_meshes = [o for o in base if o.type == 'MESH']
    backdrop = [o for o in all_meshes if o not in part_meshes]
    static_meshes = [m for _, ms in static_parts.values() for m in ms]
    floor_meshes = [o for o in backdrop if world_bbox([o])[1].z < 0.12]

    # ── dynamic variants from the other levels ──
    variants = {}   # part id -> list of (level, meta, meshes, sig)
    for pid, (meta, ms) in dyn_base.items():
        variants.setdefault(pid, []).append((BASE_LEVEL, meta, ms, signature(ms)))
    for lvl in LEVELS + ['doors']:
        if lvl == BASE_LEVEL:
            continue
        name = f'{hotel}-doors.glb' if lvl == 'doors' else f'{hotel}-L{lvl}.glb'
        objs = bc.import_model(os.path.join(glb_dir, name))
        ps, pms = collect_parts(objs)
        keep = set()
        for pid, (meta, ms) in ps.items():
            if not meta['station']:
                continue
            if lvl == 'doors' and not pid.endswith('-door'):
                continue
            keep.update(ms)
            if lvl == 'doors':
                meta = {**meta, 'state': 'open'}
            variants.setdefault(pid if lvl != 'doors' else pid + '@open', []).append(
                (1 if lvl == 'doors' else lvl, meta, ms, signature(ms)))
        # drop everything of this import that is not a dynamic part
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            if o.type == 'MESH' and o not in keep:
                o.select_set(True)
        bpy.ops.object.delete()
        bc.soften([o for o in keep])
    dyn_meshes = [m for vs in variants.values() for (_, _, ms, _) in vs for m in ms]
    print(f'[setup] {len(static_parts)} static parts, {len(variants)} dynamic parts, '
          f'{len(backdrop)} backdrop meshes, {time.time() - t0:.0f}s')

    bc.setup_render(opts['samples'], transparent=True)
    sc = bpy.context.scene
    sc.render.use_persistent_data = False
    sc.cycles.use_auto_tile = False
    bc.setup_lights(LIGHTS.get(hotel, LIGHTS['nachtruh']))
    cam = bc.make_camera((0, 0, 0), 10)

    manifest = {'hotel': hotel, 'tileW': bc.TILE_W, 'ppu': ppu, 'sprites': [], 'backdrop': None}
    old_path = os.path.join(out, 'manifest.json')
    if opts['only'] and os.path.exists(old_path):
        # partial run: keep what the other half produced
        old = json.load(open(old_path))
        manifest['sprites'] = old.get('sprites', []) if opts['only'] == 'backdrop' else []
        manifest['backdrop'] = old.get('backdrop') if opts['only'] == 'sprites' else None

    def render(path):
        sc.render.filepath = path
        bpy.ops.render.render(write_still=True)

    # ── backdrop ──
    if opts['only'] in (None, 'backdrop'):
        vis(all_meshes, camera=False)
        vis(dyn_meshes, render=False)
        vis(backdrop, camera=True)
        R = REGION
        lo = Vector((R['x0'], -R['z1'], -1.0))
        hi = Vector((R['x1'], -R['z0'], 14.0))
        bppu = ppu * BACKDROP_SCALE
        rect = screen_rect(lo, hi, bppu, pad=0)
        set_region(cam, rect, bppu)
        sc.render.film_transparent = False
        tmp = os.path.join(out, 'backdrop_full.png')
        t1 = time.time()
        render(tmp)
        sc.render.film_transparent = True
        print(f'[backdrop] {rect} in {time.time() - t1:.0f}s')
        from PIL import Image
        img = Image.open(tmp).convert('RGB')
        chunks = []
        for row in range(math.ceil(img.height / CHUNK)):
            for col in range(math.ceil(img.width / CHUNK)):
                box = (col * CHUNK, row * CHUNK, min(img.width, (col + 1) * CHUNK), min(img.height, (row + 1) * CHUNK))
                name = f'backdrop-{col}-{row}.jpg'
                img.crop(box).save(os.path.join(out, name), quality=88)
                chunks.append({'img': name, 'x': rect[0] / BACKDROP_SCALE + box[0] / BACKDROP_SCALE,
                               'y': rect[1] / BACKDROP_SCALE + box[1] / BACKDROP_SCALE,
                               'w': (box[2] - box[0]) / BACKDROP_SCALE, 'h': (box[3] - box[1]) / BACKDROP_SCALE})
        os.remove(tmp)
        manifest['backdrop'] = {'scale': BACKDROP_SCALE, 'chunks': chunks}

    # ── sprites ──
    if opts['only'] in (None, 'sprites'):
        jobs = [(pid, BASE_LEVEL if False else None, meta, ms, None) for pid, (meta, ms) in static_parts.items()]
        for pid, vs in variants.items():
            vs.sort(key=lambda v: v[0])
            last = None
            for lvl, meta, ms, sig in vs:
                if sig == last:
                    continue
                last = sig
                jobs.append((pid, lvl, meta, ms, 'dyn'))
        if opts['limit']:
            jobs = jobs[:opts['limit']]
        print(f'[sprites] {len(jobs)} renders')
        for n, (pid, lvl, meta, ms, dyn) in enumerate(jobs):
            t1 = time.time()
            name = pid.replace('@', '-') + (f'-L{lvl}' if lvl is not None else '')
            vis(all_meshes, camera=False)
            vis(dyn_meshes, render=False)
            vis(ms, camera=True, render=True)
            lo, hi = world_bbox(ms)
            rect = screen_rect(lo, hi, ppu)
            set_region(cam, rect, ppu)
            render(os.path.join(out, 's', name + '.png'))
            foot, top = footprint(lo, hi)
            entry = {'name': name, 'id': meta['id'], 'kind': meta['kind'], 'station': meta['station'],
                     'level': lvl, 'state': meta.get('state'), 'x': rect[0], 'y': rect[1],
                     'w': rect[2] - rect[0], 'h': rect[3] - rect[1], 'foot': foot, 'top': top}
            if dyn and meta['kind'] == 'sprite':
                # floor shadow of this dynamic part, drawn under everything
                vis(ms, camera=False, render=True)
                vis(floor_meshes, camera=True, catcher=True)
                # only this part may darken the catcher, not the whole scene
                for o in all_meshes:
                    o.visible_shadow = False
                for o in ms:
                    o.visible_shadow = True
                slo = Vector((lo.x - 0.8, lo.y - 0.8, 0))
                shi = Vector((hi.x + 0.8, hi.y + 0.8, 0.05))
                srect = screen_rect(slo, shi, ppu)
                set_region(cam, srect, ppu)
                # soft shadows need little resolution and few samples
                sc.render.resolution_percentage = 50
                sc.cycles.samples = max(8, opts['samples'] // 3)
                render(os.path.join(out, 's', name + '.sh.png'))
                sc.render.resolution_percentage = 100
                sc.cycles.samples = opts['samples']
                vis(floor_meshes, camera=False, catcher=False)
                for o in all_meshes:
                    o.visible_shadow = True
                entry['shadow'] = {'x': srect[0], 'y': srect[1], 'w': srect[2] - srect[0], 'h': srect[3] - srect[1]}
            manifest['sprites'].append(entry)
            print(f'[sprite {n + 1}/{len(jobs)}] {name} {entry["w"]}x{entry["h"]} {time.time() - t1:.1f}s')

    with open(os.path.join(out, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1)
    print(f'[done] {time.time() - t0:.0f}s')


if __name__ == '__main__':
    main()
