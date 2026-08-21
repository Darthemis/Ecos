// Legibilidade estrutural: quanto uma célula da grade merece de reforço por ser
// silhueta, degrau de profundidade, encontro de planos ou canto.
//
// Isto é representação perceptiva, não emissão de luz. Não entra na simulação,
// não afeta furtividade, detecção nem agentes: só muda quanto glifo uma célula
// recebe. O interior das superfícies fica exatamente como estava.
//
// A grandeza é a segunda diferença normalizada do **inverso** da profundidade.
// O inverso é afim em coordenadas de tela sobre qualquer plano — a mesma
// propriedade que a rasterização usa para interpolar — então um plano, por mais
// de raspão que esteja, dá resposta zero, e só a quebra dá resposta. A
// justificativa completa, com a comparação recusada, está em
// `docs/DECISOES_TECNICAS.md`, seção da Fase 1.1.
//
// Este arquivo é a fonte única dos números. O shader do passe ASCII é montado a
// partir daqui, de modo que teste e imagem não podem divergir.

export type StructuralSamples = {
  /** Profundidade bruta do buffer, em [0, 1]. */
  centro: number;
  esquerda: number;
  direita: number;
  cima: number;
  baixo: number;
};

export type StructuralResponse = {
  silhueta: number;
  descontinuidade: number;
  vinco: number;
  canto: number;
  /** Soma ponderada e limitada. É o que o passe aplica. */
  total: number;
};

/** Qual parte do sinal isolar no diagnóstico de máscara. */
export type StructureSource = "todas" | "silhueta" | "vinco";

export const STRUCTURE = {
  /** Degrau relativo em que a silhueta contra o vazio começa e satura. */
  silhuetaMin: 0.5,
  silhuetaMax: 0.9,
  /** Degrau relativo de sobreposição entre duas superfícies próximas. */
  degrauMin: 0.045,
  degrauMax: 0.34,
  /** Quebra de plano: começa alto o bastante para ignorar facetas pequenas. */
  vincoMin: 0.022,
  vincoMax: 0.13,
  /** Assimetria acima da qual a quebra é degrau, não vinco. */
  assimetriaMin: 0.06,
  assimetriaMax: 0.3,
  /** Canto: os dois eixos respondendo ao mesmo tempo. */
  cantoMin: 0.02,
  cantoMax: 0.11,

  // Os pesos foram escolhidos pela densidade de glifo que produzem numa célula
  // preta, para que a hierarquia seja legível na rampa de dez glifos e não
  // apenas nos números: silhueta cai em `*`, degrau em `=`, vinco em `-`, e o
  // canto sobe a aresta um degrau.
  pesoSilhueta: 0.58,
  pesoDescontinuidade: 0.38,
  pesoVinco: 0.29,
  pesoCanto: 0.15,

  /** Teto do reforço somado. O preto continua sendo a maior parte da tela. */
  teto: 0.62,
} as const;

const EPS = 1e-6;

export function smoothstep(borda0: number, borda1: number, valor: number): number {
  const t = Math.min(1, Math.max(0, (valor - borda0) / Math.max(EPS, borda1 - borda0)));
  return t * t * (3 - 2 * t);
}

/** Profundidade em metros, a partir da profundidade bruta do buffer. */
export function viewDepth(raw: number, near: number, far: number): number {
  const ndc = 2 * raw - 1;
  return (2 * near * far) / (far + near - ndc * (far - near));
}

/** O inverso da profundidade — a grandeza que é afim na tela sobre um plano. */
export function inverseDepth(raw: number, near: number, far: number): number {
  return 1 / Math.max(EPS, viewDepth(raw, near, far));
}

/**
 * Visibilidade da célula pela mesma névoa que já escurece o mundo. Fora do
 * alcance perceptivo a resposta é zero: nada é revelado além do que o alcance
 * escolhido já mostrava.
 */
export function fogVisibility(depthMeters: number, fogNear: number, fogFar: number): number {
  return Math.min(1, Math.max(0, (fogFar - depthMeters) / Math.max(EPS, fogFar - fogNear)));
}

/**
 * Resposta estrutural de uma célula. Recebe profundidades brutas; devolve os
 * quatro termos e o total já limitado — antes de qualquer porta de alcance.
 */
export function structuralResponse(
  amostras: StructuralSamples,
  near: number,
  far: number,
): StructuralResponse {
  const inv0 = inverseDepth(amostras.centro, near, far);
  const invE = inverseDepth(amostras.esquerda, near, far);
  const invD = inverseDepth(amostras.direita, near, far);
  const invC = inverseDepth(amostras.cima, near, far);
  const invB = inverseDepth(amostras.baixo, near, far);

  const base = Math.max(EPS, inv0);
  // Positivo quando o centro está à frente da média das vizinhas: o reforço
  // fica no corpo da frente e não vira halo na superfície de trás.
  const qx = (2 * inv0 - invE - invD) / base;
  const qy = (2 * inv0 - invC - invB) / base;

  const qFrente = Math.max(qx, qy);
  const qAbs = Math.max(Math.abs(qx), Math.abs(qy));
  const assimetria = Math.max(Math.abs(invE - invD), Math.abs(invC - invB)) / base;

  const silhueta = smoothstep(STRUCTURE.silhuetaMin, STRUCTURE.silhuetaMax, qFrente);
  const descontinuidade =
    smoothstep(STRUCTURE.degrauMin, STRUCTURE.degrauMax, qFrente) * (1 - silhueta);

  // Vinco é quebra de plano sem degrau: vale para o convexo e para o côncavo,
  // por isso usa o módulo. A assimetria alta denuncia um degrau e o desconta.
  const ehDegrau = smoothstep(STRUCTURE.assimetriaMin, STRUCTURE.assimetriaMax, assimetria);
  const vinco =
    smoothstep(STRUCTURE.vincoMin, STRUCTURE.vincoMax, qAbs) * (1 - ehDegrau) * (1 - silhueta);

  // Canto é a célula em que os dois eixos respondem. Uma aresta vertical
  // responde só em x; um vértice responde nos dois.
  const canto = smoothstep(
    STRUCTURE.cantoMin,
    STRUCTURE.cantoMax,
    Math.min(Math.abs(qx), Math.abs(qy)),
  );

  const total = Math.min(
    STRUCTURE.teto,
    STRUCTURE.pesoSilhueta * silhueta +
      STRUCTURE.pesoDescontinuidade * descontinuidade +
      STRUCTURE.pesoVinco * vinco +
      STRUCTURE.pesoCanto * canto,
  );

  return { silhueta, descontinuidade, vinco, canto, total };
}

/** Isola uma parte do sinal, para o diagnóstico de máscara. */
export function sourceAmount(resposta: StructuralResponse, fonte: StructureSource): number {
  switch (fonte) {
    case "silhueta":
      return Math.min(
        STRUCTURE.teto,
        STRUCTURE.pesoSilhueta * resposta.silhueta +
          STRUCTURE.pesoDescontinuidade * resposta.descontinuidade,
      );
    case "vinco":
      return Math.min(
        STRUCTURE.teto,
        STRUCTURE.pesoVinco * resposta.vinco + STRUCTURE.pesoCanto * resposta.canto,
      );
    default:
      return resposta.total;
  }
}

/**
 * Aplica o reforço à densidade de glifo já calculada. Mistura por complemento:
 * uma célula quase branca quase não muda — nada de halo —, e uma célula quase
 * preta sobe o suficiente para existir.
 */
export function reinforce(shaped: number, estrutura: number): number {
  return Math.min(1, shaped + estrutura * (1 - shaped));
}

/** Os mesmos números, como constantes GLSL. O shader não repete valor algum. */
export function structureDefines(): string {
  return Object.entries(STRUCTURE)
    .map(([nome, valor]) => `const float EST_${nome.toUpperCase()} = ${valor.toFixed(6)};`)
    .join("\n");
}
