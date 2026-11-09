"""Render the five actual modeled appearances in a separate presentation scene."""
from common import *
from mathutils import Vector

def make():
    import presentation as P
    P.set_state(False,False,'xiazhi')
    name='RooftopCharacterStudy';old=bpy.data.scenes.get(name)
    if old:
        for o in list(old.objects):bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.scenes.remove(old)
    scene=bpy.data.scenes.new(name);scene['generator']=TAG;bpy.context.window.scene=scene
    col=bpy.data.collections.new('RT_CharacterStudy');scene.collection.children.link(col)
    source=bpy.data.objects['VisitorRoot'];source_objects=[source]+list(source.children_recursive)
    modes=[('日常',()),('撑伞',('umbrella',)),('雨衣',('raincoat',)),('围巾',('scarf',)),('葵扇',('fan',))]
    for i,(label,active) in enumerate(modes):
        copies={}
        for o in source_objects:
            c=o.copy();c.name='Study'+str(i)+'_'+o.name;col.objects.link(c);copies[o]=c
        for o,c in copies.items():
            c.parent=copies.get(o.parent)
            if o.parent:c.matrix_parent_inverse=o.matrix_parent_inverse.copy()
            variant=c.get('weather_variant');c.hide_render=bool((variant and variant not in active) or c.get('hide_under_outfit') in active);c.hide_set(c.hide_render)
        copies[source].location=(-1.7+i*.85,0,source.location.z)
        text('StudyLabel',label,(-1.7+i*.85,-.045,-.12),.13,'ink',col)
    mat('studyFloor','eee7d8',.84)
    box('StudyFloor',(0,0,-.035),(14,12,.05),'studyFloor',col,r=.001)
    world=bpy.data.worlds.new('CharacterStudioWorld');world.use_nodes=True;scene.world=world
    bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=rgba('eee8dc');bg.inputs[1].default_value=.6
    for n,loc,power,size,color in [('StudyKey',(-3,-4,5),450,4,'fff0d6'),('StudyFill',(3,-2,3),220,3,'dfe9eb')]:
        d=bpy.data.lights.new(n,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=rgba(color)[:3]
        o=bpy.data.objects.new(n,d);col.objects.link(o);o.location=loc;point_at(o,(0,0,.5))
    d=bpy.data.cameras.new('CharacterStudyCamera');d.type='ORTHO';d.ortho_scale=4.8
    camera=bpy.data.objects.new('CharacterStudyCamera',d);col.objects.link(camera);camera.location=(0,-6,1.55);point_at(camera,(0,0,.54));scene.camera=camera
    scene.render.engine='CYCLES';scene.cycles.device='GPU';scene.cycles.samples=128;scene.cycles.use_denoising=True
    scene.view_settings.view_transform='AgX';scene.view_settings.exposure=.2
    scene.render.resolution_x=2048;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'reference/character-outfits.png')
    return scene
