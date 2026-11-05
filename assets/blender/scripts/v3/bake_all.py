"""Bake the room into four shared UV atlases and export an image-free GLB."""
import argparse
import json
import math
from pathlib import Path
import struct
import sys
import tempfile
import zlib

import bpy
import bmesh
from mathutils import Matrix
import numpy as np

GROUPS = ('room', 'furniture', 'props', 'interactive')
INTERACTIVE = {'Diary', 'Computer', 'Lamp', 'Cat', 'Bookshelf', 'Frame_1', 'Frame_2', 'MacBook', 'MacMini', 'AirConditioner'}
POTS = ('V2_Block_LargePlantPot', 'V2_Block_SucculentPot', 'V2_Detail_PotSoil', 'V2_Detail_PotRim', 'V2_Props_ShelfPot')
EXTRACT = {
    'MacBook': ('RBN_LaptopWallpaper', 'MacBook_Screen', 'laptop'),
    'MacMini': ('RBN_MiniPowerLED', 'MacMini_Indicator', 'indicator'),
    'AirConditioner': ('RBN_ACDigits', 'AirConditioner_Display', 'ac-display'),
}


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--res', type=int, default=512)
    parser.add_argument('--albedo-res', type=int)
    parser.add_argument('--samples', type=int, default=24)
    parser.add_argument('--scale', type=float, default=4)
    parser.add_argument('--output', type=Path, default=Path('public/bake-trial'))
    parser.add_argument('--work-dir', type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if min(args.res, args.albedo_res or args.res, args.samples) <= 0 or not math.isfinite(args.scale) or args.scale <= 0:
        parser.error('Resolutions, sample count, and irradiance scale must be positive')
    return args


def select(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def original_materials(obj):
    return [slot.material for slot in obj.material_slots]


def evaluated_mesh(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(
        obj.evaluated_get(depsgraph), preserve_all_data_layers=True, depsgraph=depsgraph,
    )
    if obj.type == 'MESH':
        mesh.use_auto_texspace = False
        mesh.texspace_location = obj.data.texspace_location
        mesh.texspace_size = obj.data.texspace_size
    return mesh


def apply_geometry(obj, collection):
    materials = original_materials(obj)
    mesh = evaluated_mesh(obj)
    for i, material in enumerate(materials):
        if i < len(mesh.materials):
            mesh.materials[i] = material
        else:
            mesh.materials.append(material)
    if obj.type == 'MESH':
        obj.modifiers.clear()
        for slot in obj.material_slots:
            slot.link = 'DATA'
        obj.data = mesh
        return obj
    name = obj.name
    obj.name = name + ' | source'
    obj.hide_render = True
    obj.hide_set(True)
    replacement = bpy.data.objects.new(name, mesh)
    collection.objects.link(replacement)
    replacement.matrix_world = obj.matrix_world
    return replacement


def keep_faces(mesh, predicate):
    bm = bmesh.new()
    try:
        bm.from_mesh(mesh)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if not predicate(f.material_index)], context='FACES')
        bm.to_mesh(mesh)
    finally:
        bm.free()


def classify(obj):
    name = obj.name.split(' | Day')[0]
    if name == 'V2_Room_Glass':
        return 'glass'
    if name.startswith('V2_Props_FairyBulb'):
        return 'fairy'
    if name == 'V2_Lighting_LED':
        return 'strip'
    if name == 'Lamp_Shade':
        return 'desk-shade'
    if name == 'Computer_Screen':
        return 'monitor'
    if name == 'V2_Block_BedsideLampShade':
        return 'bedside'
    if name == 'V2_Props_ClockDisplay':
        return 'clock'
    if name in INTERACTIVE:
        return 'interactive'
    if name == 'V2_Optimize_ACConduit' or any(c.name.startswith('Static_Room') for c in obj.users_collection):
        return 'room'
    if name.startswith(POTS) or any(c.name == 'Static_Furniture' for c in obj.users_collection):
        return 'furniture'
    return 'props'


def set_parent(child, parent):
    world = child.matrix_world.copy()
    child.parent = parent
    child.matrix_world = world


def extract_emitter(obj, collection):
    material_name, child_name, kind = EXTRACT[obj.name]
    indexes = {i for i, m in enumerate(obj.data.materials) if m and m.name == material_name}
    assert indexes, (obj.name, material_name)
    child = bpy.data.objects.new(child_name, obj.data.copy())
    collection.objects.link(child)
    child.parent = obj
    child.matrix_parent_inverse = Matrix.Identity(4)
    child['bakeAccent'] = kind
    keep_faces(child.data, lambda i: i in indexes)
    keep_faces(obj.data, lambda i: i not in indexes)
    assert child.data.polygons and obj.data.polygons
    return child


def prepare_uv(objects, gap_px, res):
    for obj in objects:
        uv = obj.data.uv_layers.new(name='BakeUV', do_init=False)
        obj.data.uv_layers.active = uv
    select(objects)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(
        angle_limit=math.radians(66), island_margin=gap_px / res, margin_method='FRACTION',
    )
    bpy.ops.object.mode_set(mode='OBJECT')


def active_targets(materials, image):
    previous = []
    for material in materials:
        if not material or not material.node_tree:
            continue
        tree = material.node_tree
        old = tree.nodes.active
        node = tree.nodes.new('ShaderNodeTexImage')
        node.image = image
        node.select = True
        tree.nodes.active = node
        previous.append((tree, old, node))
    return previous


def pad_islands(pixels, coverage, margin):
    # Bake padding after all selected objects have written their UV islands.
    # Padding per object can overwrite a neighboring object's valid texels.
    rgb = pixels.copy()
    filled = coverage.copy()
    for _ in range(margin):
        next_filled = filled.copy()
        for dst, src in [
            (np.s_[1:, :], np.s_[:-1, :]), (np.s_[:-1, :], np.s_[1:, :]),
            (np.s_[:, 1:], np.s_[:, :-1]), (np.s_[:, :-1], np.s_[:, 1:]),
        ]:
            take = ~next_filled[dst] & filled[src]
            rgb[dst][take] = rgb[src][take]
            next_filled[dst][take] = True
        filled = next_filled
    return rgb


def bake(scene, objects, label, res, passes, samples, margin):
    scene.cycles.samples = samples
    image = bpy.data.images.new(label, width=res, height=res, alpha=True, float_buffer=True)
    # Keep the bake in scene-linear float storage through quantization.
    image.colorspace_settings.name = 'Linear Rec.709'
    materials = {m for o in objects for m in o.data.materials if m}
    targets = active_targets(materials, image)
    select(objects)
    try:
        print(f'BAKE {label}: {len(objects)} objects, {res}px, {samples} samples', flush=True)
        assert bpy.ops.object.bake(
            type='DIFFUSE', pass_filter=passes, margin=0,
            use_clear=True, uv_layer='BakeUV',
        ) == {'FINISHED'}
        pixels = np.empty(res * res * 4, dtype=np.float32)
        image.pixels.foreach_get(pixels)
        rgba = np.flipud(pixels.reshape(res, res, 4))
        coverage = rgba[:, :, 3] > 0
        assert coverage.any() and not coverage.all(), (label, int(coverage.sum()))
        return pad_islands(rgba[:, :, :3], coverage, margin)
    finally:
        for tree, old, node in targets:
            tree.nodes.remove(node)
            tree.nodes.active = old
        bpy.data.images.remove(image)


def png_chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data))


def write_png(path, pixels):
    height, width, _ = pixels.shape
    scanlines = np.pad(pixels.reshape(height, width * 3), ((0, 0), (1, 0)))
    path.write_bytes(
        b'\x89PNG\r\n\x1a\n' +
        png_chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) +
        png_chunk(b'IDAT', zlib.compress(scanlines.tobytes(), 6)) +
        png_chunk(b'IEND', b'')
    )


def encode_srgb(linear, scale):
    bounded = np.clip(linear / scale, 0, 1)
    encoded = np.where(bounded <= .0031308, 12.92 * bounded, 1.055 * bounded ** (1 / 2.4) - .055)
    return np.rint(encoded * 255).astype(np.uint8)


def probes(linear, encoded, scale):
    # Sample non-black colored texels, spanning low to high values.
    intensity = linear.mean(axis=2)
    valid = np.flatnonzero((intensity > .045) & (intensity < scale * .95))
    if len(valid) == 0:
        return []
    ordered = valid[np.argsort(intensity.flat[valid])]
    result = []
    for q in (.20, .50, .80):
        index = int(ordered[round((len(ordered) - 1) * q)])
        y, x = divmod(index, linear.shape[1])
        result.append({'x': x, 'y': y, 'linear': linear[y, x].tolist(), 'encoded': encoded[y, x].tolist()})
    return result


def join_objects(objects, name):
    select(objects)
    assert bpy.ops.object.join() == {'FINISHED'}
    obj = bpy.context.view_layer.objects.active
    obj.name = name
    return obj


def placeholder_material(objects, name):
    material = bpy.data.materials.new(name)
    for obj in objects:
        obj.data.materials.clear()
        obj.data.materials.append(material)
        for face in obj.data.polygons:
            face.material_index = 0


def set_export_uv(obj):
    for uv in list(obj.data.uv_layers):
        if uv.name != 'BakeUV':
            obj.data.uv_layers.remove(uv)
    obj.data.uv_layers.active = obj.data.uv_layers['BakeUV']


def y_up(vector):
    return [vector[0], vector[2], -vector[1]]


def main():
    args = arguments()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    work = args.work_dir.resolve() if args.work_dir else Path(tempfile.mkdtemp(prefix='room-v3-bake-'))
    work.mkdir(parents=True, exist_ok=True)
    copy_path = work / 'room-bake.blend'
    if Path(bpy.data.filepath).resolve() == copy_path:
        raise ValueError('Bake copy must be different from the input .blend')
    bpy.ops.wm.save_as_mainfile(filepath=str(copy_path))
    print(f'WORK {work}', flush=True)

    day = bpy.data.scenes['RoomBlog | Day']
    night = bpy.data.scenes['RoomBlog V2 | Realism Review']
    bpy.context.window.scene = day
    day.render.engine = 'CYCLES'
    day.cycles.device = 'CPU'
    # Use one evaluated scene for all passes so every texel stays aligned.
    collection = bpy.data.collections.new('Bake Trial')
    day.collection.children.link(collection)
    day_world, night_world = day.world, night.world
    dark_world = bpy.data.worlds.new('Lamp-only black')
    dark_world.use_nodes = True
    next(n for n in dark_world.node_tree.nodes if n.type == 'BACKGROUND').inputs['Strength'].default_value = 0
    day_lights = [o for o in day.objects if o.type == 'LIGHT']
    night_lights = [o for o in night.objects if o.type == 'LIGHT' and o.name != 'L_Desk']
    desk_light = night.objects['L_Desk']
    for light in [*night_lights, desk_light]:
        collection.objects.link(light)
    night_sky = [
        o for o in night.objects
        if o.name.startswith(('V2_Room_NightPanel', 'V2_Room_Moon', 'V2_Room_CityLight_'))
    ]
    for obj in night_sky:
        collection.objects.link(obj)
        obj['bakeAccent'] = 'sky' if 'NightPanel' in obj.name else 'moon' if 'Moon' in obj.name else 'city'
    day_objects = [o for o in day.objects if o.type in {'MESH', 'CURVE'} and o.visible_get() and not o.hide_render and o not in night_sky]
    groups = {group: [] for group in GROUPS}
    accents = []
    for source in day_objects:
        group = classify(source)
        obj = apply_geometry(source, collection)
        if group in groups:
            groups[group].append(obj)
            obj['bakeGroup'] = group
            if obj.name in EXTRACT:
                accents.append(extract_emitter(obj, collection))
        else:
            obj['bakeAccent'] = group
            accents.append(obj)

    bpy.context.view_layer.update()
    for kind, name in [('bedside', 'BedsideLamp'), ('clock', 'AlarmClock')]:
        child = next(o for o in accents if o['bakeAccent'] == kind)
        parent = bpy.data.objects.new(name, None)
        collection.objects.link(parent)
        parent.matrix_world = child.matrix_world.copy()
        set_parent(child, parent)

    # Use the original per-scene fixture materials to retain colored bounce.
    fixtures = {}
    for obj in accents:
        source_name = obj.name.split(' | Day')[0]
        source = night.objects.get(source_name)
        if source and obj['bakeAccent'] in {'glass', 'fairy', 'strip', 'bedside', 'desk-shade'}:
            fixtures[obj] = (obj.data.materials[0], source.active_material)
    # Snapshot before linking fixture variants so the desk shade can be dark in ambient passes.
    darkness = {}
    for obj in accents:
        material = obj.active_material
        if not material or not material.node_tree:
            continue
        dim = material.copy()
        principled = next((n for n in dim.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not principled:
            continue
        emission = principled.inputs['Emission Strength']
        for link in list(emission.links):
            dim.node_tree.links.remove(link)
        emission.default_value = 0
        darkness[obj] = dim
    accent_original = {o: o.active_material for o in darkness}

    def light_state(state):
        day.world = {'day': day_world, 'night': night_world, 'lamp': dark_world}[state]
        for label, lights in [('day', day_lights), ('night', night_lights), ('lamp', [desk_light])]:
            for light in lights:
                light.hide_render = state != label
        for obj in night_sky:
            obj.hide_render = state != 'night'
        for obj, material in accent_original.items():
            kind = obj['bakeAccent']
            chosen = fixtures[obj][state == 'night'] if obj in fixtures else material
            if (state == 'lamp' and kind != 'desk-shade') or (kind == 'desk-shade' and state != 'lamp'):
                chosen = darkness[obj]
            elif state == 'lamp' and kind == 'desk-shade':
                chosen = fixtures[obj][1]
            obj.active_material = chosen

    albedo_res = args.albedo_res or args.res
    for objects in groups.values():
        prepare_uv(objects, 4 if args.res >= 1024 else 2, args.res)

    atlas = {group: {} for group in GROUPS}
    margin = max(4, round(16 * args.res / 1024))
    for state in ('day', 'night', 'lamp'):
        light_state(state)
        bpy.context.view_layer.update()
        for group, objects in groups.items():
            if state == 'day':
                atlas[group]['albedo'] = bake(day, objects, f'{group}-albedo', albedo_res, {'COLOR'}, 1, margin)
            atlas[group][f'light-{state}'] = bake(day, objects, f'{group}-light-{state}', args.res, {'DIRECT', 'INDIRECT'}, args.samples, margin)

    # A shared scale preserves additivity. Report clipped highlights so the
    # preview can balance their range against 8-bit precision in the shadows.
    peak = max(float(np.nanmax(pixels)) for kinds in atlas.values() for kind, pixels in kinds.items() if kind != 'albedo')
    assert np.isfinite(peak) and peak > 0
    scale = args.scale
    manifest = {'version': 1, 'scale': scale, 'peak': peak, 'groups': {}, 'probes': {}, 'clipped': {},
                'exposure': {'day': day.view_settings.exposure, 'night': night.view_settings.exposure}}
    for group, kinds in atlas.items():
        manifest['groups'][group] = {}
        for kind, pixels in kinds.items():
            factor = 1 if kind == 'albedo' else scale
            encoded = encode_srgb(pixels, factor)
            filename = f'{group}-{kind}.png'
            write_png(output / filename, encoded)
            manifest['groups'][group][kind] = filename
            if kind != 'albedo':
                manifest['probes'][filename] = probes(pixels, encoded, factor)
                manifest['clipped'][filename] = int(np.count_nonzero(pixels.max(axis=2) > scale))

    camera = day.camera
    frame = camera.data.view_frame(scene=day)
    xs = [v.x / -v.z for v in frame]
    ys = [v.y / -v.z for v in frame]
    manifest['camera'] = {
        'position': y_up(camera.matrix_world.translation),
        'target': y_up(day.objects['Cam_Room_Target'].matrix_world.translation),
        'fov': math.degrees(2 * math.atan((max(ys) - min(ys)) / 2)),
        'offset': [(min(xs) + max(xs)) / (2 * (max(xs) - min(xs))),
                   -(min(ys) + max(ys)) / (2 * (max(ys) - min(ys)))],
        'resolution': [day.render.resolution_x, day.render.resolution_y],
    }
    manifest['resolution'] = {'albedo': albedo_res, 'light': args.res}

    light_state('day')
    for obj in night_sky:
        obj.hide_render = False
    exported = []
    for group, objects in groups.items():
        for obj in objects:
            set_export_uv(obj)
        placeholder_material(objects, f'Bake_{group.title()}')
        if group == 'interactive':
            exported.extend(objects)
        else:
            combined = join_objects(objects, f'Bake_{group.title()}')
            combined['bakeGroup'] = group
            exported.append(combined)

    # Tiny fixtures share shader inputs in Three. Joining the static repeated
    # bulbs and city lights avoids one draw call per point of light.
    for objects, kind, name in [
        ([o for o in accents if o['bakeAccent'] == 'fairy'], 'fairy', 'FairyBulbs'),
        ([o for o in night_sky if o['bakeAccent'] == 'city'], 'city', 'WindowCityLights'),
    ]:
        placeholder_material(objects, 'Accent_' + kind)
        combined = join_objects(objects, name)
        combined['bakeAccent'] = kind
        if kind == 'fairy':
            accents = [o for o in accents if o not in objects or o == combined]
        else:
            night_sky = [o for o in night_sky if o not in objects or o == combined]

    for obj in [*accents, *night_sky]:
        placeholder_material([obj], 'Accent_' + obj['bakeAccent'])
    markers = [o for o in day.objects if o.name.startswith('Cam_') or o.name in {'Lamp_Light', 'AlarmClock', 'BedsideLamp'}]
    select([*exported, *accents, *night_sky, *markers])
    assert bpy.ops.export_scene.gltf(
        filepath=str(output / 'room.glb'), export_format='GLB', use_active_scene=True,
        use_selection=True, export_yup=True, export_apply=False, export_extras=True,
        export_materials='EXPORT', export_cameras=False, export_lights=False, export_animations=False,
    ) == {'FINISHED'}
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'COMPLETE {output}, irradiance peak {peak:.3f}, scale {scale:g}', flush=True)


if __name__ == '__main__':
    main()
