import { createRequire } from 'node:module'
import { dirname, join as pathJoin, resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const [toolDirectory, source, shell, output] = process.argv.slice(2)
if (!output) throw new Error('Usage: node optimize_hybrid.mjs <tool-directory> <source.glb> <shell.glb> <output.glb>')

const requireTool = createRequire(resolve(toolDirectory, 'package.json'))
const load = (name) => import(pathToFileURL(requireTool.resolve(name)).href)
const [
  { NodeIO }, { ALL_EXTENSIONS },
  { dedup, joinPrimitives, mergeDocuments, meshopt, prune, textureCompress, transformPrimitive, weld },
  { MeshoptEncoder, MeshoptDecoder }, { default: sharp },
] = await Promise.all([
  load('@gltf-transform/core'), load('@gltf-transform/extensions'), load('@gltf-transform/functions'),
  load('meshoptimizer'), load('sharp'),
])
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptDecoder,
})
const [doc, baked] = await Promise.all([io.read(source), io.read(shell)])
const manifest = JSON.parse(await readFile(pathJoin(dirname(shell), 'manifest.json'), 'utf8'))
const root = doc.getRoot()
const scene = root.listScenes()[0]
const shellPrefixes = ['V2_Room_Plinth', 'V2_Room_RearWall', 'V2_Room_LeftWall',
  'V2_Room_RearSkirting', 'V2_Room_LeftSkirting', 'V2_Room_Board_']
for (const node of scene.listChildren()) {
  if (shellPrefixes.some(prefix => node.getName().startsWith(prefix))) node.dispose()
}

const shellMapping = mergeDocuments(doc, baked)
const bakeRoom = shellMapping.get(baked.getRoot().listNodes().find(node => node.getName() === 'Bake_Room'))
scene.addChild(bakeRoom)
for (const extraScene of root.listScenes()) if (extraScene !== scene) extraScene.dispose()

const protectedNames = new Set([
  'Diary', 'Computer', 'Lamp', 'Cat', 'Bookshelf', 'Frame_1', 'Frame_2', 'MacBook', 'MacMini', 'AirConditioner',
])
const find = (name) => {
  const node = root.listNodes().find(node => node.getName() === name)
  if (!node) throw new Error(`Required node missing: ${name}`)
  return node
}
function tag(node, name) {
  node.setExtras({ ...node.getExtras(), bakeAccent: name })
}
function extractAccent(owner, material, name) {
  const node = find(owner)
  const primitive = node.getMesh().listPrimitives().find(part => part.getMaterial()?.getName() === material)
  if (!primitive) throw new Error(`Missing ${owner} material ${material}`)
  node.getMesh().removePrimitive(primitive)
  const accent = doc.createNode(`${owner}_${name}`).setMesh(doc.createMesh().addPrimitive(primitive))
  node.addChild(accent)
  tag(accent, name)
}
extractAccent('MacBook', 'RBN_LaptopWallpaper', 'laptop')
extractAccent('MacMini', 'RBN_MiniPowerLED', 'indicator')
extractAccent('AirConditioner', 'RBN_ACDigits', 'ac-display')

function attachAccent(childName, parentName, name) {
  const child = find(childName)
  const parent = find(parentName)
  // These anchors have translation-only transforms in the source model.
  const [x, y, z] = parent.getTranslation()
  const [a, b, c] = child.getTranslation()
  if (parent.getRotation().some((v, i) => Math.abs(v - [0, 0, 0, 1][i]) > 1e-6)
    || parent.getScale().some(v => Math.abs(v - 1) > 1e-6)) {
    throw new Error(`Unexpected transform on ${parentName}`)
  }
  scene.removeChild(child)
  parent.addChild(child.setTranslation([a - x, b - y, c - z]))
  tag(child, name)
}
attachAccent('V2_Props_ClockDisplay', 'V2_Props_Clock', 'clock')
attachAccent('V2_Block_BedsideLampShade | Day', 'V2_Block_BedsideLampBase', 'bedside')
tag(find('Lamp_Shade | Day'), 'desk-shade')
tag(find('Computer_Screen'), 'monitor')
tag(find('V2_Lighting_LED | Day'), 'strip')
tag(find('V2_Room_Glass | Day'), 'glass')

await doc.transform(dedup())

function toWorld(node, primitive, positionOnly = false) {
  const copy = doc.createPrimitive().setMode(primitive.getMode())
  if (!positionOnly) copy.setMaterial(primitive.getMaterial())
  for (const semantic of positionOnly ? ['POSITION'] : primitive.listSemantics()) {
    const attribute = primitive.getAttribute(semantic)
    copy.setAttribute(semantic, attribute.clone().setArray(attribute.getArray().slice()))
  }
  copy.setIndices(primitive.getIndices().clone().setArray(new Uint32Array(primitive.getIndices().getArray())))
  transformPrimitive(copy, node.getWorldMatrix())
  return copy
}
// Missing UVs on a few untextured props should not split an otherwise identical batch.
const uvOptional = new Set(['RBN_DetailedBlack', 'RBN_DetailedLeaf', 'RBN_DetailedLinen', 'RBN_DetailedCurtain'])
function join(parts) {
  if (parts.length === 1) return parts[0]
  const joined = joinPrimitives(parts)
  for (const part of parts) part.dispose()
  return joined
}
const shadowFurniture = ['V2_Block_BedFrame', 'V2_Block_BedHeadboard', 'V2_Block_DeskTop',
  'V2_Block_DeskCabinet', 'V2_Block_Nightstand', 'V2_Detail_GamingChair']
const proxy = join(shadowFurniture.flatMap((name) => {
  const node = find(name)
  return node.getMesh().listPrimitives().map(primitive => toWorld(node, primitive, true))
}))
scene.addChild(doc.createNode('LargeFurnitureShadows')
  .setMesh(doc.createMesh().addPrimitive(proxy)).setExtras({ shadowOnly: true }))

const materials = root.listMaterials()
const groups = new Map()
for (const node of scene.listChildren()) {
  const name = node.getName()
  const mesh = node.getMesh()
  if (!mesh || node === bakeRoom || node.getExtras().shadowOnly || node.getExtras().bakeAccent
    || protectedNames.has(name) || node.listChildren().length) continue

  const accent = name.startsWith('V2_Props_FairyBulb') ? 'fairy' : undefined
  for (const part of mesh.listPrimitives()) {
    const primitive = toWorld(node, part)
    if (!primitive.getAttribute('TEXCOORD_0') && uvOptional.has(part.getMaterial()?.getName())) {
      primitive.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2')
        .setArray(new Float32Array(primitive.getAttribute('POSITION').getCount() * 2)))
    }
    const key = JSON.stringify([materials.indexOf(primitive.getMaterial()), primitive.getMode(),
      primitive.listSemantics().sort().map(semantic => [semantic, primitive.getAttribute(semantic).getComponentType()])])
    if (!groups.has(key)) groups.set(key, { parts: [], accent })
    groups.get(key).parts.push(primitive)
  }
  node.dispose()
}
for (const { parts, accent } of groups.values()) {
  const primitive = join(parts)
  const node = doc.createNode(accent ? 'FairyBulbs' : primitive.getMaterial()?.getName() ?? 'Room prop')
    .setMesh(doc.createMesh().addPrimitive(primitive))
  if (accent) tag(node, accent)
  scene.addChild(node)
}

const shellMesh = bakeRoom.getMesh()
const shellGroups = new Map()
for (const primitive of shellMesh.listPrimitives()) {
  const material = primitive.getMaterial()
  if (!shellGroups.has(material)) shellGroups.set(material, [])
  shellGroups.get(material).push(primitive)
}
for (const parts of shellGroups.values()) {
  if (parts.length < 2) continue
  shellMesh.addPrimitive(join(parts))
}

await doc.transform(
  prune({ keepAttributes: true, keepLeaves: true }),
  weld(),
  dedup(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', lossless: true }),
  meshopt({ encoder: MeshoptEncoder, level: 'high', quantizePosition: 15, quantizeNormal: 12, quantizeTexcoord: 16 }),
)

for (const name of [...protectedNames, 'Lamp_Light', 'Cam_Room', 'Cam_Room_Target',
  'Cam_Diary', 'Cam_Diary_Target', 'Cam_Shelf', 'Cam_Shelf_Target']) find(name)
if (!shellMesh.listPrimitives().every(p => p.getAttribute('TEXCOORD_1'))) {
  throw new Error('Light-map UV was stripped from the shell')
}
const [buffer, ...extraBuffers] = root.listBuffers()
for (const accessor of root.listAccessors()) accessor.setBuffer(buffer)
for (const extra of extraBuffers) extra.dispose()
if (manifest.resolution === 2048) {
  // Keep the original floor UV and resolution while fitting the larger light map into the startup budget.
  const floor = root.listTextures().find(texture => texture.getName() === 'Floor_BaseColor')
  if (!floor) throw new Error('Missing original floor texture')
  floor.setImage(await sharp(floor.getImage()).webp({ nearLossless: true, quality: 95, effort: 6 }).toBuffer())
}
await io.write(output, doc)
manifest.maps = {}
for (const layer of ['day', 'night', 'lamp']) {
  const png = `light-${layer}.png`
  const webp = `light-${layer}.webp`
  await sharp(pathJoin(dirname(shell), png)).webp({ lossless: true, effort: 6 })
    .toFile(pathJoin(dirname(output), webp))
  manifest.maps[layer] = webp
  manifest.probes[webp] = manifest.probes[png]
  manifest.clipped[webp] = manifest.clipped[png]
  delete manifest.probes[png]
  delete manifest.clipped[png]
}
await writeFile(pathJoin(dirname(output), 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
const stats = { primitives: root.listNodes().reduce((n, node) => n + (node.getMesh()?.listPrimitives().length ?? 0), 0),
  textures: root.listTextures().map(texture => [texture.getName(), texture.getImage().length]) }
console.log(JSON.stringify(stats, null, 2))
