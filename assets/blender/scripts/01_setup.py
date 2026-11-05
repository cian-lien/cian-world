from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/common.py').read_text(),'common.py','exec'))
remove_names('Cube','Camera','Light')
scene.name='RoomBlog'
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
for name in ['Static','Interactive','Markers','_Preview']:collection(name)
preview_camera()
world=bpy.data.worlds.get('RB_World') or bpy.data.worlds.new('RB_World');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(*linear_hex('#f3dcc8'),1)
world.node_tree.nodes['Background'].inputs[1].default_value=.7;scene.world=world
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.cycles.preview_samples=64;scene.cycles.use_preview_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ASSETS/'preview.png')
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_perspective='CAMERA';a.spaces.active.region_3d.view_camera_zoom=5
            a.spaces.active.shading.type='MATERIAL';a.spaces.active.overlay.show_overlays=False
checkpoint(1)
