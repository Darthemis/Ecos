// Passe da legibilidade estrutural, na resolucao da grade.
//
// O reforco depende apenas da celula, nunca do pixel dentro dela. Calcula-lo no
// passe ASCII significava repetir a mesma conta 8 x 14 vezes por celula — cerca
// de 3,7 milhoes de leituras de profundidade por quadro, contra 40 mil aqui.
// Este passe roda uma vez por celula (160 x 51) e guarda o resultado num alvo do
// tamanho exato da grade; o passe ASCII faz uma leitura so.
//
// Nao e um G-buffer e nao acrescenta desenho da cena: e um quad de tela inteira
// sobre um alvo minusculo, lendo a profundidade que a cena ja produziu.

import {
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from "three";
import { structureDefines } from "./structural-legibility";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uDepth;
  uniform vec2 uGrid;
  uniform float uNear;
  uniform float uFar;
  uniform float uFogNear;
  uniform float uFogFar;

  varying vec2 vUv;

${structureDefines()}

  const float EST_EPS = 1e-6;

  float profundidade(vec2 cell) {
    // Fixa nas bordas: uma vizinha fora da grade vira a propria celula, a
    // diferenca da zero e nenhuma linha aparece presa a beirada da tela.
    vec2 fixa = clamp(cell, vec2(0.0), uGrid - 1.0);
    float bruta = texture2D(uDepth, (fixa + 0.5) / uGrid).x;
    float ndc = 2.0 * bruta - 1.0;
    float metros = (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
    return 1.0 / max(EST_EPS, metros);
  }

  void main() {
    vec2 cell = floor(vUv * uGrid);

    // Segunda diferenca normalizada do inverso da profundidade. Sobre um plano,
    // por mais de raspao que esteja, o inverso e afim na tela: resposta zero.
    float inv0 = profundidade(cell);
    float invE = profundidade(cell + vec2(-1.0, 0.0));
    float invD = profundidade(cell + vec2( 1.0, 0.0));
    float invC = profundidade(cell + vec2( 0.0, 1.0));
    float invB = profundidade(cell + vec2( 0.0, -1.0));

    float base = max(EST_EPS, inv0);
    float qx = (2.0 * inv0 - invE - invD) / base;
    float qy = (2.0 * inv0 - invC - invB) / base;

    float qFrente = max(qx, qy);
    float qAbs = max(abs(qx), abs(qy));
    float assimetria = max(abs(invE - invD), abs(invC - invB)) / base;

    float silhueta = smoothstep(EST_SILHUETAMIN, EST_SILHUETAMAX, qFrente);
    float descontinuidade = smoothstep(EST_DEGRAUMIN, EST_DEGRAUMAX, qFrente) * (1.0 - silhueta);
    float ehDegrau = smoothstep(EST_ASSIMETRIAMIN, EST_ASSIMETRIAMAX, assimetria);
    float vinco = smoothstep(EST_VINCOMIN, EST_VINCOMAX, qAbs) * (1.0 - ehDegrau) * (1.0 - silhueta);
    float canto = smoothstep(EST_CANTOMIN, EST_CANTOMAX, min(abs(qx), abs(qy)));

    float total = min(EST_TETO,
      EST_PESOSILHUETA * silhueta +
      EST_PESODESCONTINUIDADE * descontinuidade +
      EST_PESOVINCO * vinco +
      EST_PESOCANTO * canto);
    float soSilhueta = min(EST_TETO,
      EST_PESOSILHUETA * silhueta + EST_PESODESCONTINUIDADE * descontinuidade);
    float soVinco = min(EST_TETO, EST_PESOVINCO * vinco + EST_PESOCANTO * canto);

    // A mesma nevoa que ja escurece o mundo governa o alcance: objeto fora do
    // alcance perceptivo nao e revelado.
    float metros = 1.0 / base;
    float visivel = clamp((uFogFar - metros) / max(EST_EPS, uFogFar - uFogNear), 0.0, 1.0);

    // Guardado dividido pelo teto para usar a faixa inteira dos 8 bits.
    gl_FragColor = vec4(
      total * visivel / EST_TETO,
      soSilhueta * visivel / EST_TETO,
      soVinco * visivel / EST_TETO,
      1.0);
  }
`;

export type StructurePass = {
  /** Textura com os tres sinais por celula, ja limitados pelo alcance. */
  texture: () => Texture;
  setGrid: (columns: number, rows: number) => void;
  setDepthRange: (near: number, far: number, fogNear: number, fogFar: number) => void;
  render: (renderer: WebGLRenderer, depth: Texture) => void;
  dispose: () => void;
};

export function createStructurePass(): StructurePass {
  const material = new ShaderMaterial({
    uniforms: {
      uDepth: { value: null as Texture | null },
      uGrid: { value: new Vector2(1, 1) },
      uNear: { value: 0.1 },
      uFar: { value: 220 },
      uFogNear: { value: 3 },
      uFogFar: { value: 15 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
  });

  const geometry = new PlaneGeometry(2, 2);
  const quad = new Mesh(geometry, material);
  quad.frustumCulled = false;
  const scene = new Scene();
  scene.add(quad);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let target = new WebGLRenderTarget(2, 2, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });

  return {
    texture: () => target.texture,
    setGrid(columns, rows) {
      (material.uniforms.uGrid!.value as Vector2).set(columns, rows);
      target.dispose();
      target = new WebGLRenderTarget(columns, rows, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        depthBuffer: false,
        stencilBuffer: false,
      });
    },
    setDepthRange(near, far, fogNear, fogFar) {
      material.uniforms.uNear!.value = near;
      material.uniforms.uFar!.value = far;
      material.uniforms.uFogNear!.value = fogNear;
      material.uniforms.uFogFar!.value = fogFar;
    },
    render(renderer, depth) {
      material.uniforms.uDepth!.value = depth;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      target.dispose();
    },
  };
}
