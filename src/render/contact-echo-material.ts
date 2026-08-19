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
      "uniform vec3 uEchoColor;",
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
