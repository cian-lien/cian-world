import { ShaderChunk, type MeshStandardMaterial, type Vector3 } from 'three'
import { windowOpening } from './windowAnchors'

const { left, right, bottom, top, inside, outside } = windowOpening
const windowFragment = /* glsl */ `
  varying vec3 vRoomPosition;
  uniform vec3 uRoomSunDirection;

  bool throughOpening(vec3 ray, float plane) {
    vec2 hit = vRoomPosition.xy + ray.xy * ((plane - vRoomPosition.z) / ray.z);
    return all(greaterThanEqual(hit, vec2(${left}, ${bottom})))
      && all(lessThanEqual(hit, vec2(${right}, ${top})));
  }

  float roomWindowTransmission() {
    vec3 ray = uRoomSunDirection;
    if (ray.y <= 0.0 || ray.z >= -0.0001 || vRoomPosition.z < ${inside}) return 0.0;
    return float(throughOpening(ray, ${inside}) && throughOpening(ray, ${outside}));
  }
`

// The room sun is the only shadow-casting directional light in this render path.
// Three sorts it ahead of the unshadowed fill light, so it occupies slot zero.
const directCall = 'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );'
const lights = ShaderChunk.lights_fragment_begin
const dirStart = lights.indexOf('#if ( NUM_DIR_LIGHTS > 0 )')
const directional = lights.slice(dirStart).replace(directCall, /* glsl */ `
  if (UNROLLED_LOOP_INDEX == 0) {
    directLight.color *= roomWindowTransmission();
    #ifdef ROOM_BAKED_SHELL
      vec3 previousDirect = reflectedLight.directDiffuse + reflectedLight.directSpecular;
    #endif
    ${directCall}
    #ifdef ROOM_BAKED_SHELL
      roomSunRadiance = reflectedLight.directDiffuse + reflectedLight.directSpecular - previousDirect;
    #endif
  } else {
    ${directCall}
  }
`)

interface ShellUniforms {
  [key: string]: { value: unknown }
}

export function installWindowSun(
  material: MeshStandardMaterial,
  direction: { value: Vector3 },
  shell?: ShellUniforms,
) {
  material.customProgramCacheKey = () => shell ? 'room-sun-shell' : 'room-sun-prop'
  material.onBeforeCompile = shader => {
    shader.uniforms.uRoomSunDirection = direction
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRoomPosition;')
      .replace('#include <project_vertex>', 'vRoomPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + windowFragment)
      .replace('#include <lights_fragment_begin>', lights.slice(0, dirStart) + directional)
    if (!shell) return

    Object.assign(shader.uniforms, shell)
    shader.vertexShader = shader.vertexShader
      .replace('#include <uv_pars_vertex>', '#include <uv_pars_vertex>\n#ifndef USE_UV1\nattribute vec2 uv1;\n#endif\nvarying vec2 vBakeUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBakeUv = uv1;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */ `
        #define ROOM_BAKED_SHELL
        #include <common>
        varying vec2 vBakeUv;
        uniform sampler2D lightDay, lightNight, lightLamp;
        uniform float uNight, uLamp, uScale, uHighlightKnee;
        vec3 decodeRoomLight(vec3 value) {
          vec3 encoded = value * uScale;
          if (uHighlightKnee < 0.0) return encoded;
          return min(encoded, vec3(uHighlightKnee)) + exp(max(encoded - uHighlightKnee, 0.0)) - 1.0;
        }
      `)
      .replace('#include <lights_physical_fragment>', 'vec3 roomSunRadiance = vec3(0.0);\n#include <lights_physical_fragment>')
      .replace('#include <opaque_fragment>', /* glsl */ `
        vec3 dayLight = decodeRoomLight(texture2D(lightDay, vBakeUv).rgb);
        vec3 nightLight = decodeRoomLight(texture2D(lightNight, vBakeUv).rgb);
        vec3 lampLight = decodeRoomLight(texture2D(lightLamp, vBakeUv).rgb);
        outgoingLight = diffuseColor.rgb * (mix(dayLight, nightLight, uNight) + lampLight * uLamp) + roomSunRadiance;
        #include <opaque_fragment>
      `)
  }
}
