from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/common.py').read_text(),'common.py','exec'))
positions={
 'Cam_Room':(7.5,-7.5,6.2),'Cam_Room_Target':(0,.4,.8),
 'Cam_Diary':(-.05,1.5,2),'Cam_Diary_Target':(-.05,2.30,.80),
 'Cam_Shelf':(-.78,1.6,1.2),'Cam_Shelf_Target':(-2.78,1.6,1)}
remove_names(*positions);remove_prefix('PreviewLight_')
for name,pos in positions.items():
    o=bpy.data.objects.new(name,None);collection('Markers').objects.link(o)
    o.location=pos;o.empty_display_type='PLAIN_AXES';o.empty_display_size=.12
preview_camera()
def light(name,kind,loc,hexcolor,energy,target=None,size=.1):
    d=bpy.data.lights.new('PreviewLight_'+name,kind);d.energy=energy;d.color=linear_hex(hexcolor)
    if kind=='AREA':d.shape='RECTANGLE';d.size=1.0;d.size_y=.8
    elif kind=='POINT':d.shadow_soft_size=size
    elif kind=='SUN':d.angle=.20
    o=bpy.data.objects.new('PreviewLight_'+name,d);collection('_Preview').objects.link(o);o.location=loc
    if target:o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o
light('Sun','SUN',(-3,5,8),'#fff1dc',3,target=(0,0,0))
light('Window','AREA',(-1.75,2.82,1.9),'#bfe4ff',45,target=(-1,.2,.2))
lamp_pos=scene.objects['Lamp_Light'].matrix_world.translation.copy()
light('Lamp','POINT',lamp_pos,'#ffc977',4,size=.05)
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(*linear_hex('#f3dcc8'),1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.cycles.preview_samples=128;scene.cycles.use_preview_denoising=True
scene.cycles.preview_denoiser='OPENIMAGEDENOISE';scene.cycles.preview_denoising_start_sample=8
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='METAL'
    if any(d.type=='METAL' for d in prefs.devices):scene.cycles.device='GPU'
except Exception as exc:print('Using CPU:',exc)
scene.render.filepath=str(ASSETS/'preview.png')
checkpoint(5)
bpy.ops.render.render(write_still=True)
print('PREVIEW_RENDERED',scene.render.filepath)
