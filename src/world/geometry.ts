// Espaco e colisao. Matematica pura: nao conhece Three.js nem DOM.

import type { SurfaceMaterialId } from "./surface-material";

export type Vec2 = { x: number; z: number };

export type Aabb = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type ObstacleKind = "rock" | "ruin" | "monolith";

export type Obstacle = {
  id: string;
  kind: ObstacleKind;
  /**
   * Material da superficie. Ausente significa o material de fabrica do tipo
   * (`MATERIAL_BY_KIND`): o tipo diz o que a coisa e, o material diz do que ela
   * e feita, e os dois deixaram de ser a mesma decisao.
   */
  material?: SurfaceMaterialId;
  center: Vec2;
  /** Extensao total em cada eixo, em metros. */
  size: { x: number; y: number; z: number };
  /** Deslocamento vertical da base; negativo significa parcialmente enterrado. */
  baseY: number;
  yaw: number;
};

/**
 * Caixa de colisao no plano XZ. A rotacao visual do obstaculo nao gira a caixa:
 * a colisao permanece alinhada aos eixos e um pouco mais generosa, o que evita
 * que o jogador encoste em um canto invisivel.
 */
export function obstacleAabb(obstacle: Obstacle): Aabb {
  const spread = Math.abs(Math.cos(obstacle.yaw)) * obstacle.size.x + Math.abs(Math.sin(obstacle.yaw)) * obstacle.size.z;
  const depth = Math.abs(Math.sin(obstacle.yaw)) * obstacle.size.x + Math.abs(Math.cos(obstacle.yaw)) * obstacle.size.z;
  return {
    minX: obstacle.center.x - spread / 2,
    maxX: obstacle.center.x + spread / 2,
    minZ: obstacle.center.z - depth / 2,
    maxZ: obstacle.center.z + depth / 2,
  };
}

export function circleIntersectsAabb(center: Vec2, radius: number, box: Aabb): boolean {
  const nearestX = Math.max(box.minX, Math.min(center.x, box.maxX));
  const nearestZ = Math.max(box.minZ, Math.min(center.z, box.maxZ));
  const dx = center.x - nearestX;
  const dz = center.z - nearestZ;
  return dx * dx + dz * dz < radius * radius;
}

export function blocked(position: Vec2, radius: number, boxes: readonly Aabb[]): boolean {
  for (const box of boxes) {
    if (circleIntersectsAabb(position, radius, box)) return true;
  }
  return false;
}

/**
 * Move por eixo separado. Cada eixo e aceito apenas se sozinho nao colidir, o
 * que produz deslizamento ao longo de uma parede em vez de travamento seco.
 */
export function resolveMove(from: Vec2, delta: Vec2, radius: number, boxes: readonly Aabb[]): Vec2 {
  let { x, z } = from;

  const tryX = { x: x + delta.x, z };
  if (!blocked(tryX, radius, boxes)) x = tryX.x;

  const tryZ = { x, z: z + delta.z };
  if (!blocked(tryZ, radius, boxes)) z = tryZ.z;

  return { x, z };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Normaliza um angulo para o intervalo [-PI, PI). */
export function wrapAngle(radians: number): number {
  const wrapped = ((radians + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  return wrapped - Math.PI;
}
