from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/common.py').read_text(),'v2/common.py','exec'))
F='Static_Furniture';P='Static_Props';I='Interactive'
def assign(o,m):
    o.data.materials.clear();o.data.materials.append(m)
    for p in o.data.polygons:p.material_index=0
def hide_proxies(prefixes):
    for o in scene.objects:
        if o.name.startswith(tuple(prefixes)) and o.get('owner')==OWNER:
            o.hide_render=True;o.hide_set(True);o['superseded_proxy']=True
def mesh_obj(name,verts,faces,m,c=F,sub=0,solid=0):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update()
    o=bpy.data.objects.new(name,d);col(c).objects.link(o);o['owner']=OWNER;d.materials.append(m)
    for p in d.polygons:p.use_smooth=True
    if sub:
        mod=o.modifiers.new('Soft subdivision','SUBSURF');mod.levels=sub;mod.render_levels=sub
    if solid:
        mod=o.modifiers.new('Fabric thickness','SOLIDIFY');mod.thickness=solid
    return o
def curve(name,points,m,r=.003,c=P,cyclic=False):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=10;d.bevel_depth=r;d.bevel_resolution=1
    s=d.splines.new('POLY');s.points.add(len(points)-1)
    for v,p in zip(s.points,points):v.co=(*p,1)
    s.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,d);col(c).objects.link(o);o['owner']=OWNER;d.materials.append(m);return o
def ring(name,center,r,m,tube=.004,axis='Z',c=P,n=48):
    cx,cy,cz=center
    ps=[]
    for j in range(n):
        t=j*math.tau/n;a,b=r*math.cos(t),r*math.sin(t)
        ps.append((cx+a,cy+b,cz) if axis=='Z' else ((cx+a,cy,cz+b) if axis=='Y' else (cx,cy+a,cz+b)))
    return curve(name,ps,m,tube,c,True)
def cloth_mat(name,color):
    m=mat(name,color,.86);n=m.node_tree.nodes;l=m.node_tree.links;p=next(item for item in n if item.type=='BSDF_PRINCIPLED')
    p.inputs['Sheen Weight'].default_value=.24
    for x in list(n):
        if x.type not in {'BSDF_PRINCIPLED','OUTPUT_MATERIAL'}:n.remove(x)
    tc=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=190;noise.inputs['Roughness'].default_value=.75
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.0015
    l.new(tc.outputs['Generated'],noise.inputs['Vector']);l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m
def wood_mat(name,color):
    m=mat(name,color,.55);n=m.node_tree.nodes;l=m.node_tree.links;p=next(item for item in n if item.type=='BSDF_PRINCIPLED')
    for x in list(n):
        if x.type not in {'BSDF_PRINCIPLED','OUTPUT_MATERIAL'}:n.remove(x)
    tc=n.new('ShaderNodeTexCoord');mp=n.new('ShaderNodeVectorMath');mp.operation='MULTIPLY';mp.inputs[1].default_value=(2,48,8)
    noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=3;noise.inputs['Detail'].default_value=3;noise.inputs['Roughness'].default_value=.65
    ramp=n.new('ShaderNodeValToRGB');base=linear_hex(color)
    ramp.color_ramp.elements[0].position=.15;ramp.color_ramp.elements[0].color=(*(v*.60 for v in base),1)
    ramp.color_ramp.elements[1].position=.88;ramp.color_ramp.elements[1].color=(*(min(1,v*1.12) for v in base),1)
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.15;bump.inputs['Distance'].default_value=.0015
    l.new(tc.outputs['Generated'],mp.inputs[0]);l.new(mp.outputs['Vector'],noise.inputs['Vector']);l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs['Color'],p.inputs['Base Color']);l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m
WOOD=wood_mat('DetailedOak','#bc9771');WALNUT=wood_mat('DetailedWalnut','#75533e')
LINEN=cloth_mat('DetailedLinen','#dfd7c6');FOREST=cloth_mat('DetailedQuilt','#415c53');BLUE=cloth_mat('DetailedCurtain','#616f91')
PEACH=cloth_mat('DetailedTerracotta','#aa7561');RUG=cloth_mat('DetailedRug','#77717f')
DARK=mat('DetailedBlack','#25282e',.54);METAL=mat('DetailedMetal','#777e87',.32,metal=.7)
PIPING=mat('DetailedPiping','#9bafa3',.83);IVORY=mat('DetailedIvory','#dedbd4',.56)
def checkpoint(stage,label):
    scene['visual_revision']=label;scene.cycles.samples=64;scene.cycles.use_denoising=True
    save_render(stage)
    shutil.copy2(scene.render.filepath,ASSETS/'preview.png')
