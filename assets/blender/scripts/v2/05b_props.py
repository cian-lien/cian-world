from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/detail_helpers.py').read_text(),'v2/detail_helpers.py','exec'))
remove_prefix('V2_Props_');q='V2_Props_';rng=random.Random(152)
hide_proxies(['V2_Block_BedsideBook','V2_Block_Mug','V2_Block_AlarmClock'])
PAGE=mat('BookPages','#ddd4bf',.88);GOLD=mat('BookFoil','#bba276',.5,metal=.3)
bookm=[mat('BookCover'+str(j),h,.74) for j,h in enumerate(['#566779','#6f816d','#a17665','#b39764','#6c626f','#c6bda9','#44545b'])]
def book(name,loc,size,color,c=P,parts=None):
    x,y,z=loc;w,d,h=size;made=[]
    made.append(box(name+'Pages',(x,y,z+h/2),(w-.008,d-.012,h-.012),PAGE,c,.002))
    for xx in [x-w/2+.002,x+w/2-.002]:made.append(box(name+'Cover',(xx,y,z+h/2),(.004,d,h),color,c,.002))
    made.append(box(name+'Spine',(x,y-d/2+.004,z+h/2),(w,.008,h),color,c,.003))
    for zz in [z+h*.14,z+h*.85]:made.append(box(name+'Foil',(x,y-d/2-.001,zz),(w*.65,.002,.004),GOLD,c,.001))
    if parts is not None:parts.extend(made)
    return made
# A real bookcase: thin book spines, varied heights and a few horizontal stacks.
pos=scene.objects['Bookshelf'].location.copy();remove_names('Bookshelf');parts=[]
for y in [-.5775,.5775]:parts.append(box(q+'ShelfSide',(0,y,1),(.4,.045,2),WOOD,I,.009))
parts.append(box(q+'ShelfBack',(-.186,0,1),(.028,1.11,2),WALNUT,I,.004))
for z in [.03,.42,.81,1.20,1.59,1.97]:parts.append(box(q+'ShelfBoard',(0,0,z),(.4,1.2,.06),WOOD,I,.008))
for row,z in enumerate([.06,.45,.84,1.23,1.62]):
    y=-.51
    for j in range(7 if row%2==0 else 5):
        thick=rng.uniform(.04,.085);h=rng.uniform(.22,.31);d=.24+rng.uniform(-.02,.02)
        # Shelf opens toward +X: spines face into the room.
        parts.append(box(q+'ShelfPages',(.018,y+thick/2,z+h/2),(d-.014,thick-.008,h-.012),PAGE,I,.002))
        for yy in [y+.002,y+thick-.002]:parts.append(box(q+'ShelfCover',(.018,yy,z+h/2),(d,.004,h),bookm[(j+row)%len(bookm)],I,.002))
        parts.append(box(q+'ShelfSpine',(.018+d/2-.004,y+thick/2,z+h/2),(.008,thick,h),bookm[(j+row)%len(bookm)],I,.003))
        for zz in [z+.045,z+h-.045]:parts.append(box(q+'SpineStripe',(.018+d/2+.001,y+thick/2,zz),(.002,thick*.64,.004),GOLD,I,.001))
        y+=thick+.012
    if row%2:
        for k in range(3):
            parts.append(box(q+'StackedBook',(.01,.30,z+.02+k*.041),(.27,.34,.033),bookm[(k+row)%7],I,.004))
    else:parts.append(box(q+'StorageBox',(.02,.35,z+.105),(.26,.29,.21),LINEN,I,.006))
shelf=join('Bookshelf',parts,(0,0,0));shelf.location=pos
# Diary: cream page block, leather covers, elastic strap and bookmark.
pos=scene.objects['Diary'].location.copy();remove_names('Diary');parts=[];red=mat('DiaryLeather','#87372e',.62)
parts.append(box(q+'DiaryPages',(0,0,.0375),(.348,.446,.055),PAGE,I,.004))
for z in [.005,.070]:parts.append(box(q+'DiaryCover',(0,0,z),(.36,.46,.010),red,I,.006))
parts.append(box(q+'DiarySpine',(-.175,0,.0375),(.010,.46,.075),red,I,.004))
parts.append(box(q+'DiaryBand',(.12,0,.076),(.018,.46,.003),DARK,I,.001))
parts.append(box(q+'DiaryRibbon',(-.05,-.229,.037),(.018,.002,.04),GOLD,I,.001))
diary=join('Diary',parts,(0,0,0),angle=math.radians(-17));diary.location=pos
# The pegboard holes are recessed dark circles on the face of a thick wood board.
assign(scene.objects['V2_Block_Pegboard'],mat('PegboardWood','#a29483',.8))
for row in range(7):
    for j in range(15):
        x=-.76+j*.115;z=1.36+row*.13
        points=[(x+.008*math.cos(t*math.tau/10),2.166,z+.008*math.sin(t*math.tau/10)) for t in range(10)]
        mesh_obj(q+'PegHole',points,[tuple(range(10))],DARK,P)
for j,(x,z,w,h) in enumerate([(-.57,1.84,.19,.23),(-.33,1.95,.16,.17),(.57,2.02,.19,.14)]):
    box(q+'PinnedNote',(x,2.148,z),(w,.006,h),bookm[j+2],P,.002)
    pin=sphere(q+'NotePin',(x,2.137,z+h/2-.018),(.009,.006,.009),METAL,P)
    for k in range(3):box(q+'NoteLine',(x,2.144,z+.035-k*.035),(w*.65,.001,.003),PAGE,P,0)
# Shelves now carry objects at actual shelf-top contact height.
for base,start,count in [(2.345,-1.12,5),(2.905,-.87,4)]:
    for j in range(count):
        w=.035+.009*(j%3);book(q+'FloatingBook',(start+j*.064,2.055,base),(w,.17,.20+.022*(j%3)),bookm[j])
for k in range(3):box(q+'UpperStack',(.02,2.06,2.922+k*.036),(.32,.19,.034),bookm[k+1],P,.004)
box(q+'CameraBody',(.22,2.02,2.414),(.19,.10,.138),DARK,P,.012)
lens=cyl(q+'CameraLens',(.22,1.952,2.42),.044,.064,METAL,P);lens.rotation_euler.x=math.pi/2
lens=cyl(q+'CameraGlass',(.22,1.917,2.42),.034,.006,mat('CameraGlass','#253c48',.18,metal=.4),P);lens.rotation_euler.x=math.pi/2
box(q+'CameraTop',(.20,2.02,2.49),(.09,.07,.023),DARK,P,.006)
cyl(q+'ShelfPot',(.65,2.04,2.405),.058,.12,mat('ShelfPot','#b89c82',.8),P,r2=.073)
for j in range(7):
    a=j*2.399;rod(q+'ShelfPlantStem',(.65,2.04,2.45),(.65+.07*math.cos(a),2.04+.05*math.sin(a),2.55+.012*(j%3)),.002,bookm[1],P)
    sphere(q+'ShelfPlantLeaf',(.65+.07*math.cos(a),2.04+.05*math.sin(a),2.55+.012*(j%3)),(.037,.018,.012),bookm[1],P)
# Mug with visible opening, coffee surface and handle.
MUG=mat('CeramicMug','#6e8b94',.35)
cyl(q+'Mug',(-.80,1.67,.87),.052,.14,MUG,P)
cyl(q+'Coffee',(-.80,1.67,.936),.044,.003,mat('Coffee','#3b2417',.28),P)
ring(q+'MugLip',(-.80,1.67,.94),.048,MUG,.005)
ring(q+'MugHandle',(-.86,1.67,.884),.035,MUG,.009,'Y',n=24)
# An opened book on the nightstand, with a crease down the centre.
box(q+'BedsideBookCover',(-.76,-.06,.557),(.34,.21,.014),bookm[0],P,.003)
for s in [-1,1]:
    page=box(q+'OpenPage',(-.76+s*.082,-.06,.574),(.16,.198,.018),PAGE,P,.003);page.rotation_euler.y=s*.055
    for j in range(5):box(q+'BookText',(-.76+s*.082,-.12+j*.03,.586),(.11,.0015,.001),mat('PrintInk','#908777',.9),P,0)
box(q+'Clock',(-.57,.23,.60),(.12,.065,.10),DARK,P,.012)
box(q+'ClockDisplay',(-.57,.195,.60),(.10,.003,.06),mat('ClockGlow','#8ebbb0',.5,emission=.25),P,.003)
# Cable runs stay behind equipment and follow the leg down to the floor.
for j,x in enumerate([.48,-.77,-.15]):
    curve(q+'Cable'+str(j),[(x,1.96,1.00 if j==0 else .88),(x,2.01,.81),(-.88,2.015,.77),(-.90,1.98,.42),(-.88,1.98,.06),(-.64,2.08,.025)],DARK,.003)
# Warm string-light geometry; lighting strength is set in the lighting stage.
WIRE=mat('StringWire','#47433a',.8);BULB=mat('FairyBulb','#ffd292',.5,emission=1)
for segment,(a,b) in enumerate([(-1.98,-1.02),(-1.02,-.10)]):
    def pt(t):return (-2.366,a+(b-a)*t,2.31-.18*math.sin(math.pi*t))
    curve(q+'FairyWire',[pt(j/50) for j in range(51)],WIRE,.0025)
    for j in range(7):
        x,y,z=pt((j+.5)/7);rod(q+'BulbSocket',(x,y,z),(x+.017,y,z-.018),.005,DARK,P);sphere(q+'FairyBulb',(x+.025,y,z-.025),(.014,.014,.021),BULB,P)
# Abstract inset artwork, retaining each frame as an independent root.
for name in ['Frame_1','Frame_2']:
    frame=scene.objects[name];w=frame.dimensions.y;h=frame.dimensions.z;pos=frame.location
    for j in range(3):
        z=pos.z+h*(.24+j*.15);y=pos.y-w*.20+j*w*.17
        art=box(q+'Artwork',(pos.x+.025,y,z),(.001,w*.30,h*.11),bookm[(j+2)%7],P,.001);parent_keep(art,frame)
scene['realism_revision']='Detailed review: geometry and materials; no UV/baking/export.'
checkpoint(5,'Compact realistic detail review')
