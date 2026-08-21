// Densidade da grade: quantos pixels de dispositivo cabem numa celula.
//
// Puro: nao conhece Three.js nem DOM.
//
// Nao ha resposta certa e universal aqui, porque a escolha e uma troca entre
// duas coisas que o mesmo ecra nao pode ter ao mesmo tempo:
//
//   - **densidade** — quantas celulas cabem na tela, e portanto quanta textura
//     um padrao de material consegue exprimir;
//   - **fidelidade do glifo** — quantos pixels sobram para desenhar cada
//     caractere, e portanto quantas formas se distinguem umas das outras.
//
// Num ecra de 1366 x 768 com escala 100% existem 1,05 milhao de pixels e e tudo
// o que ha: densidade so se compra com fidelidade. Por isso esta escada existe
// como diagnostico — a decisao e humana, feita a olho, no lugar.
//
// Trocar de degrau muda a imagem inteira e desloca os limiares do reforco
// estrutural, que medem a segunda diferenca do inverso da profundidade **entre
// celulas vizinhas**: uma celula menor e uma diferenca menor. Mudar aqui obriga
// a recalibrar aquilo.

export type GlyphDensity = {
  /** Nome curto, para o painel de diagnostico. */
  readonly rotulo: string;
  readonly width: number;
  readonly height: number;
};

/**
 * Do mais legivel ao mais denso. Tres degraus, avaliados a olho num ecra de
 * 1366 x 768 em 20/08/2026:
 *
 *   - **nitida** — o comportamento historico do jogo. Todo glifo se distingue,
 *     com folga;
 *   - **equilibrada** — o padrao. Nenhum glifo se perde, e a textura dos
 *     materiais passa a ler-se como textura em vez de ruido por celula;
 *   - **textura** — os caracteres deixam de se distinguir e a imagem passa a
 *     valer como superficie. Foi escolhida deliberadamente, e nao tolerada: e
 *     uma leitura diferente do mesmo mundo, nao uma versao degradada.
 *
 * Existiram dois degraus intermedios (7 x 12 e 5 x 8) enquanto se procurava o
 * limiar. Achado o limiar, sairam: isto e uma escolha do jogador entre tres
 * aparencias, nao um cursor continuo.
 */
export const GLYPH_DENSITIES = [
  { rotulo: "nitida", width: 8, height: 14 },
  { rotulo: "equilibrada", width: 6, height: 10 },
  { rotulo: "textura", width: 4, height: 7 },
] as const satisfies readonly GlyphDensity[];

/**
 * O degrau de partida. Nao e o historico: e o que foi avaliado como melhor
 * equilibrio entre densidade e fidelidade do caractere.
 */
export const DEFAULT_GLYPH_DENSITY = 1;

export function glyphDensityAt(index: number): GlyphDensity {
  return GLYPH_DENSITIES[index] ?? GLYPH_DENSITIES[DEFAULT_GLYPH_DENSITY]!;
}

export function nextGlyphDensity(index: number): number {
  const proximo = index + 1;
  return proximo >= GLYPH_DENSITIES.length || proximo < 0 ? 0 : proximo;
}

/** Pixels de dispositivo disponiveis para desenhar um caractere. */
export function glyphPixels(index: number): number {
  const d = glyphDensityAt(index);
  return d.width * d.height;
}
