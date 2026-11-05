import asyncio,base64,json,sys
from pathlib import Path
from mcp import ClientSession,StdioServerParameters
from mcp.client.stdio import stdio_client
ROOT=Path('/Users/cianlien/Downloads/room-blog')
async def main():
    async with stdio_client(StdioServerParameters(command='/opt/homebrew/bin/uvx',args=['--python','3.11','mcp-for-blender'])) as (r,w):
        async with ClientSession(r,w) as session:
            await session.initialize()
            if sys.argv[1] in {'capture','capture-render'}:
                args={'image':str(ROOT/'assets/blender/preview.png'),'max_size':1400} if sys.argv[1]=='capture-render' else {'mode':'camera','shading':'material','max_size':1400}
                result=await session.call_tool('look',args)
                for c in result.content:
                    if c.type=='image':
                        path=ROOT/'assets/blender/stages'/sys.argv[2];path.write_bytes(base64.b64decode(c.data));print('CAPTURED',path)
                    elif c.type=='text':print(c.text[:1000])
            else:
                path=ROOT/'assets/blender/scripts'/sys.argv[1]
                result=await session.call_tool('execute_blender_code',{'code':path.read_text()})
                for c in result.content:
                    if c.type=='text':print(c.text)
                if result.isError or any(getattr(c,'text','').startswith('Error') for c in result.content):raise RuntimeError('MCP stage failed')
asyncio.run(main())
