import bpy,json
s=bpy.context.scene
print(json.dumps({'version':bpy.app.version_string,'scene':s.name,'stage':s.get('room_blog_v2_stage'),'objects':len(s.objects),'unmanaged':[o.name for o in s.objects if o.get('owner')!='room_blog_v2'],'meshes':[{'name':o.name,'loc':list(o.matrix_world.translation),'dims':list(o.dimensions)} for o in s.objects if o.type=='MESH']},ensure_ascii=False))
