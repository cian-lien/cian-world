from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/common.py').read_text(),'common.py','exec'))
remove_prefix('S_Shell_')
p='S_Shell_'
box(p+'Plinth',(0,0,-.2),(6.4,6.4,.4),M['base'],.04)
box(p+'Floor',(0,0,.01),(6,6,.02),M['floor'],.01)
for i in range(1,9):box(p+'FloorSeam_%02d'%i,(0,-3+i*6/9,.0205),(6,.009,.002),M['seam'],.001)
shelf_floor_recess()
# Window occupies a real opening. Interior rear-wall surface remains Y=3.
wall=box(p+'RearWall',(0,3.1,1.6),(6.4,.2,3.2),M['back'],0)
cutter=box(p+'WindowCutter',(-1.75,3.1,1.9),(1.30,.6,1.10),None,0)
mod=wall.modifiers.new('Window opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
bpy.context.view_layer.objects.active=wall;bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cutter,do_unlink=True)
mod=wall.modifiers.new('Rounded wall edges','BEVEL');mod.width=.012;mod.segments=3
mod=wall.modifiers.new('Weighted wall normals','WEIGHTED_NORMAL');mod.keep_sharp=True
box(p+'LeftWall',(-3.1,0,1.6),(.2,6.4,3.2),M['left'],.02)
box(p+'RearSkirting',(0,2.984,.06),(6,.032,.12),M['wood'],.01)
box(p+'LeftSkirting',(-2.984,0,.06),(.032,6,.12),M['wood'],.01)
# Window dimensions 1.3 x 1.1, centered at (-1.75, 2.98, 1.9).
box(p+'WindowGlass',(-1.75,3.075,1.9),(1.23,.025,1.03),M['glass'],.005)
for x in [-2.36,-1.14]:box(p+'WindowStile', (x,2.975,1.9),(.08,.09,1.1),M['white'],.012)
for z in [1.39,2.41]:box(p+'WindowRail',(-1.75,2.975,z),(1.3,.09,.08),M['white'],.012)
box(p+'WindowCrossVertical',(-1.75,2.958,1.9),(.04,.055,1.02),M['white'],.008)
box(p+'WindowCrossHorizontal',(-1.75,2.957,1.9),(1.22,.055,.04),M['white'],.008)
box(p+'WindowSill',(-1.75,2.90,1.325),(1.46,.32,.075),M['white'],.015)
# Poster with a sun and exactly two short graphic lines.
box(p+'PosterFrame',(2.1,2.985,1.95),(.76,.04,.96),M['wood'],.012)
box(p+'PosterPaper',(2.1,2.959,1.95),(.72,.009,.92),M['yellow'],.004)
o=cyl(p+'PosterSun',(2.1,2.950,2.10),.17,.008,M['orange']);o.rotation_euler.x=math.pi/2
for z,w in [(1.80,.39),(1.70,.27)]:box(p+'PosterLine',(2.1,2.948,z),(w,.008,.027),M['orange'],.008)
# Wall clock faces the open front of the room.
o=cyl(p+'Clock',(0.85,2.98,2.55),.20,.05,M['white']);o.rotation_euler.x=math.pi/2
rod(p+'ClockHour',(.85,2.948,2.55),(.78,2.948,2.60),.010,M['monitor'])
rod(p+'ClockMinute',(.85,2.944,2.55),(.88,2.944,2.69),.007,M['monitor'])
sphere(p+'ClockPin',(.85,2.937,2.55),(.017,.008,.017),M['gold'])
preview_camera();checkpoint(2)
