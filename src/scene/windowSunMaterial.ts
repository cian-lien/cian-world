import { ShaderChunk, type MeshStandardMaterial, type Vector3 } from 'three'
import { windowGlass, windowOpening } from './windowAnchors'

const { left, right, bottom, top, inside, outside } = windowOpening
export const windowOptics = /* glsl */ `
  float paneFresnel(float cosine) {
    const float r0 = pow((${windowGlass.ior} - 1.0) / (${windowGlass.ior} + 1.0), 2.0);
    return r0 + (1.0 - r0) * pow(1.0 - clamp(cosine, 0.0, 1.0), 5.0);
  }

  float openingMask(vec2 p, float softEdge) {
    vec2 edge = min(p - vec2(${left}, ${bottom}), vec2(${right}, ${top}) - p);
    return smoothstep(0.0, softEdge, min(edge.x, edge.y));
  }

  float roomWindowTransmission(vec3 p, vec3 ray, float softEdge) {
    if (ray.y <= 0.0 || ray.z >= -0.0001 || p.z < ${inside}) return 0.0;
    vec2 inner = p.xy + ray.xy * ((${inside} - p.z) / ray.z);
    vec2 entry = p.xy + ray.xy * ((${windowGlass.inside} - p.z) / ray.z);
    vec3 inGlass = refract(ray, vec3(0.0, 0.0, 1.0), 1.0 / ${windowGlass.ior});
    vec2 exit = entry + inGlass.xy * ((${windowGlass.outside} - ${windowGlass.inside}) / inGlass.z);
    vec2 outer = exit + ray.xy * ((${outside} - ${windowGlass.outside}) / ray.z);
    float transmission = 1.0 - paneFresnel(-ray.z);
    return openingMask(inner, softEdge) * openingMask(outer, softEdge) * transmission * transmission;
  }
`

const windowFragment = /* glsl */ `
  varying vec3 vRoomPosition;
  uniform vec3 uRoomSunDirection;
  ${windowOptics}
`

// The room sun is the only shadow-casting directional light in this render path.
// Three sorts it ahead of the unshadowed fill light, so it occupies slot zero.
const directCall = 'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );'
const lights = ShaderChunk.lights_fragment_begin
const dirStart = lights.indexOf('#if ( NUM_DIR_LIGHTS > 0 )')
const directional = lights.slice(dirStart).replace(directCall, /* glsl */ `
  if (UNROLLED_LOOP_INDEX == 0) {
    directLight.color *= roomWindowTransmission(vRoomPosition, uRoomSunDirection, 0.018);
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
        uniform vec3 uRoomAmbient;
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
        vec3 roomAmbient = mix(dayLight * uRoomAmbient, nightLight, uNight);
        outgoingLight = diffuseColor.rgb * (roomAmbient + lampLight * uLamp) + roomSunRadiance;
        #include <opaque_fragment>
      `)
  }
}
