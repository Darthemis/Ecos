// Descricao de um lugar. Dados puros: nao conhece Three.js, DOM nem entrada.
//
// O motor le estes tipos e nada mais. Nao ha condicional em nenhum sistema para
// uma rua em particular — trocar de lugar e trocar de dado.

import type { Obstacle, Vec2 } from "./geometry";

/** Trecho perceptivo do percurso. Serve a setores, diagnostico e registro. */
export type SegmentId = "orientacao" | "compressao" | "revelacao";

/** Qual rota um ponto do espaco pertence. */
export type RouteId = "direta" | "lateral" | "comum";

export type Rect = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

/**
 * Regiao de altura do terreno. `rampAxis` define por qual eixo a altura sobe de
 * `height` ate `heightTo`; ausente, a regiao e um patamar plano.
 *
 * E a menor representacao coerente de degrau que nao exige motor de fisica: a
 * altura do chao e uma funcao de (x, z), e o corpo simplesmente a acompanha.
 */
export type HeightPatch = {
  id: string;
  area: Rect;
  height: number;
  heightTo?: number;
  rampAxis?: "x" | "z";
};

/** Fonte de luz que pertence ao mundo. Nunca a camera. */
export type LightSource = {
  id: string;
  position: { x: number; y: number; z: number };
  color: number;
  radius: number;
  intensity: number;
  flicker: number;
};

/** Timbres sintetizados disponiveis. Nenhum arquivo de audio no repositorio. */
export type EmitterVoice = "vento" | "gotejo" | "ressonancia" | "atrito";

export type SoundEmitter = {
  id: string;
  position: Vec2;
  voice: EmitterVoice;
  /** Alcance util em metros. */
  radius: number;
  gain: number;
  /** Rota que este som ajuda a distinguir, quando aplicavel. */
  route?: RouteId;
};

/**
 * Marco: um lugar que se reconhece de longe e de perto. A representacao
 * distante e um sinal pequeno e sem nevoa — a unica forma de existir orientacao
 * para alem do alcance visual sem acender o mundo.
 */
export type Landmark = {
  id: string;
  position: Vec2;
  /** Base e topo do sinal distante. Ele e um traco vertical, nao um ponto: um
   * ponto unico sai do enquadramento quando o jogador se aproxima. */
  beaconBase: number;
  beaconHeight: number;
  /** Cor semantica do sinal distante; nao colore a geometria do mundo. */
  beaconColor: number;
  /** Meia largura do sinal distante, em metros. */
  beaconHalfWidth: number;
  segment: SegmentId;
  /** Descreve o papel do marco para diagnostico; nunca aparece ao jogador. */
  role: string;
};

/** Ponto de onde se observa o percurso de outro angulo. */
export type Vantage = {
  id: string;
  position: Vec2;
  segment: SegmentId;
  route: RouteId;
};

/** Setor espacial. So o conteudo dos setores ativos alimenta a cena detalhada. */
export type Sector = {
  id: string;
  segment: SegmentId;
  area: Rect;
  /** Setores adjacentes, que permanecem ativos junto com este. */
  neighbours: readonly string[];
};

/** No do grafo de rota. As arestas provam conectividade e retorno. */
export type RouteNode = {
  id: string;
  position: Vec2;
  segment: SegmentId;
  route: RouteId;
};

export type RouteEdge = {
  from: string;
  to: string;
  route: RouteId;
  /** Toda aresta e percorrivel nos dois sentidos: o jogador sempre pode voltar. */
  bidirectional: true;
};

export type SceneDefinition = {
  id: string;
  version: string;
  seed: number;
  spawn: Vec2;
  spawnYaw: number;
  /** Metade da extensao do terreno materializado, em metros. */
  groundHalfExtent: number;
  obstacles: readonly Obstacle[];
  /**
   * Volumes que se veem mas não barram o corpo: marcas rasas no terreno, como
   * um sulco de arrasto. Continuam produzindo Eco de Contato, porque tocam o
   * chão; apenas não são parede.
   */
  passableIds: readonly string[];
  heightPatches: readonly HeightPatch[];
  lights: readonly LightSource[];
  emitters: readonly SoundEmitter[];
  landmarks: readonly Landmark[];
  vantages: readonly Vantage[];
  sectors: readonly Sector[];
  routeNodes: readonly RouteNode[];
  routeEdges: readonly RouteEdge[];
  /** Limites de cada trecho ao longo de Z, do inicio ao fim do percurso. */
  segments: readonly { id: SegmentId; fromZ: number; toZ: number }[];
};

export function rectContains(rect: Rect, point: Vec2): boolean {
  return point.x >= rect.minX && point.x <= rect.maxX && point.z >= rect.minZ && point.z <= rect.maxZ;
}

export function rectExpanded(rect: Rect, margin: number): Rect {
  return {
    minX: rect.minX - margin,
    maxX: rect.maxX + margin,
    minZ: rect.minZ - margin,
    maxZ: rect.maxZ + margin,
  };
}

/** Em qual trecho esta uma posicao. Usa Z, o eixo do percurso. */
export function segmentAt(scene: SceneDefinition, position: Vec2): SegmentId | null {
  for (const segment of scene.segments) {
    const from = Math.max(segment.fromZ, segment.toZ);
    const to = Math.min(segment.fromZ, segment.toZ);
    if (position.z <= from && position.z >= to) return segment.id;
  }
  return null;
}

