// A escada de densidade da grade. Diagnóstico: troca densidade por fidelidade
// do glifo, e a escolha é humana.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_GLYPH_DENSITY,
  GLYPH_DENSITIES,
  glyphDensityAt,
  glyphPixels,
  nextGlyphDensity,
} from "../src/render/glyph-density";
import { computeGrid } from "../src/render/grid";
import { GLYPH_CELL_HEIGHT, GLYPH_CELL_WIDTH } from "../src/render/glyph-atlas";
import { applyDiagnosticCommand, INITIAL_DIAGNOSTIC_STATE } from "../src/app/diagnostic-commands";
import { COMMAND_KEYS } from "../src/core/input";

describe("escada de densidade", () => {
  it("sao tres aparencias, e nao um cursor continuo", () => {
    expect(GLYPH_DENSITIES.map((d) => d.rotulo)).toEqual(["nitida", "equilibrada", "textura"]);
  });

  it("o degrau de partida e o equilibrado, e nao o historico", () => {
    // O historico (8 x 14) continua a existir como escolha, mas deixou de ser o
    // padrao: avaliado a olho em 20/08/2026, 6 x 10 nao perde nenhum glifo e da
    // quase o dobro das celulas.
    expect(DEFAULT_GLYPH_DENSITY).toBe(1);
    expect(glyphDensityAt(DEFAULT_GLYPH_DENSITY)).toMatchObject({ width: 6, height: 10 });
    expect(glyphDensityAt(0)).toMatchObject({ width: 8, height: 14 });
    expect(GLYPH_CELL_WIDTH).toBe(6);
    expect(GLYPH_CELL_HEIGHT).toBe(10);
  });

  it("a mais densa perde glifos de proposito, e isso e a escolha", () => {
    // 28 px por caractere: os glifos deixam de se distinguir e a imagem passa a
    // valer como superficie. Nao e degradacao, e outra leitura do mesmo mundo.
    expect(glyphDensityAt(2)).toMatchObject({ width: 4, height: 7 });
    expect(glyphPixels(2)).toBe(28);
  });

  it("desce sempre: cada degrau tem menos pixels por glifo que o anterior", () => {
    for (let i = 1; i < GLYPH_DENSITIES.length; i += 1) {
      expect(glyphPixels(i)).toBeLessThan(glyphPixels(i - 1));
    }
  });

  it("nenhum degrau desce abaixo do piso que o atlas suporta", () => {
    // Abaixo de 4 x 6 o glifo deixa de caber no proprio texel.
    for (const d of GLYPH_DENSITIES) {
      expect(d.width).toBeGreaterThanOrEqual(4);
      expect(d.height).toBeGreaterThanOrEqual(6);
    }
  });

  it("a escada e circular e volta ao inicio", () => {
    let i = DEFAULT_GLYPH_DENSITY;
    for (let n = 0; n < GLYPH_DENSITIES.length; n += 1) i = nextGlyphDensity(i);
    expect(i).toBe(DEFAULT_GLYPH_DENSITY);
  });

  it("um indice invalido cai no degrau de partida em vez de sumir", () => {
    expect(glyphDensityAt(-1)).toBe(GLYPH_DENSITIES[DEFAULT_GLYPH_DENSITY]);
    expect(glyphDensityAt(999)).toBe(GLYPH_DENSITIES[DEFAULT_GLYPH_DENSITY]);
  });
});

describe("a densidade chega a grade", () => {
  // 1366 x 768 com escala 100%: o ecra do responsavel.
  const noEcra = (i: number) => {
    const d = glyphDensityAt(i);
    return computeGrid(1366, 768, 1, d.width, d.height);
  };

  it("reproduz as grades medidas nas capturas", () => {
    expect(noEcra(0)).toMatchObject({ columns: 170, rows: 54 });
    expect(noEcra(1)).toMatchObject({ columns: 227, rows: 76 });
    expect(noEcra(2)).toMatchObject({ columns: 341, rows: 109 });
  });

  it("o padrao da quase o dobro das celulas do historico", () => {
    const historico = noEcra(0).columns * noEcra(0).rows;
    const padrao = noEcra(DEFAULT_GLYPH_DENSITY).columns * noEcra(DEFAULT_GLYPH_DENSITY).rows;
    expect(padrao / historico).toBeGreaterThan(1.8);
  });

  it("cada degrau da mais celulas que o anterior", () => {
    let anterior = 0;
    for (let i = 0; i < GLYPH_DENSITIES.length; i += 1) {
      const g = noEcra(i);
      const celulas = g.columns * g.rows;
      expect(celulas).toBeGreaterThan(anterior);
      anterior = celulas;
    }
  });

  it("o quadro continua a ser multiplo exato da celula, em todos os degraus", () => {
    // E o que impede as faixas verticais presas a tela, corrigidas na Fase 1.1.
    for (let i = 0; i < GLYPH_DENSITIES.length; i += 1) {
      const g = noEcra(i);
      expect(g.bufferWidth % g.cellWidth).toBe(0);
      expect(g.bufferHeight % g.cellHeight).toBe(0);
    }
  });

  it("sem tamanho de celula, computeGrid mantem o comportamento antigo", () => {
    expect(computeGrid(1366, 768, 1)).toEqual(noEcra(DEFAULT_GLYPH_DENSITY));
  });
});

describe("a tecla percorre a escada", () => {
  const JOGO = readFileSync("src/app/game.ts", "utf8");

  it("G esta mapeada", () => {
    expect(COMMAND_KEYS.KeyG).toBe("cycleGlyphDensity");
  });

  it("e conforto, e nao diagnostico: existe tambem na producao", () => {
    // A densidade troca detalhe por legibilidade do caractere no ecra de quem
    // joga — a mesma categoria da reducao de cintilacao e da sensibilidade. Se
    // passasse pelo estado de diagnostico, a tecla nao existiria na construcao
    // de producao, que e onde a avaliacao humana acontece.
    expect(INITIAL_DIAGNOSTIC_STATE).not.toHaveProperty("glyphDensity");
    expect(applyDiagnosticCommand(INITIAL_DIAGNOSTIC_STATE, "cycleGlyphDensity", true)).toBe(
      INITIAL_DIAGNOSTIC_STATE,
    );
  });

  it("o laco avanca o degrau e refaz a grade", () => {
    // Sem o resize o degrau mudaria e a imagem nao — a regressao de classe do F5.
    expect(JOGO).toContain('case "cycleGlyphDensity":');
    const trecho = JOGO.slice(JOGO.indexOf('case "cycleGlyphDensity":'));
    const corpo = trecho.slice(0, trecho.indexOf("break;"));
    expect(corpo).toContain("glyphDensity = nextGlyphDensity(glyphDensity);");
    expect(corpo).toContain("resize();");
  });

  it("a grade desenhada segue o degrau, e nao a constante", () => {
    expect(JOGO).toContain("const celula = glyphDensityAt(glyphDensity);");
    expect(JOGO).toContain("celula.width, celula.height");
  });
});
