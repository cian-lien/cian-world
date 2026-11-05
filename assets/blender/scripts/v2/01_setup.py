from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/common.py').read_text(),'v2/common.py','exec'))
known={r['name'] for r in json.loads((ASSETS/'archive/v1/validation.json').read_text())['all_objects']}
unknown=[o.name for o in scene.objects if o.name not in known and o.get('owner')!=OWNER]
assert not unknown,('Ask user before touching unknown objects',unknown)
for o in list(scene.objects):bpy.data.objects.remove(o,do_unlink=True)
for c in list(scene.collection.children):
    scene.collection.children.unlink(c)
    if c.users==0:bpy.data.collections.remove(c)
for name in COLLECTIONS:
    assert bpy.data.collections.get(name) is None,('Collection owned elsewhere',name)
    scene.collection.children.link(bpy.data.collections.new(name))
scene.name='RoomBlog V2 | Layout Review';scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
world=bpy.data.worlds.get('RBN_World') or bpy.data.worlds.new('RBN_World');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(*linear_hex('#0b0a10'),1)
world.node_tree.nodes['Background'].inputs[1].default_value=.05;scene.world=world
camera();setup_inspection_lights()
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.cycles.preview_samples=128;scene.cycles.use_preview_denoising=True
scene.render.resolution_x=1800;scene.render.resolution_y=1600;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='METAL'
    if any(d.type=='METAL' for d in prefs.devices):scene.cycles.device='GPU'
except Exception as exc:print('CPU fallback:',exc)
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_perspective='CAMERA';a.spaces.active.region_3d.view_camera_zoom=3
            a.spaces.active.shading.type='MATERIAL';a.spaces.active.overlay.show_overlays=False
save_render(1)
