// Atlas de glifos gerado em tempo de execucao. Uma unica textura, consultada
// pelo shader: nao existe uma grade de elementos HTML desenhando caracteres.
//
// O atlas e desenhado no tamanho exato da celula em pixels do dispositivo. Com
// amostragem por vizinho mais proximo, isso da um texel por pixel: nao ha
// reamostragem, nem sorteio de fase entre celulas — a fonte de um vies
// periodico que aparecia como faixas verticais presas a tela.
//
// Desde a separacao entre material e tipo de objeto o atlas tem uma linha por
// familia de material, na ordem canonica de `SURFACE_MATERIAL_ORDER`. A linha 0
// e a familia base: a rampa global, identica a que existia quando o atlas tinha
// uma linha so.

import { CanvasTexture, NearestFilter, type Texture } from "three";
import { SURFACE_MATERIAL_ORDER, SURFACE_MATERIALS } from "../world/surface-material";
import { DEFAULT_GLYPH_DENSITY, GLYPH_DENSITIES } from "./glyph-density";

/**
 * Rampa de densidade da familia base. Segue a gramatica do GDD §12.3: glifos
 * leves para distancia e materia fraca, densos para massa e proximidade. O
 * conjunto definitivo continua em aberto (EXPERIMENTOS_ABERTOS.md).
 */
export const GLYPH_RAMP = SURFACE_MATERIALS.base.glifos;

/**
 * Tamanho da celula do degrau padrao, em pixels de CSS. Multiplicado pela
 * densidade da tela. Os outros degraus vivem em glyph-density.ts e so entram
 * pelo diagnostico.
 */
export const GLYPH_CELL_WIDTH = GLYPH_DENSITIES[DEFAULT_GLYPH_DENSITY].width;
export const GLYPH_CELL_HEIGHT = GLYPH_DENSITIES[DEFAULT_GLYPH_DENSITY].height;

/**
 * Tabelas de glifos na ordem canonica das familias. Todas tem o mesmo
 * comprimento: o indice de densidade e calculado uma vez, sem saber a familia.
 */
export const GLYPH_TABLES: readonly string[] = SURFACE_MATERIAL_ORDER.map(
  (id) => SURFACE_MATERIALS[id].glifos,
);

/** Luminancia (0..1) para indice de glifo na rampa. */
export function glyphIndexForLuminance(luminance: number, glyphCount: number): number {
  const clamped = Math.max(0, Math.min(1, luminance));
  return Math.min(glyphCount - 1, Math.floor(clamped * glyphCount));
}

export type GlyphAtlas = {
  texture: Texture;
  glyphCount: number;
  /** Uma linha por familia de material. */
  rowCount: number;
  cellWidth: number;
  cellHeight: number;
};

export function createGlyphAtlas(cellWidth: number, cellHeight: number): GlyphAtlas {
  const linhas = GLYPH_TABLES.map((tabela) => [...tabela]);
  const glyphCount = linhas[0]?.length ?? 0;
  if (glyphCount === 0) throw new Error("Atlas de glifos sem nenhuma tabela");
  if (linhas.some((linha) => linha.length !== glyphCount)) {
    throw new Error("Tabelas de glifos com comprimentos diferentes");
  }

  const canvas = document.createElement("canvas");
  canvas.width = cellWidth * glyphCount;
  canvas.height = cellHeight * linhas.length;

  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Contexto 2D indisponivel para o atlas de glifos");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(cellHeight * 0.82)}px ui-monospace, "DejaVu Sans Mono", "Courier New", monospace`;

  linhas.forEach((linha, row) => {
    const baseY = row * cellHeight + cellHeight / 2 + cellHeight * 0.04;
    linha.forEach((glyph, index) => {
      ctx.fillText(glyph, index * cellWidth + cellWidth / 2, baseY);
    });
  });

  const texture = new CanvasTexture(canvas);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;

  return { texture, glyphCount, rowCount: linhas.length, cellWidth, cellHeight };
}
