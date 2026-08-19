// Campo luminoso do lugar. Puro, determinístico, calculado uma vez.
//
// ── Por que este caminho, e não o mais simples ──────────────────────────────
//
// A alternativa mais simples compatível com o renderizador atual seria dar duas
// luzes pontuais a cada fonte: uma de núcleo, curta e forte, e uma de cauda,
// longa e fraca. Custa pouco e não muda nada no pipeline. Mas luz pontual em
// Three.js sem mapa de sombra **não é bloqueada por nada**: a cauda atravessaria
// os muros do corredor como se não existissem, e o §8 pede justamente que
// grandes estruturas reduzam a propagação. Mapas de sombra por fonte estão fora
// de escopo e competiriam com o orçamento da simulação.
//
// Este campo resolve os três pedidos de uma vez: cauda extensa, bloqueio
// aproximado e custo constante em execução. É uma grade rasa sobre o plano XZ,
// assada uma única vez na abertura, consultada depois por uma textura — uma
// leitura por fragmento, sem luz nova, sem sombra, sem competir com nada.
//
// O bloqueio é aproximado de propósito: marcha alguns pontos entre a fonte e a
// célula e mede quantos caem dentro de um volume alto. Não é sombra física e
// não pretende ser.

import { circleIntersectsAabb, obstacleAabb, type Aabb } from "./geometry";
import type { SceneDefinition } from "./scene";

/** Lado da célula, em metros. Rasa de propósito: a cauda é difusa. */
export const CELL_SIZE = 1;

/** Altura mínima para um volume contar como bloqueador. */
export const BLOCKER_MIN_HEIGHT = 2;

/** A cauda alcança este múltiplo do raio da fonte. */
export const TAIL_RADIUS_FACTOR = 3.4;

/** Intensidade da cauda, em fração da fonte. */
export const TAIL_GAIN = 0.16;

/** Pontos amostrados entre fonte e célula ao medir bloqueio. */
const OCCLUSION_SAMPLES = 12;

export type LightField = {
  minX: number;
  minZ: number;
  cols: number;
  rows: number;
  cellSize: number;
  /** RGB por célula, em ordem linha a linha. Já normalizado por `scale`. */
  data: Float32Array;
  /** Maior componente encontrado; serve para empacotar em 8 bits. */
  scale: number;
};

export type LightFieldStats = {
  cols: number;
  rows: number;
  cells: number;
  sources: number;
  blockers: number;
  bakeMs: number;
};

function sceneBounds(scene: SceneDefinition): Aabb {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const sector of scene.sectors) {
    minX = Math.min(minX, sector.area.minX);
    maxX = Math.max(maxX, sector.area.maxX);
    minZ = Math.min(minZ, sector.area.minZ);
    maxZ = Math.max(maxZ, sector.area.maxZ);
  }
  const margin = 6;
  return { minX: minX - margin, maxX: maxX + margin, minZ: minZ - margin, maxZ: maxZ + margin };
}

/** Volumes altos o bastante para barrar a propagação. */
export function blockersOf(scene: SceneDefinition): Aabb[] {
  const passable = new Set(scene.passableIds);
  return scene.obstacles
    .filter((o) => !passable.has(o.id) && o.baseY + o.size.y >= BLOCKER_MIN_HEIGHT)
    .map(obstacleAabb);
}

/** Fração da luz que sobrevive ao caminho entre dois pontos, de 0 a 1. */
export function transmittance(
  from: { x: number; z: number },
  to: { x: number; z: number },
  blockers: readonly Aabb[],
): number {
  let blocked = 0;
  for (let i = 1; i <= OCCLUSION_SAMPLES; i += 1) {
    const t = i / (OCCLUSION_SAMPLES + 1);
    const point = { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t };
    for (const box of blockers) {
      if (circleIntersectsAabb(point, 0.01, box)) {
        blocked += 1;
        break;
      }
    }
  }
  const open = 1 - blocked / OCCLUSION_SAMPLES;
  // Expoente acima de 1: uma parede atravessada já corta quase tudo.
  return Math.max(0, open) ** 1.6;
}

/**
 * Contribuição de uma fonte a uma distância, separada em núcleo e cauda.
 * O núcleo é curto e forte; a cauda vai muito mais longe e quase não brilha.
 */
export function coreAndTail(distance: number, radius: number, intensity: number): { core: number; tail: number } {
  const tailRadius = radius * TAIL_RADIUS_FACTOR;
  const core = distance >= radius ? 0 : intensity / (1 + (distance / (radius * 0.34)) ** 2);
  const tail = distance >= tailRadius ? 0 : intensity * TAIL_GAIN / (1 + (distance / (tailRadius * 0.42)) ** 2);
  return { core, tail };
}

export function bakeLightField(scene: SceneDefinition): { field: LightField; stats: LightFieldStats } {
  const started = Date.now();
  const bounds = sceneBounds(scene);
  const cols = Math.ceil((bounds.maxX - bounds.minX) / CELL_SIZE);
  const rows = Math.ceil((bounds.maxZ - bounds.minZ) / CELL_SIZE);
  const data = new Float32Array(cols * rows * 3);
  const blockers = blockersOf(scene);

  let peak = 1e-6;

  for (let row = 0; row < rows; row += 1) {
    const z = bounds.minZ + (row + 0.5) * CELL_SIZE;
    for (let col = 0; col < cols; col += 1) {
      const x = bounds.minX + (col + 0.5) * CELL_SIZE;
      let r = 0;
      let g = 0;
      let b = 0;

      for (const source of scene.lights) {
        const distance = Math.hypot(x - source.position.x, z - source.position.z);
        const { core, tail } = coreAndTail(distance, source.radius, source.intensity);
        const total = core + tail;
        if (total <= 0) continue;

        const open = transmittance(source.position, { x, z }, blockers);
        if (open <= 0) continue;

        const amount = total * open;
        r += ((source.color >> 16) & 0xff) / 255 * amount;
        g += ((source.color >> 8) & 0xff) / 255 * amount;
        b += (source.color & 0xff) / 255 * amount;
      }

      const i = (row * cols + col) * 3;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      peak = Math.max(peak, r, g, b);
    }
  }

  return {
    field: { minX: bounds.minX, minZ: bounds.minZ, cols, rows, cellSize: CELL_SIZE, data, scale: peak },
    stats: {
      cols,
      rows,
      cells: cols * rows,
      sources: scene.lights.length,
      blockers: blockers.length,
      bakeMs: Date.now() - started,
    },
  };
}

/** Amostra o campo com interpolação bilinear, para diagnóstico e teste. */
export function sampleLightField(field: LightField, x: number, z: number): [number, number, number] {
  const fx = (x - field.minX) / field.cellSize - 0.5;
  const fz = (z - field.minZ) / field.cellSize - 0.5;
  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const tx = fx - x0;
  const tz = fz - z0;

  const at = (cx: number, cz: number, channel: number): number => {
    const col = Math.max(0, Math.min(field.cols - 1, cx));
    const row = Math.max(0, Math.min(field.rows - 1, cz));
    return field.data[(row * field.cols + col) * 3 + channel] ?? 0;
  };

  const out: [number, number, number] = [0, 0, 0];
  for (let c = 0; c < 3; c += 1) {
    const top = at(x0, z0, c) * (1 - tx) + at(x0 + 1, z0, c) * tx;
    const bottom = at(x0, z0 + 1, c) * (1 - tx) + at(x0 + 1, z0 + 1, c) * tx;
    out[c] = top * (1 - tz) + bottom * tz;
  }
  return out;
}
