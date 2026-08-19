// Converte a cena renderizada em baixa resolucao para glifos coloridos sobre
// preto. Um quad de tela inteira e um shader; um texel da cena e uma celula.
//
// Desde a Fase 2.1A o passe le tambem o mapa estrutural — silhueta, degrau,
// encontro de planos e canto —, calculado a parte na resolucao da grade. Ele
// apenas aumenta a densidade do glifo. A cor continua sendo a do objeto: o
// reforco nao acende nada, nao inventa matiz e nao existe fora do alcance
// perceptivo.

import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  type Texture,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from "three";
import { createGlyphAtlas, GLYPH_CELL_HEIGHT, GLYPH_CELL_WIDTH } from "./glyph-atlas";
import { structureDefines, type StructureSource } from "./structural-legibility";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uScene;
  uniform sampler2D uStructureMap;
  uniform sampler2D uGlyphs;
  uniform vec2 uGrid;
  uniform float uGlyphCount;
  uniform float uStructure;
  uniform float uMaskOnly;
  uniform float uSource;

  varying vec2 vUv;

${structureDefines()}

  void main() {
    vec2 cell = floor(vUv * uGrid);
    vec2 inCell = fract(vUv * uGrid);
    vec2 sceneUv = (cell + 0.5) / uGrid;

    // O alvo de renderizacao guarda luz linear. A densidade do glifo precisa
    // seguir o brilho percebido, entao a amostra e convertida para sRGB antes
    // de virar luminancia.
    vec3 linear = max(texture2D(uScene, sceneUv).rgb, 0.0);
    vec3 src = pow(linear, vec3(1.0 / 2.2));
    float lum = dot(src, vec3(0.2126, 0.7152, 0.0722));

    // Espalha a faixa baixa: o mundo e escuro e a leitura acontece ali.
    float shaped = clamp(pow(lum, 0.75) * 1.35, 0.0, 1.0);

    // ── Reforco estrutural ────────────────────────────────────────────────
    // Uma leitura so: o sinal ja veio calculado por celula, com o alcance
    // aplicado. r = tudo, g = so silhueta e degrau, b = so vinco e canto.
    vec3 mapa = texture2D(uStructureMap, sceneUv).rgb * EST_TETO;
    float escolhido = uSource < 0.5 ? mapa.r : (uSource < 1.5 ? mapa.g : mapa.b);
    float estrutura = escolhido * uStructure;

    // Mistura por complemento: celula clara quase nao muda — nada de halo —, e
    // celula quase preta sobe o bastante para existir.
    shaped = min(1.0, shaped + estrutura * (1.0 - shaped));

    float index = floor(min(shaped * uGlyphCount, uGlyphCount - 1.0));
    vec2 glyphUv = vec2((index + inCell.x) / uGlyphCount, 1.0 - inCell.y);
    float mask = texture2D(uGlyphs, glyphUv).a;

    // A densidade do glifo ja carrega a luminancia. A cor mantem o matiz
    // legivel em vez de escurecer junto, para que materia e distancia sejam
    // distinguiveis por dois canais e nao apenas por brilho.
    float peak = max(src.r, max(src.g, src.b));
    vec3 hue = peak > 0.001 ? src / peak : vec3(0.0);
    vec3 color = hue * mix(0.45, 1.0, shaped);

    if (uMaskOnly > 0.5) {
      // Diagnostico: so o sinal detectado, sem a cena por baixo.
      float ind = floor(min(escolhido / EST_TETO * uGlyphCount, uGlyphCount - 1.0));
      vec2 uvm = vec2((ind + inCell.x) / uGlyphCount, 1.0 - inCell.y);
      float m = texture2D(uGlyphs, uvm).a;
      gl_FragColor = vec4(vec3(0.55, 0.78, 1.0) * m, 1.0);
      return;
    }

    gl_FragColor = vec4(color * mask, 1.0);
  }
`;

export type AsciiPass = {
  render: (renderer: WebGLRenderer, source: WebGLRenderTarget, structureMap: Texture) => void;
  /** Celula em pixels do dispositivo: o atlas e refeito quando ela muda. */
  setGrid: (columns: number, rows: number, cellWidth: number, cellHeight: number) => void;
  setStructureEnabled: (enabled: boolean) => void;
  /** Diagnostico: mostra so a mascara estrutural. */
  setStructureMask: (enabled: boolean) => void;
  /** Diagnostico: isola uma parte do sinal. */
  setStructureSource: (source: StructureSource) => void;
  dispose: () => void;
};

const SOURCE_CODE: Record<StructureSource, number> = { todas: 0, silhueta: 1, vinco: 2 };

export function createAsciiPass(): AsciiPass {
  let atlas = createGlyphAtlas(GLYPH_CELL_WIDTH, GLYPH_CELL_HEIGHT);

  const material = new ShaderMaterial({
    uniforms: {
      uScene: { value: null as Texture | null },
      uStructureMap: { value: null as Texture | null },
      uGlyphs: { value: atlas.texture },
      uGrid: { value: new Vector2(1, 1) },
      uGlyphCount: { value: atlas.glyphCount },
      uStructure: { value: 1 },
      uMaskOnly: { value: 0 },
      uSource: { value: 0 },
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

  return {
    render(renderer, source, structureMap) {
      material.uniforms.uScene!.value = source.texture;
      material.uniforms.uStructureMap!.value = structureMap;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    },
    setGrid(columns, rows, cellWidth, cellHeight) {
      (material.uniforms.uGrid!.value as Vector2).set(columns, rows);

      if (atlas.cellWidth === cellWidth && atlas.cellHeight === cellHeight) return;
      atlas.texture.dispose();
      atlas = createGlyphAtlas(cellWidth, cellHeight);
      material.uniforms.uGlyphs!.value = atlas.texture;
      material.uniforms.uGlyphCount!.value = atlas.glyphCount;
    },
    setStructureEnabled(enabled) {
      material.uniforms.uStructure!.value = enabled ? 1 : 0;
    },
    setStructureMask(enabled) {
      material.uniforms.uMaskOnly!.value = enabled ? 1 : 0;
    },
    setStructureSource(source) {
      material.uniforms.uSource!.value = SOURCE_CODE[source];
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      atlas.texture.dispose();
    },
  };
}
