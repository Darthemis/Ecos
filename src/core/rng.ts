// Fonte unica de aleatoriedade. AGENT_RULES §5: aleatoriedade vem de gerador
// controlado por seed, nunca de chamadas dispersas e irrecuperaveis.

export type Rng = () => number;

/** mulberry32: pequeno, rapido e reproduzivel entre execucoes e plataformas. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
