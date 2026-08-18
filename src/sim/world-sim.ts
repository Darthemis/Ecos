// Simulacao. Avanca em ticks de duracao fixa, nunca le o relogio de parede e
// nao conhece Three.js, DOM ou taxa de quadros (AGENT_RULES §5).

import { TICK_SECONDS } from "../core/fixed-step";
import { clampAxis, type FrameIntent } from "../core/intent";
import {
  OBSTACLES,
  PLAYER_SPAWN,
  PLAYER_SPAWN_YAW,
  PRESENCE_PATH,
  PRESENCE_SPEED,
} from "../content/desert-scene";
import { obstacleAabb, resolveMove, type Aabb } from "../world/geometry";
import { pointOnLoop } from "./presence";
import {
  MAX_PITCH,
  PLAYER_RADIUS,
  WALK_SPEED,
  type WorldState,
} from "./state";

export const COLLIDERS: readonly Aabb[] = OBSTACLES.map(obstacleAabb);

export function createWorldState(): WorldState {
  return {
    tick: 0,
    player: {
      position: { ...PLAYER_SPAWN },
      yaw: PLAYER_SPAWN_YAW,
      pitch: 0,
    },
    presence: {
      position: pointOnLoop(PRESENCE_PATH, 0),
      travelled: 0,
    },
  };
}

/** Aplica a rotacao do quadro. A visada e continua; nao se divide por tick. */
export function applyLook(state: WorldState, intent: FrameIntent): WorldState {
  const yaw = state.player.yaw - intent.look.yaw;
  const pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, state.player.pitch - intent.look.pitch));
  return { ...state, player: { ...state.player, yaw, pitch } };
}

/** Um tick de simulacao. Puro: mesmo estado e mesma intencao, mesmo resultado. */
export function stepOnce(state: WorldState, intent: FrameIntent, colliders: readonly Aabb[] = COLLIDERS): WorldState {
  const forward = clampAxis(intent.move.forward);
  const strafe = clampAxis(intent.move.strafe);

  let dx = 0;
  let dz = 0;
  if (forward !== 0 || strafe !== 0) {
    const length = Math.hypot(forward, strafe);
    const nf = forward / length;
    const ns = strafe / length;
    const sin = Math.sin(state.player.yaw);
    const cos = Math.cos(state.player.yaw);
    // yaw 0 aponta para -Z; +strafe aponta para a direita do olhar.
    const step = WALK_SPEED * TICK_SECONDS;
    dx = (-nf * sin + ns * cos) * step;
    dz = (-nf * cos - ns * sin) * step;
  }

  const position = resolveMove(state.player.position, { x: dx, z: dz }, PLAYER_RADIUS, colliders);
  const travelled = state.presence.travelled + PRESENCE_SPEED * TICK_SECONDS;

  return {
    tick: state.tick + 1,
    player: { ...state.player, position },
    presence: { position: pointOnLoop(PRESENCE_PATH, travelled), travelled },
  };
}

/**
 * Avanca `ticks` passos com a mesma intencao de movimento, aplicando a visada
 * uma unica vez. Assim o resultado depende apenas de (estado, intencao, ticks),
 * o que torna a determinacao verificavel por teste.
 */
export function advance(
  state: WorldState,
  intent: FrameIntent,
  ticks: number,
  colliders: readonly Aabb[] = COLLIDERS,
): WorldState {
  let next = applyLook(state, intent);
  for (let i = 0; i < ticks; i += 1) {
    next = stepOnce(next, intent, colliders);
  }
  return next;
}
