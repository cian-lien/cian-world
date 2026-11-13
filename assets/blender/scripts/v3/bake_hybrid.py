"""Shell-only bake using the current room GLB and the Blender light rigs."""
import argparse
import json
import math
from pathlib import Path
import sys

import bpy
import numpy as np

from mathutils import Vector
sys.path.insert(0, str(Path(__file__).parent))
from bake_all import active_targets, encode_srgb, join_objects, prepare_uv, select, write_png, y_up

SHELL = ('V2_Room_Plinth', 'V2_Room_RearWall', 'V2_Room_LeftWall',
         'V2_Room_RearSkirting', 'V2_Room_LeftSkirting', 'V2_Room_Board_')
EMISSION = {
    'RBN_FairyBulb': (0, 2.5), 'RBN_LEDStrip': (0, 2.4),
    'RBN_ScreenGradient': (1.05, 1.5), 'RBN_LaptopWallpaper': (.2, .85),
    'RBN_MiniPowerLED': (.25, 1.1), 'RBN_ACDigits': (.15, .55),
    'RBN_ClockGlow': (.12, .35), 'RBN_LinenLampShade': (0, .25),
}


def args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-glb', type=Path, default=Path('public/models/room-day-warm.glb'))
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--res', type=int, default=1024)
    parser.add_argument('--samples', type=int, default=2048)
    parser.add_argument('--scale', type=float, default=6)
    parser.add_argument('--hdr', action='store_true', help='Preserve highlights using a reversible shoulder')
    parser.add_argument('--day-ambient-only', action='store_true', help='Bake only the day layer without the fixed window key')
    parser.add_argument('--device', choices=('metal', 'cpu'), default='metal')
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


def image_from_array(name, rgba):
    res = rgba.shape[0]
    image = bpy.data.images.new(name, res, res, alpha=True, float_buffer=True)
    image.colorspace_settings.name = 'Linear Rec.709'
    image.pixels.foreach_set(np.ascontiguousarray(rgba, dtype=np.float32).ravel())
    image.update()
    return image


def bake(scene, shell, label, kind, passes, resolution, samples):
    scene.cycles.samples = samples
    image = bpy.data.images.new(label, resolution, resolution, alpha=True, float_buffer=True)
    image.colorspace_settings.name = 'Linear Rec.709'
    targets = active_targets(set(shell.data.materials), image)
    select([shell])
    try:
        print(f'BAKE {label}: {resolution}px, {samples} samples', flush=True)
        result = bpy.ops.object.bake(type=kind, pass_filter=passes, uv_layer='BakeUV',
                                     use_clear=True, margin=16, margin_type='EXTEND',
                                     normal_space='OBJECT')
        assert result == {'FINISHED'}, result
        pixels = np.empty(resolution ** 2 * 4, dtype=np.float32)
        image.pixels.foreach_get(pixels)
        return pixels.reshape(resolution, resolution, 4)
    finally:
        for tree, old, node in targets:
            tree.nodes.remove(node)
            tree.nodes.active = old
        bpy.data.images.remove(image)


def denoise(capture, label, noisy, albedo, normal, folder):
    tree = capture.compositing_node_group
    tree.nodes.clear()
    denoiser = tree.nodes.new('CompositorNodeDenoise')
    denoiser.inputs['HDR'].default_value = True
    inputs = []
    for name, data in [('Image', noisy), ('Albedo', albedo), ('Normal', normal)]:
        node = tree.nodes.new('CompositorNodeImage')
        node.image = image_from_array(label + '-' + name, data)
        inputs.append(node.image)
        tree.links.new(node.outputs['Image'], denoiser.inputs[name])
    output = tree.nodes.new('CompositorNodeOutputFile')
    output.directory = str(folder)
    output.file_name = label
    output.format.media_type = 'IMAGE'
    output.format.file_format = 'OPEN_EXR'
    output.format.color_depth = '32'
    output.format.color_mode = 'RGB'
    output.file_output_items.new('RGBA', 'Denoised')
    tree.links.new(denoiser.outputs[0], output.inputs[0])
    print(f'OIDN {label}: Image + Albedo + Normal', flush=True)
    assert bpy.ops.render.render(scene=capture.name) == {'FINISHED'}
    files = list(folder.glob(label + '*.exr'))
    assert len(files) == 1, files
    result_image = bpy.data.images.load(str(files[0]), check_existing=False)
    res = noisy.shape[0]
    pixels = np.empty(res ** 2 * 4, dtype=np.float32)
    result_image.pixels.foreach_get(pixels)
    tree.nodes.clear()
    for image in [result_image, *inputs]:
        bpy.data.images.remove(image)
    return pixels.reshape(res, res, 4)


def configure_cycles(scene, device):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    if device == 'metal':
        preferences = bpy.context.preferences.addons['cycles'].preferences
        preferences.compute_device_type = 'METAL'
        preferences.refresh_devices()
        if any(d.type == 'METAL' for d in preferences.devices):
            for d in preferences.devices:
                d.use = d.type == 'METAL'
            scene.cycles.device = 'GPU'
    scene.cycles.sample_clamp_indirect = 3
    scene.cycles.use_adaptive_sampling = False
    scene.cycles.seed = 0


def build_scene(day, night, input_glb):
    scene = bpy.data.scenes.new('Hybrid Trial')
    bpy.context.window.scene = scene
    # Free the imported node names without changing the original file on disk.
    for obj in set(day.objects) | set(night.objects):
        if obj.type in {'MESH', 'CURVE'}:
            obj.name = 'Source_' + obj.name
    for material in bpy.data.materials:
        material.name = 'Source_' + material.name
    assert bpy.ops.import_scene.gltf(filepath=str(input_glb)) == {'FINISHED'}
    return scene


def no_emission_and_ref_states(scene):
    states = []
    for obj in scene.objects:
        if obj.type != 'MESH':
            continue
        for slot in obj.material_slots:
            material = slot.material
            if not material or not material.node_tree:
                continue
            shader = next((n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if shader is None:
                continue
            if material.name in ('RBN_LeftWall', 'RBN_RearWall'):
                for link in list(shader.inputs['Normal'].links):
                    material.node_tree.links.remove(link)
            strength = shader.inputs['Emission Strength']
            if not any(item[0] == strength for item in states):
                states.append((strength, material, obj.name))
    for strength, material, _ in states:
        for link in list(strength.links):
            material.node_tree.links.remove(link)
        strength.default_value = 0
    return states


def color_metadata(linear, pixels, scale):
    brightness = linear.mean(axis=2)
    eligible = np.flatnonzero((brightness > .065) & (linear.max(axis=2) < scale))
    sorted_indexes = eligible[np.argsort(brightness.flat[eligible])]
    result = []
    for percentile in (.15, .35, .55, .75, .90):
        if not len(sorted_indexes):
            continue
        y, x = divmod(int(sorted_indexes[round((len(sorted_indexes) - 1) * percentile)]), linear.shape[1])
        result.append({'x': x, 'y': y, 'linear': linear[y, x].tolist(), 'encoded': pixels[y, x].tolist()})
    return result


def set_reference_emitters(emitters, night, lamp_on):
    colors = {'RBN_FairyBulb': (.95,.69,.36,1), 'RBN_LEDStrip': (.63,.28,.82,1),
              'RBN_ScreenGradient': (.35,.42,.85,1), 'RBN_LaptopWallpaper': (.54,.31,.28,1)}
    for strength, material, obj in emitters:
        level = EMISSION.get(material.name, (0, 0))[int(night)]
        if obj.startswith('Lamp_Shade'):
            level = 1.1 if lamp_on else 0
        for link in list(strength.links):
            material.node_tree.links.remove(link)
        if not level:
            strength.default_value = 0
            continue
        tree = material.node_tree
        color = strength.node.inputs['Emission Color']
        if material.name in colors:
            color.default_value = colors[material.name]
        ray = tree.nodes.new('ShaderNodeLightPath')
        gain = tree.nodes.new('ShaderNodeMath')
        gain.operation = 'MULTIPLY'
        gain.inputs[1].default_value = level
        tree.links.new(ray.outputs['Is Camera Ray'], gain.inputs[0])
        tree.links.new(gain.outputs[0], strength)


def srgb_linear(r, g, b):
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in (r, g, b))


def main():
    config = args()
    output = config.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    copy = output / 'room-bake.blend'
    assert copy != Path(bpy.data.filepath).resolve()
    if not config.day_ambient_only:
        bpy.ops.wm.save_as_mainfile(filepath=str(copy))
    day = bpy.data.scenes['RoomBlog | Day']
    night = bpy.data.scenes['RoomBlog V2 | Realism Review']
    scene = build_scene(day, night, config.input_glb.resolve())
    configure_cycles(scene, config.device)
    print('Cycles device', scene.cycles.device, flush=True)
    shell_objects = [o for o in scene.objects if o.name.startswith(SHELL)]
    assert len(shell_objects) == 43, [o.name for o in shell_objects]
    shell = join_objects(shell_objects, 'Bake_Room')
    assert len(shell.data.uv_layers) == 1
    prepare_uv([shell], max(4, math.ceil(config.res * .004)), config.res)
    assert [uv.name for uv in shell.data.uv_layers][-1] == 'BakeUV'
    shell['bakeShell'] = True

    # Export the shell with its original color UV and PBR slots intact.
    select([shell])
    assert bpy.ops.export_scene.gltf(filepath=str(output/'shell.glb'), export_format='GLB',
        use_active_scene=True, use_selection=True, export_yup=True, export_extras=True,
        export_lights=False, export_cameras=False, export_animations=False) == {'FINISHED'}
    for slot in shell.material_slots:
        if not slot.material:
            material = bpy.data.materials.new('Shell bake default surface')
            material.use_nodes = True
            slot.material = material

    camera = day.camera
    scene.collection.objects.link(camera)
    scene.camera = camera
    day_lights = [o for o in day.objects if o.type == 'LIGHT']
    night_lights = [o for o in night.objects if o.type == 'LIGHT' and o.name != 'L_Desk']
    desk = night.objects['L_Desk']
    for light in [*day_lights, *night_lights, desk]:
        scene.collection.objects.link(light)
    dark = bpy.data.worlds.new('Lamp only')
    dark.use_nodes = True
    next(n for n in dark.node_tree.nodes if n.type == 'BACKGROUND').inputs['Strength'].default_value = 0
    for obj in scene.objects:
        if obj.type == 'MESH' and obj.name.startswith('Lamp_Shade'):
            for slot in obj.material_slots:
                if slot.material:
                    slot.material = slot.material.copy()
    emitters = no_emission_and_ref_states(scene)

    def state(label, lamp_on=False):
        scene.world = {'day': day.world, 'day-ambient': day.world, 'night': night.world, 'lamp': dark}[label]
        for name, lights in [('day', day_lights), ('night', night_lights), ('lamp', [desk])]:
            for light in lights:
                enabled = name == label or (name == 'lamp' and lamp_on)
                if label == 'day-ambient':
                    enabled = name == 'day' and light != day.objects['Day | Window Key']
                light.hide_render = not enabled
        bpy.context.view_layer.update()

    capture = bpy.data.scenes.new('Shell OIDN')
    capture.collection.objects.link(camera)
    capture.camera = camera
    capture.render.engine = 'CYCLES'
    capture.cycles.samples = 1
    capture.render.resolution_x = capture.render.resolution_y = config.res
    capture.render.resolution_percentage = 100
    capture.compositing_node_group = bpy.data.node_groups.new('Shell OIDN', 'CompositorNodeTree')
    state('day')
    albedo = bake(scene, shell, 'albedo-guide', 'DIFFUSE', {'COLOR'}, config.res, 1)
    normal = bake(scene, shell, 'normal-guide', 'NORMAL', set(), config.res, 1)
    normal[:, :, :3] = normal[:, :, :3] * 2 - 1
    normal[normal[:, :, 3] == 0, :3] = 0
    manifest = {'version': 1, 'scale': config.scale, 'resolution': config.res, 'samples': config.samples,
                'probes': {}, 'clipped': {}, 'exposure': {'day': day.view_settings.exposure, 'night': night.view_settings.exposure}}
    knee = .55 if config.hdr else None
    if knee is not None:
        manifest['highlightKnee'] = knee
        manifest['version'] = 2
    labels = ('day-ambient',) if config.day_ambient_only else (
        ('day', 'night', 'lamp', 'day-ambient') if config.hdr else ('day', 'night', 'lamp')
    )
    for label in labels:
        state(label)
        noisy = bake(scene, shell, 'light-' + label, 'DIFFUSE', {'DIRECT', 'INDIRECT'}, config.res, config.samples)
        result = denoise(capture, 'light-' + label, noisy, albedo, normal, output)
        linear = np.flipud(np.maximum(result[:, :, :3], 0)).copy()
        assert np.isfinite(linear).all() and linear.max() > .05, label
        name = 'light-' + label + '.png'
        encoded = linear if knee is None else np.minimum(linear, knee) + np.log1p(np.maximum(linear - knee, 0))
        pixels = encode_srgb(encoded, config.scale)
        write_png(output/name, pixels)
        linear_limit = config.scale if knee is None else knee + math.expm1(config.scale - knee)
        manifest['probes'][name] = color_metadata(linear, pixels, linear_limit)
        manifest['clipped'][name] = int(np.count_nonzero(encoded.max(axis=2) > config.scale))
        print(label, 'peak', float(linear.max()), 'clipped', manifest['clipped'][name], flush=True)

    frame = camera.data.view_frame(scene=day)
    x = [v.x/-v.z for v in frame]
    y = [v.y/-v.z for v in frame]
    manifest['camera'] = {'position': y_up(camera.matrix_world.translation),
        'target': y_up(day.objects['Cam_Room_Target'].matrix_world.translation),
        'fov': math.degrees(2*math.atan((max(y)-min(y))/2)),
        'offset': [(min(x)+max(x))/(2*(max(x)-min(x))), -(min(y)+max(y))/(2*(max(y)-min(y)))],
        'resolution': [day.render.resolution_x, day.render.resolution_y]}
    (output/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    if config.day_ambient_only:
        return

    print('Shell bake complete. Rendering references.', flush=True)

    scene.render.resolution_x, scene.render.resolution_y = manifest['camera']['resolution']
    scene.render.resolution_percentage = 60
    scene.render.image_settings.file_format = 'PNG'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'None'
    scene.cycles.samples = 96
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.use_denoising = True
    glass = bpy.data.materials.get('RBN_Glass')
    glass_color = next(n for n in glass.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color']
    for label, lamp_on in [('day', False), ('night', False), ('night', True)]:
        state(label, lamp_on)
        set_reference_emitters(emitters, label == 'night', lamp_on)
        if label == 'night':
            glass_color.default_value = (*srgb_linear(.09, .15, .27), 1)
        scene.view_settings.exposure = manifest['exposure'][label]
        scene.render.filepath = str(output / f"blender-{label}{'-lamp' if lamp_on else ''}.png")
        assert bpy.ops.render.render(write_still=True, scene=scene.name) == {'FINISHED'}


if __name__ == '__main__':
    main()
