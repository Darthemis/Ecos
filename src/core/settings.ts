// Ajustes de conforto. Puros e mínimos: esta fase não abre um sistema de
// configurações, apenas o que o teste humano exige para não machucar ninguém.

export const SENSITIVITY_MIN = 0.4;
export const SENSITIVITY_MAX = 2.4;
export const SENSITIVITY_STEP = 0.2;
export const SENSITIVITY_DEFAULT = 1;

export type ComfortSettings = {
  /** Multiplica a velocidade da visada, para mouse, arrasto e setas. */
  sensitivity: number;
  /** Congela oscilação de luzes e pulsação do radar. */
  flickerReduced: boolean;
};

export const DEFAULT_COMFORT: ComfortSettings = {
  sensitivity: SENSITIVITY_DEFAULT,
  flickerReduced: false,
};

export function clampSensitivity(value: number): number {
  const stepped = Math.round(value / SENSITIVITY_STEP) * SENSITIVITY_STEP;
  return Number(Math.max(SENSITIVITY_MIN, Math.min(SENSITIVITY_MAX, stepped)).toFixed(2));
}

export function adjustSensitivity(current: number, direction: -1 | 1): number {
  return clampSensitivity(current + direction * SENSITIVITY_STEP);
}
