from common import *
col=clear_stage('Animals')
# A sleeping calico, independently articulated head and tail for later program animation.
cat=empty('CalicoCat',(-2.70,2.23,2.18),col,interaction='pet-cat',animal='cat')
x,y,z=-2.70,2.23,2.18
body=empty('Cat_BodyPivot',(x,y,z+.12),col,cat)
uv('CatBody',(x,y,z+.12),(.30,.19,.15),'white',col,body,segments=20,rings=10)
uv('CatOrangePatch',(x-.09,y+.04,z+.235),(.14,.12,.045),'terracotta',col,body)
uv('CatDarkPatch',(x+.15,y+.03,z+.21),(.10,.11,.054),'hair',col,body)
head=empty('Cat_HeadPivot',(x-.19,y-.12,z+.19),col,cat)
uv('CatHead',(x-.19,y-.12,z+.19),(.14,.13,.12),'white',col,head)
uv('CatHeadPatch',(x-.25,y-.12,z+.25),(.075,.11,.065),'terracotta',col,head)
for dx in [-.09,.09]:
    v=[(x-.19+dx-.045,y-.11,z+.26),(x-.19+dx+.045,y-.11,z+.26),(x-.19+dx,y-.10,z+.39),(x-.19+dx,y-.035,z+.27)]
    mesh('CatEar',v,[(0,1,2),(0,2,3),(1,3,2),(0,3,1)],'terracotta' if dx<0 else 'hair',col,head)
    mesh('CatInnerEar',[(x-.19+dx-.026,y-.113,z+.274),(x-.19+dx+.026,y-.113,z+.274),(x-.19+dx,y-.112,z+.35)],[(0,1,2)],'pink',col,head)
for dx in [-.048,.048]:
    tube('CatClosedEye',[(x-.19+dx-.025,y-.236,z+.20),(x-.19+dx,y-.249,z+.192),(x-.19+dx+.025,y-.236,z+.20)],.004,'ink',col,head,res=1)
uv('CatNose',(x-.19,y-.25,z+.16),(.013,.009,.008),'pink',col,head,segments=8,rings=4)
for dx in [-.08,.055]:uv('CatPaw',(x-.18+dx,y-.23,z+.055),(.065,.075,.04),'white',col,cat)
tail=empty('Cat_TailPivot',(x+.23,y+.02,z+.08),col,cat)
pts=[]
for i in range(19):a=.2+i/18*math.pi*1.5;pts.append((x+.13+math.cos(a)*.26,y+.02+math.sin(a)*.23,z+.065))
tube('CatCurledTail',pts,.037,'terracotta',col,tail,res=2)
for name,loc,kind in [('Sparrow01',(1.98,3.47,.812),'sparrow'),('Sparrow02',(2.34,3.47,.812),'sparrow'),('Pigeon01',(3.98,1.60,.812),'pigeon')]:
    x,y,z=loc;p=empty(name,loc,col,animal=kind,proximity_flight=True)
    material='wood' if kind=='sparrow' else 'metalDark';scale=1 if kind=='sparrow' else 1.3
    uv(name+'_Body',(x,y,z+.095*scale),(.065*scale,.10*scale,.075*scale),material,col,p,segments=12,rings=6)
    uv(name+'_Breast',(x,y-.048*scale,z+.10*scale),(.053*scale,.066*scale,.055*scale),'paper' if kind=='sparrow' else 'metal',col,p,segments=12,rings=6)
    h=empty(name+'_HeadPivot',(x,y-.064*scale,z+.18*scale),col,p)
    uv(name+'_Head',(x,y-.064*scale,z+.18*scale),(.052*scale,.05*scale,.047*scale),material,col,h,segments=12,rings=6)
    cone(name+'_Beak',(x,y-.125*scale,z+.175*scale),.018*scale,0,.045*scale,'yellow',col,h,vertices=6,rot=(math.pi/2,0,0))
    for dx in [-.038,.038]:uv(name+'_Eye',(x+dx*scale,y-.095*scale,z+.19*scale),(.007,.005,.007),'ink',col,h,segments=8,rings=4)
    for sign in [-1,1]:
        wing=empty(name+('_WingL' if sign<0 else '_WingR'),(x+sign*.047*scale,y,z+.11*scale),col,p)
        uv(name+'_Wing',(x+sign*.055*scale,y+.016*scale,z+.12*scale),(.018*scale,.075*scale,.045*scale),'hair' if kind=='sparrow' else 'metalDark',col,wing,segments=10,rings=6)
        rod(name+'_Leg',(x+sign*.024*scale,y,z+.05),(x+sign*.024*scale,y,z+.012),.004,'woodDark',col,p,vertices=6,r=0)
        rod(name+'_Foot',(x+sign*.024*scale,y-.02,z+.012),(x+sign*.024*scale,y+.018,z+.012),.004,'woodDark',col,p,vertices=6,r=0)
    mesh(name+'_Tail',[(x-.03*scale,y+.05*scale,z+.08*scale),(x+.03*scale,y+.05*scale,z+.08*scale),(x+.045*scale,y+.19*scale,z+.06*scale),(x-.045*scale,y+.19*scale,z+.06*scale)],[(0,1,2,3)],material,col,p)
print('Animals built:',len(col.objects),'objects; named head/tail/wing pivots')
