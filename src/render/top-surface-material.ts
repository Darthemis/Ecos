// Da existencia discreta as superficies quase horizontais dos volumes.
//
// O hemisferio do lugar tem ceu preto: face voltada para cima recebe o lado
// escuro e desaparece. Isso e a decisao da Fase 1.1 e vale para o terreno, mas
// atinge tambem o topo de muros, blocos e ruinas, que somem no preto.
//
// Este termo devolve so um piso minimo, e so onde a face aponta praticamente
// para cima. Nao e iluminacao: nao ha fonte, alcance nem sombra, e nenhuma
// outra superficie muda. Nao entra no material do terreno.
//
// O piso e aplicado ao **matiz** do material, nao a sua cor multiplicada: a cor
// da superficie e escura em linear, e multiplicar por ela deixaria o resultado
// abaixo de 1/255 no alvo de 8 bits — ou seja, invisivel. Normalizando, a
// magnitude e o piso declarado e o matiz continua sendo o do objeto.

import type {
  MeshLambertMaterial,
  WebGLProgramParametersWithUniforms,
  WebGLRenderer,
} from "three";

/** Piso de emissao no topo, em luz linear. Acima de 1/255, que e o minimo que os 8 bits guardam. */
const TOP_FLOOR = 0.006;

const VERTEX_HOOK = "#include <beginnormal_vertex>";
const VERTEX_INJECTION = /* glsl */ `
#include <beginnormal_vertex>
// Caixas sem escala nao uniforme: a matriz do modelo basta para levar a normal
// ao espaco do mundo.
vTopoNormal = normalize( mat3( modelMatrix ) * objectNormal );
`;

const FRAGMENT_HOOK = "#include <emissivemap_fragment>";
const FRAGMENT_INJECTION = /* glsl */ `
#include <emissivemap_fragment>

// Quase horizontal, e nada mais: uma face vertical da zero, e mesmo uma bem
// inclinada fica de fora.
float ecosParaCima = smoothstep( 0.80, 0.95, vTopoNormal.y );

float ecosTopoPico = max( diffuseColor.r, max( diffuseColor.g, diffuseColor.b ) );
vec3 ecosTopoMatiz = ecosTopoPico > 0.000001 ? diffuseColor.rgb / ecosTopoPico : vec3( 0.0 );

totalEmissiveRadiance += ecosTopoMatiz * ecosParaCima * uTopoPiso;
`;

/**
 * Liga o piso do topo a um material de volume. O terreno nao o recebe: o chao
 * vazio continua quase inteiramente preto.
 */
export function attachTopSurface(material: MeshLambertMaterial): MeshLambertMaterial {
  const previousCompile = material.onBeforeCompile;

  material.onBeforeCompile = (
    shader: WebGLProgramParametersWithUniforms,
    renderer: WebGLRenderer,
  ) => {
    previousCompile.call(material, shader, renderer);
    shader.uniforms.uTopoPiso = { value: TOP_FLOOR };

    if (!shader.vertexShader.includes(VERTEX_HOOK)) {
      throw new Error("Ponto de injecao da normal nao encontrado");
    }
    if (!shader.fragmentShader.includes(FRAGMENT_HOOK)) {
      throw new Error("Ponto de injecao da emissao nao encontrado");
    }

    shader.vertexShader = `varying vec3 vTopoNormal;\n${shader.vertexShader}`.replace(
      VERTEX_HOOK,
      VERTEX_INJECTION,
    );
    shader.fragmentShader = [
      "varying vec3 vTopoNormal;",
      "uniform float uTopoPiso;",
      shader.fragmentShader,
    ]
      .join("\n")
      .replace(FRAGMENT_HOOK, FRAGMENT_INJECTION);
  };

  // O material precisa de emissao para que totalEmissiveRadiance seja usado.
  material.emissive.setRGB(0, 0, 0);
  material.needsUpdate = true;
  return material;
}
