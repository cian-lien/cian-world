import bpy, math, random, shutil, json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path('/Users/cianlien/Downloads/room-blog')
ASSETS=ROOT/'assets/blender'
scene=bpy.context.scene

def linear_hex(value):
    value=value.lstrip('#')
    rgb=[int(value[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb)

def mat(name,value,emission=0):
    name='RB_'+name
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes=True
    c=linear_hex(value);m.diffuse_color=(*c,1)
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*c,1)
    p.inputs['Roughness'].default_value=.78;p.inputs['Metallic'].default_value=0
    p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emission
    return m

M={
    'base':mat('Base','#b9794a'),'floor':mat('Floor','#d79b68'),'seam':mat('FloorSeam','#c4895a'),
    'back':mat('RearWall','#f6e6cf'),'left':mat('LeftWall','#efd8bd'),'wood':mat('Wood','#c98b5a'),
    'desk':mat('Desktop','#e9b97f'),'white':mat('White','#ffffff'),'linen':mat('Linen','#fffaf0'),
    'glass':mat('WindowGlass','#bfe4ff',.25),'gold':mat('Gold','#f2c14e'),'orange':mat('Orange','#ff7b54'),
    'yellow':mat('PosterSun','#ffd36e'),'blue':mat('Blue','#7fb3d5'),'quilt':mat('Quilt','#81b29a'),
    'rug':mat('Rug','#f2a97f'),'rug_inner':mat('RugInner','#f7c59f'),'terra':mat('PlantPot','#d9734e'),
    'leaf':mat('Leaf','#6aa84f'),'leaf_light':mat('LeafLight','#88b964'),'leaf_dark':mat('LeafDark','#54883b'),
    'frame':mat('Frame','#6b4f3a'),'mint':mat('Mint','#9fd3c7'),'pink':mat('Pink','#f6b8b8'),
    'diary':mat('Diary','#d65f45'),'paper':mat('Paper','#fff6e3'),'strap':mat('Strap','#3b2f2f'),
    'monitor':mat('Monitor','#3a3a46'),'key':mat('Keyboard','#f2f2f2'),'screen':mat('Screen','#111118'),
    'cat':mat('Cat','#f0a35e'),'paw':mat('Paw','#fff3e0'),'nose':mat('Nose','#e89191'),'black':mat('Black','#25212a')}

def collection(name):
    c=next((c for c in scene.collection.children if c.name==name),None)
    if c is None:c=bpy.data.collections.new(name);scene.collection.children.link(c)
    return c

def move(o,c):
    if isinstance(c,str):c=collection(c)
    for old in list(o.users_collection):old.objects.unlink(o)
    c.objects.link(o);return o

def remove_names(*names):
    for name in names:
        o=scene.objects.get(name)
        if o:bpy.data.objects.remove(o,do_unlink=True)

def remove_prefix(prefix):
    for o in list(scene.objects):
        if o.name.startswith(prefix):bpy.data.objects.remove(o,do_unlink=True)

def finish(o,name,m=None,bevel=0,c='Static'):
    o.name=name
    if m:o.data.materials.append(m)
    if bevel:
        b=o.modifiers.new('Rounded edges','BEVEL');b.width=bevel;b.segments=3
        w=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');w.keep_sharp=True
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True
    return move(o,c)

def box(name,loc,size,m,bevel=.015,c='Static'):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,m,bevel,c)

def cyl(name,loc,r,depth,m,r2=None,c='Static',vertices=20):
    if r2 is None:bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc)
    else:bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r2,depth=depth,location=loc)
    return finish(bpy.context.object,name,m,min(.008,depth*.15),c)

def sphere(name,loc,scale,m,c='Static'):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,location=loc);o=bpy.context.object;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,m,0,c)

def rod(name,a,b,r,m,c='Static'):
    a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(b-a).length,m,c=c,vertices=16)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o

def tube(name,points,r,m,c='Static'):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=8;data.bevel_depth=r;data.bevel_resolution=1;data.use_fill_caps=True
    s=data.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for b,p in zip(s.bezier_points,points):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,data);collection(c).objects.link(o);data.materials.append(m);return o

def join_parts(name,parts,pivot,c='Interactive',angle=0):
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:
        bpy.context.view_layer.objects.active=o;o.select_set(True)
        if o.type=='CURVE':bpy.ops.object.convert(target='MESH')
        for mod in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
        o.select_set(False)
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.join();o=bpy.context.object;o.name=name
    old_cursor=scene.cursor.location.copy();scene.cursor.location=pivot
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR');scene.cursor.location=old_cursor
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.rotation_euler.z=angle
    move(o,c);o['room_blog_managed']=True
    return o

def parent_keep(o,parent):
    bpy.context.view_layer.update();world=o.matrix_world.copy();o.parent=parent;o.matrix_world=world

def preview_camera():
    o=scene.objects.get('PreviewCam')
    if o is None:
        d=bpy.data.cameras.new('PreviewCam');o=bpy.data.objects.new('PreviewCam',d);collection('_Preview').objects.link(o)
    o.location=(7.5,-7.5,6.2);target=Vector((0,.4,.8))
    o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
    o.data.type='PERSP';o.data.lens=40;o.data.sensor_fit='VERTICAL';o.data.sensor_height=32
    o.data.shift_x=-.025;o.data.shift_y=-.03
    scene.camera=o;return o

def shelf_floor_recess():
    # Bookshelf's exact Z=0 pivot meets the plinth, below the 0.02m floor layer.
    # Cut only the concealed footprint, rather than moving its contractual pivot.
    remove_names('P_Recess_Cutter')
    cutter=box('P_Recess_Cutter',(-2.78,1.6,.02),(.40002,1.20002,.16),None,0)
    for o in list(scene.objects):
        if o.name!='S_Shell_Floor' and not o.name.startswith('S_Shell_FloorSeam_'):continue
        mod=o.modifiers.new('Concealed shelf footprint','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        bpy.context.view_layer.objects.active=o
        while o.modifiers.find(mod.name)>0:bpy.ops.object.modifier_move_up(modifier=mod.name)
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)

def checkpoint(stage):
    ASSETS.mkdir(parents=True,exist_ok=True)
    path=ASSETS/'room.blend'
    if path.exists():shutil.copy2(path,ASSETS/'room_prev.blend')
    scene['room_blog_stage']=stage
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(path))
    print('CHECKPOINT',stage,len(scene.objects),'objects',path)
