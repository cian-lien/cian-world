from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/detail_helpers.py').read_text(),'v2/detail_helpers.py','exec'))
remove_prefix('V2_Detail_');q='V2_Detail_'
hide_proxies(['V2_Block_Chair','V2_Block_Fan','V2_Block_LargePlantMass','V2_Block_LargePlantStem','V2_Block_SucculentMass','V2_Block_HeadphoneStand'])
UPHOLSTERY=cloth_mat('ChairFabric','#353b43');ACCENT=mat('ChairAccent','#64828a',.7)
# Five-star base, twin caster wheels and a racing-chair shell.
parts=[]
parts.append(cyl(q+'ChairLift',(0,0,.29),.035,.38,METAL,F))
parts.append(cyl(q+'ChairLiftCover',(0,0,.23),.055,.24,DARK,F))
for j in range(5):
    a=j*math.tau/5;d=Vector((math.cos(a),math.sin(a),0));end=d*.31
    parts.append(rod(q+'ChairSpoke',(0,0,.16),(end.x,end.y,.085),.025,DARK,F))
    for sign in [-1,1]:
        perp=Vector((-d.y,d.x,0))*.025*sign;pos=end+perp;pos.z=.035
        w=cyl(q+'Caster',pos,.035,.028,DARK,F);w.rotation_euler=(Vector((-d.y,d.x,0))).to_track_quat('Z','Y').to_euler();parts.append(w)
    parts.append(rod(q+'CasterFork',(end.x,end.y,.035),(end.x,end.y,.09),.011,METAL,F))
parts.append(box(q+'ChairSeat',(0,0,.49),(.54,.53,.12),UPHOLSTERY,F,.03))
outline=[(-.24,.57),(-.31,.77),(-.29,1.14),(-.21,1.34),(-.14,1.41),(.14,1.41),(.21,1.34),(.29,1.14),(.31,.77),(.24,.57)]
vs=[(x,-.20-(z-.57)*.13+dy,z) for dy in [-.04,.05] for x,z in outline];n=len(outline)
fs=[tuple(reversed(range(n))),tuple(n+j for j in range(n))]+[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
back=mesh_obj(q+'ChairRacingBack',vs,fs,UPHOLSTERY);bevel(back,.022);parts.append(back)
for s in [-1,1]:
    bolster=sphere(q+'SeatBolster',(s*.24,.03,.54),(.055,.23,.065),DARK,F);parts.append(bolster)
    bolster=sphere(q+'BackBolster',(s*.23,-.20,.94),(.065,.07,.29),DARK,F);bolster.rotation_euler.y=s*.10;parts.append(bolster)
    parts.append(rod(q+'ArmSupport',(s*.32,-.10,.51),(s*.32,-.10,.73),.018,DARK,F))
    parts.append(box(q+'ArmPad',(s*.33,0,.755),(.09,.29,.045),DARK,F,.02))
    parts.append(box(q+'BackAccent',(s*.185,-.34,1.11),(.055,.012,.35),ACCENT,F,.012))
    parts.append(box(q+'ShoulderVent',(s*.095,-.35,1.28),(.085,.018,.036),DARK,F,.013))
parts.append(sphere(q+'Lumbar',(0,-.135,.79),(.19,.08,.09),UPHOLSTERY,F))
parts.append(sphere(q+'NeckCushion',(0,-.24,1.27),(.15,.065,.07),UPHOLSTERY,F))
chair=join(q+'GamingChair',parts,(0,0,0),F,math.radians(15));chair.location=(.60,.60,0)
for side in [-1,1]:
    ps=[(side*x,-.253-(z-.57)*.13,z) for x,z in [(.20,.64),(.25,.79),(.23,1.10),(.16,1.29),(.12,1.34)]]
    seam=curve(q+'ChairStitching',ps,ACCENT,.002,F);seam.rotation_euler.z=math.radians(15);seam.location=chair.location
# Preserve the contractual display plane while replacing the joined computer proxy.
screen=scene.objects['Computer_Screen'];world=screen.matrix_world.copy();screen.parent=None;screen.matrix_world=world
rootpos=scene.objects['Computer'].matrix_world.translation.copy();remove_names('Computer');parts=[]
parts.append(box(q+'MonitorBase',(0,0,.012),(.30,.20,.024),DARK,I,.008))
parts.append(rod(q+'MonitorArm',(0,.025,.024),(0,.04,.30),.022,METAL,I))
parts.append(box(q+'MonitorShell',(0,0,.60),(1,.046,.64),DARK,I,.009))
parts.append(box(q+'KeyboardCase',(0,-.43,.012),(.68,.23,.024),DARK,I,.008))
KEY=mat('Keycap','#b5b9bb',.58);KEYD=mat('KeycapDark','#5d6775',.6)
for row in range(5):
    for j in range(15):
        if row==0 and 4<=j<=9:continue
        parts.append(box(q+'Keycap',(-.307+j*.0438,-.52+row*.043,.031),(.037,.037,.014),KEY if j%7 else KEYD,I,.003))
parts.append(box(q+'Spacebar',(-.025,-.52,.031),(.255,.037,.014),KEY,I,.003))
parts.append(sphere(q+'Mouse',(.48,-.43,.027),(.046,.068,.027),IVORY,I))
parts.append(box(q+'MouseWheel',(.48,-.453,.053),(.009,.024,.006),DARK,I,.002))
computer=join('Computer',parts,(0,0,0));computer.location=rootpos;parent_keep(screen,computer)
# A small aluminium desktop computer at the right rear, behind the keyboard.
ALU=mat('Aluminium','#aeb2b7',.34,metal=.72)
box(q+'MacMini',(1.12,1.89,.84),(.19,.19,.08),ALU,P,.018)
box(q+'MiniFront',(1.12,1.794,.835),(.135,.002,.033),DARK,P,.004)
for x in [1.083,1.112]:box(q+'MiniPort',(x,1.791,.84),(.016,.003,.006),METAL,P,.002)
# Wired over-ear headphones on a slim stand, rather than a rectangular placeholder.
box(q+'HeadphoneBase',(-.79,1.39,.807),(.15,.12,.014),DARK,P,.009)
rod(q+'HeadphoneStand',(-.79,1.40,.814),(-.79,1.40,1.12),.009,METAL,P)
rod(q+'HeadphoneRest',(-.855,1.40,1.12),(-.725,1.40,1.12),.014,DARK,P)
curve(q+'HeadphoneBand',[(-.79+.09*math.cos(math.pi*j/24),1.38,1.06+.13*math.sin(math.pi*j/24)) for j in range(25)],DARK,.016)
for x in [-.88,-.70]:
    sphere(q+'HeadphoneCup',(x,1.38,1.025),(.026,.043,.06),DARK,P)
    sphere(q+'HeadphonePad',(x+(.012 if x<-.79 else -.012),1.38,1.025),(.020,.036,.048),UPHOLSTERY,P)
# Fan guard rings, radial wires and visible blades.
cx,cy,cz=1.90,-.90,1.13
cyl(q+'FanBase',(cx,cy,.025),.22,.05,DARK,P)
rod(q+'FanStem',(cx,cy,.05),(cx,cy,1.10),.020,METAL,P)
rod(q+'FanRearMotor',(cx,cy,cz),(cx,cy+.14,cz),.075,DARK,P)
for y in [cy-.065,cy+.055]:
    for r in [.09,.17,.25]:ring(q+'FanGuard',(cx,y,cz),r,METAL,.003,'Y')
    for j in range(20):
        a=j*math.tau/20;curve(q+'FanRadial',[(cx+.035*math.cos(a),y,cz+.035*math.sin(a)),(cx+.15*math.cos(a),y-.016,cz+.15*math.sin(a)),(cx+.25*math.cos(a),y,cz+.25*math.sin(a))],METAL,.002)
for j in range(3):
    a=j*math.tau/3;ps=[]
    for r,t in [(.035,-.1),(.16,-.3),(.22,.0),(.18,.65),(.06,.65)]:ps.append((cx+r*math.cos(a+t),cy,cz+r*math.sin(a+t)))
    blade=mesh_obj(q+'FanBlade',ps,[tuple(range(5))],mat('FanBlade','#687a81',.48),P,solid=.006);bevel(blade,.006)
hub=sphere(q+'FanHub',(cx,cy-.07,cz),(.053,.022,.053),DARK,P)
# Layered lance-shaped leaves replace the three spherical canopy masses.
LEAF=mat('DetailedLeaf','#355c40',.65);VEIN=mat('LeafVein','#74915e',.78);SOIL=mat('Soil','#302a24',.98)
cyl(q+'PotSoil',(2,1.8,.452),.254,.012,SOIL,P)
ring(q+'PotRim',(2,1.8,.46),.27,mat('PotRim','#8e624c',.72),.012)
rod(q+'PlantTrunk',(2,1.8,.46),(2,1.8,1.40),.017,WALNUT,P)
for j in range(12):
    a=j*2.399;z=.71+j*.062;reach=.22+.09*math.sin(j*1.8)
    start=Vector((2,1.8,z));end=start+Vector((reach*math.cos(a),reach*math.sin(a),.11));rod(q+'LeafStem',start,end,.004,LEAF,P)
    direction=Vector((math.cos(a),math.sin(a),.45)).normalized();cross=Vector((-math.sin(a),math.cos(a),0));length=.30;vs=[]
    for k in range(9):
        t=k/8;width=.085*math.sin(math.pi*t)**.7
        center=end+direction*length*t+Vector((0,0,.07*math.sin(math.pi*t)))
        for s in [-1,0,1]:vs.append(tuple(center+cross*width*s+Vector((0,0,-.025*abs(s)*math.sin(math.pi*t)))))
    fs=[]
    for k in range(8):
        for s in range(2):v=k*3+s;fs.append((v,v+1,v+4,v+3))
    mesh_obj(q+'Leaf',vs,fs,LEAF,P,sub=1,solid=.001)
    curve(q+'LeafMidrib',[vs[k*3+1] for k in range(9)],VEIN,.0015)
for j in range(9):
    a=j*math.tau/9;o=sphere(q+'SucculentLeaf',(1.13+.035*math.cos(a),1.40+.035*math.sin(a),.95),(.015,.038,.018),LEAF,P);o.rotation_euler.z=a-math.pi/2
checkpoint(5,'Compact room: detailed gaming chair, equipment, fan and botanical leaves')
