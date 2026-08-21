// Registro de materiais de superficie. Puro: nao conhece Three.js nem DOM.
//
// Ate aqui o padrao era indexado direto por `ObstacleKind`, o que fazia material
// e tipo de objeto serem a mesma coisa: uma familia nova exigia um tipo novo, e
// dois objetos de tipos diferentes nunca podiam compartilhar a mesma pedra. Aqui
// as duas coisas se separam — o tipo diz o que a coisa e no mundo, o material diz
// do que a superficie e feita. `MATERIAL_BY_KIND` e so o padrao de fabrica.
//
// Cada material declara duas coisas, e nenhuma delas e cor:
//   - o padrao (escala em ciclos por metro, contraste em profundidade);
//   - a tabela de glifos com que o passe ASCII desenha aquela superficie.
//
// A familia `base` e a do mundo inteiro que ainda nao declarou material: terreno,
// rampas e patamares. Ela tem contraste zero (nenhum padrao) e a rampa global
// historica. Isso nao e uma escolha de conveniencia — e o que garante que tudo
// que nao foi tocado nesta etapa continua exatamente como estava.

import type { ObstacleKind } from "./geometry";

export type SurfaceMaterialId = "base" | "rock" | "ruin" | "monolith";

export type SurfaceMaterial = {
  /** Ciclos por metro do padrao. Irrelevante quando o contraste e zero. */
  escala: number;
  /** Profundidade do padrao, 0..1. Zero significa superficie lisa. */
  contraste: number;
  /** Tabela de glifos, do mais leve ao mais denso. */
  glifos: string;
  /**
   * Matiz da superficie, multiplicada na cor difusa. Deliberadamente proxima do
   * neutro: a tentativa monolitica foi reprovada por expor grandes faixas de
   * marrom e creme, e o que se quer aqui e materia reconhecivel, nao cor.
   *
   * So a cromaticidade importa. O `stabilizeLambertHue` divide pela componente
   * maxima, entao multiplicar a matiz inteira por um numero nao muda nada — o
   * que muda e a razao entre os canais.
   *
   * Tres calibracoes ate aqui, e vale registrar porque:
   *
   *   - 0,085 chegou ao ecra como 7,1/255 e foi **invisivel a olho humano**. A
   *     causa era o passe ASCII tirar o matiz depois da curva de gama, que
   *     comprime a razao entre canais quase para metade;
   *   - 0,22, com o matiz tirado da luz linear, deu 26,2/255 — visivel, mas
   *     ainda timido face as referencias;
   *   - as atuais, com cerca de 0,4, dao materia reconhecivel a distancia.
   *
   * O que a tentativa monolitica reprovou nao foi saturacao: foi **cor turva** —
   * grandes faixas de marrom e creme com a luminancia comida junto. Aqui o preto
   * continua a dominar a tela, a luminancia continua a vir do glifo, e o matiz e
   * limpo: azul de ardosia, ocre e violeta separam-se pelo angulo, nao pela
   * quantidade de tinta.
   */
  matiz: readonly [number, number, number];
};

/**
 * Ordem canonica das familias. O indice nesta lista e o identificador que viaja
 * ate o passe ASCII, entao a ordem e estavel: familias novas entram no fim.
 * `base` e obrigatoriamente a primeira — ver `BASE_MATERIAL_ID`.
 */
export const SURFACE_MATERIAL_ORDER = ["base", "rock", "ruin", "monolith"] as const satisfies
  readonly SurfaceMaterialId[];

/** A familia de quem nao declarou material. Vale zero por construcao. */
export const BASE_MATERIAL_ID = 0;

export const SURFACE_MATERIALS = {
  // Sem padrao e com a rampa global: terreno, rampas e patamares.
  base: { escala: 0, contraste: 0, glifos: " .:-=+*#%@", matiz: [1, 1, 1] },
  // Grao fino e raso; glifos arredondados: pedra inteira, continua.
  // Fria e quase neutra: pedra do lugar.
  rock: { escala: 2.2, contraste: 0.1, glifos: " .,:;ox%8@", matiz: [0.62, 0.8, 1] },
  // Manchas largas e fundas; glifos angulares: superficie quebrada, lascada.
  // Morna e terrosa: o que foi feito por alguem, e cedeu.
  ruin: { escala: 0.7, contraste: 0.22, glifos: " .:!/*[#%@", matiz: [1, 0.78, 0.52] },
  // Quase liso e muito largo; poucos glifos distintos, repetidos: a superficie
  // tem menos estados que qualquer outra coisa do lugar.
  // Fria e levemente violeta: nao se parece com nada que o lugar produziria.
  monolith: { escala: 0.25, contraste: 0.04, glifos: " ..--==+#@", matiz: [0.7, 0.58, 1] },
} as const satisfies Record<SurfaceMaterialId, SurfaceMaterial>;

/** Material de fabrica de cada tipo de volume. O objeto pode sobrepor. */
export const MATERIAL_BY_KIND = {
  rock: "rock",
  ruin: "ruin",
  monolith: "monolith",
} as const satisfies Record<ObstacleKind, SurfaceMaterialId>;

/** Material de um obstaculo: o declarado, ou o de fabrica do seu tipo. */
export function materialForObstacle(obstacle: {
  kind: ObstacleKind;
  material?: SurfaceMaterialId;
}): SurfaceMaterialId {
  return obstacle.material ?? MATERIAL_BY_KIND[obstacle.kind];
}

/** Indice da familia na ordem canonica. Desconhecido cai na base. */
export function surfaceMaterialIndex(id: SurfaceMaterialId): number {
  const index = SURFACE_MATERIAL_ORDER.indexOf(id);
  return index < 0 ? BASE_MATERIAL_ID : index;
}

/**
 * Alfa que o material escreve no alvo da cena. A familia base vale 1, que e o
 * valor que o limpo e todo material que nao escreve alfa ja produzem: quem nao
 * declara material cai na tabela global sem precisar de nenhum codigo.
 */
export function alphaForMaterialIndex(index: number): number {
  return 1 - index / 255;
}

/** Inverso de `alphaForMaterialIndex`. Espelha o que o shader do passe faz. */
export function materialIndexFromAlpha(alpha: number): number {
  return Math.round((1 - alpha) * 255);
}
