// Setores. Decidem qual conteudo espacial alimenta a cena detalhada.
//
// Puro e sem efeito sobre a simulacao: a colisao continua consultando todos os
// volumes, sempre. Um setor inativo deixa de ser desenhado, nunca deixa de
// existir para o corpo.

import type { Vec2 } from "./geometry";
import { rectContains, rectExpanded, type SceneDefinition, type Sector } from "./scene";

/** Margem em metros ao redor do setor, para que a troca nao aconteca na borda. */
export const SECTOR_MARGIN = 6;

export function sectorAt(scene: SceneDefinition, position: Vec2): Sector | null {
  for (const sector of scene.sectors) {
    if (rectContains(sector.area, position)) return sector;
  }
  // Fora de qualquer setor, vale o mais proximo: nada some por estar na borda.
  let closest: Sector | null = null;
  let best = Infinity;
  for (const sector of scene.sectors) {
    const cx = (sector.area.minX + sector.area.maxX) / 2;
    const cz = (sector.area.minZ + sector.area.maxZ) / 2;
    const distance = Math.hypot(position.x - cx, position.z - cz);
    if (distance < best) {
      best = distance;
      closest = sector;
    }
  }
  return closest;
}

/**
 * Setores ativos: aquele onde o jogador esta, seus vizinhos declarados, e
 * qualquer outro cuja area alargada ainda o contenha.
 */
export function activeSectorIds(scene: SceneDefinition, position: Vec2): Set<string> {
  const active = new Set<string>();
  const current = sectorAt(scene, position);
  if (current === null) return active;

  active.add(current.id);
  for (const id of current.neighbours) active.add(id);

  for (const sector of scene.sectors) {
    if (rectContains(rectExpanded(sector.area, SECTOR_MARGIN), position)) active.add(sector.id);
  }
  return active;
}

/** A qual setor pertence um ponto do mundo, para distribuir os objetos. */
export function sectorIdForPoint(scene: SceneDefinition, point: Vec2): string | null {
  return sectorAt(scene, point)?.id ?? null;
}
