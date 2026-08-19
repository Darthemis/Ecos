// Textura procedural por família de material. É este canal — não a cor — que
// impede grandes painéis de virarem um retângulo uniformemente preenchido, e é
// ele que separa duas famílias quando as cores estiverem próximas.
//
// Determinística por seed e ancorada no mundo: nada aqui muda com a câmera.

import { CanvasTexture, RepeatWrapping, type Texture } from "three";
import { createRng } from "../core/rng";
import { MATERIALS, type MaterialFamily } from "../world/materials";

function latticeNoise(size: number, cells: number, seed: number): Float32Array {
  const rng = createRng(seed);
  const lattice = new Float32Array((cells + 1) * (cells + 1));
  for (let i = 0; i < lattice.length; i += 1) lattice[i] = rng();

  const at = (cx: number, cy: number): number =>
    lattice[(cy % (cells + 1)) * (cells + 1) + (cx % (cells + 1))] ?? 0;

  const out = new Float32Array(size * size);
  const scale = cells / size;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const fx = x * scale;
      const fy = y * scale;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
      const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
      out[y * size + x] = top * (1 - sy) + bottom * sy;
    }
  }
  return out;
}

/**
 * Duas oitavas mais um limiar de lacuna: a superfície ganha desgaste e trechos
 * que caem abaixo do primeiro degrau da rampa, deixando preto dentro do painel.
 */
export function createMaterialTexture(family: MaterialFamily, seed: number): Texture {
  const material = MATERIALS[family];
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Contexto 2D indisponivel para a textura de material");

  const grande = latticeNoise(size, 7, seed);
  const miudo = latticeNoise(size, 29, seed + 613);

  const image = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i += 1) {
    const mistura = (grande[i] ?? 0) * 0.62 + (miudo[i] ?? 0) * 0.38;
    // Contraste da família decide quanto o painel se quebra.
    const centrado = 0.5 + (mistura - 0.5) * (0.5 + material.pattern.contrast * 1.5);
    const comLacuna = centrado < material.pattern.gaps ? centrado * 0.28 : centrado;
    const valor = Math.round(Math.max(0, Math.min(1, comLacuna)) * 255);
    image.data[i * 4] = valor;
    image.data[i * 4 + 1] = valor;
    image.data[i * 4 + 2] = valor;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  // A escala do padrão é declarada em metros; a repetição sai dela.
  const repeat = 1 / material.pattern.scaleMeters;
  texture.repeat.set(repeat, repeat);
  return texture;
}
