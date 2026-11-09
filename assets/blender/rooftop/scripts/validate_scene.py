"""Validate asset scale, finite geometry and reachable 0.25m navigation anchors.
The conservative footprint map is an integration guide, not a runtime pathfinder.
"""
from common import *
from collections import deque
import json

def validate():
    bpy.context.window.scene=SCENE;bpy.context.view_layer.update()
    obj=bpy.data.objects
    roof=obj['RoofFloor']
    assert abs(roof.dimensions.z-.18)<.001
    outline=[tuple((roof.matrix_world@v.co)[:2]) for v in roof.data.vertices if abs((roof.matrix_world@v.co).z)<.001]
    root=bpy.data.objects['VisitorRoot']
    parts=[o for o in root.children_recursive if o.type in {'MESH','CURVE'} and not o.get('weather_variant')]
    points=[o.matrix_world@Vector(c) for o in parts for c in o.bound_box]
    height=max(p.z for p in points)-min(p.z for p in points)
    assert abs(height-.9)<.001,height
    checked=0
    for o in SCENE.objects:
        assert all(math.isfinite(v) for row in o.matrix_world for v in row),o.name
        if o.type=='MESH':
            for v in o.data.vertices:assert all(math.isfinite(x) for x in v.co),o.name
            checked+=1
    def bounds(objects):
        points=[o.matrix_world@Vector(p) for o in objects if o.type=='MESH' for p in o.bound_box]
        return [(min(p[i] for p in points),max(p[i] for p in points)) for i in range(3)]
    # Derive collision footprints from the exported layout instead of duplicating coordinates.
    rects=[]
    for label,name,prefixes in [
        ('stairwell','Stairwell',('StairBack','StairSide','StairFront','DoorStep')),
        ('tank','WaterTank',('TankBody','TankLeg')),
        ('heater','SolarWaterHeater',('HeaterBase','HeaterFrame')),
        ('AC','ACCondenser',('CondenserBody','ACFoot')),
        ('telescope','Telescope',('TripodLeg',)),
        ('tea table','TeaTableFrameOutline',('TeaTable',)),
        ('left stool','TeaStool_Left',('TeaStool_Left',)),
        ('right stool','TeaStool_Right',('TeaStool_Right',)),
        ('planter1','ScallionBox',('ScallionBox_Wall',)),
        ('planter2','MintBox',('MintBox_Wall',)),
        ('planter3','ChiliBox',('ChiliBox_Wall',)),
    ]:
        xy=bounds([o for o in obj[name].children_recursive if o.name.startswith(prefixes)])[:2]
        rects.append((label,[round(v,3) for pair in xy for v in pair]))
    crock=obj['LotusCrock'].matrix_world.translation
    cx,cy,_=bounds([obj['EarthenwareCrock']])
    lamp=obj['LampPost'].matrix_world.translation
    circles=[('lotus crock',(crock.x,crock.y,max(cx[1]-cx[0],cy[1]-cy[0])/2)),('lamp',(lamp.x,lamp.y,.04))]
    radius=.14
    edges=list(zip(outline,outline[1:]+outline[:1]))
    def clear(x,y):
        return -3.6<=x<=3.6 and -3.1<=y<=3.1 and all((bx-ax)*(y-ay)-(by-ay)*(x-ax)>=.22*math.hypot(bx-ax,by-ay) for (ax,ay),(bx,by) in edges) and not any(a-radius<=x<=b+radius and c-radius<=y<=d+radius for _,(a,b,c,d) in rects) and not any(math.hypot(x-a,y-b)<=r+radius for _,(a,b,r) in circles)
    anchors={o.name:tuple(o.matrix_world.translation)[:2] for o in collection('Anchors').objects if o.get('role')=='interaction-point'}
    for n,(x,y) in anchors.items():assert clear(x,y),f'Blocked interaction anchor: {n} {(x,y)}'
    grid={(ix,iy):(-3.5+ix*.25,-3+iy*.25) for ix in range(29) for iy in range(25) if clear(-3.5+ix*.25,-3+iy*.25)}
    def nearest(point):return min(grid,key=lambda cell:math.dist(point,grid[cell]))
    start=nearest(anchors['VisitorSpawn']);seen={start};q=deque([start])
    while q:
        x,y=q.popleft()
        for n in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if n in grid and n not in seen:seen.add(n);q.append(n)
    for n,p in anchors.items():assert nearest(p) in seen,f'Unreachable: {n}'
    street=bounds([obj['StreetGround']])
    street_buildings=[o for o in SCENE.objects if o.name.startswith(('NeighborBlock','QilouRearWall','UpperFloorFacade'))]
    for o in street_buildings:
        x,y,z=bounds([o])
        assert abs(z[0]-street[2][1])<.001 and all(street[i][0]<=a and b<=street[i][1] for i,(a,b) in enumerate((x,y))),o.name
    far_terrain=[o for o in SCENE.objects if o.name.startswith('FarBankTerrain')]
    far_buildings=[o for o in SCENE.objects if o.name.startswith('FarBuilding')]
    for o in far_buildings:
        x,y,z=bounds([o])
        for px in x:
            for py in y:
                heights=[]
                for surface in far_terrain:
                    inverse=surface.matrix_world.inverted()
                    hit,point,_,_=surface.ray_cast(inverse@Vector((px,py,0)),inverse.to_3x3()@Vector((0,0,-1)))
                    if hit:heights.append((surface.matrix_world@point).z)
                assert heights and z[0]<=max(heights)+.001,o.name
    report={'roofMeters':[round(roof.dimensions.x,2),round(roof.dimensions.y,2)],'visitorHeightMeters':round(height,6),'finiteMeshes':checked,'gridMeters':.25,'visitorRadiusMeters':radius,'reachableAnchors':sorted(anchors),'reachableCells':len(seen),'groundedBuildings':len(street_buildings)+len(far_buildings),'streetLevelMeters':STREET_LEVEL,'coordinateSystem':'glTF Y-up; Blender (x,y,z) becomes (x,z,-y)'}
    guide={**report,'walkBoundsXZ':[-3.6,3.6,-3.1,3.1],'outlineXZ':[[round(x,3),round(-y,3)] for x,y in outline],'edgeClearanceMeters':.22,'anchors':{n:[round(p[0],3),0,round(-p[1],3)] for n,p in anchors.items()},'obstacles': [{'name':n,'rectXZ':[a,b,-d,-c]} for n,(a,b,c,d) in rects]+[{'name':n,'circleXZ':[round(a,3),round(-b,3),round(r,3)]} for n,(a,b,r) in circles]}
    dest=ROOT/'public/models/rooftop';dest.mkdir(exist_ok=True,parents=True)
    (dest/'walkmap.json').write_text(json.dumps(guide,ensure_ascii=False,indent=2)+'\n')
    (OUT/'scene-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('SCENE VALIDATION',json.dumps(report))
    return report
if __name__=='__main__':validate()
