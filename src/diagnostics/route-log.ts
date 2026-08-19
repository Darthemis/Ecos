// Registro do percurso. Local, diagnóstico, sem rede.
//
// Não envia telemetria, não usa backend, não guarda nada sobre a pessoa: só uma
// sequência de posições do corpo no mundo, com o trecho e a rota inferidos da
// própria geometria. Não toca a simulação — recebe cópias e devolve leituras.

import type { Vec2 } from "../world/geometry";
import type { RouteId, SceneDefinition, SegmentId } from "../world/scene";
import { rectContains, segmentAt } from "../world/scene";

/** Intervalo entre amostras, em segundos. */
export const SAMPLE_SECONDS = 0.35;

/** Abaixo desta velocidade média, por este tempo, conta-se uma hesitação. */
const HESITATION_SPEED = 0.25;
const HESITATION_SECONDS = 1.4;

export type RouteSample = {
  t: number;
  x: number;
  z: number;
  segment: SegmentId | null;
  route: RouteId;
};

export type RouteSummary = {
  samples: number;
  seconds: number;
  distance: number;
  hesitations: number;
  /** Quantas vezes o percurso voltou para um trecho anterior. */
  returns: number;
  perSegment: Record<string, number>;
  perRoute: Record<string, number>;
};

const SEGMENT_ORDER: SegmentId[] = ["orientacao", "compressao", "revelacao"];

/**
 * A rota vem da posição, não de um estado escondido: quem está a oeste dos
 * setores laterais está na lateral.
 */
export function routeAt(scene: SceneDefinition, point: Vec2): RouteId {
  for (const sector of scene.sectors) {
    if (!rectContains(sector.area, point)) continue;
    if (sector.id.includes("lateral")) return "lateral";
    if (sector.id.includes("compressao")) return "direta";
  }
  return "comum";
}

export type RouteLog = {
  sample: (seconds: number, position: Vec2) => void;
  summary: () => RouteSummary;
  samples: () => readonly RouteSample[];
  toText: () => string;
  reset: () => void;
};

export function createRouteLog(scene: SceneDefinition): RouteLog {
  const samples: RouteSample[] = [];
  let lastSampleAt = -Infinity;
  let stillSince: number | null = null;
  let hesitations = 0;
  let returns = 0;
  let deepestSegment = -1;

  return {
    sample(seconds, position) {
      if (seconds - lastSampleAt < SAMPLE_SECONDS) return;
      lastSampleAt = seconds;

      const segment = segmentAt(scene, position);
      const entry: RouteSample = {
        t: Number(seconds.toFixed(2)),
        x: Number(position.x.toFixed(2)),
        z: Number(position.z.toFixed(2)),
        segment,
        route: routeAt(scene, position),
      };

      const previous = samples[samples.length - 1];
      if (previous !== undefined) {
        const step = Math.hypot(entry.x - previous.x, entry.z - previous.z);
        const elapsed = entry.t - previous.t;
        const speed = elapsed > 0 ? step / elapsed : 0;

        if (speed < HESITATION_SPEED) {
          if (stillSince === null) stillSince = previous.t;
          else if (entry.t - stillSince >= HESITATION_SECONDS) {
            hesitations += 1;
            stillSince = entry.t;
          }
        } else {
          stillSince = null;
        }
      }

      const index = segment === null ? -1 : SEGMENT_ORDER.indexOf(segment);
      if (index >= 0) {
        if (index > deepestSegment) deepestSegment = index;
        else if (index < deepestSegment) {
          returns += 1;
          deepestSegment = index;
        }
      }

      samples.push(entry);
    },

    summary() {
      let distance = 0;
      const perSegment: Record<string, number> = {};
      const perRoute: Record<string, number> = {};

      for (let i = 0; i < samples.length; i += 1) {
        const entry = samples[i]!;
        const key = entry.segment ?? "fora";
        perSegment[key] = (perSegment[key] ?? 0) + 1;
        perRoute[entry.route] = (perRoute[entry.route] ?? 0) + 1;
        if (i === 0) continue;
        const previous = samples[i - 1]!;
        distance += Math.hypot(entry.x - previous.x, entry.z - previous.z);
      }

      const first = samples[0];
      const last = samples[samples.length - 1];
      return {
        samples: samples.length,
        seconds: first === undefined || last === undefined ? 0 : Number((last.t - first.t).toFixed(2)),
        distance: Number(distance.toFixed(2)),
        hesitations,
        returns,
        perSegment,
        perRoute,
      };
    },

    samples() {
      return samples;
    },

    /** Exportação local: uma linha por amostra, legível sem ferramenta alguma. */
    toText() {
      const header = `# percurso ${scene.id} v${scene.version} seed ${scene.seed}\n# t\tx\tz\ttrecho\trota`;
      const body = samples.map((s) => `${s.t}\t${s.x}\t${s.z}\t${s.segment ?? "-"}\t${s.route}`).join("\n");
      return `${header}\n${body}\n`;
    },

    reset() {
      samples.length = 0;
      lastSampleAt = -Infinity;
      stillSince = null;
      hesitations = 0;
      returns = 0;
      deepestSegment = -1;
    },
  };
}
