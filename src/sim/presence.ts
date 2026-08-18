import type { Vec2 } from "../world/geometry";

/**
 * Posicao ao longo de um percurso fechado, em funcao da distancia percorrida.
 * Funcao pura do comprimento: dado o mesmo tick, o resultado e sempre o mesmo.
 */
export function pointOnLoop(path: readonly Vec2[], travelled: number): Vec2 {
  const first = path[0];
  if (first === undefined) return { x: 0, z: 0 };
  if (path.length === 1) return { ...first };

  const total = loopLength(path);
  if (total === 0) return { ...first };

  let remaining = ((travelled % total) + total) % total;

  for (let i = 0; i < path.length; i += 1) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    if (a === undefined || b === undefined) break;
    const segment = Math.hypot(b.x - a.x, b.z - a.z);
    if (remaining <= segment || i === path.length - 1) {
      const t = segment === 0 ? 0 : remaining / segment;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    remaining -= segment;
  }

  return { ...first };
}

export function loopLength(path: readonly Vec2[]): number {
  let total = 0;
  for (let i = 0; i < path.length; i += 1) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    if (a === undefined || b === undefined) continue;
    total += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return total;
}
