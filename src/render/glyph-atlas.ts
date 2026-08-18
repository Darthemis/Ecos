// Atlas de glifos gerado em tempo de execucao. Uma unica textura, consultada
// pelo shader: nao existe uma grade de elementos HTML desenhando caracteres.

import { CanvasTexture, NearestFilter, type Texture } from "three";

/**
 * Rampa de densidade. Segue a gramatica do GDD §12.3: glifos leves para
 * distancia e materia fraca, densos para massa e proximidade. O conjunto
 * definitivo continua em aberto (EXPERIMENTOS_ABERTOS.md).
 */
export const GLYPH_RAMP = " .:-=+*#%@";

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
};

export function createGlyphAtlas(scale = 4): GlyphAtlas {
  const glyphs = [...GLYPH_RAMP];
  const cellW = GLYPH_CELL_WIDTH * scale;
  const cellH = GLYPH_CELL_HEIGHT * scale;

  const canvas = document.createElement("canvas");
  canvas.width = cellW * glyphs.length;
  canvas.height = cellH;

  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Contexto 2D indisponivel para o atlas de glifos");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(cellH * 0.82)}px ui-monospace, "DejaVu Sans Mono", "Courier New", monospace`;

  glyphs.forEach((glyph, index) => {
    ctx.fillText(glyph, index * cellW + cellW / 2, cellH / 2 + cellH * 0.04);
  });

  const texture = new CanvasTexture(canvas);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;

  return { texture, glyphCount: glyphs.length };
}
