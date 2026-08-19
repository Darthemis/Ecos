// Eco de Contato — regra perceptiva, provisoria.
//
// «Tudo que toca o mundo torna minimamente legivel o lugar onde o toca.»
//
// Nao e luz. Nenhum objeto ganha uma fonte luminosa: o proprio chao passa a ser
// levemente legivel junto da area onde algo o toca. A distincao importa por tres
// motivos:
//
//   1. oclusao sai de graca — como o efeito sombreia a superficie do terreno, um
//      muro entre a camera e aquele chao o esconde pelo teste de profundidade,
//      sem calculo de sombra e sem revelar nada atraves de barreiras;
//   2. a base pode estar fora do enquadramento e o vestigio ainda existe, porque
//      ele pertence ao terreno, nao ao objeto;
//   3. nada aqui alcanca simulacao, furtividade, percepcao de agentes ou
//      deteccao: este modulo apenas descreve contatos, e quem os le e a
//      renderizacao.
//
// Este arquivo e puro: decide quais objetos tocam o terreno e qual e a area real
// desse contato. Nao conhece Three.js nem DOM.

import type { Obstacle, Vec2 } from "./geometry";

/** Altura da base ate a qual um objeto e considerado apoiado no terreno. */
export const GROUND_CONTACT_EPSILON = 0.05;

/** Limite de contatos enviados a renderizacao por quadro. */
export const MAX_CONTACTS = 24;

export type ContactFootprint = {
  id: string;
  /** Centro da area de contato, no plano do terreno. */
  center: Vec2;
  /** Metade do comprimento da base, sempre no eixo mais longo. */
  halfLength: number;
  /** Metade da largura da base, sempre no eixo mais curto. */
  halfWidth: number;
  /** Eixo mais longo da base, ja girado para o espaco do mundo. */
  axis: Vec2;
};

/** Um objeto suspenso, voando ou sem contato com o terreno nao produz eco. */
export function isGrounded(obstacle: Obstacle): boolean {
  return obstacle.baseY <= GROUND_CONTACT_EPSILON;
}

export function contactFootprint(obstacle: Obstacle): ContactFootprint {
  const longAxisIsX = obstacle.size.x >= obstacle.size.z;
  const cosine = Math.cos(obstacle.yaw);
  const sine = Math.sin(obstacle.yaw);

  return {
    id: obstacle.id,
    center: { x: obstacle.center.x, z: obstacle.center.z },
    halfLength: Math.max(obstacle.size.x, obstacle.size.z) / 2,
    halfWidth: Math.min(obstacle.size.x, obstacle.size.z) / 2,
    axis: longAxisIsX
      ? { x: cosine, z: -sine }
      : { x: sine, z: cosine },
  };
}

export function contactFootprints(obstacles: readonly Obstacle[]): ContactFootprint[] {
  const grounded: ContactFootprint[] = [];
  for (const obstacle of obstacles) {
    if (!isGrounded(obstacle)) continue;
    grounded.push(contactFootprint(obstacle));
    if (grounded.length === MAX_CONTACTS) break;
  }
  return grounded;
}

/**
 * Os contatos mais proximos de um ponto, ate o limite enviado a renderizacao.
 * Um lugar inteiro tem mais volumes do que cabem num quadro; os que importam
 * sao os que o jogador pode ver de perto, porque o alcance do eco e curto.
 */
export function nearestContacts(
  obstacles: readonly Obstacle[],
  from: Vec2,
  max = MAX_CONTACTS,
): ContactFootprint[] {
  const grounded = obstacles.filter(isGrounded).map(contactFootprint);
  grounded.sort((a, b) => {
    const da = (a.center.x - from.x) ** 2 + (a.center.z - from.z) ** 2;
    const db = (b.center.x - from.x) ** 2 + (b.center.z - from.z) ** 2;
    // Desempate pela identidade: a selecao nao pode depender da ordem do array.
    return da === db ? a.id.localeCompare(b.id) : da - db;
  });
  return grounded.slice(0, max);
}

/** Intensidades comparaveis para avaliacao humana. O padrao e experimental. */
// O termo entra como emissao em espaco linear, num mundo cuja iluminacao
// ambiente mal chega a 0,05. Valores acima de ~0,06 estouram o topo da rampa de
// glifos e produzem exatamente a plataforma brilhante que a regra proibe.
export const ECHO_LEVELS = {
  sutil: 0.016,
  intermediario: 0.03,
  legivel: 0.052,
} as const;

export type EchoLevel = keyof typeof ECHO_LEVELS;
export const ECHO_LEVEL_ORDER: readonly EchoLevel[] = ["sutil", "intermediario", "legivel"];
// Fechamento da Fase 1.1: o sutil e o padrao jogavel provisorio. As outras duas
// intensidades permanecem apenas como diagnostico, em F8.
export const DEFAULT_ECHO_LEVEL: EchoLevel = "sutil";

export function nextEchoLevel(current: EchoLevel): EchoLevel {
  const index = ECHO_LEVEL_ORDER.indexOf(current);
  return ECHO_LEVEL_ORDER[(index + 1) % ECHO_LEVEL_ORDER.length] ?? DEFAULT_ECHO_LEVEL;
}
