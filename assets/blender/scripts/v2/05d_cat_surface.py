from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/detail_helpers.py').read_text(),'v2/detail_helpers.py','exec'))
remove_prefix('V2_Finish_');q='V2_Finish_'
pos=scene.objects['Cat'].matrix_world.translation.copy();remove_names('Cat');parts=[]
ginger=mat('TabbyCoat','#c98c54',.96);WHITE=cloth_mat('CatWhite','#eee2ca')
nodes,links=ginger.node_tree.nodes,ginger.node_tree.links;bs=nodes.get('Principled BSDF')
for n in list(nodes):
    if n.type not in {'BSDF_PRINCIPLED','OUTPUT_MATERIAL'}:nodes.remove(n)
tex=nodes.new('ShaderNodeTexCoord');wave=nodes.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='X';wave.inputs['Scale'].default_value=.9;wave.inputs['Distortion'].default_value=2.5
ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.18;ramp.color_ramp.elements[0].color=(*linear_hex('#b47743'),1);ramp.color_ramp.elements[1].position=.42;ramp.color_ramp.elements[1].color=(*linear_hex('#d69a61'),1)
links.new(tex.outputs['Generated'],wave.inputs['Vector']);links.new(wave.outputs['Color'],ramp.inputs[0]);links.new(ramp.outputs['Color'],bs.inputs['Base Color'])
parts.append(sphere(q+'CatBody',(-.02,.02,.103),(.20,.145,.103),ginger,I))
parts.append(sphere(q+'CatHaunch',(-.115,.035,.108),(.105,.12,.10),ginger,I))
parts.append(sphere(q+'CatHead',(.115,-.075,.147),(.091,.078,.081),ginger,I))
for x in [.058,.171]:
    vs=[(x-.032,-.064,.19),(x+.032,-.064,.19),(x+.008,-.052,.264),(x-.027,-.016,.19),(x+.027,-.016,.19),(x+.008,-.027,.255)]
    ear=mesh_obj(q+'CatEar',vs,[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)],ginger,I);bevel(ear,.006);parts.append(ear)
    parts.append(mesh_obj(q+'InnerEar',[(x-.021,-.068,.197),(x+.021,-.068,.197),(x+.006,-.056,.244)],[(0,1,2)],mat('CatEarPink','#c38778',.96),I))
for x,y in [(.07,-.14),(.15,-.14)]:parts.append(sphere(q+'Paw',(x,y,.020),(.033,.050,.020),WHITE,I))
parts.append(sphere(q+'Muzzle',(.12,-.144,.125),(.04,.016,.027),WHITE,I))
parts.append(sphere(q+'Nose',(.12,-.159,.145),(.010,.006,.007),mat('CatNose','#805551',.98),I))
parts.append(curve(q+'Tail',[(-.025+.19*math.cos(a),.02+.135*math.sin(a),.056+.014*math.sin(a)) for a in [math.pi*.3+j*math.pi*1.65/35 for j in range(36)]],ginger,.025,I))
for x in [.085,.155]:
    parts.append(curve(q+'ClosedEye',[(x-.017+j*.034/8,-.150,.163-.006*math.sin(math.pi*j/8)) for j in range(9)],DARK,.002,I))
for o in parts:
    if o.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
cat=join('Cat',parts,(0,0,0),angle=math.radians(35));cat.location=pos
ring(q+'CatBedRim',(.92,-1.30,.058),.235,cloth_mat('CatBedLinen','#b29b75'),.025,'Z',F)
# The rug rim is circular even at the high-resolution camera view.
old=scene.objects['V2_Block_Rug'];loc=old.location.copy();remove_names('V2_Block_Rug')
bpy.ops.mesh.primitive_cylinder_add(vertices=128,radius=1,depth=.02,location=loc)
finish(bpy.context.object,'V2_Block_Rug',RUG,F,.004)
# Very shallow plaster relief avoids a glossy, perfectly uniform wall surface.
for key in ['RBN_RearWall','RBN_LeftWall']:
    m=bpy.data.materials[key];n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');p.inputs['Roughness'].default_value=.9
    for item in list(n):
        if item.type not in {'BSDF_PRINCIPLED','OUTPUT_MATERIAL'}:n.remove(item)
    noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=180;noise.inputs['Detail'].default_value=2
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.001
    l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
checkpoint(5,'Compact detailed review including tabby cat and material microstructure')
