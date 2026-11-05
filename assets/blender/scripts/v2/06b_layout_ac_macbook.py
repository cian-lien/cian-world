from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/detail_helpers.py').read_text(),'v2/detail_helpers.py','exec'))
unknown=[o.name for o in scene.objects if o.get('owner')!=OWNER]
assert not unknown,('Unmanaged scene objects require review',unknown)
remove_prefix('V2_Optimize_');remove_prefix('V2_Detail_Fan');remove_prefix('V2_Block_Fan')
remove_prefix('V2_Detail_MacMini');remove_prefix('V2_Detail_Mini')
remove_names('AirConditioner','MacBook','MacMini')
q='V2_Optimize_'
def shift(o,delta):
    assert o.parent is None
    if 'ac_layout_base' not in o:o['ac_layout_base']=list(o.location)
    o.location=Vector(o['ac_layout_base'])+Vector(delta)
def group(prefixes,delta,condition=None):
    for o in scene.objects:
        if o.parent is None and o.name.startswith(tuple(prefixes)) and (condition is None or condition(o)):shift(o,delta)
# These offsets are relative to the previous revision, not the last run.
group(['V2_Block_BedFoot','V2_Block_BedFrame','V2_Block_BedHeadboard','V2_Block_Mattress','V2_Block_Quilt','V2_Block_Pillow','V2_Block_AccentPillow',
       'V2_Soft_DrapedQuilt','V2_Soft_Quilt','V2_Soft_Mattress','V2_Soft_Pillow','V2_Soft_Accent'],(0,.10,0))
group(['V2_Block_Nightstand','V2_Block_Bedside','V2_Block_AlarmClock','V2_Props_Bedside','V2_Props_OpenPage','V2_Props_BookText','V2_Props_Clock','L_Bedside'],(0,.13,0))
group(['V2_Soft_DrawerFront','V2_Soft_DrawerPull'],(0,.13,0),lambda o:o.location.x<0)
group(['V2_Detail_GamingChair','V2_Detail_ChairStitching'],(-.10,.20,0))
group(['V2_Soft_Beanbag','V2_Block_Beanbag'],(.25,.05,0))
group(['V2_Block_Rug'],(.30,-.05,0))
group(['V2_Block_CatBed','V2_Finish_CatBedRim'],(.30,.10,0))
shift(scene.objects['Cat'],(.30,.10,0));shift(scene.objects['Bookshelf'],(0,.10,0))
group(['V2_Detail_Headphone'],(-.28,0,0))
group(['V2_Props_Mug','V2_Props_Coffee'],(-.28,0,0))
group(['V2_Block_Speaker'],(-.42,.05,0))
group(['V2_Block_DeskMetalLeg'],(-.20,0,0))
group(['V2_Block_DeskCabinet'],(.10,0,0))
group(['V2_Soft_DrawerFront','V2_Soft_DrawerPull'],(.10,0,0),lambda o:o.location.x>0)
desk=scene.objects['V2_Block_DeskTop'];span=max(v.co.x for v in desk.data.vertices)-min(v.co.x for v in desk.data.vertices)
desk.data.transform(Matrix.Diagonal((2.60/span,1,1,1)));desk.location.x=.10
scene.objects['Lamp'].location=(-.97,1.92,.8);group(['L_Desk'],(-.20,0,0))
lamp_cable=scene.objects.get('V2_Props_Cable1')
if lamp_cable:
    lamp_cable.data.splines[0].points[0].co=(-.97,1.96,.88,1)
    lamp_cable.data.splines[0].points[1].co=(-.97,2.01,.81,1)
speaker_cable=scene.objects.get('V2_Props_Cable2')
if speaker_cable:
    speaker_cable.data.splines[0].points[0].co=(-.57,1.98,.88,1)
    speaker_cable.data.splines[0].points[1].co=(-.57,2.01,.81,1)
diary=scene.objects['Diary'];diary.location=(-.77,1.53,.8);diary.rotation_euler.z=math.radians(-3)
scene.objects['Cam_Diary'].location=(-.77,.90,2);scene.objects['Cam_Diary_Target'].location=(-.77,1.53,.8)
scene.objects['Cam_Shelf'].location=(-.18,1.20,1.2);scene.objects['Cam_Shelf_Target'].location=(-2.15,1.20,1)
# Mounted split AC: backplate touches the wall; the front panel faces +X.
AC_WHITE=mat('ACWhite','#e1e2df',.42);AC_SEAM=mat('ACSeam','#b8bcc0',.58);parts=[]
parts.append(box(q+'ACMount',(-2.394,.91,2.72),(.012,.86,.21),AC_SEAM,F,.005))
parts.append(box(q+'ACBody',(-2.22,.91,2.73),(.34,1.06,.33),AC_WHITE,F,.03))
parts.append(box(q+'ACFront',(-2.043,.91,2.765),(.018,1.015,.235),AC_WHITE,F,.018))
parts.append(box(q+'ACOutlet',(-2.038,.91,2.622),(.016,.88,.074),DARK,F,.008))
for z in [2.606,2.625,2.644]:
    parts.append(box(q+'ACLouver',(-2.023,.91,z),(.027,.86,.007),AC_SEAM,F,.003))
for y in [.416,1.404]:parts.append(box(q+'ACEndSeam',(-2.030,y,2.74),(.002,.004,.22),AC_SEAM,F,.001))
parts.append(box(q+'ACDisplay',(-2.030,1.255,2.75),(.004,.11,.045),mat('ACDisplay','#71838a',.4),F,.004))
# Bfont is bundled with Blender; convert the small status display to geometry.
bpy.ops.object.text_add(location=(-2.026,1.215,2.736));txt=bpy.context.object
txt.name=q+'ACDigits';move(txt,F);txt.data.body='24';txt.data.size=.029;txt.data.extrude=.0001
txt.data.materials.append(mat('ACDigits','#bee3d7',.5,emission=.5))
txt.rotation_euler=Matrix(((0,0,1),(1,0,0),(0,1,0))).to_euler()
bpy.ops.object.convert(target='MESH');parts.append(txt)
ac=join('AirConditioner',parts,(-2.4,.91,2.565),F)
ac['device']='Wall-mounted split air conditioner';ac['replaces']='Floor fan'
curve(q+'ACConduit',[(-2.377,1.44,2.72),(-2.377,2.12,2.72),(-2.377,2.12,2.04)],AC_WHITE,.010,F)
# Open aluminium MacBook, placed beside the display at true tabletop height.
ALU=mat('DeviceAluminium','#aab0b6',.30,metal=.75);BEZEL=mat('LaptopBezel','#171b24',.43)
KEY=mat('LaptopKey','#272e38',.57);TRACKPAD=mat('LaptopTrackpad','#929aa4',.35,metal=.65)
parts=[]
parts.append(box(q+'LaptopBase',(0,0,.008),(.304,.215,.016),ALU,P,.006))
parts.append(box(q+'LaptopKeyboardWell',(0,.025,.0165),(.276,.124,.002),BEZEL,P,.003))
for row in range(5):
    for j in range(13):
        if row==0 and 3<=j<=8:continue
        o=box(q+'LaptopKey',(-.124+j*.0207,-.016+row*.022,.019),(.0175,.018,.003),KEY,P,.001)
        o.modifiers['Edge bevel'].segments=1;parts.append(o)
parts.append(box(q+'LaptopSpace',(-.01,-.016,.019),(.118,.018,.003),KEY,P,.001))
parts.append(box(q+'LaptopTrackpad',(0,-.071,.0168),(.113,.055,.0016),TRACKPAD,P,.003))
for s in [-1,1]:
    for j in range(10):parts.append(box(q+'LaptopSpeaker',(s*.145,.001+j*.007,.017),(.003,.003,.001),KEY,P,0))
    parts.append(box(q+'LaptopPort',(s*.152,-.007,.008),(.0015,.020,.004),DARK,P,.001))
hinge=Vector((0,.101,.018));rot=Matrix.Rotation(math.radians(-15),4,'X')
display=mat('LaptopWallpaper','#385e83',.45,emission=.85)
nodes,links=display.node_tree.nodes,display.node_tree.links
for n in list(nodes):
    if n.type not in {'BSDF_PRINCIPLED','OUTPUT_MATERIAL'}:nodes.remove(n)
tc=nodes.new('ShaderNodeTexCoord');sep=nodes.new('ShaderNodeSeparateXYZ');ramp=nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color=(*linear_hex('#263c69'),1);ramp.color_ramp.elements[1].color=(*linear_hex('#d79278'),1)
links.new(tc.outputs['Generated'],sep.inputs[0]);links.new(sep.outputs['Z'],ramp.inputs[0])
bs=next(item for item in nodes if item.type=='BSDF_PRINCIPLED');links.new(ramp.outputs['Color'],bs.inputs['Base Color']);links.new(ramp.outputs['Color'],bs.inputs['Emission Color'])
lid=[box(q+'LaptopLid',(0,0,.106),(.304,.008,.212),ALU,P,.005),
     box(q+'LaptopBezel',(0,-.0048,.107),(.294,.002,.200),BEZEL,P,.004),
     box(q+'LaptopScreen',(0,-.0062,.112),(.278,.001,.177),display,P,.002),
     sphere(q+'LaptopWebcam',(0,-.0065,.202),(.002,.001,.002),DARK,P)]
for o in lid:o.matrix_world=Matrix.Translation(hinge)@rot@o.matrix_world
parts.extend(lid)
macbook=join('MacBook',parts,(0,0,0),P);macbook.data.transform(Matrix.Scale(.42/.304,4));macbook.location=(-.28,1.81,.8)
macbook['device']='MacBook';macbook['lid_open_degrees']=105
# Mac mini stays at the right of the display, with a rubber foot, ports and LED.
parts=[]
parts.append(cyl(q+'MiniFoot',(0,0,.002),.078,.004,DARK,P))
parts.append(box(q+'MiniCase',(0,0,.041),(.197,.197,.078),ALU,P,.016))
parts.append(box(q+'MiniFront',(0,-.0988,.035),(.144,.002,.033),mat('MiniFront','#868e98',.4,metal=.6),P,.004))
for x in [-.046,-.015]:parts.append(box(q+'MiniUSB',(x,-.1003,.038),(.015,.002,.006),DARK,P,.002))
port=cyl(q+'MiniJack',(.040,-.1006,.038),.004,.002,DARK,P);port.rotation_euler.x=math.pi/2;parts.append(port)
parts.append(sphere(q+'MiniPowerLED',(.070,-.100,.019),(.002,.001,.002),mat('MiniPowerLED','#e4eadc',.5,emission=1.5),P))
parts.append(box(q+'MiniRearVent',(0,.099,.028),(.14,.002,.009),DARK,P,.002))
# A small restrained top badge helps the aluminium enclosure read at overview scale.
parts.append(sphere(q+'MiniBadge',(0,0,.0802),(.016,.018,.0004),DARK,P))
leaf=sphere(q+'MiniBadgeLeaf',(.007,.024,.0802),(.005,.010,.0004),DARK,P);leaf.rotation_euler.z=-.5;parts.append(leaf)
mini=join('MacMini',parts,(0,0,0),P);mini.data.transform(Matrix.Scale(.28/.197,4));mini.location=(1.21,1.88,.8);mini['device']='Mac mini'
curve(q+'LaptopCable',[(-.068,1.80,.811),(.04,1.91,.806),(.10,1.99,.806),(.40,1.99,.81),(.50,1.92,.82)],DARK,.0018,P)
curve(q+'MiniCable',[(1.21,2.02,.838),(1.21,2.03,.81),(.68,2.03,.81),(.50,1.93,.83)],DARK,.002,P)
scene['layout_revision']='ac-macbook-v1'
scene['device_proportion_revision']='MacBook 0.42m wide, Mac mini 0.28m wide; desk 2.60m wide'
scene['layout_notes']='Bed/nightstand rearward; chair centred on monitor; lounge moved right; fan replaced by wall AC; MacBook left / Mac mini right of monitor.'
scene['v2_gate']='Revised layout and devices: awaiting visual approval before bake test.'
scene.cycles.samples=256;scene.cycles.use_denoising=True
save_render(6);shutil.copy2(scene.render.filepath,ASSETS/'preview.png')
print('LAYOUT_REVISION',scene['layout_revision'])
