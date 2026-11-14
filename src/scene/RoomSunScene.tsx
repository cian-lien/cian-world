import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import { Camera, Color, MathUtils, Scene, ShaderMaterial, Vector3 } from 'three'
import { roomSunDirection, type SunPosition } from './roomSun'
import { roomWindow } from './windowAnchors'
import { Interactive } from './Interactive'
import { navigate } from '../route'
import { useTranslation } from 'react-i18next'
import { windowOptics } from './windowSunMaterial'

function createSunFrame(sun: SunPosition) {
  const direction = new Vector3(...roomSunDirection(sun))
  return {
    direction: { value: direction },
    warm: { value: new Color('#ffd4a6') },
    altitude: { value: sun.altitude },
    horizon: { value: 0.62 },
    ambient: { value: new Color() },
    lowAngle: 0,
    night: 0,
    intensity: 0,
  }
}

export type SunFrame = ReturnType<typeof createSunFrame>
const RoomSunContext = createContext<SunFrame | null>(null)
export const useSunFrame = () => useContext(RoomSunContext)

const lowSun = new Color('#ff812a')
const highSun = new Color('#fff1d7')
const twilightAmbient = new Color('#6886d3')
const daylightAmbient = new Color('#ebf4ff')
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
    const altitude = MathUtils.radToDeg(Math.asin(MathUtils.clamp(direction.y, -1, 1)))
    current.altitude.value = altitude
    current.lowAngle = 1 - smooth(5, 31, altitude)
    current.warm.value.copy(lowSun).lerp(highSun, 1 - current.lowAngle)
    current.ambient.value.copy(twilightAmbient).lerp(daylightAmbient, smooth(-2, 28, altitude))
      .multiplyScalar(0.72 + 0.14 * smooth(1, 30, altitude))
    current.night = 1 - smooth(-9, 18, altitude)
    const windowFacing = smooth(0, 0.12, -direction.z)
    current.intensity = (11.8 + 3.1 * current.lowAngle) * smooth(0.02, 2.6, altitude) * windowFacing
  }, -2)

  return <RoomSunContext.Provider value={current}>{children}</RoomSunContext.Provider>
}

export const skyRadiance = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform float uSunAltitude;

  vec3 solarRadiance(float distance) {
    vec3 tint = mix(vec3(1.0, 0.17, 0.032), vec3(1.0, 0.91, 0.73), smoothstep(0.0, 24.0, uSunAltitude));
    float edge = clamp(fwidth(distance), 0.02, 0.25);
    float disc = 1.0 - smoothstep(1.0 - edge, 1.0 + edge, distance);
    float glow = 2.8 * exp(-distance * 0.70) + 0.36 * exp(-distance * 0.17);
    float core = mix(5.0, 16.0, smoothstep(0.0, 27.0, uSunAltitude));
    float limb = sqrt(max(0.0, 1.0 - distance * distance));
    return tint * (disc * core * (0.70 + 0.30 * limb) + glow);
  }

  vec3 sampleSky(vec3 ray, vec3 direction, float radius) {
    float day = smoothstep(-5.0, 34.0, uSunAltitude);
    float twilight = smoothstep(-8.0, 1.0, uSunAltitude) * (1.0 - smoothstep(3.0, 31.0, uSunAltitude));
    float elevation = max(ray.y, 0.0);
    float skyGradient = 1.0 - exp(-elevation * 3.8);
    vec3 horizon = mix(vec3(0.075, 0.069, 0.14), vec3(0.21, 0.49, 1.05), day);
    vec3 zenith = mix(vec3(0.013, 0.016, 0.071), vec3(0.034, 0.16, 0.55), day);
    vec3 sky = mix(horizon, zenith, skyGradient);
    float alignment = clamp(dot(ray, direction), -1.0, 1.0);
    float nearSun = max(0.0, alignment);
    sky += vec3(1.39, 0.27, 0.028) * twilight * exp(-elevation * 8.0)
      * (0.12 + 0.85 * pow(nearSun, 10.0));
    float below = smoothstep(0.0, 0.56, -ray.y);
    vec3 ground = mix(vec3(0.022, 0.024, 0.061), vec3(0.17, 0.37, 0.76), day);
    sky = mix(sky, ground, below * 0.9);

    if (radius > 0.0 && alignment > 0.0 && uSunAltitude > 0.0) {
      float skyVisible = smoothstep(-0.004, 0.001, ray.y);
      sky += solarRadiance(length(cross(ray, direction)) / radius) * skyVisible
        * smoothstep(0.0, 0.65, uSunAltitude);
    }
    return sky;
  }
`

const skyPreviewFragment = /* glsl */ `
  uniform float uAspect;
  varying vec2 vScreen;
  ${skyRadiance}
  void main() {
    vec2 heading = uSunDirection.xz;
    heading = length(heading) > 0.0001 ? normalize(heading) : vec2(0.0, -1.0);
    float pitch = radians(18.0 + 32.0 * smoothstep(4.0, 90.0, uSunAltitude));
    vec3 forward = vec3(heading.x * cos(pitch), sin(pitch), heading.y * cos(pitch));
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 ray = normalize(forward + 1.07 * (right * vScreen.x * uAspect + up * vScreen.y));
    gl_FragColor = vec4(sampleSky(ray, uSunDirection, 0.013), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function createWindowGlass(sun: SunFrame) {
  return new ShaderMaterial({
    uniforms: { uSunDirection: sun.direction, uSunAltitude: sun.altitude,
      uGlassSunColor: sun.warm },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vGlassPosition;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vGlassPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDirection, uGlassSunColor;
      uniform float uSunAltitude;
      varying vec3 vGlassPosition;
      ${windowOptics}
      void main() {
        vec3 ray = normalize(vGlassPosition - cameraPosition);
        vec3 normal = vec3(0.0, 0.0, 1.0);
        float fresnel = paneFresnel(-ray.z);
        vec3 reflection = mix(vec3(0.04, 0.06, 0.11), vec3(0.26, 0.40, 0.62), smoothstep(-6.0, 25.0, uSunAltitude));
        float facingSun = smoothstep(0.0, 0.24, -uSunDirection.z) * smoothstep(0.0, 2.6, uSunAltitude);
        vec3 inwardLight = reflect(-uSunDirection, normal);
        float specular = pow(max(0.0, dot(-ray, inwardLight)), 18.0);
        vec2 pane = (vGlassPosition.xy - vec2(${roomWindow.center.slice(0, 2).join(', ')}))
          / vec2(${roomWindow.size.join(', ')}) + 0.5;
        vec2 paneEdge = min(pane, 1.0 - pane);
        float illuminatedEdge = uSunDirection.x < 0.0 ? pane.x : 1.0 - pane.x;
        float bevel = exp(-paneEdge.y * 73.0) * smoothstep(0.35, 0.85, pane.y)
          + exp(-illuminatedEdge * 50.0) * smoothstep(0.10, 0.98, pane.y);
        float streakPosition = 0.45 + 0.42 * uSunDirection.x;
        float streakDistance = (pane.x - streakPosition - 0.22 * (pane.y - 0.5)) / 0.047;
        float streak = exp(-streakDistance * streakDistance) * smoothstep(0.18, 0.90, pane.y);
        float highlight = facingSun * (specular * 0.12 + bevel * 1.25 + streak * 0.21);
        float opacity = clamp(fresnel + highlight * 0.25, 0.04, 0.65);
        gl_FragColor = vec4((fresnel * reflection + uGlassSunColor * highlight) / opacity, opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}

export function RoomWindowHotspot() {
  const { t } = useTranslation()
  return <Interactive position={roomWindow.center} label={t('sun.lookOut')} labelHeight={.8} onSelect={() => navigate('/window')}>
    <mesh>
      <planeGeometry args={roomWindow.size} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  </Interactive>
}

export function SunSkyPreview() {
  const sun = useSunFrame()
  const material = useMemo(() => sun && new ShaderMaterial({
    vertexShader: 'varying vec2 vScreen; void main() { vScreen = position.xy * 2.0; gl_Position = vec4(vScreen, 0.0, 1.0); }',
    fragmentShader: skyPreviewFragment,
    uniforms: { uSunDirection: sun.direction, uSunAltitude: sun.altitude, uAspect: { value: 1 } },
    depthTest: false,
    depthWrite: false,
  }), [sun])
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
