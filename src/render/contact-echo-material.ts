// Aplica o Eco de Contato ao material do terreno.
//
// O termo entra como emissao do proprio chao, antes da nevoa: some com a
// distancia junto com todo o resto e respeita os alcances de 8, 15 e 25 metros
// sem conhece-los. Como e o terreno que se sombreia, qualquer barreira entre a
// camera e aquele chao o esconde pelo teste de profundidade — nada e revelado
// atraves de paredes ou relevos.

import type { MeshLambertMaterial, WebGLProgramParametersWithUniforms } from "three";
import { Vector2, Vector3, Vector4 } from "three";
import { MAX_CONTACTS, type ContactFootprint } from "../world/contact-echo";

/** Alcance do eco a partir da borda da area de contato, em metros. */
const ECHO_REACH = 1.15;

/** Celulas de ruido por metro. Define o tamanho dos retalhos. */
const NOISE_SCALE = 1.7;

const ECHO_COLOR = new Vector3(0.62, 0.66, 0.78);

export type ContactEchoUniforms = {
  setFootprints: (footprints: readonly ContactFootprint[]) => void;
  setStrength: (strength: number) => void;
};

const VERTEX_HOOK = "#include <begin_vertex>";
const VERTEX_INJECTION = /* glsl */ `
#include <begin_vertex>
vEchoWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
`;

const FRAGMENT_HOOK = "#include <emissivemap_fragment>";

// Declaradas fora de main: o ponto de injecao do termo fica dentro dela.
const FRAGMENT_HELPERS = /* glsl */ `
// Ruido de valor ancorado no espaco do mundo. Sem termo de tempo e sem
// dependencia da tela: ao caminhar ou girar, o vestigio continua pertencendo ao
// mesmo lugar do terreno.
float ecoHash( vec2 cell, float seed ) {
  return fract( sin( dot( cell, vec2( 127.1, 311.7 ) ) + seed * 53.7 ) * 43758.5453 );
}

float ecoNoise( vec2 p, float seed ) {
  vec2 cell = floor( p );
  vec2 f = fract( p );
  f = f * f * ( 3.0 - 2.0 * f );
  float a = ecoHash( cell, seed );
  float b = ecoHash( cell + vec2( 1.0, 0.0 ), seed );
  float c = ecoHash( cell + vec2( 0.0, 1.0 ), seed );
  float d = ecoHash( cell + vec2( 1.0, 1.0 ), seed );
  return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
}
`;

const FRAGMENT_INJECTION = /* glsl */ `
#include <emissivemap_fragment>

float eco = 0.0;

for ( int i = 0; i < ECHO_MAX_CONTACTS; i ++ ) {
  if ( i >= uEchoCount ) break;

  vec4 area = uEchoAreas[ i ];
  vec2 meta = uEchoMeta[ i ];

  // Distancia ate a borda do retangulo de contato, nao ate o centro: a forma e o
  // tamanho da area entram no resultado e nenhum objeto recebe um circulo igual.
  vec2 d = abs( vEchoWorld.xz - area.xy ) - area.zw;
  float edge = length( max( d, 0.0 ) ) + min( max( d.x, d.y ), 0.0 );

  float fall = 1.0 - clamp( edge / uEchoReach, 0.0, 1.0 );
  fall = fall * fall * fall;

  // O limiar sobe com o tamanho da fundacao: estruturas grandes recebem poucos
  // vestigios ao longo dela, em vez da area inteira abaixo.
  float sparsity = meta.y;
  float threshold = 0.38 + ( 1.0 - sparsity ) * 0.34;

  float n = ecoNoise( vEchoWorld.xz * uEchoNoiseScale, meta.x );
  float broken = smoothstep( threshold, threshold + 0.22, n );

  // max, nunca soma: por mais objetos que se aproximem, o chao nao vira uma
  // superficie continua.
  eco = max( eco, fall * broken );
}

totalEmissiveRadiance += uEchoColor * eco * uEchoStrength;
`;

/**
 * Liga o Eco de Contato a um material de terreno ja existente. O material
 * continua sendo iluminado normalmente pelas fontes do mundo; o eco apenas soma
 * um termo proprio, sempre mais fraco que o objeto que o origina.
 */
export function attachContactEcho(material: MeshLambertMaterial): ContactEchoUniforms {
  const areas = Array.from({ length: MAX_CONTACTS }, () => new Vector4(0, 0, 0, 0));
  const meta = Array.from({ length: MAX_CONTACTS }, () => new Vector2(0, 1));

  const uniforms = {
    uEchoCount: { value: 0 },
    uEchoAreas: { value: areas },
    uEchoMeta: { value: meta },
    uEchoStrength: { value: 0 },
    uEchoReach: { value: ECHO_REACH },
    uEchoNoiseScale: { value: NOISE_SCALE },
    uEchoColor: { value: ECHO_COLOR },
  };

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = `varying vec3 vEchoWorld;\n${shader.vertexShader}`.replace(
      VERTEX_HOOK,
      VERTEX_INJECTION,
    );

    shader.fragmentShader = [
      `#define ECHO_MAX_CONTACTS ${MAX_CONTACTS}`,
      "varying vec3 vEchoWorld;",
      "uniform int uEchoCount;",
      `uniform vec4 uEchoAreas[${MAX_CONTACTS}];`,
      `uniform vec2 uEchoMeta[${MAX_CONTACTS}];`,
      "uniform float uEchoStrength;",
      "uniform float uEchoReach;",
      "uniform float uEchoNoiseScale;",
      "uniform vec3 uEchoColor;",
      FRAGMENT_HELPERS,
      shader.fragmentShader,
    ]
      .join("\n")
      .replace(FRAGMENT_HOOK, FRAGMENT_INJECTION);
  };

  // O material precisa de emissao para que totalEmissiveRadiance seja usado.
  material.emissive.setRGB(0, 0, 0);
  material.needsUpdate = true;

  return {
    setFootprints(footprints) {
      const count = Math.min(footprints.length, MAX_CONTACTS);
      for (let i = 0; i < count; i += 1) {
        const print = footprints[i]!;
        areas[i]!.set(print.center.x, print.center.z, print.halfExtent.x, print.halfExtent.z);
        meta[i]!.set(print.seed, print.sparsity);
      }
      uniforms.uEchoCount.value = count;
    },
    setStrength(strength) {
      uniforms.uEchoStrength.value = strength;
    },
  };
}
