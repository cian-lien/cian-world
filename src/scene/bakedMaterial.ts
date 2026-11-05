import { Color, ShaderMaterial, type Texture } from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vBakeUv;
  void main() {
    vBakeUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export function bakedMaterial(
  [albedo, lightDay, lightNight, lightLamp]: Texture[],
  scale: number,
  exposure: { day: number; night: number },
) {
  return new ShaderMaterial({
    name: 'Room bake',
    vertexShader,
    uniforms: {
      albedo: { value: albedo },
      lightDay: { value: lightDay },
      lightNight: { value: lightNight },
      lightLamp: { value: lightLamp },
      uNight: { value: 0 },
      uLamp: { value: 0 },
      uScale: { value: scale },
      uDayExposure: { value: 2 ** exposure.day },
      uNightExposure: { value: 2 ** exposure.night },
    },
    fragmentShader: /* glsl */ `
      varying vec2 vBakeUv;
      uniform sampler2D albedo;
      uniform sampler2D lightDay;
      uniform sampler2D lightNight;
      uniform sampler2D lightLamp;
      uniform float uNight;
      uniform float uLamp;
      uniform float uScale;
      uniform float uDayExposure;
      uniform float uNightExposure;

      void main() {
        vec3 day = texture2D(lightDay, vBakeUv).rgb;
        vec3 night = texture2D(lightNight, vBakeUv).rgb;
        vec3 lamp = texture2D(lightLamp, vBakeUv).rgb;
        float exposure = mix(uDayExposure, uNightExposure, uNight);
        vec3 irradiance = mix(day, night, uNight) + lamp * uLamp;
        gl_FragColor = vec4(texture2D(albedo, vBakeUv).rgb * irradiance * uScale * exposure, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}

export function bakedAccentMaterial(transparent: boolean) {
  return new ShaderMaterial({
    name: 'Room bake accents',
    transparent,
    depthWrite: !transparent,
    vertexShader,
    uniforms: {
      uDayColor: { value: new Color() },
      uNightColor: { value: new Color() },
      uLampColor: { value: new Color() },
      uLampReactive: { value: 0 },
      uDayOpacity: { value: 1 },
      uNightOpacity: { value: 1 },
      uNight: { value: 0 },
      uLamp: { value: 0 },
    },
    fragmentShader: /* glsl */ `
      uniform vec3 uDayColor;
      uniform vec3 uNightColor;
      uniform vec3 uLampColor;
      uniform float uLampReactive;
      uniform float uDayOpacity;
      uniform float uNightOpacity;
      uniform float uNight;
      uniform float uLamp;
      void main() {
        float opacity = mix(uDayOpacity, uNightOpacity, uNight);
        if (opacity < 0.001) discard;
        vec3 color = mix(uDayColor, uNightColor, uNight);
        gl_FragColor = vec4(mix(color, uLampColor, uLamp * uLampReactive), opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
