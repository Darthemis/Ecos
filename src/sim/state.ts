import type { Vec2 } from "../world/geometry";

export type PlayerState = {
  position: Vec2;
  /** Radianos. 0 olha para -Z; cresce no sentido anti-horario visto de cima. */
  yaw: number;
  /** Radianos, limitado por MAX_PITCH. */
  pitch: number;
};

export type PresenceState = {
  position: Vec2;
  /** Distancia percorrida ao longo do percurso fechado, em metros. */
  travelled: number;
};

export type WorldState = {
  tick: number;
  player: PlayerState;
  presence: PresenceState;
};

export const PLAYER_RADIUS = 0.34;
export const PLAYER_EYE_HEIGHT = 1.66;
export const WALK_SPEED = 1.75;
export const MAX_PITCH = (85 * Math.PI) / 180;
