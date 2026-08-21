import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  alphaForMaterialIndex,
  BASE_MATERIAL_ID,
  MATERIAL_BY_KIND,
  materialForObstacle,
  materialIndexFromAlpha,
  SURFACE_MATERIAL_ORDER,
  SURFACE_MATERIALS,
  surfaceMaterialIndex,
  type SurfaceMaterialId,
} from "../src/world/surface-material";
import { GLYPH_RAMP, GLYPH_TABLES } from "../src/render/glyph-atlas";
import { attachSurfacePattern } from "../src/render/surface-pattern-material";
import { attachTopSurface } from "../src/render/top-surface-material";
import { stabilizeLambertHue } from "../src/render/stable-hue-material";
import {
  MeshLambertMaterial,
  NormalBlending,
  ShaderChunk,
  ShaderLib,
  type WebGLProgramParametersWithUniforms,
  type WebGLRenderer,
} from "three";

const ASCII_PASS = readFileSync("src/render/ascii-pass.ts", "utf8");
const PADRAO = readFileSync("src/render/surface-pattern-material.ts", "utf8");
const TOPO = readFileSync("src/render/top-surface-material.ts", "utf8");

describe("registro de materiais", () => {
  it("a familia base e a primeira e vale zero", () => {
    expect(SURFACE_MATERIAL_ORDER[0]).toBe("base");
    expect(surfaceMaterialIndex("base")).toBe(BASE_MATERIAL_ID);
    expect(BASE_MATERIAL_ID).toBe(0);
  });

  it("a base nao tem padrao: quem nao declarou material fica liso", () => {
    expect(SURFACE_MATERIALS.base.contraste).toBe(0);
  });

  it("material e tipo sao coisas separadas", () => {
    // O tipo continua decidindo o material de fabrica...
    expect(materialForObstacle({ kind: "ruin" })).toBe(MATERIAL_BY_KIND.ruin);
    // ...mas nao e mais a mesma decisao: o objeto pode declarar outro.
    expect(materialForObstacle({ kind: "ruin", material: "monolith" })).toBe("monolith");
  });

  it("uma familia desconhecida cai na base em vez de sumir", () => {
    expect(surfaceMaterialIndex("inexistente" as never)).toBe(BASE_MATERIAL_ID);
  });
});

describe("familia codificada no alfa", () => {
  it("a base vale alfa 1, que e o que o limpo ja produz", () => {
    expect(alphaForMaterialIndex(BASE_MATERIAL_ID)).toBe(1);
  });

  it("sobrevive a quantizacao de 8 bits, para toda familia", () => {
    for (let indice = 0; indice < SURFACE_MATERIAL_ORDER.length; indice += 1) {
      const alfa = alphaForMaterialIndex(indice);
      // O alvo da cena guarda 8 bits: e este valor que o shader le de volta.
      const quantizado = Math.round(alfa * 255) / 255;
      expect(materialIndexFromAlpha(quantizado)).toBe(indice);
    }
  });

  it("o alfa desce conforme o indice sobe", () => {
    expect(alphaForMaterialIndex(1)).toBeLessThan(alphaForMaterialIndex(0));
    expect(alphaForMaterialIndex(2)).toBeLessThan(alphaForMaterialIndex(1));
  });
});

describe("tabelas de glifos", () => {
  it("ha uma tabela por familia, na ordem canonica", () => {
    expect(GLYPH_TABLES).toHaveLength(SURFACE_MATERIAL_ORDER.length);
  });

  it("a linha zero e a rampa global, sem nenhuma mudanca", () => {
    expect(GLYPH_TABLES[0]).toBe(GLYPH_RAMP);
    expect(GLYPH_RAMP).toBe(" .:-=+*#%@");
  });

  it("todas tem o mesmo comprimento: o indice de densidade nao conhece familia", () => {
    for (const tabela of GLYPH_TABLES) {
      expect(tabela.length).toBe(GLYPH_RAMP.length);
    }
  });

  it("cada familia tem uma tabela propria", () => {
    expect(new Set(GLYPH_TABLES).size).toBe(GLYPH_TABLES.length);
  });

  it("toda tabela comeca vazia e termina densa", () => {
    for (const tabela of GLYPH_TABLES) {
      expect(tabela[0]).toBe(" ");
      expect(tabela[tabela.length - 1]).not.toBe(" ");
    }
  });
});

describe("passe ASCII", () => {
  it("recupera a familia pela formula acordada", () => {
    expect(ASCII_PASS).toContain("floor((1.0 - cena.a) * 255.0 + 0.5)");
  });

  it("prende a familia dentro das linhas que o atlas tem", () => {
    expect(ASCII_PASS).toContain("clamp(floor((1.0 - cena.a) * 255.0 + 0.5), 0.0, uGlyphRows - 1.0)");
  });

  it("escolhe a linha do atlas pela familia", () => {
    expect(ASCII_PASS).toContain("(familia + 1.0 - inCell.y) / uGlyphRows");
  });

  it("com uma linha so, a coordenada volta a ser a antiga", () => {
    // (f + 1 - y) / linhas, com f = 0 e linhas = 1, e exatamente 1 - y.
    const linha = (familia: number, y: number, linhas: number) => (familia + 1 - y) / linhas;
    for (const y of [0, 0.25, 0.5, 1]) {
      expect(linha(0, y, 1)).toBeCloseTo(1 - y, 12);
    }
  });

  it("a mascara estrutural nao e materia: continua na linha base", () => {
    expect(ASCII_PASS).toContain("(1.0 - inCell.y) / uGlyphRows");
  });
});

describe("o que esta etapa nao pode ter mexido", () => {
  it("o padrao continua sem cor: fator escalar nos tres canais", () => {
    expect(PADRAO).toContain("diffuseColor.rgb *= mix( 1.0, ecosFator, uPadraoLigado );");
  });

  it("desligar o padrao devolve a superficie a familia base", () => {
    expect(PADRAO).toContain("gl_FragColor.a = mix( 1.0, uPadraoAlfa, uPadraoLigado );");
  });

  it("a visibilidade dos topos de 7191ebc continua intacta", () => {
    expect(TOPO).toContain("smoothstep( 0.80, 0.95, vTopoNormal.y )");
    expect(TOPO).toContain("totalEmissiveRadiance += ecosTopoMatiz * ecosParaCima * uTopoPiso;");
  });

  it("o topo nao escreve alfa: a familia e so do material da superficie", () => {
    expect(TOPO).not.toContain("diffuseColor.a");
    expect(TOPO).not.toContain("gl_FragColor.a");
  });
});

// O alfa so chega ao alvo se for escrito depois de <opaque_fragment>: para um
// material opaco o Three define OPAQUE e aquele trecho faz `diffuseColor.a = 1.0`.
// Este bloco monta o shader real da versao instalada e prova a ordem, em vez de
// confiar na leitura do codigo.
describe("o alfa da familia sobrevive ao shader real do Three", () => {
  function resolverIncludes(fonte: string, profundidade = 0): string {
    if (profundidade > 8) return fonte;
    return resolverIncludes(
      fonte.replace(/^[ \t]*#include +<([\w\d./]+)>/gm, (linha, nome: string) => {
        const trecho = (ShaderChunk as Record<string, string>)[nome];
        return trecho === undefined ? linha : trecho;
      }),
      profundidade + 1,
    );
  }

  function montar(): string {
    const material = new MeshLambertMaterial({ color: 0xffffff });
    attachSurfacePattern(material, "rock");
    const shader = {
      uniforms: {},
      vertexShader: ShaderLib.lambert.vertexShader,
      fragmentShader: ShaderLib.lambert.fragmentShader,
    } as unknown as WebGLProgramParametersWithUniforms;
    material.onBeforeCompile(shader, {} as WebGLRenderer);
    return resolverIncludes(shader.fragmentShader);
  }

  it("o material e opaco, que e a condicao que zera o alfa", () => {
    const material = new MeshLambertMaterial({ color: 0xffffff });
    expect(material.transparent).toBe(false);
    expect(material.blending).toBe(NormalBlending);
    expect(material.alphaToCoverage).toBe(false);
  });

  it("o Three de fato zera o alfa no caminho opaco", () => {
    expect(ShaderChunk.opaque_fragment).toContain("diffuseColor.a = 1.0;");
  });

  it("a escrita da familia vem depois desse zeramento", () => {
    const fonte = montar();
    const zeramento = fonte.indexOf("diffuseColor.a = 1.0;");
    const escrita = fonte.indexOf("gl_FragColor.a = mix( 1.0, uPadraoAlfa");
    expect(zeramento).toBeGreaterThan(-1);
    expect(escrita).toBeGreaterThan(-1);
    expect(escrita).toBeGreaterThan(zeramento);
  });

  it("nada depois dela escreve o alfa de novo", () => {
    const fonte = montar();
    const escrita = fonte.indexOf("gl_FragColor.a = mix( 1.0, uPadraoAlfa");
    const resto = fonte.slice(escrita + 1);
    expect(resto).not.toMatch(/gl_FragColor\.a\s*=/);
  });

  it("a unica atribuicao inteira posterior e a de espaco de cor", () => {
    const fonte = montar();
    const escrita = fonte.indexOf("gl_FragColor.a = mix( 1.0, uPadraoAlfa");
    const resto = fonte.slice(escrita + 1);
    const inteiras = resto.match(/gl_FragColor\s*=[^;]*;/g) ?? [];
    expect(inteiras).toEqual(["gl_FragColor = linearToOutputTexel( gl_FragColor );"]);
  });

  it("e essa atribuicao preserva o alfa nas duas transferencias possiveis", () => {
    // O corpo de linearToOutputTexel e gerado pelo WebGLProgram como
    // `OETF( vec4( value.rgb * matriz, value.a ) )`: o alfa entra intacto. Resta
    // provar que nenhuma das duas OETF o altera.
    const pars = ShaderChunk.colorspace_pars_fragment;
    expect(pars).toContain("vec4 LinearTransferOETF( in vec4 value ) {\n\treturn value;\n}");
    const srgb = /vec4 sRGBTransferOETF\( in vec4 value \) \{\n\treturn ([^;]*);/.exec(pars);
    expect(srgb?.[1]).toContain("value.a");
    expect(srgb?.[1]).toMatch(/,\s*value\.a\s*\)$/);
  });

  it("a cor difusa continua sendo modulada antes da iluminacao", () => {
    const fonte = montar();
    const padrao = fonte.indexOf("diffuseColor.rgb *= mix( 1.0, ecosFator, uPadraoLigado );");
    const luz = fonte.indexOf("vec3 outgoingLight");
    expect(padrao).toBeGreaterThan(-1);
    expect(luz).toBeGreaterThan(padrao);
  });
});

// O defeito que a captura determinista expos, e que nenhum teste apanhava.
//
// O Three partilha programas ja compilados entre materiais cuja chave de
// programa coincide. A chave por omissao e o texto de `onBeforeCompile`, e dois
// fechos com o mesmo codigo-fonte dao o mesmo texto. Rampas e patamares usavam a
// mesma cadeia menos o padrao, eram criados primeiro, e o programa deles — sem
// padrao e sem escrita de alfa — passava a servir todos os obstaculos.
//
// Nenhuma asercao sobre o texto do shader podia apanhar isto: o shader estava
// certo e nunca chegava a ser compilado. O que fixa a correcao e a chave.
describe("a chave de programa distingue quem injetou o padrao", () => {
  const rampa = () => stabilizeLambertHue(attachTopSurface(new MeshLambertMaterial({ color: 0xffffff })));
  const obstaculo = (id: SurfaceMaterialId = "rock") => {
    const material = new MeshLambertMaterial({ color: 0xffffff });
    attachSurfacePattern(material, id);
    return stabilizeLambertHue(attachTopSurface(material));
  };

  it("uma rampa e um obstaculo nao partilham programa", () => {
    expect(obstaculo().customProgramCacheKey()).not.toBe(rampa().customProgramCacheKey());
  });

  it("duas rampas continuam a partilhar, que e o que se quer", () => {
    expect(rampa().customProgramCacheKey()).toBe(rampa().customProgramCacheKey());
  });

  it("a chave do obstaculo declara o padrao", () => {
    expect(obstaculo().customProgramCacheKey()).toContain("ecos-surface-pattern-v1");
  });

  it("cada elo da cadeia acrescenta a sua identidade, nenhum apaga a anterior", () => {
    const chave = obstaculo().customProgramCacheKey();
    const padrao = chave.indexOf("ecos-surface-pattern-v1");
    const topo = chave.indexOf("ecos-top-surface-v1");
    const matiz = chave.indexOf("ecos-stable-lambert-hue-v1");
    expect(padrao).toBeGreaterThan(-1);
    expect(topo).toBeGreaterThan(padrao);
    expect(matiz).toBeGreaterThan(topo);
  });

  it("nenhum elo substitui a chave anterior por texto de funcao", () => {
    // Era exatamente esta a origem: `previousCompile.toString()` em vez da chave
    // anterior. O texto de um fecho e igual para todos os materiais.
    for (const arquivo of [
      "src/render/stable-hue-material.ts",
      "src/render/top-surface-material.ts",
      "src/render/surface-pattern-material.ts",
    ]) {
      const fonte = readFileSync(arquivo, "utf8");
      expect(fonte).not.toContain("previousCompile.toString()");
      if (fonte.includes("customProgramCacheKey = ")) {
        expect(fonte).toContain("material.customProgramCacheKey.bind(material)");
        expect(fonte).toContain("${previousKey()}");
      }
    }
  });
});
