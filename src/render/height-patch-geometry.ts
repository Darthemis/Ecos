// Geometria das regioes de altura. Existe por causa de uma divergencia real
// entre o que a simulacao sabe e o que a cena mostrava.
//
// Ate aqui toda regiao de altura era desenhada como uma caixa na altura maxima:
// `Math.max(patch.height, patch.heightTo)`. Para um patamar isso esta certo —
// ele e plano. Para uma rampa, nao: a simulacao interpola a altura ao longo do
// eixo (world/terrain.ts), mas a imagem mostrava um bloco de topo plano ja na
// altura final. O corpo subia a rampa que o terreno tem, encostado a uma parede
// que a cena desenhava — dai a impressao de deslizar para cima de um bloco alto.
//
// A correcao e uma so: quando a regiao e rampa, o topo do solido segue
// `patchHeightAt`, a mesma funcao que a simulacao usa. Nao ha uma segunda
// definicao de inclinacao aqui que possa divergir da primeira.

import { BufferGeometry, Float32BufferAttribute } from "three";
import type { HeightPatch } from "../world/scene";
import { patchHeightAt } from "../world/terrain";

/**
 * O topo afunda 2 cm, como ja acontecia com os patamares: evita disputa de
 * profundidade com o chao e mantem rampa e patamar na mesma convencao.
 */
export const TOP_SINK = 0.02;

/**
 * A base desce 6 cm abaixo do terreno. Isso da espessura ao inicio de uma rampa
 * que comeca no nivel do chao, em vez de um solido degenerado de altura zero —
 * cujos triangulos sem area produziriam normais invalidas.
 */
export const BASE_DEPTH = 0.06;

/** A regiao e rampa quando declara para onde a altura vai e por qual eixo. */
export function isRamp(patch: HeightPatch): boolean {
  return patch.heightTo !== undefined && patch.rampAxis !== undefined;
}

/**
 * Solido de uma rampa, em coordenadas do mundo: quatro cantos de topo na altura
 * que a simulacao da naquele ponto, e uma base plana logo abaixo do terreno.
 *
 * Sem indices: cada face tem vertices proprios, entao `computeVertexNormals`
 * produz normais planas por face. Isso importa para a visibilidade dos topos,
 * que le a normal do mundo — o plano inclinado tem de dar a normal do plano
 * inclinado, nao uma media suavizada com as laterais.
 */
export function rampGeometry(patch: HeightPatch): BufferGeometry {
  const { minX, maxX, minZ, maxZ } = patch.area;
  const topo = (x: number, z: number) =>
    (patchHeightAt(patch, { x, z }) ?? patch.height) - TOP_SINK;

  const base = -BASE_DEPTH;
  // Topo, no sentido anti-horario visto de cima.
  const A: Ponto = [minX, topo(minX, minZ), minZ];
  const B: Ponto = [maxX, topo(maxX, minZ), minZ];
  const C: Ponto = [maxX, topo(maxX, maxZ), maxZ];
  const D: Ponto = [minX, topo(minX, maxZ), maxZ];
  // Base, diretamente abaixo.
  const a: Ponto = [minX, base, minZ];
  const b: Ponto = [maxX, base, minZ];
  const c: Ponto = [maxX, base, maxZ];
  const d: Ponto = [minX, base, maxZ];

  const posicoes: number[] = [];
  const face = (p: Ponto, q: Ponto, r: Ponto) => posicoes.push(...p, ...q, ...r);

  face(A, C, B); face(A, D, C);   // topo, normal para cima
  face(a, b, c); face(a, c, d);   // base, normal para baixo
  face(a, A, B); face(a, B, b);   // lado -Z
  face(d, c, C); face(d, C, D);   // lado +Z
  face(a, D, A); face(a, d, D);   // lado -X
  face(b, B, C); face(b, C, c);   // lado +X

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(posicoes, 3));
  geometry.computeVertexNormals();
  return geometry;
}

type Ponto = readonly [number, number, number];
