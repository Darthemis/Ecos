// Altura do terreno. Puro, deterministico, sem motor de fisica.
//
// A menor representacao coerente de degrau: a altura do chao e uma funcao de
// (x, z) definida por regioes de dados. O corpo acompanha essa altura em vez de
// cair, saltar ou colidir verticalmente. Rampas sobem; patamares sao planos;
// tudo que o corpo nao deve subir e obstaculo, nao regiao de altura.
//
// Limitacao registrada: nao existe passagem por baixo de nada, porque a altura
// e uma funcao de valor unico. Um tunel com terreno por cima exigiria mudanca
// arquitetural desproporcional para esta fase.

import type { Vec2 } from "./geometry";
import { rectContains, type HeightPatch, type SceneDefinition } from "./scene";

/** Altura maxima que o corpo sobe de uma vez sem que a subida seja bloqueada. */
export const MAX_STEP_UP = 0.45;

export function patchHeightAt(patch: HeightPatch, point: Vec2): number | null {
  if (!rectContains(patch.area, point)) return null;
  if (patch.heightTo === undefined || patch.rampAxis === undefined) return patch.height;

  const { area } = patch;
  const span = patch.rampAxis === "x" ? area.maxX - area.minX : area.maxZ - area.minZ;
  if (span <= 0) return patch.height;

  const travelled = patch.rampAxis === "x" ? point.x - area.minX : point.z - area.minZ;
  const t = Math.max(0, Math.min(1, travelled / span));
  return patch.height + (patch.heightTo - patch.height) * t;
}

/** A regiao mais alta vence: patamares sobrepostos nao se cancelam. */
export function groundHeightAt(scene: SceneDefinition, point: Vec2): number {
  let height = 0;
  for (const patch of scene.heightPatches) {
    const local = patchHeightAt(patch, point);
    if (local !== null && local > height) height = local;
  }
  return height;
}

/** Um degrau alto demais bloqueia o passo, em vez de teleportar o corpo. */
export function canStepFrom(scene: SceneDefinition, from: Vec2, to: Vec2): boolean {
  return groundHeightAt(scene, to) - groundHeightAt(scene, from) <= MAX_STEP_UP;
}
