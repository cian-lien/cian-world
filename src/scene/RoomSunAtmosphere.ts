import { MathUtils, Matrix4, ShaderMaterial, Vector2, Vector3, type DirectionalLight, type PerspectiveCamera, type Texture } from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { skyRadiance, type SunFrame } from './RoomSunScene'
import { windowOptics } from './windowSunMaterial'
import { roomWindow } from './windowAnchors'

const windowCenter = new Vector3(...roomWindow.center)
const solarNoonAnchor = windowCenter.clone().add(new Vector3(0, 0, -2.5))

const fragment = /* glsl */ `
  uniform sampler2D tDiffuse, uDepth, uShadow;
  uniform mat4 uInverseProjection, uCameraWorld, uShadowMatrix;
  uniform vec3 uEye, uSunColor;
  uniform vec2 uSunPosition;
  uniform float uStrength, uAspect, uRoomView, uBackdropHorizon;
  uniform int uSamples;
  varying vec2 vUv;
  ${skyRadiance}
  ${windowOptics}
  #include <packing>

  vec3 worldAt(float depth) {
    vec4 p = uInverseProjection * vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    return (uCameraWorld * vec4(p.xyz / p.w, 1.0)).xyz;
  }

  vec3 sunDisc() {
    // The room occludes the disc through depth.
    vec2 scale = vec2(uAspect, 1.0) * 1.25;
    vec2 horizonOrigin = vec2(0.5, uBackdropHorizon);
    vec3 ray = normalize(vec3((vUv - horizonOrigin) * scale, -1.0));
    vec3 source = normalize(vec3((uSunPosition - horizonOrigin) * scale, -1.0));
    if (dot(ray, source) <= 0.0) return vec3(0.0);
    float visible = smoothstep(-0.004, 0.001, ray.y) * smoothstep(0.0, 0.65, uSunAltitude);
    return solarRadiance(length(cross(ray, source)) / 0.014) * visible;
  }

  float shadowAt(vec3 p) {
    vec3 uvz = (uShadowMatrix * vec4(p, 1.0)).xyz;
    if (any(lessThan(uvz, vec3(0.0))) || any(greaterThan(uvz, vec3(1.0)))) return 0.0;
    float stored = unpackRGBAToDepth(texture2D(uShadow, uvz.xy));
    return step(uvz.z - 0.0005, stored);
  }

  vec3 windowScattering(vec3 ray, float distanceToSurface) {
    // Intersect the room's air volume, then stop at the first opaque surface.
    vec3 inverseRay = sign(ray + 1e-8) / max(abs(ray), vec3(1e-5));
    vec3 a = (vec3(-2.59, 0.02, -2.195) - uEye) * inverseRay;
    vec3 b = (vec3(2.59, 3.19, 2.19) - uEye) * inverseRay;
    vec3 near = min(a, b), far = max(a, b);
    float start = max(0.0, max(max(near.x, near.y), near.z));
    float end = min(distanceToSurface, min(min(far.x, far.y), far.z));
    if (end <= start) return vec3(0.0);
    float stepSize = (end - start) / float(uSamples);
    float scatter = 0.0;
    float jitter = fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)) * 52.9829189);
    for (int i = 0; i < 24; ++i) {
      if (i >= uSamples) break;
      vec3 p = uEye + ray * (start + (float(i) + jitter) * stepSize);
      float through = roomWindowTransmission(p, uSunDirection, 0.060);
      if (through > 0.0) scatter += through * shadowAt(p);
    }
    float facing = 0.48 + 0.52 * pow(max(0.0, dot(ray, uSunDirection)), 3.0);
    float haze = mix(0.077, 0.020, smoothstep(4.0, 27.0, uSunAltitude));
    return uSunColor * (scatter * stepSize * uStrength * haze * facing);
  }

  void main() {
    float depth = texture2D(uDepth, vUv).r;
    vec3 color = texture2D(tDiffuse, vUv).rgb;
    if (depth >= 1.0 && uRoomView > 0.5 && uSunAltitude > 0.0) color += sunDisc();
    if (uStrength > 0.0) {
      vec3 offset = worldAt(depth) - uEye;
      float distanceToSurface = length(offset);
      vec3 ray = offset / max(distanceToSurface, 0.0001);
      color += windowScattering(ray, distanceToSurface);
    }
    gl_FragColor = vec4(color, 1.0);
  }
`

export function createRoomSunAtmosphere(sun: SunFrame, depth: Texture) {
  const projectedNoon = new Vector3()
  const uniforms = {
    tDiffuse: { value: null },
    uDepth: { value: depth },
    uShadow: { value: null as Texture | null },
    uSunDirection: sun.direction,
    uSunAltitude: sun.altitude,
    uSunColor: sun.warm,
    uSunPosition: { value: new Vector2(0.5, 0.7) },
    uInverseProjection: { value: new Matrix4() },
    uCameraWorld: { value: new Matrix4() },
    uShadowMatrix: { value: new Matrix4() },
    uEye: { value: new Vector3() },
    uStrength: { value: 0 },
    uAspect: { value: 1 },
    uRoomView: { value: 0 },
    uBackdropHorizon: sun.horizon,
    uSamples: { value: 24 },
  }
  const pass = new ShaderPass(new ShaderMaterial({
    uniforms,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: fragment,
    depthTest: false,
    depthWrite: false,
  }))
  return {
    pass,
    update(camera: PerspectiveCamera, light: DirectionalLight | null, narrow: boolean, roomView: boolean) {
      uniforms.uInverseProjection.value = camera.projectionMatrixInverse
      uniforms.uCameraWorld.value = camera.matrixWorld
      uniforms.uEye.value.setFromMatrixPosition(camera.matrixWorld)
      uniforms.uAspect.value = camera.aspect
      uniforms.uRoomView.value = Number(roomView)
      if (roomView) {
        const direction = sun.direction.value
        projectedNoon.copy(solarNoonAnchor).project(camera)
        const noonX = MathUtils.clamp(projectedNoon.x * 0.5 + 0.5, 0.55, 0.78)
        const eastWest = direction.x / Math.max(Math.hypot(direction.x, direction.z), 1e-4)
        // Give the rising sun room to clear the left wall. Keep the west
        // side within the frame and meet both sides smoothly at noon.
        const east = Math.max(0, -eastWest)
        const sunX = noonX + 0.14 * eastWest - (noonX - 0.10 - 0.14) * east * east
        // Use one curve from the horizon to the highest point in the sky.
        const altitude = Math.max(0, sun.altitude.value)
        const sunHeight = sun.horizon.value + 0.26 * (1 - Math.exp(-altitude / 28))
        uniforms.uSunPosition.value.set(sunX, sunHeight)
      }
      uniforms.uSamples.value = narrow ? 14 : 24
      uniforms.uStrength.value = 0
      if (!light?.shadow.map || sun.intensity <= 0) return
      uniforms.uStrength.value = sun.intensity
      uniforms.uShadow.value = light.shadow.map.texture
      uniforms.uShadowMatrix.value = light.shadow.matrix
    },
  }
}
