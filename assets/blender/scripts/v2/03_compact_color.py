from pathlib import Path
BASE=Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2')
SKIP_BLOCKOUT_CHECKPOINT=True
exec(compile((BASE/'03_blockout.py').read_text(),'v2/03_blockout.py','exec'))
SKIP_BLOCKOUT_CHECKPOINT=False
remove_prefix('V2_Color_')
scene['layout_variant']='compact-color'
palette={
 'wood':mat('PaletteOak','#d9b38c',.66),'walnut':mat('PaletteWalnut','#8d6852',.68),
 'ivory':mat('PaletteIvory','#e8e4e0',.75),'linen':mat('PaletteLinen','#e8e0d5',.9),
 'forest':mat('PaletteQuilt','#4b665e',.9),'blue':mat('PaletteBlue','#6c7aa6',.86),
 'peach':mat('PalettePeach','#bb8270',.88),'graphite':mat('PaletteGraphite','#30343f',.65),
 'chair':mat('PaletteChair','#505866',.85),'mat':mat('PaletteDeskMat','#2f2b3a',.8),
 'rug':mat('PaletteRug','#7c778e',.95),'pot':mat('PalettePot','#9c6b55',.78),
 'green':mat('PaletteLeaf','#456a4f',.75),'green_light':mat('PaletteLeafLight','#69885e',.78),
 'diary':mat('PaletteDiary','#9e3b32',.72),'ochre':mat('PaletteOchre','#c5a064',.8),
 'cat':mat('PaletteCat','#e8975a',.9),'paw':mat('PaletteCatWhite','#fff3e0',.9),
 'pink':mat('PalettePink','#d98991',.8),'mint':mat('PaletteMint','#91afa1',.8),
 'lamp':mat('PaletteLamp','#d4b478',.6)}
def assign(o,m):
    o.data.materials.clear();o.data.materials.append(m)
    if o.type=='MESH':
        for face in o.data.polygons:face.material_index=0
def translate_names(prefixes,delta):
    for o in scene.objects:
        if o.parent is None and o.name.startswith(prefixes):o.location+=Vector(delta)

# Move coherent furniture groups; keep their real dimensions.
translate_names(('V2_Block_Desk','V2_Block_Pegboard','V2_Block_FloatingShelf','V2_Block_Mug','V2_Block_Speaker','V2_Block_HeadphoneStand','V2_Block_Succulent','V2_Block_StickyNotes','V2_Block_Curtain'),(-.35,-.8,0))
for name in ['Diary','Computer','Lamp']:scene.objects[name].location+=Vector((-.35,-.8,0))
scene.objects['V2_Block_Chair'].location=(.60,.60,0)
translate_names(('V2_Block_Bed','V2_Block_Mattress','V2_Block_Quilt','V2_Block_Pillow','V2_Block_AccentPillow','V2_Block_Nightstand','V2_Block_AlarmClock'),(.60,.35,0))
translate_names(('V2_Block_Nightstand','V2_Block_Bedside','V2_Block_AlarmClock'),(-.05,.15,0))
translate_names(('V2_Block_LargePlant',),(-.55,-.75,0))
translate_names(('V2_Block_Fan',),(-.30,-.45,0))
for name in ['Frame_1','Frame_2']:scene.objects[name].location+=Vector((.60,.35,0))
scene.objects['Bookshelf'].location=(-2.15,1.10,0)
rug=scene.objects['V2_Block_Rug'];rug.location=(.35,-.85,.01)
for v in rug.data.vertices:v.co.x/=1.3;v.co.y/=1.3
scene.objects['V2_Block_Beanbag'].location=(-.05,-1.20,.33)
nest=scene.objects['V2_Block_CatBed'];nest.location=(.92,-1.30,.025)
for v in nest.data.vertices:v.co.x*=.27/.33;v.co.y*=.27/.33
scene.objects['Cat'].location=(.92,-1.30,.03)

# Give every placeholder its intended palette, without entering detail modeling.
for o in list(scene.objects):
    if o.type!='MESH' or not o.name.startswith('V2_Block_'):continue
    n=o.name
    if any(k in n for k in ['DeskTop','FloatingShelf','BedFrame','BedHeadboard','Nightstand']):m=palette['wood']
    elif 'BedFoot' in n:m=palette['walnut']
    elif 'DeskCabinet' in n:m=palette['ivory']
    elif 'DeskMetalLeg' in n:m=palette['graphite']
    elif 'DeskMat' in n:m=palette['mat']
    elif 'Pegboard' in n:m=mat('PegboardColor','#9e9aa7',.8)
    elif 'AccentPillow' in n:m=palette['peach']
    elif 'Mattress' in n or 'Pillow' in n:m=palette['linen']
    elif 'Quilt' in n:m=palette['forest']
    elif 'Curtain' in n:m=palette['blue']
    elif 'Rug' in n:m=palette['rug']
    elif 'Beanbag' in n:m=palette['peach']
    elif 'CatBed' in n:m=palette['ochre']
    elif 'LargePlantPot' in n or 'SucculentPot' in n:m=palette['pot']
    elif 'LargePlantStem' in n:m=palette['walnut']
    elif 'LargePlantMass' in n or 'SucculentMass' in n:m=palette['green_light'] if n.endswith('.001') else palette['green']
    elif 'Mug' in n:m=mat('MugBlue','#83a0b1',.55)
    elif 'StickyNotes' in n:m=palette['ochre']
    elif 'BedsideBook' in n:m=palette['blue']
    elif 'BedsideLampShade' in n:m=palette['linen']
    elif 'BedsideLamp' in n:m=palette['lamp']
    elif 'FanHead' in n:m=palette['chair']
    else:m=palette['graphite']
    assign(o,m)
# Multi-part proxies retain useful material differences after joining.
for name in ['Computer','Lamp','V2_Block_Chair']:
    o=scene.objects[name]
    for slot in o.material_slots:
        if name=='Computer':slot.material=palette['ivory'] if slot.material and slot.material.name.endswith(('BlockoutClay','BlockoutLinen')) else palette['graphite']
        elif name=='Lamp':slot.material=palette['lamp'] if slot.material and slot.material.name.endswith('BlockoutClay') else palette['graphite']
        else:slot.material=palette['chair'] if slot.material and slot.material.name.endswith('BlockoutClay') else palette['graphite']
assign(scene.objects['Lamp_Shade'],palette['lamp'])
assign(scene.objects['Diary'],palette['diary'])

# Colored book masses make the shelf recognizable during layout review.
shelf_pos=scene.objects['Bookshelf'].location.copy();remove_names('Bookshelf');parts=[];q='V2_Color_Shelf_'
for y in [-.5775,.5775]:parts.append(box(q+'Side',(0,y,1.0),(.4,.045,2),palette['wood'],'Interactive',.012))
parts.append(box(q+'Back',(-.185,0,1),(.03,1.11,2),palette['walnut'],'Interactive',.008))
for z in [.03,.42,.81,1.20,1.59,1.97]:parts.append(box(q+'Shelf',(0,0,z),(.4,1.2,.06),palette['wood'],'Interactive',.01))
book_colors=[palette['blue'],palette['forest'],palette['peach'],palette['ochre'],palette['linen']]
for row,base in enumerate([.06,.45,.84,1.23,1.62]):
    for j in range(5):
        h=.23+(j%3)*.035
        parts.append(box(q+'Book',(0.01,-.44+j*.21,base+h/2),(.27,.16,h),book_colors[(j+row)%5],'Interactive',.004))
shelf=join('Bookshelf',parts,(0,0,0));shelf.location=shelf_pos

# Basic inset frame colors; finer artwork is deferred to the detailed stages.
for name,art,w,h in [('Frame_1',palette['mint'],.50,.42),('Frame_2',palette['peach'],.40,.52)]:
    pos=scene.objects[name].location.copy();remove_names(name);parts=[]
    for y in [-w/2+.025,w/2-.025]:parts.append(box('V2_Color_FrameSide',(0,y,h/2),(.04,.05,h),palette['walnut'],'Interactive',.008))
    for z in [.025,h-.025]:parts.append(box('V2_Color_FrameRail',(0,0,z),(.04,w,.05),palette['walnut'],'Interactive',.008))
    parts.append(box('V2_Color_FrameArt',(.004,0,h/2),(.016,w-.065,h-.065),art,'Interactive',.006))
    frame=join(name,parts,(0,0,0));frame.location=pos

# A few primitive cat features make the orange color readable in the layout.
cat_pos=scene.objects['Cat'].location.copy();remove_names('Cat');q='V2_Color_Cat_';parts=[]
parts.append(sphere(q+'Body',(0,0,.10),(.21,.15,.10),palette['cat'],'Interactive'))
parts.append(sphere(q+'Head',(.14,-.11,.16),(.105,.095,.095),palette['cat'],'Interactive'))
for x in [.08,.20]:
    parts.append(cyl(q+'Ear',(x,-.09,.25),.035,.08,palette['cat'],'Interactive',r2=0))
    parts.append(sphere(q+'Paw',(x,-.20,.022),(.034,.05,.022),palette['paw'],'Interactive'))
for x in [.10,.17]:parts.append(sphere(q+'Eye',(x,-.196,.18),(.010,.008,.012),palette['graphite'],'Interactive'))
parts.append(sphere(q+'Muzzle',(.14,-.196,.145),(.035,.018,.025),palette['paw'],'Interactive'))
parts.append(sphere(q+'Nose',(.14,-.216,.16),(.012,.008,.009),palette['pink'],'Interactive'))
cat=join('Cat',parts,(0,0,0),angle=math.radians(45));cat.location=cat_pos

# Preview screen color is restrained; final emissive lighting waits for its gate.
display=mat('ScreenGradient','#5b6cff',.6,.35)
nodes,links=display.node_tree.nodes,display.node_tree.links
for n in list(nodes):
    if n.type not in {'BSDF_PRINCIPLED','OUTPUT_MATERIAL'}:nodes.remove(n)
tc=nodes.new('ShaderNodeTexCoord');sep=nodes.new('ShaderNodeSeparateXYZ');ramp=nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color=(*linear_hex('#5b6cff'),1);ramp.color_ramp.elements[1].color=(*linear_hex('#b07cff'),1)
links.new(tc.outputs['Generated'],sep.inputs[0]);links.new(sep.outputs['Z'],ramp.inputs[0])
bs=nodes.get('Principled BSDF');links.new(ramp.outputs['Color'],bs.inputs['Base Color']);links.new(ramp.outputs['Color'],bs.inputs['Emission Color'])
assign(scene.objects['Computer_Screen'],display)
for o in scene.objects:
    if o.get('owner')==OWNER and (o.name.startswith(('V2_Block_','V2_Color_')) or o.name in ['Diary','Computer','Cat','Bookshelf','Frame_1','Frame_2','Lamp','Lamp_Shade','Lamp_Light']):o['blockout_only']=True
# The smaller room needs corresponding frontend camera/target anchors.
positions={'Cam_Room':(6.3,-6.5,5.6),'Cam_Room_Target':(0,.15,.8),'Cam_Diary':(-.4,.9,2),'Cam_Diary_Target':(-.4,1.535,.8),
           'Cam_Shelf':(-.18,1.1,1.2),'Cam_Shelf_Target':(-2.15,1.1,1)}
for name,pos in positions.items():scene.objects[name].location=pos
scene['v2_gate']='Stage 3 compact colored layout: awaiting approval; detailed modeling/final lighting/UV/bake/export deferred.'
save_render(3)
