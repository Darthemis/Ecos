// Acumulador de passo fixo. A renderizacao interpola no tempo real; a simulacao
// avanca sempre em ticks de duracao identica (AGENT_RULES §5).

export const TICKS_PER_SECOND = 60;
export const TICK_SECONDS = 1 / TICKS_PER_SECOND;

/** Teto de ticks por quadro: impede a espiral da morte apos uma pausa longa. */
export const MAX_TICKS_PER_FRAME = 5;

export type StepPlan = {
  /** Quantos ticks executar neste quadro. */
  ticks: number;
  /** Sobra a carregar para o proximo quadro, em segundos. */
  carry: number;
  /** Segundos descartados por exceder o teto; util para diagnostico. */
  dropped: number;
};

export function planSteps(accumulatedSeconds: number): StepPlan {
  const wanted = Math.floor(accumulatedSeconds / TICK_SECONDS);
  const ticks = Math.min(wanted, MAX_TICKS_PER_FRAME);
  const carry = accumulatedSeconds - wanted * TICK_SECONDS;
  const dropped = (wanted - ticks) * TICK_SECONDS;
  return { ticks, carry, dropped };
}
