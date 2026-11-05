from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/common.py').read_text(),'common.py','exec'))
shelf_floor_recess()
checkpoint(5)
bpy.ops.render.render(write_still=True)
print('Floor contact corrected, preview refreshed.')
