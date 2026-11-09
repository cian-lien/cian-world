"""Align the physical roof and its props to the two approved composition crops."""
from common import *
from mathutils import Matrix

ARCH = collection('Architecture')
ROOT_OBJECT = bpy.data.objects['RooftopRoot']
OUTLINE = [(-4, -3.5), (4, -3.5), (4.45, .35), (.42, 3.6), (-5, 3.6)]

def named(prefixes, *collections):
    return [o for c in collections for o in collection(c).objects if o.name.startswith(prefixes)]

def place(objects, pivot, shift, scale, turn=0):
    """Bake a world-space layout change into the top-level objects of a part."""
    transform = Matrix.Translation(Vector(pivot) + Vector(shift)) @ Matrix.Rotation(math.radians(turn),4,'Z') @ Matrix.Diagonal((*scale, 1)) @ Matrix.Translation(-Vector(pivot))
    bpy.context.view_layer.update()
    for o in objects:
        o.matrix_world = transform @ o.matrix_world
    bpy.context.view_layer.update()
    return transform

def slab(name, outline, bottom, top, material):
    count = len(outline)
    vertices = [(x, y, z) for z in (bottom, top) for x, y in outline]
    faces = [tuple(reversed(range(count))), tuple(range(count, count * 2))]
    faces.extend((i, (i + 1) % count, (i + 1) % count + count, i + count) for i in range(count))
    return mesh(name, vertices, faces, material, ARCH, ROOT_OBJECT)

def structure():
    tile = bpy.data.objects['FlowerLattice'].data
    for o in list(ARCH.objects):
        if o.name.startswith(('Parapet', 'PierCap', 'FlowerLattice', 'RoofFloor', 'RoofCutEdge', 'UpperFloorFacade', 'FloorJoint')):
            bpy.data.objects.remove(o, do_unlink=True)
    slab('RoofFloor', OUTLINE, -.18, 0, 'floor')
    slab('RoofCutEdge', [(x * 1.012, y * 1.012) for x, y in OUTLINE], -.40, -.18, 'cut')
    slab('UpperFloorFacade', OUTLINE, STREET_LEVEL, -.40, 'plaster')
    for i in range(1, 6):
        height = -.40 - i * 2.25
        slab('FacadeFloorCourse', [(x * 1.005, y * 1.005) for x, y in OUTLINE], height - .08, height, 'limestone')
        if i > 1:
            for x in (-2.65, -.9, .9, 2.65):
                box('LowerFacadeWindow', (x, -3.514, height + .98), (1.03, .032, .94), 'glass', ARCH, ROOT_OBJECT, r=.015)
    for i, (a, b) in enumerate(zip(OUTLINE, OUTLINE[1:] + OUTLINE[:1])):
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = math.hypot(dx, dy)
        angle = math.atan2(dy, dx)
        center = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        parent = empty('FrontParapet' if i == 0 else 'ParapetSide', (*center, 0), ARCH, ROOT_OBJECT, composition='frontRail' if i == 0 else '')
        box('ParapetBase', (*center, .145), (length, .18, .29), 'limestone', ARCH, parent, rot=(0, 0, angle))
        box('ParapetTop', (*center, .868), (length + .10, .245, .115), 'limestone', ARCH, parent, rot=(0, 0, angle))
        box('ParapetWebTop', (*center, .735), (length, .145, .155), 'plaster', ARCH, parent, rot=(0, 0, angle))
        count = 13 if i == 0 else round(length / .51)
        pitch = length / count
        side_tile = tile.copy()
        side_tile.materials.clear()
        side_tile.materials.append(M['plaster'])
        side_tile.materials.append(M['terracotta'])
        for vertex in side_tile.vertices:
            outer = vertex.index // 24 % 2 == 0
            vertex.co.x *= pitch / .278 if outer else 1.28
        for face in side_tile.polygons:
            face.material_index = int(face.index % 4 == 3)
        for j in range(count):
            t = (j + .5) / count
            o = bpy.data.objects.new('FlowerLattice', side_tile)
            ARCH.objects.link(o);o['generator']=TAG
            o.location = (a[0] + t * dx, a[1] + t * dy, .476)
            o.rotation_euler.z = angle
            o.scale = (1, 1, 1.60)
            o.parent = parent
            o.matrix_parent_inverse = parent.matrix_world.inverted()
        for x, y in ([a, b] if i == 0 else [a] if i > 1 else []):
            box('ParapetPier', (x, y, .46), (.245, .245, .92), 'plaster', ARCH, parent)
            box('PierCap', (x, y, .963), (.33, .33, .102), 'limestone', ARCH, parent)

def layout():
    structure()
    obj = bpy.data.objects
    stair_parts = named(('Stair', 'DoorFrame', 'DoorStep', 'SpringCouplet', 'CoupletGlyph'), 'Architecture')
    stair = empty('Stairwell', (-2.65, 2.42, 0), ARCH, ROOT_OBJECT, composition='stair')
    for o in stair_parts:
        world = o.matrix_world.copy()
        o.parent = stair
        o.matrix_world = world
    # Props and their animated or seasonal children keep their pivots.
    stair_height=2.66 / 2.195
    stair_transform=place([stair, obj['Door_Hinge']], (-2.65, 2.42, 0), (-.775, -.311, 0), (.843, .967, stair_height),turn=50.36)
    # The reference shows both faces of the cap and a two-metre iron door.
    place([obj['Door_Hinge']], (0, 0, 0), (0, 0, 0), (1, 1, 2 / (1.69 * stair_height)))
    for i,(x,y) in enumerate([(-1.125,-.975),(1.125,-.975),(1.125,.975),(-1.125,.975)]):
        empty(f'StairRoofCorner{i}',stair_transform@Vector((-2.65+x,2.42+y,2.195)),ARCH,stair,reference_landmark=True)
    place([obj['WaterTank']], (-.72, 2.48, 0), (-.901, -.119, 0), (.884, 1.35, 1.21))
    obj['WaterTank']['composition'] = 'tank'
    tea = obj['TeaTable']
    tea['composition'] = 'table'
    table_parts = named(('TeaTableTop', 'TeaTableLeg', 'TeaTableFrame'), 'Tea')
    top = empty('TeaTableFrameOutline', tuple(tea.matrix_world.translation), collection('Tea'), tea, composition='tableFrame')
    for o in table_parts:
        world = o.matrix_world.copy()
        o.parent = top
        o.matrix_world = world
    place([tea] + named(('LycheePlate', 'SummerLychee', 'LycheeLeaf', 'Tangyuan', 'SteamAnchor'), 'Seasons'),
          (-.05, -1.72, 0), (.27, .08, 0), (1.614, 1.60, .93))
    place([obj['TeaStool_Left']], (-.98, -1.87, 0), (-.28, -.13, 0), (1.60, 1.52, 1.04))
    place([obj['TeaStool_Right']], (.93, -2.10, 0), (.12, -.34, 0), (1.58, 1.52, 1.04))
    crock = obj['LotusCrock']
    crock['composition'] = 'crock'
    place([crock] + named(('LotusFlower', 'LotusPetal', 'LotusSeedHead'), 'Seasons'),
          (3.13, -2.31, 0), (.33, -.069, 0), (1.37, 1.49, 1.192))
    place([obj['SolarWaterHeater']], (1.12, 2.47, 0), (-.98, .435, 0), (1.235, 1.15, 1.026))
    # Pull the cable's visible front behind the condenser, leaving its end at the stair wall.
    place([obj['ACCondenser']], (-.15, 1.45, 0), (-.31, .91, 0), (.89, .90, 1.33))
    place([obj['Telescope']], (2.52, 2.34, 0), (-.46, -.61, 0), (1.60, 1.22, 1.16))
    obj['Telescope'].rotation_euler.z -= math.radians(56)
    for name, old, new in [('ScallionBox', 1.45, (2.76, .80)), ('MintBox', .42, (3.26, -.13)), ('ChiliBox', -.62, (3.64, -.84))]:
        place([obj[name]], (2.97, old, 0), (new[0] - 2.97, new[1] - old, 0), (1.15, 1.13, 1))
    place([obj['Bougainvillea_Right']], (3.85, -1.15, 0), (.16, -.12, 0), (1, .75, 1.12))
    place([obj['Bougainvillea_Stair']], (-3.8, 2.7, 0), (-.50, -.26, 0), (1.15, 1.12, 1.13))
    place(named(('CorrugatedCanopy', 'CanopyBrace', 'CanopyBeam', 'CanopyDiagonal', 'CanopyGutter', 'BambooLaundryPole'), 'Props', 'PlantMass')
          + [o for o in collection('Laundry').objects if o.type == 'EMPTY'],
          (-3.18, -.525, 0), (-.32, -.42, 0), (1.18, .64, 1.40))
    place(named(('TVAntenna', 'AntennaCable'), 'Equipment'), (-1.17, 3.1, 0), (-.15, .30, 0), (1, 1, 1.08))
    place(named(('CanopyBrace', 'CanopyDiagonal'), 'Props'), (0, 0, 0), (.25, 0, 0), (1, 1, 1))
    props=collection('Props')
    for o in named(('LampPost','LampArm','LampFlex','BulbSocket','TeaCornerBulb'),'Props'):
        bpy.data.objects.remove(o,do_unlink=True)
    rod('LampPost',(-3.86,-.79,0),(-3.86,-.79,2.89),.023,'metalDark',props,ROOT_OBJECT)
    rod('LampAnchor',(4.06,-2.42,.84),(4.06,-2.42,2.86),.016,'metalDark',props,ROOT_OBJECT)
    tube('LampWire',[(-3.86,-.79,2.89),(.323,-1.68,2.73),(4.06,-2.42,2.86)],.006,'ink',props,ROOT_OBJECT)
    rod('LampFlex',(.323,-1.68,2.73),(.323,-1.68,1.95),.005,'ink',props,ROOT_OBJECT)
    cylinder('BulbSocket',(.323,-1.68,1.94),.027,.07,'metalDark',props,ROOT_OBJECT)
    uv('TeaCornerBulb',(.323,-1.68,1.855),(.045,.045,.064),'warmLight',props,ROOT_OBJECT)
    obj['TeaBulbLight'].location=(.323,-1.68,1.855)
    place([obj['CalicoCat']], (-2.7, 2.23, 2.18), (-.72, -.27, .48), (1.08, 1.08, 1))
    obj['CalicoCat']['roof_pose']=tuple(obj['CalicoCat'].location)
    obj['Sparrow01'].location=(3.00,1.52,.925)
    obj['Sparrow02'].location=(3.30,1.28,.925)
    obj['Pigeon01'].location=(.15,3.60,.925)
    for name, x, y in [('Door_Interact', -2.45, .52), ('Tea_Interact', -.30, -.70), ('Garden_Interact', 2.45, -.39),
                       ('Radio_Interact', .76, -.70), ('Laundry_Interact', -2.35, -.71), ('Telescope_Interact', 1.47, 1.07),
                       ('Cat_Interact', -1.75, .52), ('VisitorSpawn', -1.65, -.22)]:
        obj[name].location = (x, y, 0)
    cam = SCENE.camera
    cam.location = (.494, -11.859, 10.722)
    point_at(cam, (-.15, .902, 0))
    cam.data.lens_unit = 'FOV'
    cam.data.sensor_fit = 'VERTICAL'
    cam.data.angle = math.radians(35)
    cam.data.clip_end = 180
    SCENE.render.resolution_x, SCENE.render.resolution_y = 918, 852
    SCENE['reference_composition'] = 1
    bpy.context.view_layer.update()

if __name__ == '__main__':
    assert not SCENE.get('reference_composition'), 'Build 01–07 before applying composition again.'
    layout()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'rooftop.blend'))
