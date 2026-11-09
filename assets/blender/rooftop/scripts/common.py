"""Shared modeling primitives for the approved Lingnan rooftop. Units: meters, Z up."""
import bpy, math, random
from pathlib import Path
from mathutils import Vector
ROOT=Path('/Users/cianlien/development/projects/room-blog')
OUT=ROOT/'assets/blender/rooftop'
TAG='lingnan-rooftop-v1'
STREET_LEVEL=-13.8
SCENE=bpy.data.scenes.get('LingnanRooftop') or bpy.data.scenes.new('LingnanRooftop')
bpy.context.window.scene=SCENE
RNG=random.Random(72811)
M={}
def srgb(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def rgba(h):
    h=h.lstrip('#');return tuple(srgb(int(h[i:i+2],16)/255) for i in (0,2,4))+(1,)
def enum(obj,prop,value):
    p=obj.bl_rna.properties[prop]
    allowed={x.identifier for x in p.enum_items}
    if value not in allowed:raise ValueError((prop,value,allowed))
    setattr(obj,prop,value)
def mat(name,color,rough=.72,metal=0,emission=None,strength=0):
    m=bpy.data.materials.get('RT_'+name) or bpy.data.materials.new('RT_'+name)
    m.use_nodes=True;m.diffuse_color=rgba(color)
    n=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    n.inputs['Base Color'].default_value=rgba(color);n.inputs['Roughness'].default_value=rough;n.inputs['Metallic'].default_value=metal
    if emission:n.inputs['Emission Color'].default_value=rgba(emission);n.inputs['Emission Strength'].default_value=strength
    M[name]=m;return m
for name,color in {'cut':'7a4e33','plaster':'e4d9c4','floor':'b9ad99','limestone':'cfbea1','white':'e5e4d7','door':'81917a','doorDark':'53664f','wood':'a88b62','woodDark':'766348','metal':'a3aaa7','metalDark':'59635f','zinc':'959fa3','red':'aa5d4a','redDark':'844b3f','terracotta':'a77d5b','soil':'5e5945','leaf':'7f9569','leafDark':'627b56','leafLight':'9eae80','pink':'c995a4','pinkLight':'ddbbc0','yellow':'c2a16a','water':'799c99','ink':'423c33','linen':'d8d3bd','clothBlue':'9aabaa','paper':'e9debf','glass':'718a88','fruit':'b87160','skin':'e2bf9b','hair':'655241','cloth':'e4deca','sage':'89947b','shoe':'d7cdb4','raincoat':'bb9a60','scarf':'b17e68'}.items():mat(name,color)
mat('water','799c99',.24,.12);mat('metal','a3aaa7',.28,.6);mat('zinc','959fa3',.48,.3)
mat('warmLight','e7c68f',.4,emission='ffd39b',strength=0)
mat('cityLight','534d40',.65,emission='e9b56a',strength=0)
def collection(name):
    c=bpy.data.collections.get('RT_'+name)
    if c is None:c=bpy.data.collections.new('RT_'+name);SCENE.collection.children.link(c)
    c['generator']=TAG;return c
def clear_stage(name):
    c=collection(name)
    for o in list(c.all_objects):
        if o.get('generator')==TAG:bpy.data.objects.remove(o,do_unlink=True)
    return c
def adopt(o,name,material,col,parent=None):
    o.name=name;o['generator']=TAG
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o)
    if material and o.type=='MESH':o.data.materials.append(M[material] if isinstance(material,str) else material)
    if parent:o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    return o
def empty(name,loc,col,parent=None,**extras):
    o=bpy.data.objects.new(name,None);col.objects.link(o);o.location=loc;o['generator']=TAG
    bpy.context.view_layer.update()
    if parent:o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    for k,v in extras.items():o[k]=v
    return o
def bevel(o,width=.015,segments=2):
    if width<=0:return o
    m=o.modifiers.new('Soft edges','BEVEL');m.width=width;m.segments=segments
    # Weighted corner normals retain the broad flat miniature surfaces.
    m=o.modifiers.new('Corner normals','WEIGHTED_NORMAL');m.keep_sharp=True
    return o
def box(name,loc,size,material,col,parent=None,r=.015,rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if rot:o.rotation_euler=rot
    adopt(o,name,material,col,parent);bevel(o,min(r,min(size)*.32))
    return o
def uv(name,loc,size,material,col,parent=None,segments=16,rings=8,smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=loc)
    o=bpy.context.object;o.scale=size
    adopt(o,name,material,col,parent)
    if smooth:
        for p in o.data.polygons:p.use_smooth=True
    return o
def ico(name,loc,size,material,col,parent=None,sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc)
    o=bpy.context.object;o.scale=size;return adopt(o,name,material,col,parent)
def cylinder(name,loc,radius,depth,material,col,parent=None,vertices=16,rot=None,r=.005):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=bpy.context.object
    if rot:o.rotation_euler=rot
    adopt(o,name,material,col,parent);bevel(o,r)
    for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
    return o
def cone(name,loc,r1,r2,depth,material,col,parent=None,vertices=12,rot=None):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc)
    o=bpy.context.object
    if rot:o.rotation_euler=rot
    return adopt(o,name,material,col,parent)
def mesh(name,verts,faces,material,col,parent=None,smooth=False):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    o=bpy.data.objects.new(name,data);col.objects.link(o);o['generator']=TAG
    if material:data.materials.append(M[material] if isinstance(material,str) else material)
    if parent:o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    for p in data.polygons:p.use_smooth=smooth
    return o
def rod(name,a,b,radius,material,col,parent=None,vertices=10,r=.002):
    a,b=Vector(a),Vector(b);o=cylinder(name,(a+b)/2,radius,(b-a).length,material,col,parent,vertices,r=r)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def tube(name,points,radius,material,col,parent=None,res=2):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=1;c.bevel_depth=radius;c.bevel_resolution=res
    p=c.splines.new('POLY');p.points.add(len(points)-1)
    for v,xyz in zip(p.points,points):v.co=(*xyz,1)
    o=bpy.data.objects.new(name,c);col.objects.link(o);o['generator']=TAG;c.materials.append(M[material])
    if parent:o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    return o
def lathe(name,loc,profile,material,col,parent=None,n=24,smooth=True):
    verts=[(loc[0]+r*math.cos(i*math.tau/n),loc[1]+r*math.sin(i*math.tau/n),loc[2]+z) for r,z in profile for i in range(n)]
    faces=[]
    for j in range(len(profile)-1):
        for i in range(n):k=j*n+i;faces.append((k,j*n+(i+1)%n,(j+1)*n+(i+1)%n,k+n))
    return mesh(name,verts,faces,material,col,parent,smooth)
def torus(name,loc,major,minor,material,col,parent=None,rot=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=6,location=loc,major_radius=major,minor_radius=minor)
    o=bpy.context.object
    if rot:o.rotation_euler=rot
    adopt(o,name,material,col,parent)
    for p in o.data.polygons:p.use_smooth=True
    return o
def point_at(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def camera(name,loc,target,lens=45,ortho=None):
    data=bpy.data.cameras.new(name);o=bpy.data.objects.new(name,data);collection('Presentation').objects.link(o);o.location=loc;data.lens=lens
    if ortho:enum(data,'type','ORTHO');data.ortho_scale=ortho
    data.clip_end=200;point_at(o,target);return o
def area(name,loc,target,power,size,color):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=rgba(color)[:3]
    o=bpy.data.objects.new(name,d);collection('Presentation').objects.link(o);o.location=loc;point_at(o,target);return o
def text(name,body,loc,size,material,col,parent=None,rot=(math.pi/2,0,0)):
    d=bpy.data.curves.new(name,'FONT');d.body=body;d.size=size;d.align_x='CENTER';d.extrude=.0008;d.resolution_u=3
    font=Path('/System/Library/Fonts/STHeiti Medium.ttc')
    if font.exists():
        try:d.font=bpy.data.fonts.load(str(font),check_existing=True)
        except RuntimeError:pass
    o=bpy.data.objects.new(name,d);col.objects.link(o);o.location=loc;o.rotation_euler=rot;o['generator']=TAG;d.materials.append(M[material])
    if parent:o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    return o
