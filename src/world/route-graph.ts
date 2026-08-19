// Grafo das rotas. Existe para que conectividade e retorno sejam verificaveis
// por teste, e nao apenas afirmados.
//
// Nao guia o jogador e nao aparece na tela: o percurso e compreendido pela forma
// do lugar. O grafo apenas declara o que o desenho da rua promete.

import type { RouteId, SceneDefinition } from "./scene";

export type Adjacency = Map<string, Set<string>>;

export function buildAdjacency(scene: SceneDefinition, allowed?: RouteId[]): Adjacency {
  const adjacency: Adjacency = new Map();
  for (const node of scene.routeNodes) adjacency.set(node.id, new Set());

  for (const edge of scene.routeEdges) {
    if (allowed !== undefined && !allowed.includes(edge.route)) continue;
    adjacency.get(edge.from)?.add(edge.to);
    // Toda aresta vale nos dois sentidos: o retorno e propriedade do desenho.
    adjacency.get(edge.to)?.add(edge.from);
  }
  return adjacency;
}

export function pathBetween(adjacency: Adjacency, from: string, to: string): string[] | null {
  if (!adjacency.has(from) || !adjacency.has(to)) return null;

  const previous = new Map<string, string | null>([[from, null]]);
  const queue = [from];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === to) {
      const path: string[] = [];
      let step: string | null = current;
      while (step !== null) {
        path.unshift(step);
        step = previous.get(step) ?? null;
      }
      return path;
    }
    for (const next of adjacency.get(current) ?? []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      queue.push(next);
    }
  }
  return null;
}

/** Comprimento em metros de um caminho de nos. */
export function pathLength(scene: SceneDefinition, path: readonly string[]): number {
  const byId = new Map(scene.routeNodes.map((node) => [node.id, node]));
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    const a = byId.get(path[i - 1]!);
    const b = byId.get(path[i]!);
    if (a === undefined || b === undefined) continue;
    total += Math.hypot(b.position.x - a.position.x, b.position.z - a.position.z);
  }
  return total;
}
