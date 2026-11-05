from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/detail_helpers.py').read_text(),'v2/detail_helpers.py','exec'))
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/05c_budget.py').read_text(),'v2/05c_budget.py','exec'))
remove_prefix('V2_Lighting_');remove_prefix('L_Blockout_')
for o in list(scene.objects):
    if o.type=='LIGHT' and o.get('owner')==OWNER:bpy.data.objects.remove(o,do_unlink=True)
def point(name,pos,power,color,radius):
    d=bpy.data.lights.new(name,'POINT');d.energy=power;d.color=linear_hex(color);d.shadow_soft_size=radius
    o=bpy.data.objects.new(name,d);col('Lights').objects.link(o);o.location=pos;o['owner']=OWNER;return o
moon=area('L_Moon',(1.65,2.8,2.68),(-.8,-.8,.35),300,'#9fc1ff',.30)
moon.visible_glossy=False;moon.visible_transmission=False
scene.objects['V2_Room_NightPanel'].visible_shadow=False
area('L_Fill',(2.5,-3.8,4.7),(-.2,.2,.7),235,'#b6b6d0',4)
point('L_Desk',scene.objects['Lamp_Light'].matrix_world.translation,18,'#ffbf80',.035)
point('L_Bedside',(-.75,.25,.735),13,'#ffd39c',.04)
led=area('L_LED',(-.2,1.99,2.845),(-.2,2.20,2.54),22,'#c084df',2)
led.data.shape='RECTANGLE';led.data.size=2;led.data.size_y=.035
box('V2_Lighting_LED',(-.2,1.95,2.85),(1.95,.012,.008),mat('LEDStrip','#d3a2f0',.5,emission=3),P,.003)
area('L_Monitor',(.50,1.80,1.4),(.40,1.2,.70),5,'#9ea6ff',.65)
screen=scene.objects['Computer_Screen'].active_material
screen.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=2
for o in scene.objects:
    if o.name.startswith('V2_Props_FairyBulb'):
        point('L_Fairy_'+o.name.rsplit('.',1)[-1],o.location+Vector((.025,0,0)),.28,'#ffd5a0',.023)
fairy=bpy.data.materials.get('RBN_FairyBulb')
if fairy:fairy.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=4
for name in ['V2_Block_BedsideLampShade','Lamp_Shade']:
    o=scene.objects.get(name)
    if o:
        m=mat('LinenLampShade','#e8d4ad',.85,emission=.16);assign(o,m)
scene.render.engine='CYCLES';scene.cycles.samples=256;scene.cycles.use_denoising=True
scene.cycles.preview_samples=128;scene.cycles.use_preview_denoising=True
scene.render.resolution_x=1800;scene.render.resolution_y=1600;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.3
scene.camera.data.dof.use_dof=False
scene['v2_gate']='Realism revision and stage 6 night lighting: awaiting visual approval before UV/bake test.'
scene['visual_revision']='Realistic geometry/material detail and layered night light'
scene.name='RoomBlog V2 | Realism Review'
for screen_layout in bpy.data.screens:
    for area_ui in screen_layout.areas:
        if area_ui.type=='VIEW_3D':
            shading=area_ui.spaces.active.shading
            shading.use_scene_lights=True;shading.use_scene_world=True
save_render(6);shutil.copy2(scene.render.filepath,ASSETS/'preview.png')
