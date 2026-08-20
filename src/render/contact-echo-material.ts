// Aplica o Eco de Contato ao material do terreno.
//
// O termo entra como emissao do proprio chao, antes da nevoa: some com a
// distancia junto com todo o resto e respeita os alcances de 8, 15 e 25 metros
// sem conhece-los. Como e o terreno que se sombreia, qualquer barreira entre a
// camera e aquele chao o esconde pelo teste de profundidade — nada e revelado
// atraves de paredes ou relevos.

import type { MeshLambertMaterial, WebGLProgramParametersWithUniforms } from "three";
import { Vector2, Vector3, Vector4 } from "three";
import { contactReach, MAX_CONTACTS, type ContactFootprint } from "../world/contact-echo";

/**
 * Largura da borda suave, em metros. Fica constante de proposito: o alcance do
 * eco passou a depender do tamanho do contato, mas a suavidade da borda e uma
 * constante perceptiva, nao uma proporcao do objeto.
 */
const ECHO_FADE = 0.65;

/**
 * Grao do contorno, em metros. Desloca a distancia, nunca a intensidade.
 *
 * Substitui a ondulacao de borda de 0,12 m, que atuava numa faixa estreita
 * demais para disfarcar a curva por baixo. Baixar este numero devolve o eco a um
 * limite mais definido; zero devolve o contorno limpo da caixa arredondada.
 */
const ECHO_GRAIN = 0.45;

/** Raio maximo de canto, em metros. Prende o arredondamento em bases grandes. */
const ECHO_CORNER_MAX = 0.9;

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
  vec2 reach = uEchoReach[ i ];
  vec2 side = vec2( -axis.y, axis.x );
  vec2 delta = vEchoWorld.xz - area.xy;
  vec2 local = vec2( dot( delta, axis ), dot( delta, side ) );

  // Caixa arredondada, e nao capsula. A capsula punha o alcance so no eixo
  // comprido e fechava as pontas com um arco circular exato: uma forma esticada
  // para um lado, com uma curvatura que a vista reconhece de imediato. A caixa
  // segue o retangulo da base nos dois eixos, e o raio de canto e pequeno face a
  // ela — o eco fica com a forma do objeto, nao com uma forma propria.
  vec2 meia = vec2( area.z + reach.x, area.w + reach.y );
  float raio = min( min( meia.x, meia.y ) * 0.45, uEchoCornerMax );
  vec2 q = abs( local ) - meia + raio;
  float dist = length( max( q, vec2( 0.0 ) ) ) + min( max( q.x, q.y ), 0.0 ) - raio;

  // Grao. A referencia nao tem contorno: tem densidade que rareia com a
  // distancia. Duas oitavas desfazem o limite em vez de o ondular, e a amplitude
  // sobe de zero dentro da base ate ao maximo na borda — o nucleo junto ao
  // objeto continua solido, e o que se dissolve e o fim.
  //
  // Continua a deslocar a distancia, nunca a intensidade: a lei de queda e a
  // mesma, o que muda e onde ela cruza o limiar.
  //
  // smoothstep com edge0 > edge1 e indefinido em GLSL: a queda vai por
  // 1.0 - smoothstep, que e bem definido em qualquer implementacao.
  float fora = smoothstep( -uEchoFade * 2.0, uEchoFade, dist );
  float grao = ecoNoise( vEchoWorld.xz * uEchoNoiseScale ) * 0.6
             + ecoNoise( vEchoWorld.xz * uEchoNoiseScale * 2.7 ) * 0.4;
  dist += uEchoGrain * fora * ( grao - 0.5 );

  float fall = 1.0 - smoothstep( -uEchoFade, uEchoFade, dist );

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
  // Alcance por contato: o tamanho do eco passa a depender do objeto que o gera.
  const reaches = Array.from({ length: MAX_CONTACTS }, () => new Vector2(0, 0));

  const uniforms = {
    uEchoCount: { value: 0 },
    uEchoAreas: { value: areas },
    uEchoAxes: { value: axes },
    uEchoStrength: { value: 0 },
    uEchoReach: { value: reaches },
    uEchoFade: { value: ECHO_FADE },
    uEchoGrain: { value: ECHO_GRAIN },
    uEchoCornerMax: { value: ECHO_CORNER_MAX },
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
      `uniform vec2 uEchoReach[${MAX_CONTACTS}];`,
      "uniform float uEchoFade;",
      "uniform float uEchoGrain;",
      "uniform float uEchoCornerMax;",
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
        const reach = contactReach(print);
        reaches[i]!.set(reach.length, reach.width);
      }
      uniforms.uEchoCount.value = count;
    },
    setStrength(strength) {
      uniforms.uEchoStrength.value = strength;
    },
  };
}
