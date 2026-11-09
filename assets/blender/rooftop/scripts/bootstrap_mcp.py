"""Start the already-installed MCP addon in a newly launched Blender session."""
import bpy
import addon_utils
addon_utils.enable('blender_mcp', default_set=False, persistent=False)
if not getattr(bpy.types, 'blendermcp_server', None) or not bpy.types.blendermcp_server.running:
    bpy.ops.blendermcp.start_server()
print('ROOFTOP_MCP_READY', flush=True)
