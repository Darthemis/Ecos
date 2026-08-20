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

/** O eco se estende mais no comprimento do contato do que nas laterais. */
const ECHO_LENGTH_REACH = 1.8;
const ECHO_SIDE_REACH = 0.7;
const ECHO_FADE = 0.65;

/**
 * Ondulacao do contorno, em metros. Desloca a distancia, nunca a intensidade, e
 * so dentro da faixa de transicao: o miolo do eco continua uniforme.
 */
const ECHO_EDGE_NOISE = 0.12;

/** Celulas de ruido por metro. Define o tamanho das ondulacoes da borda. */
const ECHO_NOISE_SCALE = 1.2;

/**
 * Cor do eco. Era (0.62, 0.66, 0.78) — azulada, e o azul aparecia como linhas
 * proprias junto aos objetos, uma faixa cromatica que o eco nao deveria criar.
 *
 * O cinza abaixo tem exatamente a luminancia daquela cor, pelos pesos Rec. 709
 * que o passe ASCII ja usa. Como o eco entra somando luz linear, preservar a
 * luminancia do vetor preserva a luminancia de cada pixel: muda o matiz, nao a
 * quantidade de luz. Intensidade, formato, alcance e ondulacao ficam intactos.
 *
 * (O cinza que igualaria a luminancia medida depois da curva de gama seria
 * 0.659621 — 0.14 de um nivel de 255 de diferenca, abaixo da quantizacao do
 * alvo. As duas definicoes concordam, entao nao ha escolha a fazer aqui.)
 */
const ECHO_LUMINANCE = 0.2126 * 0.62 + 0.7152 * 0.66 + 0.0722 * 0.78;
const ECHO_COLOR = new Vector3(ECHO_LUMINANCE, ECHO_LUMINANCE, ECHO_LUMINANCE);

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
// dependencia da tela: ao caminhar ou girar, a ondulacao continua pertencendo
// ao mesmo lugar do terreno.
float ecoHash( vec2 cell ) {
  return fract( sin( dot( cell, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
}

float ecoNoise( vec2 p ) {
  vec2 cell = floor( p );
  vec2 f = fract( p );
  f = f * f * ( 3.0 - 2.0 * f );
  float a = ecoHash( cell );
  float b = ecoHash( cell + vec2( 1.0, 0.0 ) );
  float c = ecoHash( cell + vec2( 0.0, 1.0 ) );
  float d = ecoHash( cell + vec2( 1.0, 1.0 ) );
  return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
}
`;

const FRAGMENT_INJECTION = /* glsl */ `
#include <emissivemap_fragment>

float eco = 0.0;

for ( int i = 0; i < ECHO_MAX_CONTACTS; i ++ ) {
  if ( i >= uEchoCount ) break;

  vec4 area = uEchoAreas[ i ];
  vec2 axis = uEchoAxes[ i ];
  vec2 side = vec2( -axis.y, axis.x );
  vec2 delta = vEchoWorld.xz - area.xy;
  vec2 local = vec2( dot( delta, axis ), dot( delta, side ) );

  // Capsula orientada pela base real: centro uniforme, pontas arredondadas e
  // extensao deliberadamente maior no comprimento do contato.
  float along = max( abs( local.x ) - ( area.z + uEchoLengthReach ), 0.0 );
  float capsule = length( vec2( along, local.y ) ) - ( area.w + uEchoSideReach );

  float fall = 1.0 - smoothstep( -uEchoFade, uEchoFade, capsule );

  // Ondulacao do contorno. O peso e definido pelo proprio eco, nao pela
  // distancia: e zero enquanto o eco tem corpo e zero de novo depois que ele
  // acabou, subindo so na faixa em que ja esta se apagando. Pesar por
  // abs( capsule ) nao serve: aquilo e zero apenas no nucleo saturado, e a
  // rampa de transicao, que a vista le como interior, ficava cheia de furos.
  // Desloca a distancia, nunca a intensidade: a forma ondula, a lei de queda
  // continua a mesma.
  // smoothstep com edge0 > edge1 e indefinido em GLSL: a queda vai por
  // 1.0 - smoothstep, que e bem definido em qualquer implementacao.
  float borda = smoothstep( 0.015, 0.05, fall ) * ( 1.0 - smoothstep( 0.05, 0.18, fall ) );
  capsule += uEchoEdgeNoise * borda * ( ecoNoise( vEchoWorld.xz * uEchoNoiseScale ) - 0.5 );
  fall = 1.0 - smoothstep( -uEchoFade, uEchoFade, capsule );

  // max, nunca soma: contatos sobrepostos nao aumentam a intensidade.
  eco = max( eco, fall );
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
  const axes = Array.from({ length: MAX_CONTACTS }, () => new Vector2(1, 0));

  const uniforms = {
    uEchoCount: { value: 0 },
    uEchoAreas: { value: areas },
    uEchoAxes: { value: axes },
    uEchoStrength: { value: 0 },
    uEchoLengthReach: { value: ECHO_LENGTH_REACH },
    uEchoSideReach: { value: ECHO_SIDE_REACH },
    uEchoFade: { value: ECHO_FADE },
    uEchoEdgeNoise: { value: ECHO_EDGE_NOISE },
    uEchoNoiseScale: { value: ECHO_NOISE_SCALE },
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
      `uniform vec2 uEchoAxes[${MAX_CONTACTS}];`,
      "uniform float uEchoStrength;",
      "uniform float uEchoLengthReach;",
      "uniform float uEchoSideReach;",
      "uniform float uEchoFade;",
      "uniform float uEchoEdgeNoise;",
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
        areas[i]!.set(print.center.x, print.center.z, print.halfLength, print.halfWidth);
        axes[i]!.set(print.axis.x, print.axis.z);
      }
      uniforms.uEchoCount.value = count;
    },
    setStrength(strength) {
      uniforms.uEchoStrength.value = strength;
    },
  };
}
