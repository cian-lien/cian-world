import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import { Camera, Color, Scene, ShaderMaterial, Vector3 } from 'three'
import { roomSunDirection, type SunPosition } from './roomSun'
import { roomWindow, windowOpening } from './windowAnchors'
import { Interactive } from './Interactive'
import { navigate } from '../route'
import { useTranslation } from 'react-i18next'

function createSunFrame(sun: SunPosition) {
  const direction = new Vector3(...roomSunDirection(sun))
  return {
    direction: { value: direction },
    warm: { value: new Color('#ffd4a6') },
    altitude: { value: sun.altitude },
    night: 0,
    intensity: 0,
  }
}

type SunFrame = ReturnType<typeof createSunFrame>
const RoomSunContext = createContext<SunFrame | null>(null)
export const useSunFrame = () => useContext(RoomSunContext)

const lowSun = new Color('#ffa155')
const highSun = new Color('#fff2df')
const smooth = (low: number, high: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)))
  return t * t * (3 - 2 * t)
}

export function RoomSunScene({ sun, scrubbing, children }: {
  sun: SunPosition
  scrubbing: boolean
  children: ReactNode
}) {
  const frame = useRef<SunFrame>()
  const target = useMemo(() => new Vector3(...roomSunDirection(sun)), [sun])
  const from = useRef(target.clone())
  const previous = useRef(target)
  const elapsed = useRef(1)
  const motion = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)'), [])
  frame.current ??= createSunFrame(sun)
  const current = frame.current

  useFrame((_, delta) => {
    if (previous.current !== target) {
      from.current.copy(current.direction.value)
      previous.current = target
      elapsed.current = 0
    }
    elapsed.current += delta
    const blend = scrubbing || motion.matches
      ? 1 : smooth(0, 0.65, elapsed.current)
    const direction = current.direction.value
    const angle = from.current.angleTo(target)
    if (angle > 0.0001 && angle < Math.PI - 0.0001 && blend < 1) {
      direction.copy(from.current).multiplyScalar(Math.sin((1 - blend) * angle))
        .addScaledVector(target, Math.sin(blend * angle)).normalize()
    } else {
      direction.copy(target)
    }
    const altitude = Math.asin(Math.max(-1, Math.min(1, direction.y))) * 180 / Math.PI
    current.altitude.value = altitude
    current.warm.value.copy(lowSun).lerp(highSun, smooth(1, 28, altitude))
    current.night = 1 - smooth(-6, 16, altitude)
    current.intensity = direction.z < -0.0001 ? 3.6 * smooth(0, 9, altitude) : 0
  }, -2)

  return <RoomSunContext.Provider value={current}>{children}</RoomSunContext.Provider>
}

const skyVertex = /* glsl */ `
  varying vec2 vScreen;
  varying vec3 vSkyPosition;
  void main() {
    #ifdef SKY_PREVIEW
      vScreen = position.xy * 2.0;
      gl_Position = vec4(vScreen, 0.0, 1.0);
    #else
      vec4 world = modelMatrix * vec4(position, 1.0);
      vSkyPosition = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    #endif
  }
`

const skyFragment = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform float uSunAltitude;
  uniform float uAspect;
  varying vec2 vScreen;
  varying vec3 vSkyPosition;
  void main() {
    #ifdef SKY_PREVIEW
      vec2 heading = uSunDirection.xz;
      heading = length(heading) > 0.0001 ? normalize(heading) : vec2(0.0, -1.0);
      float pitch = radians(18.0 + 32.0 * smoothstep(4.0, 90.0, uSunAltitude));
      vec3 forward = vec3(heading.x * cos(pitch), sin(pitch), heading.y * cos(pitch));
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(right, forward);
      vec3 ray = normalize(forward + 1.07 * (right * vScreen.x * uAspect + up * vScreen.y));
    #else
      vec3 ray = normalize(vSkyPosition - cameraPosition);
    #endif
    float day = smoothstep(-6.0, 12.0, uSunAltitude);
    float twilight = smoothstep(-6.0, 0.0, uSunAltitude) * (1.0 - smoothstep(0.0, 19.0, uSunAltitude));
    float elevation = max(ray.y, 0.0);
    float skyGradient = pow(elevation, 0.43);
    vec3 horizon = mix(vec3(0.04, 0.055, 0.115), vec3(0.53, 0.72, 0.92), day);
    vec3 zenith = mix(vec3(0.008, 0.016, 0.045), vec3(0.075, 0.30, 0.70), day);
    vec3 sky = mix(horizon, zenith, skyGradient);
    float alignment = clamp(dot(ray, uSunDirection), -1.0, 1.0);
    float distance = length(cross(ray, uSunDirection));
    float nearSun = max(0.0, alignment);
    sky += vec3(0.63, 0.18, 0.043) * twilight * exp(-elevation * 5.0)
      * (0.23 + 0.77 * pow(nearSun, 4.0));
    float skyVisible = smoothstep(-0.005, 0.001, ray.y);
    vec3 ground = mix(vec3(0.018, 0.029, 0.051), vec3(0.32, 0.48, 0.64), day);
    ground += twilight * vec3(0.17, 0.047, 0.012);
    sky = mix(ground, sky, skyVisible);

    if (alignment > 0.0 && uSunAltitude > -0.65) {
      vec3 tint = mix(vec3(1.0, 0.17, 0.032), vec3(1.0, 0.91, 0.73), smoothstep(0.0, 24.0, uSunAltitude));
      float edge = clamp(fwidth(distance), 0.0005, 0.0035);
      float disc = 1.0 - smoothstep(0.01047 - edge, 0.01047 + edge, distance);
      float glow = 1.7 * exp(-distance * 48.0) + 0.34 * exp(-distance * 13.0);
      float core = mix(3.5, 9.0, smoothstep(0.0, 20.0, uSunAltitude));
      sky += tint * (disc * core + glow) * skyVisible * smoothstep(-0.65, 0.1, uSunAltitude);
    }
    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function skyMaterial(sun: SunFrame, preview: boolean) {
  return new ShaderMaterial({
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    defines: preview ? { SKY_PREVIEW: 1 } : {},
    uniforms: { uSunDirection: sun.direction, uSunAltitude: sun.altitude, uAspect: { value: 1 } },
    depthTest: !preview,
    depthWrite: !preview,
  })
}

export function RoomWindowSky() {
  const sun = useSunFrame()
  const { t } = useTranslation()
  const material = useMemo(() => sun && skyMaterial(sun, false), [sun])
  useEffect(() => () => material?.dispose(), [material])
  if (!material) return null

  return <>
    <mesh position={[roomWindow.center[0], roomWindow.center[1], windowOpening.outside - 0.005]}>
      <planeGeometry args={[windowOpening.right - windowOpening.left, windowOpening.top - windowOpening.bottom]} />
      <primitive attach="material" object={material} />
    </mesh>
    <Interactive position={roomWindow.center} label={t('sun.lookOut')} labelHeight={.8} onSelect={() => navigate('/window')}>
      <mesh>
        <planeGeometry args={roomWindow.size} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </Interactive>
  </>
}

export function SunSkyPreview() {
  const sun = useSunFrame()
  const material = useMemo(() => sun && skyMaterial(sun, true), [sun])
  const scene = useMemo(() => new Scene(), [])
  const camera = useMemo(() => new Camera(), [])
  useEffect(() => () => material?.dispose(), [material])
  useFrame(({ gl, size }) => {
    if (!material) return
    material.uniforms.uAspect.value = size.width / size.height
    const exposure = gl.toneMappingExposure
    gl.toneMappingExposure = 1
    try {
      gl.render(scene, camera)
    } finally {
      gl.toneMappingExposure = exposure
    }
  }, 2)

  return material && createPortal(<mesh frustumCulled={false}>
    <planeGeometry />
    <primitive attach="material" object={material} />
  </mesh>, scene)
}
