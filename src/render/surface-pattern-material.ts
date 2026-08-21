// Padrao de superficie por familia de material. Sem cor: so densidade.
//
// A familia vem de `SurfaceMaterialId`, nao do tipo do objeto: e o registro puro
// em world/surface-material.ts que decide o que uma pedra e, e dois tipos
// diferentes podem compartilhar a mesma. Deste modulo saem os dois efeitos
// visiveis da familia — o padrao do ruido e, pelo alfa, a tabela de glifos com
// que o passe ASCII desenha aquela superficie.
//
// O fator e escalar e igual nos tres canais, entao o matiz nao muda: as
// superficies continuam neutras. E e sempre <= 1, entao o padrao so escurece —
// nada acende e a exposicao da cena nao sobe.
//
// O ruido e ancorado no espaco do mundo, sem termo de tempo: a escala fica em
// metros e o padrao pertence ao lugar, nao a tela. Textura nao serviria, porque
// UV de caixa vai de 0 a 1 por face e o padrao esticaria diferente em cada
// bloco.

import type {
  MeshLambertMaterial,
  WebGLProgramParametersWithUniforms,
  WebGLRenderer,
} from "three";
import {
  alphaForMaterialIndex,
  SURFACE_MATERIALS,
  surfaceMaterialIndex,
  type SurfaceMaterialId,
} from "../world/surface-material";

export type PatternHandle = {
  setEnabled: (enabled: boolean) => void;
};

const VERTEX_HOOK = "#include <begin_vertex>";
const VERTEX_INJECTION = /* glsl */ `
#include <begin_vertex>
vPadraoMundo = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
`;

const FRAGMENT_HOOK = "#include <color_fragment>";

// Copia local do ruido de valor. O Eco de Contato tem uma igual e nao foi
// tocado nesta etapa; unificar as duas fica registrado como divida.
const FRAGMENT_HELPERS = /* glsl */ `
float padraoHash( vec3 cell ) {
  return fract( sin( dot( cell, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453 );
}

float padraoNoise( vec3 p ) {
  vec3 cell = floor( p );
  vec3 f = fract( p );
  f = f * f * ( 3.0 - 2.0 * f );
  float a = mix( padraoHash( cell + vec3( 0.0, 0.0, 0.0 ) ), padraoHash( cell + vec3( 1.0, 0.0, 0.0 ) ), f.x );
  float b = mix( padraoHash( cell + vec3( 0.0, 1.0, 0.0 ) ), padraoHash( cell + vec3( 1.0, 1.0, 0.0 ) ), f.x );
  float c = mix( padraoHash( cell + vec3( 0.0, 0.0, 1.0 ) ), padraoHash( cell + vec3( 1.0, 0.0, 1.0 ) ), f.x );
  float d = mix( padraoHash( cell + vec3( 0.0, 1.0, 1.0 ) ), padraoHash( cell + vec3( 1.0, 1.0, 1.0 ) ), f.x );
  return mix( mix( a, b, f.y ), mix( c, d, f.y ), f.z );
}
`;

const FRAGMENT_INJECTION = /* glsl */ `
#include <color_fragment>

float ecosPadrao = padraoNoise( vPadraoMundo * uPadraoEscala );
// Sempre <= 1: o padrao escurece, nunca acende.
float ecosFator = mix( 1.0 - uPadraoContraste, 1.0, ecosPadrao );
diffuseColor.rgb *= mix( 1.0, ecosFator, uPadraoLigado );
`;

const ALPHA_HOOK = "#include <opaque_fragment>";

// A familia do material viaja ate o passe ASCII pelo alfa, que nada mais usa:
// nenhum material da cena e transparente, entao a mistura esta desligada e o
// valor chega intacto ao alvo.
//
// A escrita tem de vir depois de <opaque_fragment>, e nao junto com a cor: como
// o material e opaco, o Three define OPAQUE e aquele trecho faz
// `diffuseColor.a = 1.0` — um alfa escrito antes seria descartado em silencio.
// O que vem depois (tonemapping, espaco de cor, neblina) so mexe em rgb.
//
// Desligar o padrao devolve a superficie a familia base, e com ela a tabela de
// glifos global: o diagnostico da tecla P volta ao estado anterior por inteiro,
// nao pela metade.
const ALPHA_INJECTION = /* glsl */ `
#include <opaque_fragment>
gl_FragColor.a = mix( 1.0, uPadraoAlfa, uPadraoLigado );
`;

/**
 * Liga o padrao e a tabela de glifos de uma familia a um material de volume. O
 * terreno, as rampas e os patamares nao o recebem: continuam na familia base,
 * que e o que o alvo da cena ja produz sem que ninguem escreva nada.
 */
export function attachSurfacePattern(
  material: MeshLambertMaterial,
  id: SurfaceMaterialId,
): PatternHandle {
  const { escala, contraste } = SURFACE_MATERIALS[id];
  const uniforms = {
    uPadraoEscala: { value: escala },
    uPadraoContraste: { value: contraste },
    uPadraoAlfa: { value: alphaForMaterialIndex(surfaceMaterialIndex(id)) },
    uPadraoLigado: { value: 1 },
  };

  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey.bind(material);

  material.onBeforeCompile = (
    shader: WebGLProgramParametersWithUniforms,
    renderer: WebGLRenderer,
  ) => {
    previousCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);

    if (!shader.vertexShader.includes(VERTEX_HOOK)) {
      throw new Error("Ponto de injecao da posicao nao encontrado");
    }
    if (!shader.fragmentShader.includes(FRAGMENT_HOOK)) {
      throw new Error("Ponto de injecao da cor difusa nao encontrado");
    }
    if (!shader.fragmentShader.includes(ALPHA_HOOK)) {
      throw new Error("Ponto de injecao do alfa nao encontrado");
    }

    shader.vertexShader = `varying vec3 vPadraoMundo;\n${shader.vertexShader}`.replace(
      VERTEX_HOOK,
      VERTEX_INJECTION,
    );
    shader.fragmentShader = [
      "varying vec3 vPadraoMundo;",
      "uniform float uPadraoEscala;",
      "uniform float uPadraoContraste;",
      "uniform float uPadraoAlfa;",
      "uniform float uPadraoLigado;",
      FRAGMENT_HELPERS,
      shader.fragmentShader,
    ]
      .join("\n")
      .replace(FRAGMENT_HOOK, FRAGMENT_INJECTION)
      .replace(ALPHA_HOOK, ALPHA_INJECTION);
  };

  // Identidade propria na chave de programa. Sem isto, o padrao nao chega ao
  // ecra — e nao chegava.
  //
  // O Three partilha programas ja compilados entre materiais cuja chave coincide
  // (WebGLPrograms.acquireProgram, mapa global por chave). A chave por omissao e
  // o texto de `onBeforeCompile`, e dois fechos com o mesmo codigo-fonte dao o
  // mesmo texto — mesmo quando um deles injetou este padrao e o outro nao.
  //
  // Rampas e patamares sao criados antes dos obstaculos em scene-view.ts e usam
  // a mesma cadeia menos este modulo. A chave saia igual, o programa da rampa —
  // sem padrao e sem escrita de alfa — era compilado primeiro, e todos os
  // obstaculos passavam a usa-lo. As uniformes continuavam a ser atribuidas por
  // material, mas para uniformes que aquele programa nao tinha: silencio total.
  //
  // O sintoma era exatamente nenhum: nem o padrao nem a familia produziam um
  // unico pixel de diferenca. So apareceu quando a captura determinista baixou o
  // ruido de medicao a zero.
  material.customProgramCacheKey = () => `${previousKey()}|ecos-surface-pattern-v1`;
  material.needsUpdate = true;

  return {
    setEnabled(enabled) {
      uniforms.uPadraoLigado.value = enabled ? 1 : 0;
    },
  };
}
