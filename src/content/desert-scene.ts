// Cena fixa da Fase 1. Conteudo orientado a dados (AGENT_RULES §5): o motor le
// esta tabela, nao possui excecoes para nenhum objeto em particular.
//
// Nao ha geracao procedural ampla nesta fase. O trecho existe para provar
// percepcao — chao, profundidade, obstaculo e orientacao —, nao para povoar um
// mundo. A ruina esta parcialmente enterrada e possui uma abertura, para que o
// jogador leia massa e passagem sem precisar de texto.

import type { Obstacle, Vec2 } from "../world/geometry";

export const SCENE_SEED = 1801;

/** Metade da extensao do chao materializado, em metros. */
export const GROUND_HALF_EXTENT = 120;

export const PLAYER_SPAWN: Vec2 = { x: 0, z: 6 };
/** Olhando para -Z, o norte da cena. */
export const PLAYER_SPAWN_YAW = 0;

export const OBSTACLES: readonly Obstacle[] = [
  // Muro de ruina parcialmente enterrado, com uma abertura ao centro.
  { id: "ruin-w", kind: "ruin", center: { x: -4.2, z: -9 }, size: { x: 5.2, y: 2.6, z: 0.9 }, baseY: -0.9, yaw: 0.04 },
  { id: "ruin-e", kind: "ruin", center: { x: 4.6, z: -9.2 }, size: { x: 4.4, y: 2.2, z: 0.9 }, baseY: -1.1, yaw: -0.06 },
  { id: "ruin-n", kind: "ruin", center: { x: 7.2, z: -13.4 }, size: { x: 0.9, y: 1.8, z: 6.0 }, baseY: -0.8, yaw: 0.02 },
  { id: "ruin-stub", kind: "ruin", center: { x: -6.6, z: -13.0 }, size: { x: 0.9, y: 1.2, z: 3.2 }, baseY: -0.5, yaw: 0.18 },

  // Blocos caidos junto da abertura: leem-se como massa proxima, nao como parede.
  { id: "block-a", kind: "ruin", center: { x: 0.4, z: -11.8 }, size: { x: 1.4, y: 0.8, z: 1.2 }, baseY: -0.2, yaw: 0.6 },
  { id: "block-b", kind: "ruin", center: { x: 1.9, z: -12.6 }, size: { x: 1.0, y: 0.5, z: 1.0 }, baseY: -0.15, yaw: 1.1 },

  // Pedras espalhadas: referencia de distancia entre o jogador e a ruina.
  { id: "rock-a", kind: "rock", center: { x: -3.1, z: 1.2 }, size: { x: 1.6, y: 1.1, z: 1.4 }, baseY: -0.25, yaw: 0.4 },
  { id: "rock-b", kind: "rock", center: { x: 5.4, z: -1.6 }, size: { x: 2.1, y: 1.5, z: 1.8 }, baseY: -0.3, yaw: 0.9 },
  { id: "rock-c", kind: "rock", center: { x: -8.5, z: -3.4 }, size: { x: 2.6, y: 1.9, z: 2.2 }, baseY: -0.4, yaw: 0.2 },
  { id: "rock-d", kind: "rock", center: { x: 9.8, z: 3.2 }, size: { x: 1.8, y: 1.2, z: 1.6 }, baseY: -0.2, yaw: 1.4 },
  { id: "rock-e", kind: "rock", center: { x: -12.4, z: 4.8 }, size: { x: 3.0, y: 2.2, z: 2.6 }, baseY: -0.5, yaw: 0.7 },
  { id: "rock-f", kind: "rock", center: { x: 13.2, z: -7.4 }, size: { x: 2.4, y: 1.7, z: 2.0 }, baseY: -0.35, yaw: 0.1 },
  { id: "rock-g", kind: "rock", center: { x: -2.2, z: 14.6 }, size: { x: 2.0, y: 1.4, z: 1.8 }, baseY: -0.3, yaw: 1.0 },
  { id: "rock-h", kind: "rock", center: { x: 7.6, z: 12.2 }, size: { x: 1.5, y: 1.0, z: 1.3 }, baseY: -0.2, yaw: 0.5 },

  // Pedra de prova, pequena e apoiada. Existe para o diagnostico do Eco de
  // Contato: apoiada produz eco, suspensa nao produz.
  { id: "probe-stone", kind: "rock", center: { x: 1.6, z: 1.4 }, size: { x: 0.9, y: 0.7, z: 0.8 }, baseY: -0.1, yaw: 0.3 },

  // Monolito inclinado: silhueta alta o bastante para ancorar a orientacao.
  { id: "monolith", kind: "monolith", center: { x: -15.5, z: -14.5 }, size: { x: 1.2, y: 6.5, z: 1.2 }, baseY: -0.6, yaw: 0.35 },
];

/**
 * Fontes de luz que pertencem ao mundo, nunca ao personagem. O chao so aparece
 * onde alguma delas alcanca; longe de todas, o terreno some no preto.
 *
 * Esta e o calor que escapa da maquina soterrada sob a ruina — a mesma maquina
 * do cenario de ouro do Plano §8. A luz tem origem no mundo e uma causa.
 */
export type LightSource = {
  id: string;
  position: { x: number; y: number; z: number };
  color: number;
  /** Alcance em metros. Alem dele a fonte nao contribui. */
  radius: number;
  intensity: number;
  /** Amplitude e ritmo da oscilacao, em fracao da intensidade. */
  flicker: number;
};

export const LIGHT_SOURCES: readonly LightSource[] = [
  {
    id: "ember-maquina",
    position: { x: 0.9, y: 0.85, z: -11.7 },
    color: 0xff7326,
    radius: 14,
    intensity: 16,
    flicker: 0.09,
  },
];

/**
 * Percurso fechado da presenca sonora. Ela nunca e desenhada: existe para o
 * ouvido e para um unico contato ambiguo no radar. O caminho passa perto do
 * ponto inicial e depois se afasta, para que aproximacao e afastamento sejam
 * perceptiveis sem que a fonte seja identificada.
 */
export const PRESENCE_PATH: readonly Vec2[] = [
  { x: 16, z: 10 },
  { x: 6, z: -2 },
  { x: -2, z: -5 },
  { x: -14, z: -2 },
  { x: -18, z: 12 },
  { x: -4, z: 20 },
  { x: 12, z: 18 },
];

/** Metros por segundo da presenca. Lenta o bastante para ser seguida de ouvido. */
export const PRESENCE_SPEED = 1.15;
