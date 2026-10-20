# Volumetric cumulus renders, a look target for the game's cloud shader.
# Reference only: nothing here ships in the game.
#
#   blender.exe -b --factory-startup --python tools/blender/clouds.py -- <out dir> [names,...] [samples] [width px]
#
# Each cloud is metaballs (a smooth union of lobes) turned to a mesh, pushed
# about by two scales of noise so the edge breaks up the way a real cumulus
# edge does, and rendered as the inside of that mesh: a dense scattering
# volume, so the light is what a cloud does with it (a bright lit face, a
# soft-edged shadow through the body), not a painted gradient. The density is
# cut off under the cloud's base height, wobbled a little, because a cumulus
# base is where the rising air reaches condensation: nearly flat, never ruled.
# One sun, up and to the left of the camera; the sky is left transparent so
# the silhouette comes from coverage, and the white sky is laid in afterward.

import bpy, sys, math
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '//'
ONLY = argv[1].split(',') if len(argv) > 1 and argv[1] != 'all' else None
SAMPLES = int(argv[2]) if len(argv) > 2 else 64
WIDTH = int(argv[3]) if len(argv) > 3 else 720
# One exposure for every cloud, so the tone shares between clouds compare.
EXPOSURE = float(argv[4]) if len(argv) > 4 else 0.0
SKY_FILL = 0.7
GROUND_FILL = 0.25


def lobe(x, z, r, y=0.0, sx=1.0, sz=1.0):
    return (x, y, z, r * sx, r, r * sz)


# --- the shapes -------------------------------------------------------------
# Lengths in scene units; the base line is z = 0 and the cloud is centered
# on x = 0. Each returns (lobes, base wobble, noise scale).

def near_turrets(g):
    # a near stacked cumulus: a broad base row, three turrets rising off it,
    # smaller domes clustered on each turret's top
    L = []
    for x in np.linspace(-4.6, 4.6, 8):
        L.append(lobe(x + g.uniform(-.3, .3), 0.9, g.uniform(1.1, 1.45), g.uniform(-.6, .6), 1.25, 0.8))
    for x, r, h in [(-2.6, 1.9, 2.2), (0.3, 2.4, 2.9), (3.0, 1.7, 2.0)]:
        L.append(lobe(x, h, r, g.uniform(-.4, .4)))
        for k in range(g.integers(2, 4)):
            a = g.uniform(-0.9, 0.9)
            rr = r * g.uniform(0.45, 0.62)
            L.append(lobe(x + math.sin(a) * r * 0.8, h + math.cos(a) * r * 0.8, rr, g.uniform(-.6, .6)))
    return L


def towering(g):
    # cumulus congestus: a wide base and a tower of stacked domes, each a
    # little smaller and leaning, the top domes knobbly
    L = []
    for x in np.linspace(-6.0, 6.0, 10):
        L.append(lobe(x + g.uniform(-.3, .3), 0.9, g.uniform(1.0, 1.35), g.uniform(-.6, .6), 1.25, 0.8))
    for x in (-3.6, 3.4):
        L.append(lobe(x, 1.7, g.uniform(1.5, 1.8), g.uniform(-.4, .4)))
    x, z, r = -0.3, 2.3, 2.3
    for lvl in range(3):
        L.append(lobe(x, z, r, g.uniform(-.3, .3)))
        for k in range(2):
            s = -1 if k == 0 else 1
            L.append(lobe(x + s * r * g.uniform(.7, .95), z - r * g.uniform(.1, .4), r * g.uniform(.5, .65), g.uniform(-.6, .6)))
        x += g.uniform(-.25, .45)
        z += r * 0.95
        r *= 0.82
    L.append(lobe(x - r * .5, z - r * .3, r * .7))
    L.append(lobe(x + r * .6, z - r * .4, r * .6))
    return L


def mid_group(g):
    # two or three cumulus run together: separate crowns, one shared base
    L = []
    for x in np.linspace(-6.5, 6.5, 11):
        L.append(lobe(x + g.uniform(-.3, .3), 0.8, g.uniform(.95, 1.3), g.uniform(-.6, .6), 1.3, 0.75))
    for cx, R in [(-4.4, 1.7), (0.2, 2.1), (4.6, 1.5)]:
        L.append(lobe(cx, 1.9, R, g.uniform(-.4, .4)))
        for k in range(g.integers(2, 4)):
            a = g.uniform(-1.1, 1.1)
            L.append(lobe(cx + math.sin(a) * R * .8, 1.9 + math.cos(a) * R * .75, R * g.uniform(.45, .6), g.uniform(-.6, .6)))
    return L


def far_flat(g):
    # a far cloud seen nearly edge-on: low, flat-based, a few soft domes
    L = []
    for x in np.linspace(-3.6, 3.6, 6):
        L.append(lobe(x + g.uniform(-.3, .3), 0.6, g.uniform(.9, 1.2), g.uniform(-.5, .5), 1.4, 0.7))
    for x, r in [(-1.8, 1.5), (0.6, 1.9), (2.6, 1.3)]:
        L.append(lobe(x, 1.4, r, 0, 1.15, 0.85))
    return L


def low_bank(g):
    # a long low bank: many small lobes of mixed size along a level top
    L = []
    for x in np.linspace(-6.0, 6.0, 13):
        L.append(lobe(x + g.uniform(-.25, .25), 0.8, g.uniform(.9, 1.3), g.uniform(-.7, .7), 1.2, 0.8))
    for x in np.linspace(-5.4, 5.4, 9):
        r = g.uniform(.9, 1.5)
        L.append(lobe(x + g.uniform(-.4, .4), 1.8 + g.uniform(-.2, .5), r, g.uniform(-.5, .5)))
    return L


def fair_puff(g):
    # my pick: a small fair-weather cumulus (humilis), the one a player
    # clicks: one main dome, two shoulders, flat underneath
    L = []
    for x in np.linspace(-3.0, 3.0, 5):
        L.append(lobe(x + g.uniform(-.2, .2), 0.75, g.uniform(.95, 1.2), g.uniform(-.4, .4), 1.25, 0.75))
    L.append(lobe(0.2, 1.75, 1.75))
    L.append(lobe(-1.9, 1.3, 1.25, 0.3))
    L.append(lobe(2.0, 1.2, 1.1, -0.3))
    L.append(lobe(-0.7, 2.6, 0.95, -0.4))
    L.append(lobe(0.9, 2.7, 0.8, 0.5))
    return L


CLOUDS = {
    'near-turrets': (near_turrets, 11),
    'towering': (towering, 23),
    'mid-group': (mid_group, 5),
    'far-flat': (far_flat, 8),
    'low-bank': (low_bank, 3),
    'fair-puff': (fair_puff, 14),
}


# --- the scene ----------------------------------------------------------------

def clear():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)


def setup():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 16
    sc.cycles.volume_bounces = 12
    sc.cycles.transparent_max_bounces = 8
    sc.cycles.volume_step_rate = 1.0
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = EXPOSURE
    w = bpy.data.worlds.new('sky')
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes['Background']
    # the sky's own light on the shadowed side: from above, none from the
    # ground, so an underside is in the dark the way a real one is
    bg.inputs[0].default_value = (1, 1, 1, 1)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeMapRange')
    ramp.inputs['From Min'].default_value = -0.2
    ramp.inputs['From Max'].default_value = 1.0
    ramp.inputs['To Min'].default_value = GROUND_FILL
    ramp.inputs['To Max'].default_value = SKY_FILL
    nt.links.new(tc.outputs['Generated'], sep.inputs[0])
    nt.links.new(sep.outputs['Z'], ramp.inputs['Value'])
    nt.links.new(ramp.outputs[0], bg.inputs[1])
    sc.world = w


def material(base_wobble):
    m = bpy.data.materials.new('cloud')
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    vol = nt.nodes.new('ShaderNodeVolumePrincipled')
    vol.inputs['Color'].default_value = (1, 1, 1, 1)
    vol.inputs['Anisotropy'].default_value = 0.35
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 0.35
    # the base line, lifted a little and wobbled by a slow noise
    wob = nt.nodes.new('ShaderNodeMath'); wob.operation = 'MULTIPLY_ADD'
    wob.inputs[1].default_value = base_wobble
    wob.inputs[2].default_value = 0.35 - base_wobble / 2
    cut = nt.nodes.new('ShaderNodeMath'); cut.operation = 'GREATER_THAN'
    dens = nt.nodes.new('ShaderNodeMath'); dens.operation = 'MULTIPLY'
    dens.inputs[1].default_value = 14.0
    L = nt.links
    L.new(tc.outputs['Object'], sep.inputs[0])
    L.new(tc.outputs['Object'], noise.inputs['Vector'])
    L.new(noise.outputs['Fac'], wob.inputs[0])
    L.new(sep.outputs['Z'], cut.inputs[0])
    L.new(wob.outputs[0], cut.inputs[1])
    L.new(cut.outputs[0], dens.inputs[0])
    L.new(dens.outputs[0], vol.inputs['Density'])
    L.new(vol.outputs[0], out.inputs['Volume'])
    return m


def cauliflower(g, lobes, levels=2):
    # a cumulus is domes on domes: every lobe big enough grows a few smaller
    # ones on its upper, sunward-ish edge, and they grow their own
    out = list(lobes)
    gen = list(lobes)
    for _ in range(levels):
        nxt = []
        for (x, y, z, rx, ry, rz) in gen:
            r = min(rx, rz)
            if r < 0.8:
                continue
            for k in range(g.integers(2, 4)):
                a = g.uniform(-1.2, 1.2)            # 0 straight up
                rr = r * g.uniform(0.48, 0.62)
                d = r * g.uniform(0.55, 0.72)
                nxt.append((x + math.sin(a) * d * rx / r, y + g.uniform(-.5, .5) * r, z + math.cos(a) * d * rz / r, rr, rr, rr))
        out += nxt
        gen = nxt
    return out


def build(name, fn, seed):
    g = np.random.default_rng(seed)
    lobes = cauliflower(g, fn(g))
    mb = bpy.data.metaballs.new(name)
    mb.resolution = 0.07
    mb.render_resolution = 0.07
    mb.threshold = 0.6
    for (x, y, z, rx, ry, rz) in lobes:
        e = mb.elements.new()
        e.type = 'ELLIPSOID'
        e.co = (x, y, z)
        e.radius = max(rx, ry, rz) * 1.25
        e.size_x, e.size_y, e.size_z = rx / max(rx, ry, rz), ry / max(rx, ry, rz), rz / max(rx, ry, rz)
    mo = bpy.data.objects.new(name + '-mb', mb)
    bpy.context.scene.collection.objects.link(mo)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(mo.evaluated_get(dg))
    bpy.data.objects.remove(mo, do_unlink=True)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    # a little noise on the edge, so no dome is a perfect sphere; the
    # cauliflower itself is the cauliflower() lobes, not noise
    for scale, strength in [(0.7, 0.22), (0.22, 0.05)]:
        t = bpy.data.textures.new(name + str(scale), 'CLOUDS')
        t.noise_scale = scale
        t.noise_depth = 2
        d = ob.modifiers.new('d' + str(scale), 'DISPLACE')
        d.texture = t
        d.strength = strength
        d.mid_level = 0.5
        d.texture_coords = 'GLOBAL'
    ob.data.materials.append(material(0.35))
    return ob


def frame(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    pts = [ev.matrix_world @ Vector(c) for c in ev.bound_box]
    xs = [p.x for p in pts]; zs = [p.z for p in pts]
    zmin = 0.0
    w = max(xs) - min(xs); h = max(zs) - zmin
    cx = (max(xs) + min(xs)) / 2; cz = (max(zs) + zmin) / 2
    pad = 1.12
    aspect = w / h
    sc = bpy.context.scene
    sc.render.resolution_x = WIDTH
    sc.render.resolution_y = max(16, int(WIDTH / aspect))
    cam = bpy.data.cameras.new('cam')
    cam.type = 'ORTHO'
    cam.ortho_scale = w * pad
    co = bpy.data.objects.new('cam', cam)
    co.location = (cx, -40, cz)
    co.rotation_euler = (math.pi / 2, 0, 0)
    sc.collection.objects.link(co)
    sc.camera = co
    return co


def sun():
    s = bpy.data.lights.new('sun', 'SUN')
    s.energy = 4.0
    s.angle = math.radians(2)
    so = bpy.data.objects.new('sun', s)
    # light from up and to the left of the camera, a little from in front
    d = Vector((1.0, 0.25, -0.85)).normalized()
    so.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(so)


for name, (fn, seed) in CLOUDS.items():
    if ONLY and name not in ONLY:
        continue
    clear()
    setup()
    sun()
    ob = build(name, fn, seed)
    frame(ob)
    bpy.context.scene.render.filepath = f'{OUT}/{name}.png'
    bpy.ops.render.render(write_still=True)
    print('RENDERED', name, bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y)
