// Sombreamento de superfície. Um único ponto de injeção por material, porque um
// material só aceita um `onBeforeCompile`. Compõe três termos independentes:
//
//   1. campo luminoso do mundo — núcleo denso e cauda esparsa, já com bloqueio
//      assado; entra em todo material;
//   2. continuidade de superfície — só em superfícies de objetos, nunca no chão;
//   3. Eco de Contato — só no chão.
//
// Nenhum deles é luz nova e nenhum acompanha a câmera. Todos entram como emissão
// da própria superfície, antes da névoa, e por isso somem com a distância e são
// escondidos por qualquer oclusor pelo simples teste de profundidade.

import {
  DataTexture,
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  Vector2,
  Vector3,
  Vector4,
  type MeshLambertMaterial,
  type WebGLProgramParametersWithUniforms,
} from "three";
import { MAX_CONTACTS, type ContactFootprint } from "../world/contact-echo";
import type { LightField } from "../world/light-field";

const NOISE_SCALE = 1.7;
const ECHO_COLOR = new Vector3(0.62, 0.66, 0.78);

/** Claridade da continuidade. Muito abaixo do material que a origina. */
const CONTINUITY_COLOR = new Vector3(0.54, 0.58, 0.66);

export type SurfaceRole = "chao" | "objeto";

export type SurfaceShading = {
  setFootprints: (footprints: readonly ContactFootprint[]) => void;
  setEchoStrength: (strength: number) => void;
  setContinuityStrength: (strength: number) => void;
  setPerceptionRange: (meters: number) => void;
  setLightFieldEnabled: (enabled: boolean) => void;
  setLightFieldDebug: (enabled: boolean) => void;
  setMaterialFloor: (value: number) => void;
};

export function lightFieldTexture(field: LightField): DataTexture {
  const pixels = new Uint8Array(field.cols * field.rows * 4);
  for (let i = 0; i < field.cols * field.rows; i += 1) {
    for (let c = 0; c < 3; c += 1) {
      const value = (field.data[i * 3 + c] ?? 0) / field.scale;
      pixels[i * 4 + c] = Math.round(Math.max(0, Math.min(1, value)) * 255);
    }
    pixels[i * 4 + 3] = 255;
  }
  const texture = new DataTexture(pixels, field.cols, field.rows, RGBAFormat, UnsignedByteType);
  // Linear: a cauda é difusa e a grade é rasa; degraus de célula apareceriam.
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const HELPERS = /* glsl */ `
float surfHash( vec2 cell, float seed ) {
  return fract( sin( dot( cell, vec2( 127.1, 311.7 ) ) + seed * 53.7 ) * 43758.5453 );
}

float surfNoise( vec2 p, float seed ) {
  vec2 cell = floor( p );
  vec2 f = fract( p );
  f = f * f * ( 3.0 - 2.0 * f );
  float a = surfHash( cell, seed );
  float b = surfHash( cell + vec2( 1.0, 0.0 ), seed );
  float c = surfHash( cell + vec2( 0.0, 1.0 ), seed );
  float d = surfHash( cell + vec2( 1.0, 1.0 ), seed );
  return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
}
`;

function fragmentBody(role: SurfaceRole): string {
  const echo = role === "chao" ? /* glsl */ `
// ── Eco de Contato ─────────────────────────────────────────────────────────
float eco = 0.0;
for ( int i = 0; i < ECHO_MAX_CONTACTS; i ++ ) {
  if ( i >= uEchoCount ) break;

  vec4 area = uEchoAreas[ i ];
  vec4 meta = uEchoMeta[ i ];

  // Distância até a borda do retângulo de contato, não até o centro.
  vec2 d = abs( vSurfWorld.xz - area.xy ) - area.zw;
  float edge = length( max( d, 0.0 ) ) + min( max( d.x, d.y ), 0.0 );

  // O alcance vem do próprio contato: fundação longa espalha mais, sem brilhar
  // mais. A intensidade é a mesma para todos.
  float reach = meta.z;
  float fall = 1.0 - clamp( edge / reach, 0.0, 1.0 );
  fall = fall * fall * fall;

  float threshold = 0.38 + ( 1.0 - meta.y ) * 0.34;
  float n = surfNoise( vSurfWorld.xz * uNoiseScale, meta.x );
  // Segunda oitava: abre lacunas dentro da própria máscara.
  float n2 = surfNoise( vSurfWorld.xz * uNoiseScale * 2.7 + 11.3, meta.x );
  float broken = smoothstep( threshold, threshold + 0.22, n ) * step( 0.32, n2 );

  // max, nunca soma: aglomerados não refazem uma superfície contínua.
  eco = max( eco, fall * broken );
}
totalEmissiveRadiance += uEchoColor * eco * uEchoStrength;
` : /* glsl */ `
// ── Continuidade de superfície ─────────────────────────────────────────────
// Uma face voltada para cima não pode sumir enquanto as laterais do mesmo
// volume continuam visíveis: isso leria como um objeto sem tampa. O sinal
// depende da orientação da face e da distância — nunca da direção do olhar —
// e só existe em superfícies de objetos, jamais no chão.
// Contribuição ambiental mínima da família: o material tem presença própria,
// granulada pelo mesmo ruído estável, para não virar brilho uniforme.
float nm = surfNoise( vSurfWorld.xz * 3.1 + vSurfWorld.y * 1.7, 41.0 );
totalEmissiveRadiance += diffuseColor.rgb * uMaterialFloor * smoothstep( 0.34, 0.62, nm );

float voltadaPraCima = clamp( vSurfNormal.y, 0.0, 1.0 );
float orientacao = smoothstep( 0.22, 0.82, voltadaPraCima );
float distancia = length( vSurfWorld - cameraPosition );
float dentroDaPercepcao = 1.0 - smoothstep( uPerceptionRange * 0.35, uPerceptionRange * 0.9, distancia );

float nc = surfNoise( vSurfWorld.xz * 2.1 + vSurfWorld.y * 0.7, 7.0 );
float esparso = smoothstep( 0.44, 0.68, nc );

totalEmissiveRadiance += uContinuityColor * orientacao * dentroDaPercepcao * esparso * uContinuityStrength;
`;

  return /* glsl */ `
#include <emissivemap_fragment>

// ── Campo luminoso do mundo ────────────────────────────────────────────────
vec2 campoUv = ( vSurfWorld.xz - uFieldOrigin ) / uFieldSize;
vec3 campo = vec3( 0.0 );
if ( uFieldEnabled > 0.5 && campoUv.x > 0.0 && campoUv.x < 1.0 && campoUv.y > 0.0 && campoUv.y < 1.0 ) {
  // Normalizado: 1 e o pico do campo assado. Trabalhar em valor absoluto
  // entregava emissao dezenas de vezes maior que a do Eco e estourava o chao.
  campo = texture2D( uLightField, campoUv ).rgb;
}

float campoLum = max( campo.r, max( campo.g, campo.b ) );
// Núcleo: contínuo e forte. Cauda: só onde o ruído deixa, para que grandes
// áreas pretas permaneçam entre os sinais.
float nucleo = smoothstep( 0.14, 0.46, campoLum );
float cauda = smoothstep( 0.012, 0.14, campoLum );
float nf = surfNoise( vSurfWorld.xz * 1.35, 21.0 );
float nf2 = surfNoise( vSurfWorld.xz * 0.42 + 5.7, 33.0 );
// Duas oitavas e limiar alto: a cauda vira sinais esparsos, nao um tapete.
float raro = smoothstep( 0.58, 0.74, nf ) * smoothstep( 0.40, 0.58, nf2 );
float mascara = max( nucleo, cauda * raro );

// A cor da fonte se mistura à do material, em vez de substituí-la.
totalEmissiveRadiance += campo * mix( vec3( 1.0 ), diffuseColor.rgb, 0.62 ) * mascara * uFieldGain;

if ( uFieldDebug > 0.5 ) {
  totalEmissiveRadiance += campo * 0.08;
}

${echo}
`;
}

export type SurfaceOptions = {
  role: SurfaceRole;
  field: LightField;
  fieldTexture: DataTexture;
};

export function attachSurfaceShading(material: MeshLambertMaterial, options: SurfaceOptions): SurfaceShading {
  const { role, field, fieldTexture } = options;

  const areas = Array.from({ length: MAX_CONTACTS }, () => new Vector4(0, 0, 0, 0));
  const meta = Array.from({ length: MAX_CONTACTS }, () => new Vector4(0, 1, 1, 0));

  const uniforms = {
    uEchoCount: { value: 0 },
    uEchoAreas: { value: areas },
    uEchoMeta: { value: meta },
    uEchoStrength: { value: 0 },
    uEchoColor: { value: ECHO_COLOR },
    uNoiseScale: { value: NOISE_SCALE },
    uContinuityStrength: { value: 0 },
    uContinuityColor: { value: CONTINUITY_COLOR },
    uPerceptionRange: { value: 15 },
    uLightField: { value: fieldTexture },
    uFieldOrigin: { value: new Vector2(field.minX, field.minZ) },
    uFieldSize: { value: new Vector2(field.cols * field.cellSize, field.rows * field.cellSize) },
    uFieldScale: { value: field.scale },
    uFieldGain: { value: 0.055 },
    uFieldEnabled: { value: 1 },
    uFieldDebug: { value: 0 },
    uMaterialFloor: { value: 0 },
  };

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = `varying vec3 vSurfWorld;\nvarying vec3 vSurfNormal;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
vSurfWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
vSurfNormal = normalize( mat3( modelMatrix ) * objectNormal );`,
    );

    shader.fragmentShader = [
      `#define ECHO_MAX_CONTACTS ${MAX_CONTACTS}`,
      "varying vec3 vSurfWorld;",
      "varying vec3 vSurfNormal;",
      "uniform int uEchoCount;",
      `uniform vec4 uEchoAreas[${MAX_CONTACTS}];`,
      `uniform vec4 uEchoMeta[${MAX_CONTACTS}];`,
      "uniform float uEchoStrength;",
      "uniform vec3 uEchoColor;",
      "uniform float uNoiseScale;",
      "uniform float uContinuityStrength;",
      "uniform vec3 uContinuityColor;",
      "uniform float uPerceptionRange;",
      "uniform sampler2D uLightField;",
      "uniform vec2 uFieldOrigin;",
      "uniform vec2 uFieldSize;",
      "uniform float uFieldScale;",
      "uniform float uFieldGain;",
      "uniform float uFieldEnabled;",
      "uniform float uFieldDebug;",
      "uniform float uMaterialFloor;",
      HELPERS,
      shader.fragmentShader,
    ]
      .join("\n")
      .replace("#include <emissivemap_fragment>", fragmentBody(role));
  };

  material.emissive.setRGB(0, 0, 0);
  material.needsUpdate = true;

  return {
    setFootprints(footprints) {
      const count = Math.min(footprints.length, MAX_CONTACTS);
      for (let i = 0; i < count; i += 1) {
        const print = footprints[i]!;
        areas[i]!.set(print.center.x, print.center.z, print.halfExtent.x, print.halfExtent.z);
        meta[i]!.set(print.seed, print.sparsity, print.reach, 0);
      }
      uniforms.uEchoCount.value = count;
    },
    setEchoStrength(strength) {
      uniforms.uEchoStrength.value = strength;
    },
    setContinuityStrength(strength) {
      uniforms.uContinuityStrength.value = strength;
    },
    setPerceptionRange(meters) {
      uniforms.uPerceptionRange.value = meters;
    },
    setLightFieldEnabled(enabled) {
      uniforms.uFieldEnabled.value = enabled ? 1 : 0;
    },
    setLightFieldDebug(enabled) {
      uniforms.uFieldDebug.value = enabled ? 1 : 0;
    },
    setMaterialFloor(value) {
      uniforms.uMaterialFloor.value = value;
    },
  };
}
