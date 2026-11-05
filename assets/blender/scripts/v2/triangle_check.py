import bpy,json,collections
s=bpy.context.scene;deps=bpy.context.evaluated_depsgraph_get();groups=collections.Counter();hidden=0
for o in s.objects:
 if o.type not in {'MESH','CURVE','FONT'}:continue
 e=o.evaluated_get(deps);m=e.to_mesh();m.calc_loop_triangles();n=len(m.loop_triangles);e.to_mesh_clear()
 if o.hide_render:hidden+=n
 else:groups['_'.join(o.name.split('_')[:2])]+=n
print(json.dumps({'visible_triangles':sum(groups.values()),'hidden_triangles':hidden,'groups':dict(groups)}))
