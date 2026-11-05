import bpy,math,random,json,shutil
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path('/Users/cianlien/Downloads/room-blog')
ASSETS=ROOT/'assets/blender'
STAGES=ASSETS/'stages/v2'
scene=bpy.context.scene
OWNER='room_blog_v2'
COLLECTIONS=['Static_Room','Static_Furniture','Static_Props','Interactive','Markers','Lights']

def linear_hex(h):
    h=h.lstrip('#');values=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in values)

def mat(name,h,rough=.72,emission=0,metal=0):
    name='RBN_'+name;m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True
    c=linear_hex(h);m.diffuse_color=(*c,1);p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emission
    return m

M={'cut':mat('Cut','#2a2433'),'rear':mat('RearWall','#e9e2f0'),'left':mat('LeftWall','#dcd3e6'),
   'trim':mat('Skirting','#c9bfd6'),'white':mat('WindowFrame','#ececf1'),'sky':mat('NightSky','#101c43'),
   'moon':mat('Moon','#e8ecff',emission=.8),'city':mat('City','#ddba82',emission=.8),
   'clay':mat('BlockoutClay','#c8cbd1',.82),'clay_light':mat('BlockoutLinen','#e2e3e7',.88),
   'clay_dark':mat('BlockoutDark','#626777',.75),'screen':mat('BlockoutScreen','#353746',.75)}

def col(name):return bpy.data.collections.get(name)
def move(o,c):
    for old in list(o.users_collection):old.objects.unlink(o)
    col(c).objects.link(o);o['owner']=OWNER;return o
def remove_prefix(prefix):
    for o in list(scene.objects):
        if o.name.startswith(prefix) and o.get('owner')==OWNER:bpy.data.objects.remove(o,do_unlink=True)
def remove_names(*names):
    for n in names:
        o=scene.objects.get(n)
        if o:
            assert o.get('owner')==OWNER,('Unmanaged object',n)
            bpy.data.objects.remove(o,do_unlink=True)

def finish(o,name,m,c,bevel=0):
    o.name=name;move(o,c)
    if m:o.data.materials.append(m)
    if bevel:
        b=o.modifiers.new('Edge bevel','BEVEL');b.width=bevel;b.segments=3
        n=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');n.keep_sharp=True
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True
    return o
def box(name,loc,size,m,c,bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,m,c,bevel)
def cyl(name,loc,r,depth,m,c,r2=None):
    if r2 is None:bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=depth,location=loc)
    else:bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=r,radius2=r2,depth=depth,location=loc)
    return finish(bpy.context.object,name,m,c,min(.008,depth/8))
def sphere(name,loc,scale,m,c):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc);o=bpy.context.object;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,m,c)
def rod(name,a,b,r,m,c):
    a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(b-a).length,m,c)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def join(name,parts,pivot,c='Interactive',angle=0):
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:
        bpy.context.view_layer.objects.active=o
        for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
    old=scene.cursor.location.copy();scene.cursor.location=pivot;bpy.ops.object.origin_set(type='ORIGIN_CURSOR');scene.cursor.location=old
    o.rotation_euler.z=angle;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return move(o,c)
def parent_keep(o,parent):
    bpy.context.view_layer.update();world=o.matrix_world.copy();o.parent=parent;o.matrix_world=world
def empty(name,pos,c='Markers',parent=None):
    o=bpy.data.objects.new(name,None);col(c).objects.link(o);o['owner']=OWNER;o.location=pos;o.empty_display_size=.08
    if parent:parent_keep(o,parent)
    return o
def bevel(o,width=.015):
    b=o.modifiers.new('Edge bevel','BEVEL');b.width=width;b.segments=3
    n=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');n.keep_sharp=True
def cut_with(o,cutter):
    mod=o.modifiers.new('Opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
def camera():
    o=scene.objects.get('PreviewCam')
    if o is None:
        d=bpy.data.cameras.new('PreviewCam');o=bpy.data.objects.new('PreviewCam',d);scene.collection.objects.link(o);o['owner']=OWNER
    compact=scene.get('layout_variant')=='compact-color'
    o.location=(6.3,-6.5,5.6) if compact else (7.5,-7.5,6.2)
    target=Vector((0,.15,.8) if compact else (0,.4,.8));o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
    o.data.type='PERSP';o.data.lens=50;o.data.sensor_fit='VERTICAL';o.data.sensor_height=40;o.data.shift_x=-.025;o.data.shift_y=-.03
    scene.camera=o;return o
def area(name,loc,target,power,color,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=linear_hex(color);d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);col('Lights').objects.link(o);o['owner']=OWNER;o.location=loc
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
def setup_inspection_lights():
    remove_prefix('L_Blockout_')
    area('L_Blockout_Key',(0,-3,7),(0,.5,.5),1050,'#e8e9ff',5)
    area('L_Blockout_Fill',(5,0,5),(-1,0,1),650,'#d6dcff',4)
    area('L_Blockout_Back',(-3,4,6),(0,0,0),600,'#fff0e5',3)
def save_render(stage):
    camera();scene['room_blog_v2_stage']=stage
    path=ASSETS/'room.blend'
    if path.exists():shutil.copy2(path,ASSETS/'room_prev.blend')
    scene.render.filepath=str(STAGES/f'{stage:02d}-preview.png')
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(path))
    bpy.ops.render.render(write_still=True)
    if stage==3:shutil.copy2(scene.render.filepath,ASSETS/'preview.png')
    print('V2_CHECKPOINT',stage,len(scene.objects),'objects;',scene.render.filepath)
