import { Mesh, Vector3, type Camera, type Object3D } from 'three'

const parts = { stair: 'Stairwell', tank: 'WaterTank', table: 'TeaTableFrameOutline', frontRail: 'FrontParapet', crock: 'LotusCrock' }

/** Screen-space silhouette extents from the meshes that were rendered. */
export function measureReferenceComposition(scene: Object3D, camera: Camera, width: number, height: number) {
  const point = new Vector3()
  const boundsByPart = Object.fromEntries(Object.entries(parts).map(([key, name]) => {
    const part = scene.getObjectByName(name)
    if (!part) throw new Error(`Missing reference geometry: ${name}`)
    const bounds = [Infinity, Infinity, -Infinity, -Infinity]
    part.traverseVisible(object => {
      if (!(object instanceof Mesh)) return
      const positions = object.geometry.getAttribute('position')
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).project(camera)
        const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2
        bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y)
        bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y)
      }
    })
    return [key, bounds]
  }))
  const corners = Array.from({ length: 4 }, (_, i) => {
    const corner = scene.getObjectByName(`StairRoofCorner${i}`)
    if (!corner) throw new Error(`Missing stair roof corner ${i}`)
    corner.getWorldPosition(point).project(camera)
    return [(point.x + 1) * width / 2, (1 - point.y) * height / 2]
  })
  return { ...boundsByPart, stairCorners: corners.flat() }
}
