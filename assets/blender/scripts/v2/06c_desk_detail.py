from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/common.py').read_text(),'v2/common.py','exec'))
camera=scene.camera;matrix=camera.matrix_world.copy();lens=camera.data.lens;shift_x=camera.data.shift_x;shift_y=camera.data.shift_y
resolution=(scene.render.resolution_x,scene.render.resolution_y);old_path=scene.render.filepath
try:
    camera.location=(2.25,-.65,2.25);target=Vector((.12,1.72,1.08));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.lens=68;camera.data.shift_x=0;camera.data.shift_y=0
    scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.filepath=str(STAGES/'06-desk-detail.png')
    bpy.ops.render.render(write_still=True)
finally:
    camera.matrix_world=matrix;camera.data.lens=lens;camera.data.shift_x=shift_x;camera.data.shift_y=shift_y
    scene.render.resolution_x,scene.render.resolution_y=resolution;scene.render.filepath=old_path
print('DESK_DETAIL',STAGES/'06-desk-detail.png')
