// A grade de caracteres em pixels inteiros do dispositivo.
//
// Quando a largura do quadro não é múltiplo exato da célula, cada célula ocupa
// uma fração de pixel e o batimento entre as duas grades aparece como faixas
// verticais fixas na tela — o defeito corrigido na Fase 1.1. Por isso o cálculo
// vive aqui, isolado e verificável, em vez de dentro do laço de renderização.

import { GLYPH_CELL_HEIGHT, GLYPH_CELL_WIDTH } from "./glyph-atlas";

export type GridLayout = {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  /** Tamanho do quadro de desenho. Sempre múltiplo exato da célula. */
  bufferWidth: number;
  bufferHeight: number;
};

export function computeGrid(
  clientWidth: number,
  clientHeight: number,
  dpr: number,
  celulaX: number = GLYPH_CELL_WIDTH,
  celulaY: number = GLYPH_CELL_HEIGHT,
): GridLayout {
  const escala = Math.max(1, Math.min(3, dpr || 1));
  // O piso de 4 x 6 nao e estetico: abaixo disso o glifo deixa de caber no
  // proprio texel, e o atlas passaria a desenhar caracteres uns por cima dos
  // outros.
  const cellWidth = Math.max(4, Math.round(celulaX * escala));
  const cellHeight = Math.max(6, Math.round(celulaY * escala));

  const disponivelX = Math.max(320, Math.floor(clientWidth * escala));
  const disponivelY = Math.max(240, Math.floor(clientHeight * escala));

  const columns = Math.max(2, Math.floor(disponivelX / cellWidth));
  const rows = Math.max(2, Math.floor(disponivelY / cellHeight));

  return {
    columns,
    rows,
    cellWidth,
    cellHeight,
    bufferWidth: columns * cellWidth,
    bufferHeight: rows * cellHeight,
  };
}
