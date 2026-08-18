// Intencao de um quadro. A camada de Entrada produz este valor; a Simulacao o
// consome. Nenhum dos dois lados conhece o outro (AGENT_RULES §5).

export type MoveIntent = {
  /** -1 (tras) a 1 (frente) */
  forward: number;
  /** -1 (esquerda) a 1 (direita) */
  strafe: number;
};

export type LookIntent = {
  /** radianos acumulados no quadro */
  yaw: number;
  pitch: number;
};

export type FrameIntent = {
  move: MoveIntent;
  look: LookIntent;
};

export const NEUTRAL_INTENT: FrameIntent = {
  move: { forward: 0, strafe: 0 },
  look: { yaw: 0, pitch: 0 },
};

export function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, value));
}
