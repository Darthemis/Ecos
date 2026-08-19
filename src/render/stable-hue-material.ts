// Mantem o matiz do material sob iluminacao colorida.
//
// As luzes do mundo continuam controlando a luminancia — inclusive alcance,
// orientacao da face e oscilacao —, mas sua cor nao pinta a superficie. Assim
// uma ruina nao atravessa faixas ciano, azul e violeta conforme o jogador anda.

import type {
  MeshLambertMaterial,
  WebGLProgramParametersWithUniforms,
  WebGLRenderer,
} from "three";

const LIGHT_OUTPUT =
  "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;";

const STABLE_HUE_OUTPUT = /* glsl */ `
vec3 ecosLitDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
float ecosLitLuminance = dot(ecosLitDiffuse, vec3(0.2126, 0.7152, 0.0722));
float ecosMaterialPeak = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
vec3 ecosMaterialHue = ecosMaterialPeak > 0.000001
  ? diffuseColor.rgb / ecosMaterialPeak
  : vec3(0.0);
float ecosHueLuminance = dot(ecosMaterialHue, vec3(0.2126, 0.7152, 0.0722));
vec3 ecosStableDiffuse = ecosMaterialHue * ecosLitLuminance / max(ecosHueLuminance, 0.000001);
vec3 outgoingLight = ecosStableDiffuse + totalEmissiveRadiance;
`;

/** Faz luzes alterarem somente o brilho difuso, nunca o matiz do material. */
export function stabilizeLambertHue(material: MeshLambertMaterial): MeshLambertMaterial {
  const previousCompile = material.onBeforeCompile;
  const previousKey = previousCompile.toString();

  material.onBeforeCompile = (
    shader: WebGLProgramParametersWithUniforms,
    renderer: WebGLRenderer,
  ) => {
    previousCompile.call(material, shader, renderer);
    if (!shader.fragmentShader.includes(LIGHT_OUTPUT)) {
      throw new Error("Saida de luz Lambert nao encontrada");
    }
    shader.fragmentShader = shader.fragmentShader.replace(LIGHT_OUTPUT, STABLE_HUE_OUTPUT);
  };

  material.customProgramCacheKey = () => `${previousKey}|ecos-stable-lambert-hue-v1`;
  material.needsUpdate = true;
  return material;
}
