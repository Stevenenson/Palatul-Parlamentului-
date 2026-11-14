import { Color, DoubleSide, ShaderMaterial, type Texture, Vector2 } from 'three'

/**
 * Materialul hologramei: arată două filmări vecine care alunecă una după alta (`shift`),
 * păstrează proporțiile fiecăreia („contain”) și le dă aspect de proiecție: tentă în
 * culoarea sălii, linii de baleiaj, o pâlpâire fină și margini estompate.
 */

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform sampler2D mapA;
  uniform sampler2D mapB;
  uniform vec2 fitA;
  uniform vec2 fitB;
  uniform float shift;
  uniform float time;
  uniform float power;
  uniform float backing;
  uniform float motion;
  uniform vec3 tint;
  varying vec2 vUv;

  vec4 contain(sampler2D map, vec2 uv, vec2 fit) {
    vec2 p = (uv - 0.5) * fit + 0.5;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return vec4(0.0);
    return texture2D(map, p);
  }

  void main() {
    float x = vUv.x + shift;
    vec4 media = x < 1.0 ? contain(mapA, vec2(x, vUv.y), fitA) : contain(mapB, vec2(x - 1.0, vUv.y), fitB);

    float luma = dot(media.rgb, vec3(0.299, 0.587, 0.114));
    vec3 projected = mix(media.rgb, tint * (0.3 + 1.15 * luma), 0.42);

    float scan = 0.9 + 0.1 * sin(vUv.y * 420.0 - time * 5.0 * motion);
    float flicker = 1.0 - 0.035 * motion * (0.5 + 0.5 * sin(time * 31.0));
    float sweep = 0.07 * motion * smoothstep(0.06, 0.0, abs(fract(vUv.y - time * 0.11) - 0.5));

    // Sub filmare, un geam întunecat în tenta sălii: fără el imaginea s-ar pierde într-o sală luminoasă.
    vec3 glass = tint * 0.12;
    vec3 color = mix(glass, projected * scan * flicker + tint * sweep, media.a);
    float alpha = mix(backing, 0.96, media.a);

    float edge = smoothstep(0.0, 0.025, vUv.x) * smoothstep(0.0, 0.025, 1.0 - vUv.x)
               * smoothstep(0.0, 0.035, vUv.y) * smoothstep(0.0, 0.035, 1.0 - vUv.y);

    gl_FragColor = vec4(color, alpha * edge * power);
    #include <colorspace_fragment>
  }
`

export type HologramUniforms = {
  mapA: { value: Texture | null }
  mapB: { value: Texture | null }
  fitA: { value: Vector2 }
  fitB: { value: Vector2 }
  shift: { value: number }
  time: { value: number }
  power: { value: number }
  backing: { value: number }
  motion: { value: number }
  tint: { value: Color }
}

export function createHologramMaterial(accent: string, backing: number) {
  const uniforms: HologramUniforms = {
    mapA: { value: null },
    mapB: { value: null },
    fitA: { value: new Vector2(1, 1) },
    fitB: { value: new Vector2(1, 1) },
    shift: { value: 0 },
    time: { value: 0 },
    power: { value: 0 },
    backing: { value: backing },
    motion: { value: 1 },
    // Tenta e culoarea sălii, deschisă spre alb ca filmarea să rămână lizibilă.
    tint: { value: new Color(accent).lerp(new Color('#e8f6ff'), 0.45) },
  }
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  })
  return { material, uniforms }
}

/** Factorii prin care o imagine cu proporția `media` încape întreagă într-un panou cu proporția `panel`. */
export function containFit(media: number, panel: number, out: Vector2) {
  if (media > panel) out.set(1, media / panel)
  else out.set(panel / media, 1)
}
