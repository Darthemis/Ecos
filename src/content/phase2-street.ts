// A Rua Interrompida — cenário fixo e autoral da Fase 2.
//
// Conteudo orientado a dados. O motor le esta descricao e nao possui excecao
// alguma para esta rua: trocar de lugar e trocar de arquivo.
//
// O percurso corre ao longo de -Z e se divide em tres trechos que mudam de
// ritmo espacial: uma praca aberta, um corredor comprimido e uma bacia que se
// abre. Duas rotas o atravessam e ambas retornam.
//
// Convencao de coordenadas: o jogador nasce olhando para -Z; +X e a direita.

import type { Obstacle } from "../world/geometry";
import type { SceneDefinition } from "../world/scene";

const RUIN = "ruin" as const;
const ROCK = "rock" as const;
const MONOLITH = "monolith" as const;

type BlockSpec = {
  id: string;
  kind: typeof RUIN | typeof ROCK | typeof MONOLITH;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  baseY?: number;
  yaw?: number;
};

function block(spec: BlockSpec): Obstacle {
  return {
    id: spec.id,
    kind: spec.kind,
    center: { x: spec.x, z: spec.z },
    size: { x: spec.w, y: spec.h, z: spec.d },
    baseY: spec.baseY ?? -0.15,
    yaw: spec.yaw ?? 0,
  };
}

/** Corrida de muro ao longo de Z, quebrada em pedacos de alturas irregulares. */
function wallAlongZ(
  id: string,
  x: number,
  fromZ: number,
  toZ: number,
  thickness: number,
  heights: readonly number[],
): Obstacle[] {
  const pieces: Obstacle[] = [];
  const total = Math.abs(toZ - fromZ);
  const count = heights.length;
  const step = total / count;
  for (let i = 0; i < count; i += 1) {
    const centre = fromZ - step * (i + 0.5);
    pieces.push(
      block({
        id: `${id}-${i}`,
        kind: RUIN,
        x,
        z: centre,
        w: thickness,
        h: heights[i]!,
        d: step * 0.94,
        baseY: -0.3,
      }),
    );
  }
  return pieces;
}

/** Corrida de muro ao longo de X. */
function wallAlongX(
  id: string,
  z: number,
  fromX: number,
  toX: number,
  thickness: number,
  heights: readonly number[],
): Obstacle[] {
  const pieces: Obstacle[] = [];
  const total = Math.abs(toX - fromX);
  const count = heights.length;
  const step = total / count;
  for (let i = 0; i < count; i += 1) {
    const centre = fromX + step * (i + 0.5);
    pieces.push(
      block({
        id: `${id}-${i}`,
        kind: RUIN,
        x: centre,
        z,
        w: step * 0.94,
        h: heights[i]!,
        d: thickness,
        baseY: -0.3,
      }),
    );
  }
  return pieces;
}

const OBSTACLES: readonly Obstacle[] = [
  // ─── Orientação: praça aberta, muros baixos e interrompidos dos dois lados ───
  ...wallAlongZ("praca-oeste-a", -11, 12, -13, 0.9, [1.9, 2.4, 1.6, 2.1, 1.3]),
  // A brecha fica entre z -13 e -19: é por ela que a rota lateral se descobre.
  ...wallAlongZ("praca-oeste-b", -11, -19, -28, 0.9, [2.0, 1.4, 2.2]),
  ...wallAlongZ("praca-leste", 11, 12, -28, 0.9, [2.3, 1.7, 2.6, 1.9, 2.2, 1.5, 2.4, 2.0]),

  // Restos soltos na praça: profundidade sem fechar a passagem.
  block({ id: "praca-resto-a", kind: ROCK, x: -5.4, z: 2.2, w: 1.9, h: 1.2, d: 1.6, yaw: 0.4 }),
  block({ id: "praca-resto-b", kind: ROCK, x: 6.1, z: -3.4, w: 2.3, h: 1.5, d: 2.0, yaw: 0.9 }),
  block({ id: "praca-resto-c", kind: RUIN, x: -2.8, z: -9.6, w: 1.4, h: 0.7, d: 1.2, yaw: 1.2 }),
  block({ id: "praca-resto-d", kind: ROCK, x: 8.2, z: -18.5, w: 1.7, h: 1.1, d: 1.5, yaw: 0.2 }),
  // Monte do desabamento que abriu a brecha: assinala a passagem lateral.
  block({ id: "brecha-monte", kind: RUIN, x: -12.2, z: -21.6, w: 2.6, h: 1.1, d: 3.4, baseY: -0.5, yaw: 0.3 }),

  // ─── Funil: muro atravessado com uma única porta ───
  ...wallAlongX("funil-oeste", -28, -12.5, -3.6, 1.0, [3.2, 2.8, 3.4]),
  ...wallAlongX("funil-leste", -28, 3.6, 12.5, 1.0, [3.0, 3.5, 2.9]),

  // ─── Compressão, trecho A: corredor estreito ───
  ...wallAlongZ("corredor-a-oeste", -3.2, -28, -46, 0.8, [4.2, 3.6, 4.6, 3.9]),
  ...wallAlongZ("corredor-a-leste", 3.2, -28, -46, 0.8, [3.8, 4.4, 3.5, 4.1]),

  // Curva: o muro atravessado empurra o percurso para a direita.
  ...wallAlongX("curva-fechada", -46, -3.6, 0.4, 0.9, [4.0, 3.4]),

  // ─── Compressão, trecho B: corredor deslocado, com rampa ───
  ...wallAlongZ("corredor-b-oeste", 0.8, -46, -62, 0.8, [3.7, 4.3, 3.5]),
  ...wallAlongZ("corredor-b-leste", 6.4, -46, -62, 0.8, [4.1, 3.3, 4.5]),

  // Segunda curva: volta para a esquerda.
  ...wallAlongX("curva-aberta", -62, 2.8, 6.9, 0.9, [3.6, 4.2]),

  // ─── Compressão, trecho C: corredor final antes da bacia ───
  ...wallAlongZ("corredor-c-oeste", -3.2, -62, -78, 0.8, [4.4, 3.7, 4.0]),
  ...wallAlongZ("corredor-c-leste", 3.2, -62, -78, 0.8, [3.9, 4.5, 3.6]),

  // ─── Rota lateral: alameda a oeste ───
  ...wallAlongZ("alameda-oeste", -19, -13, -80, 0.9, [3.4, 2.9, 3.7, 3.1, 3.5, 2.8, 3.3]),
  // O muro leste da alameda fica baixo no trecho do mirante: dali se olha por cima.
  ...wallAlongZ("alameda-leste-a", -14, -19, -22, 0.9, [3.0]),
  ...wallAlongZ("alameda-leste-mirante", -14, -22, -28, 0.9, [1.9, 2.0]),
  ...wallAlongZ("alameda-leste-b", -14, -28, -80, 0.9, [3.6, 3.0, 3.8, 3.2, 3.5, 2.9]),

  block({ id: "alameda-resto-a", kind: ROCK, x: -18.0, z: -34, w: 1.5, h: 1.0, d: 1.3, yaw: 0.7 }),
  block({ id: "alameda-resto-b", kind: RUIN, x: -15.1, z: -52, w: 1.2, h: 0.8, d: 1.6, yaw: 0.2 }),
  block({ id: "alameda-resto-c", kind: ROCK, x: -18.1, z: -66, w: 1.8, h: 1.3, d: 1.5, yaw: 1.1 }),

  // ─── Revelação: bacia aberta ───
  ...wallAlongZ("bacia-oeste", -20, -80, -118, 1.0, [2.6, 1.8, 2.2, 1.4, 2.0]),
  ...wallAlongZ("bacia-leste", 19, -78, -118, 1.0, [2.1, 2.7, 1.6, 2.3, 1.9]),
  ...wallAlongX("bacia-fundo", -118, -19, 18, 1.0, [2.4, 1.7, 2.9, 2.0]),

  // Marco 1 — o Mastro Inclinado. Silhueta alta que ancora a direção.
  block({ id: "mastro-base", kind: MONOLITH, x: 5, z: -104, w: 3.2, h: 1.4, d: 3.2, baseY: -0.4 }),
  block({ id: "mastro-fuste", kind: MONOLITH, x: 5.4, z: -104.3, w: 1.1, h: 13.5, d: 1.1, baseY: 0.6, yaw: 0.22 }),
  block({ id: "mastro-braco", kind: MONOLITH, x: 6.6, z: -104.6, w: 3.6, h: 0.5, d: 0.5, baseY: 9.4, yaw: 0.22 }),

  // Marco 2 — o vestígio. Ver VESTIGE_SIGNALS abaixo.
  // Sinal 1: a fundação, uma linha de blocos que para de repente.
  block({ id: "fundacao-1", kind: RUIN, x: -16.4, z: -84.6, w: 2.2, h: 0.9, d: 1.4, baseY: -0.5 }),
  block({ id: "fundacao-2", kind: RUIN, x: -14.0, z: -84.5, w: 2.2, h: 0.9, d: 1.4, baseY: -0.55 }),
  // Os dois últimos estão tortos e deslocados: a linha para aqui.
  block({ id: "fundacao-4", kind: RUIN, x: -8.6, z: -84.9, w: 2.0, h: 0.8, d: 1.3, baseY: -0.7, yaw: 0.26 }),
  block({ id: "fundacao-5", kind: RUIN, x: -6.9, z: -86.2, w: 1.8, h: 0.7, d: 1.2, baseY: -0.85, yaw: 0.61 }),

  // Sinal 2: o sulco. Restos rasos alinhados, saindo do assento vazio.
  block({ id: "sulco-1", kind: ROCK, x: -10.2, z: -87.4, w: 2.6, h: 0.28, d: 1.0, baseY: -0.22, yaw: 0.18 }),
  block({ id: "sulco-2", kind: ROCK, x: -8.4, z: -89.1, w: 2.6, h: 0.24, d: 1.0, baseY: -0.24, yaw: 0.34 }),
  block({ id: "sulco-3", kind: ROCK, x: -6.9, z: -90.9, w: 2.4, h: 0.22, d: 1.0, baseY: -0.26, yaw: 0.42 }),
  block({ id: "sulco-4", kind: ROCK, x: -5.7, z: -92.8, w: 2.2, h: 0.2, d: 0.9, baseY: -0.28, yaw: 0.5 }),

  // O bloco que faltava na linha, caído ao sul: a fundação foi aberta, não ruiu.
  block({ id: "fundacao-3", kind: RUIN, x: -12.6, z: -90.6, w: 2.2, h: 0.9, d: 1.4, baseY: -0.75, yaw: 0.85 }),

  // Sinal 3: o objeto deslocado, caído no fim do sulco, fora da linha.
  block({ id: "objeto-deslocado", kind: MONOLITH, x: -4.6, z: -95.2, w: 3.4, h: 1.6, d: 1.7, baseY: -0.45, yaw: 1.19 }),

  // Sinal 4: o assento vazio, onde a fundação foi aberta.
  block({ id: "assento-borda-oeste", kind: RUIN, x: -13.6, z: -86.4, w: 0.8, h: 0.6, d: 2.0, baseY: -0.6, yaw: 0.1 }),
  block({ id: "assento-borda-leste", kind: RUIN, x: -9.2, z: -86.6, w: 0.8, h: 0.5, d: 2.0, baseY: -0.7, yaw: -0.12 }),

  // Restos agrupados junto do assento, como se algo tivesse sido descarregado.
  block({ id: "restos-agrupados-a", kind: ROCK, x: -13.6, z: -88.9, w: 1.2, h: 0.7, d: 1.1, yaw: 0.8 }),
  block({ id: "restos-agrupados-b", kind: ROCK, x: -12.7, z: -89.8, w: 0.9, h: 0.5, d: 0.9, yaw: 0.3 }),
  block({ id: "restos-agrupados-c", kind: ROCK, x: -14.3, z: -90.2, w: 1.0, h: 0.6, d: 1.0, yaw: 1.4 }),

  block({ id: "bacia-resto-a", kind: ROCK, x: 12.4, z: -92, w: 2.4, h: 1.7, d: 2.1, yaw: 0.6 }),
  block({ id: "bacia-resto-b", kind: ROCK, x: -3.2, z: -110, w: 2.0, h: 1.4, d: 1.8, yaw: 0.9 }),
  block({ id: "bacia-resto-c", kind: RUIN, x: 13.8, z: -108, w: 1.6, h: 1.0, d: 2.4, yaw: 0.15 }),
];

/**
 * Os sinais do vestígio, nomeados para diagnóstico. Não aparecem ao jogador e
 * não explicam nada: existem para que a substituição futura por vestígios
 * causais sistêmicos saiba o que estava aqui.
 */
export const VESTIGE_SIGNALS = [
  { id: "fundacao-interrompida", blocks: ["fundacao-1", "fundacao-2", "fundacao-3", "fundacao-4", "fundacao-5"] },
  { id: "sulco-de-arrasto", blocks: ["sulco-1", "sulco-2", "sulco-3", "sulco-4"] },
  { id: "objeto-fora-da-linha", blocks: ["objeto-deslocado"] },
  { id: "assento-vazio", blocks: ["assento-borda-oeste", "assento-borda-leste"] },
  { id: "restos-agrupados", blocks: ["restos-agrupados-a", "restos-agrupados-b", "restos-agrupados-c"] },
] as const;

export const PHASE2_STREET: SceneDefinition = {
  id: "rua-interrompida",
  version: "2.0.0",
  seed: 20260819,
  spawn: { x: 0, z: 10 },
  spawnYaw: 0,
  groundHalfExtent: 150,
  obstacles: OBSTACLES,
  // O sulco é uma marca rasa: vê-se, atravessa-se.
  passableIds: ["sulco-1", "sulco-2", "sulco-3", "sulco-4"],

  heightPatches: [
    // Rampa e patamar no meio da compressão: a mudança de altura muda o ritmo.
    { id: "rampa-sobe", area: { minX: 1.2, maxX: 6.0, minZ: -56, maxZ: -52 }, height: 1.1, heightTo: 0, rampAxis: "z" },
    { id: "patamar", area: { minX: 1.2, maxX: 6.0, minZ: -59, maxZ: -56 }, height: 1.1 },
    { id: "rampa-desce", area: { minX: 1.2, maxX: 6.0, minZ: -63, maxZ: -59 }, height: 0, heightTo: 1.1, rampAxis: "z" },

    // Mirante da rota lateral: dali se olha por cima do muro baixo.
    { id: "mirante-rampa", area: { minX: -18.4, maxX: -14.6, minZ: -28, maxZ: -25 }, height: 0, heightTo: 1.9, rampAxis: "z" },
    { id: "mirante-plataforma", area: { minX: -18.4, maxX: -14.6, minZ: -25, maxZ: -21 }, height: 1.9 },
    { id: "mirante-descida", area: { minX: -18.4, maxX: -14.6, minZ: -21, maxZ: -18 }, height: 1.9, heightTo: 0, rampAxis: "z" },
  ],

  lights: [
    // Brasa presa no assento vazio: o calor que sobrou do que foi retirado.
    { id: "assento-brasa", position: { x: -11.2, y: 0.5, z: -86.2 }, color: 0xff7326, radius: 15, intensity: 20, flicker: 0.08 },
    // Coroa do mastro: emissão residual, quase parada.
    { id: "mastro-coroa", position: { x: 6.4, y: 12.8, z: -104.6 }, color: 0xc65cff, radius: 20, intensity: 26, flicker: 0.03 },
    // Cor localizada que denuncia a brecha da rota lateral.
    { id: "brecha-frio", position: { x: -11.4, y: 1.0, z: -16.4 }, color: 0x36d6d0, radius: 9, intensity: 7, flicker: 0.05 },
    // Veio quente no fim da compressão: antecipa a abertura.
    { id: "veio-quente", position: { x: 1.4, y: 0.6, z: -72 }, color: 0xff9a3c, radius: 8, intensity: 6, flicker: 0.07 },
  ],

  emitters: [
    { id: "vento-praca", position: { x: 0, z: -8 }, voice: "vento", radius: 26, gain: 0.5, route: "comum" },
    { id: "brecha-atrito", position: { x: -11.4, z: -16.4 }, voice: "atrito", radius: 11, gain: 0.62, route: "lateral" },
    { id: "gotejo-corredor", position: { x: 2.4, z: -54 }, voice: "gotejo", radius: 14, gain: 0.58, route: "direta" },
    { id: "assento-ressonancia", position: { x: -11.2, z: -86.2 }, voice: "ressonancia", radius: 20, gain: 0.7, route: "comum" },
  ],

  landmarks: [
    {
      id: "mastro-inclinado",
      position: { x: 5.4, z: -104.3 },
      beaconBase: 1.4,
      beaconHeight: 13.6,
      beaconHalfWidth: 0.3,
      segment: "revelacao",
      role: "direcao principal, visivel de longe por cima dos muros",
    },
    {
      id: "fundacao-interrompida",
      position: { x: -11.2, z: -86.2 },
      beaconBase: 0.25,
      beaconHeight: 3.4,
      beaconHalfWidth: 0.26,
      segment: "revelacao",
      role: "vestigio; o traco distante aparece pela alameda antes de ser compreendido",
    },
  ],

  vantages: [{ id: "mirante-alameda", position: { x: -16.5, z: -23 }, segment: "orientacao", route: "lateral" }],

  sectors: [
    { id: "s-orientacao", segment: "orientacao", area: { minX: -13, maxX: 16, minZ: -30, maxZ: 16 }, neighbours: ["s-compressao", "s-lateral-norte"] },
    { id: "s-compressao", segment: "compressao", area: { minX: -8, maxX: 10, minZ: -78, maxZ: -30 }, neighbours: ["s-orientacao", "s-revelacao"] },
    { id: "s-lateral-norte", segment: "orientacao", area: { minX: -26, maxX: -13, minZ: -52, maxZ: -13 }, neighbours: ["s-orientacao", "s-lateral-sul"] },
    { id: "s-lateral-sul", segment: "compressao", area: { minX: -26, maxX: -10, minZ: -84, maxZ: -52 }, neighbours: ["s-lateral-norte", "s-revelacao"] },
    { id: "s-revelacao", segment: "revelacao", area: { minX: -24, maxX: 22, minZ: -122, maxZ: -78 }, neighbours: ["s-compressao", "s-lateral-sul"] },
  ],

  routeNodes: [
    { id: "n-inicio", position: { x: 0, z: 10 }, segment: "orientacao", route: "comum" },
    { id: "n-praca", position: { x: 0, z: -16 }, segment: "orientacao", route: "comum" },
    { id: "n-brecha", position: { x: -11, z: -16.5 }, segment: "orientacao", route: "lateral" },
    { id: "n-funil", position: { x: 0, z: -30 }, segment: "compressao", route: "direta" },
    { id: "n-corredor", position: { x: 0, z: -42 }, segment: "compressao", route: "direta" },
    { id: "n-curva", position: { x: 3.6, z: -50 }, segment: "compressao", route: "direta" },
    { id: "n-patamar", position: { x: 3.6, z: -58 }, segment: "compressao", route: "direta" },
    { id: "n-corredor-sul", position: { x: 0.4, z: -68 }, segment: "compressao", route: "direta" },
    // A passagem da praça para a alameda acontece pela abertura em z -13..-19:
    // só depois de estar dentro dela o percurso desce para o sul.
    { id: "n-alameda-entrada", position: { x: -16.5, z: -16.5 }, segment: "orientacao", route: "lateral" },
    { id: "n-alameda-norte", position: { x: -16.5, z: -26 }, segment: "orientacao", route: "lateral" },
    { id: "n-mirante", position: { x: -16.5, z: -23 }, segment: "orientacao", route: "lateral" },
    { id: "n-alameda-sul", position: { x: -16.5, z: -70 }, segment: "compressao", route: "lateral" },
    // A alameda desemboca ao sul do muro; daí o percurso segue para leste antes
    // de descer pela abertura da fundação.
    { id: "n-alameda-saida", position: { x: -16.5, z: -81.5 }, segment: "revelacao", route: "lateral" },
    { id: "n-limiar", position: { x: -11.4, z: -81.5 }, segment: "revelacao", route: "lateral" },
    { id: "n-vestigio", position: { x: -11.4, z: -86.2 }, segment: "revelacao", route: "comum" },
    // Sobre o próprio sulco: daqui o rastro leva ao que foi arrastado.
    { id: "n-sulco", position: { x: -7.5, z: -89 }, segment: "revelacao", route: "comum" },
    { id: "n-bacia", position: { x: 0, z: -84 }, segment: "revelacao", route: "comum" },
    { id: "n-mastro", position: { x: 5.4, z: -102 }, segment: "revelacao", route: "comum" },
  ],

  routeEdges: [
    { from: "n-inicio", to: "n-praca", route: "comum", bidirectional: true },
    { from: "n-praca", to: "n-funil", route: "direta", bidirectional: true },
    { from: "n-funil", to: "n-corredor", route: "direta", bidirectional: true },
    { from: "n-corredor", to: "n-curva", route: "direta", bidirectional: true },
    { from: "n-curva", to: "n-patamar", route: "direta", bidirectional: true },
    { from: "n-patamar", to: "n-corredor-sul", route: "direta", bidirectional: true },
    { from: "n-corredor-sul", to: "n-bacia", route: "direta", bidirectional: true },

    { from: "n-praca", to: "n-brecha", route: "lateral", bidirectional: true },
    { from: "n-brecha", to: "n-alameda-entrada", route: "lateral", bidirectional: true },
    { from: "n-alameda-entrada", to: "n-mirante", route: "lateral", bidirectional: true },
    { from: "n-mirante", to: "n-alameda-norte", route: "lateral", bidirectional: true },
    { from: "n-alameda-norte", to: "n-alameda-sul", route: "lateral", bidirectional: true },
    { from: "n-alameda-sul", to: "n-alameda-saida", route: "lateral", bidirectional: true },
    { from: "n-alameda-saida", to: "n-limiar", route: "lateral", bidirectional: true },
    { from: "n-limiar", to: "n-vestigio", route: "lateral", bidirectional: true },

    { from: "n-vestigio", to: "n-sulco", route: "comum", bidirectional: true },
    { from: "n-sulco", to: "n-bacia", route: "comum", bidirectional: true },
    { from: "n-bacia", to: "n-mastro", route: "comum", bidirectional: true },
  ],

  segments: [
    { id: "orientacao", fromZ: 16, toZ: -28 },
    { id: "compressao", fromZ: -28, toZ: -78 },
    { id: "revelacao", fromZ: -78, toZ: -122 },
  ],
};

/** Percurso fechado da presença sonora móvel, herdada da Fase 1. */
export const PRESENCE_PATH = [
  { x: 8, z: -20 },
  { x: 1.6, z: -40 },
  { x: 4.4, z: -60 },
  { x: 8, z: -86 },
  { x: -2, z: -100 },
  { x: -14, z: -78 },
  { x: -16.5, z: -46 },
  { x: -9, z: -14 },
] as const;

export const PRESENCE_SPEED = 1.15;

