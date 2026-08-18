// Percepcao: decide o que pode ser detectado e com qual fidelidade. Nao desenha
// nada e nao revela estado global sem regra (AGENT_RULES §5).

import { distance, wrapAngle, type Vec2 } from "./geometry";
import type { WorldState } from "../sim/state";

/** Alcances visuais desta fase, em metros. */
export const VISUAL_RANGES = [8, 15, 25] as const;
export type VisualRange = (typeof VISUAL_RANGES)[number];
export const DEFAULT_VISUAL_RANGE: VisualRange = 15;

/** Alcance do radar. Independe da visao: o radar percebe o que a vista nao alcanca. */
export const RADAR_RANGE = 30;

export type RadarContact = {
  /** Angulo relativo ao olhar, em radianos. 0 e a frente. */
  bearing: number;
  /** 0 no jogador, 1 na borda do alcance do radar. */
  normalizedDistance: number;
  /** 0 a 1. Cai com a distancia; o radar nao informa o que o contato e. */
  strength: number;
};

export function radarContact(state: WorldState): RadarContact | null {
  const meters = distance(state.player.position, state.presence.position);
  if (meters > RADAR_RANGE) return null;

  const bearing = relativeBearing(state.player.position, state.presence.position, state.player.yaw);
  const normalizedDistance = Math.min(1, meters / RADAR_RANGE);
  const strength = 1 - normalizedDistance ** 0.7;

  return { bearing, normalizedDistance, strength };
}

/**
 * Angulo do alvo em relacao ao olhar. Positivo a direita, negativo a esquerda,
 * porque yaw 0 aponta para -Z.
 */
export function relativeBearing(from: Vec2, to: Vec2, yaw: number): number {
  const worldBearing = Math.atan2(to.x - from.x, -(to.z - from.z));
  return wrapAngle(worldBearing - yaw);
}

export function nextVisualRange(current: VisualRange): VisualRange {
  const index = VISUAL_RANGES.indexOf(current);
  const next = VISUAL_RANGES[(index + 1) % VISUAL_RANGES.length];
  return next ?? DEFAULT_VISUAL_RANGE;
}
