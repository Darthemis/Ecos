// Atlas de glifos gerado em tempo de execucao. Uma unica textura, consultada
// pelo shader: nao existe uma grade de elementos HTML desenhando caracteres.
//
// O atlas e desenhado no tamanho exato da celula em pixels do dispositivo. Com
// amostragem por vizinho mais proximo, isso da um texel por pixel: nao ha
// reamostragem, nem sorteio de fase entre celulas — a fonte de um vies
// periodico que aparecia como faixas verticais presas a tela.

import { CanvasTexture, NearestFilter, type Texture } from "three";

/**
 * Rampa de densidade. Segue a gramatica do GDD §12.3: glifos leves para
 * distancia e materia fraca, densos para massa e proximidade. O conjunto
 * definitivo continua em aberto (EXPERIMENTOS_ABERTOS.md).
 */
export const GLYPH_RAMP = " .:-=+*#%@";

/** Tamanho da celula em pixels de CSS. Multiplicado pela densidade da tela. */
export const GLYPH_CELL_WIDTH = 8;
export const GLYPH_CELL_HEIGHT = 14;

/** Luminancia (0..1) para indice de glifo na rampa. */
export function glyphIndexForLuminance(luminance: number, glyphCount: number): number {
  const clamped = Math.max(0, Math.min(1, luminance));
  return Math.min(glyphCount - 1, Math.floor(clamped * glyphCount));
}

export type GlyphAtlas = {
  texture: Texture;
  glyphCount: number;
  cellWidth: number;
  cellHeight: number;
};

export function createGlyphAtlas(cellWidth: number, cellHeight: number): GlyphAtlas {
  const glyphs = [...GLYPH_RAMP];

  const canvas = document.createElement("canvas");
  canvas.width = cellWidth * glyphs.length;
  canvas.height = cellHeight;

  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Contexto 2D indisponivel para o atlas de glifos");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(cellHeight * 0.82)}px ui-monospace, "DejaVu Sans Mono", "Courier New", monospace`;

  glyphs.forEach((glyph, index) => {
    ctx.fillText(glyph, index * cellWidth + cellWidth / 2, cellHeight / 2 + cellHeight * 0.04);
  });

  const texture = new CanvasTexture(canvas);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;

  return { texture, glyphCount: glyphs.length, cellWidth, cellHeight };
}
