import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { BackSide, Mesh, ShaderMaterial, Vector3 } from 'three'
import { ROOM_VIEW } from './layout'
import { skyRadiance, useSunFrame } from './RoomSunScene'

const modelUrl = `${import.meta.env.BASE_URL}models/room-sky.glb`
const roomDirection = new Vector3(...ROOM_VIEW.target).sub(new Vector3(...ROOM_VIEW.position)).normalize()
const cloudWind = roomDirection.clone().cross(new Vector3(0, 1, 0)).normalize()

const vertex = /* glsl */ `
  varying vec3 vSkyPosition;
  varying vec4 vSkyClip;
  void main() {
    vSkyPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vSkyClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = vSkyClip;
  }
`

const fragment = /* glsl */ `
  uniform float uHorizon;
  varying vec3 vSkyPosition;
  varying vec4 vSkyClip;
  ${skyRadiance}
  void main() {
    float elevation = 0.5 + 0.5 * vSkyClip.y / vSkyClip.w - uHorizon;
    vec2 heading = normalize((vSkyPosition - cameraPosition).xz);
    vec3 ray = normalize(vec3(heading.x, 1.6 * elevation, heading.y));
    vec3 sky = sampleSky(ray, uSunDirection, 0.0);
    float day = smoothstep(-6.0, 25.0, uSunAltitude);
    vec3 horizonLight = mix(vec3(0.048, 0.053, 0.102), vec3(0.34, 0.52, 0.75), day);
    sky = mix(sky, horizonLight, 0.24 * exp(-abs(elevation) * 27.0));
    vec3 lowerSky = sky * mix(vec3(0.66, 0.74, 0.89), vec3(0.72, 0.81, 0.94), day);
    sky = mix(lowerSky, sky, smoothstep(-0.0025, 0.0015, elevation));
    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const cloudVertex = /* glsl */ `
  varying vec3 vCloudPosition, vCloudNormal;
  varying vec4 vCloudClip;
  void main() {
    vCloudPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vCloudNormal = normalize(mat3(modelMatrix) * normal);
    vCloudClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = vCloudClip;
  }
`

const cloudFragment = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform float uSunAltitude, uHorizon;
  varying vec3 vCloudPosition, vCloudNormal;
  varying vec4 vCloudClip;
  float cloudNoise(vec3 position) {
    vec3 cell = floor(position);
    vec3 f = fract(position);
    f = f * f * (3.0 - 2.0 * f);
    vec4 offsets = dot(cell, vec3(1.0, 57.0, 113.0)) + vec4(0.0, 1.0, 57.0, 58.0);
    vec4 lower = fract(sin(offsets) * 43758.5453);
    vec4 upper = fract(sin(offsets + 113.0) * 43758.5453);
    vec4 values = mix(lower, upper, f.z);
    return mix(mix(values.x, values.y, f.x), mix(values.z, values.w, f.x), f.y);
  }
  void main() {
    vec3 normal = normalize(vCloudNormal);
    vec3 eye = normalize(cameraPosition - vCloudPosition);
    float sunlit = max(0.0, dot(normal, uSunDirection));
    float top = 0.5 + normal.y * 0.5;
    float warm = (1.0 - smoothstep(3.0, 24.0, uSunAltitude));
    vec3 shadow = mix(vec3(0.45, 0.60, 0.79), vec3(0.34, 0.28, 0.41), warm);
    vec3 light = mix(vec3(2.2, 2.24, 2.35), vec3(1.83, 0.98, 0.55), warm);
    float facing = max(0.0, dot(normal, eye));
    float detail = 0.65 * cloudNoise(vCloudPosition * 1.85) + 0.35 * cloudNoise(vCloudPosition * 5.4);
    float shading = clamp(0.42 * top + 0.64 * sunlit + (detail - 0.5) * 0.27, 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.5);
    vec3 daylightColor = mix(shadow, light, shading) + warm * rim * sunlit * vec3(0.43, 0.18, 0.07);
    vec3 nightColor = mix(vec3(0.018, 0.025, 0.059), vec3(0.057, 0.073, 0.132),
      clamp(0.7 * top + 0.3 * detail, 0.0, 1.0));
    float daylight = smoothstep(-15.0, 3.0, uSunAltitude);
    vec3 color = mix(nightColor, daylightColor, daylight);
    float elevation = 0.5 + 0.5 * vCloudClip.y / vCloudClip.w - uHorizon;
    float thickness = mix(0.34 + 0.14 * detail, 1.0, daylight);
    float edge = mix(0.73, 0.40, daylight) + detail * 0.15;
    float opacity = thickness * smoothstep(-0.025, 0.04, elevation) * smoothstep(0.0, edge, facing);
    gl_FragColor = vec4(color, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const starVertex = /* glsl */ `
  attribute vec3 color;
  varying vec3 vStarColor;
  varying vec4 vStarClip;
  void main() {
    vStarColor = color;
    vStarClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = vStarClip;
  }
`

const starFragment = /* glsl */ `
  uniform float uSunAltitude, uHorizon;
  varying vec3 vStarColor;
  varying vec4 vStarClip;
  void main() {
    float elevation = 0.5 + 0.5 * vStarClip.y / vStarClip.w - uHorizon;
    float darkness = 1.0 - smoothstep(-17.0, -4.0, uSunAltitude);
    float opacity = darkness * smoothstep(0.012, 0.16, elevation) * pow(vStarColor.b, 0.78);
    vec3 light = mix(vec3(1.18, 1.39, 1.76), vec3(2.15, 2.35, 2.65), vStarColor.b);
    gl_FragColor = vec4(light, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function RoomSky({ localSeconds, previewing }: { localSeconds: number; previewing: boolean }) {
  const sun = useSunFrame()
  const { scene } = useGLTF(modelUrl, false)
  const direction = useMemo(() => new Vector3(), [])
  const clockSample = useMemo(() => performance.now(), [localSeconds, previewing])
  const sky = useMemo(() => {
    if (!sun) return null
    const uniforms = { uSunDirection: sun.direction, uSunAltitude: sun.altitude, uHorizon: sun.horizon }
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      side: BackSide,
      depthWrite: false,
    })
    const cloudMaterial = new ShaderMaterial({
      vertexShader: cloudVertex, fragmentShader: cloudFragment, uniforms,
      transparent: true, depthWrite: false,
    })
    const starMaterial = new ShaderMaterial({
      vertexShader: starVertex, fragmentShader: starFragment, uniforms,
      transparent: true, depthWrite: false, side: BackSide,
    })
    const object = scene.clone()
    const clouds: { mesh: Mesh; origin: Vector3 }[] = []
    let stars: Mesh | undefined
    object.traverse(child => {
      if (!(child instanceof Mesh)) return
      if (child.name.startsWith('Cumulus')) {
        child.material = cloudMaterial
        // Blend clouds over the stars, using their opacity to soften the edges.
        child.renderOrder = 1
        clouds.push({ mesh: child, origin: child.position.clone() })
        return
      }
      if (child.name === 'StarField') {
        child.material = starMaterial
        stars = child
        return
      }
      child.material = material
      child.renderOrder = -1
    })
    return { object, material, cloudMaterial, starMaterial, clouds, stars }
  }, [scene, sun])

  useFrame(({ camera }) => {
    if (!sun || !sky) return
    camera.getWorldDirection(direction)
    sun.horizon.value = 0.62 + (roomDirection.y - direction.y) * 0.7

    const seconds = localSeconds + (previewing ? 0 : (performance.now() - clockSample) / 1000)
    const windPhase = (seconds / 86400 - 0.5) * 2 * Math.PI
    for (const [index, { mesh, origin }] of sky.clouds.entries()) {
      mesh.position.copy(origin).addScaledVector(cloudWind, Math.sin(windPhase) * (4.4 + index * 0.42))
    }
    if (sky.stars) sky.stars.visible = sun.altitude.value < -4
  })

  useEffect(() => () => {
    sky?.material.dispose()
    sky?.cloudMaterial.dispose()
    sky?.starMaterial.dispose()
  }, [sky])
  return sky && <primitive object={sky.object} />
}
