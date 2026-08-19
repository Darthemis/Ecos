// Descritores de geometria mais complexa. Dados puros: o conteúdo declara
// primitivas e transformações, e a renderização as materializa. Nada aqui
// importa Three.js.
//
// A regra de orçamento é perceptiva, não estética: um detalhe só merece
// triângulos se mudar a silhueta ou a orientação de uma face o bastante para a
// grade ASCII notar. Ornamento menor que uma célula é desperdício.

import type { MaterialFamily } from "./materials";

export type Vec3 = { x: number; y: number; z: number };

export type ShapePart =
  | { kind: "box"; size: Vec3; position: Vec3; rotation: Vec3 }
  | { kind: "sphere"; radius: number; widthSegments: number; heightSegments: number; scale: Vec3; position: Vec3; rotation: Vec3 }
  | { kind: "cylinder"; radiusTop: number; radiusBottom: number; height: number; radialSegments: number; position: Vec3; rotation: Vec3 }
  | { kind: "cone"; radius: number; height: number; radialSegments: number; position: Vec3; rotation: Vec3 }
  | { kind: "torus"; radius: number; tube: number; radialSegments: number; tubularSegments: number; position: Vec3; rotation: Vec3 };

export type ComplexShape = {
  id: string;
  material: MaterialFamily;
  /** Posição no mundo. As partes são declaradas em torno da origem. */
  origin: { x: number; z: number };
  baseY: number;
  yaw: number;
  parts: readonly ShapePart[];
  /** Colisão simplificada, declarada à parte da forma vista. */
  collider: { halfX: number; halfZ: number; height: number };
  /** Faixa de triângulos aceita, verificada por teste. */
  budget: { min: number; max: number };
};

/** Triângulos de uma parte, pelas fórmulas das primitivas correspondentes. */
export function partTriangles(part: ShapePart): number {
  switch (part.kind) {
    case "box":
      return 12;
    case "sphere":
      // Faixas do topo e da base são triângulos; o miolo são quads.
      return part.widthSegments * (part.heightSegments - 1) * 2;
    case "cylinder":
      // Lateral em quads mais duas tampas em leque.
      return part.radialSegments * 2 + part.radialSegments * 2;
    case "cone":
      return part.radialSegments * 2;
    case "torus":
      return part.radialSegments * part.tubularSegments * 2;
  }
}

export function shapeTriangles(shape: ComplexShape): number {
  return shape.parts.reduce((total, part) => total + partTriangles(part), 0);
}

const box = (size: Vec3, position: Vec3, rotation: Vec3): ShapePart => ({ kind: "box", size, position, rotation });
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/**
 * A Forma Erodida — figura parcialmente reconhecível e deliberadamente ambígua.
 * Pode ser uma estátua gasta, um organismo petrificado ou nada disso. O jogo
 * não confirma. Assimétrica, com reentrâncias e partes quebradas.
 */
export const FORMA_ERODIDA: ComplexShape = {
  id: "forma-erodida",
  material: "pedra",
  origin: { x: -16.4, z: -96.5 },
  baseY: -0.3,
  yaw: 0.4,
  collider: { halfX: 1.5, halfZ: 1.3, height: 3.4 },
  budget: { min: 300, max: 800 },
  parts: [
    // Massa inferior, achatada e larga: a base que ainda resiste.
    { kind: "sphere", radius: 1.25, widthSegments: 10, heightSegments: 7, scale: v(1.15, 0.72, 1), position: v(0, 0.62, 0), rotation: v(0, 0.3, 0.08) },
    // Tronco, inclinado e mais estreito.
    { kind: "sphere", radius: 0.86, widthSegments: 10, heightSegments: 7, scale: v(0.92, 1.35, 0.86), position: v(0.18, 1.78, -0.1), rotation: v(0.14, 0, 0.19) },
    // Parte alta quebrada: para de repente, sem topo.
    { kind: "sphere", radius: 0.58, widthSegments: 9, heightSegments: 6, scale: v(1, 0.78, 0.92), position: v(0.44, 2.62, -0.22), rotation: v(0.3, 0.5, 0.36) },
    // Saliência lateral: o que sobrou de um braço, ou de uma raiz.
    { kind: "cone", radius: 0.42, height: 1.35, radialSegments: 10, position: v(-0.86, 1.94, 0.28), rotation: v(0.2, 0, -1.02) },
    // Reentrância marcada por um bloco enterrado no flanco.
    box(v(0.72, 0.5, 0.62), v(0.74, 1.16, 0.5), v(0.25, 0.6, 0.4)),
    // Lasca caída, encostada na base.
    box(v(0.9, 0.34, 0.66), v(-0.98, 0.2, -0.72), v(0.42, 1.1, 0.3)),
  ],
};

/**
 * O Mecanismo Emborcado — destroço de função ambígua, tombado de lado. Placas
 * inclinadas, anéis, cilindros e uma cavidade aberta. Pode ser antigo ou não.
 */
export const MECANISMO_EMBORCADO: ComplexShape = {
  id: "mecanismo-emborcado",
  material: "metal-oxidado",
  origin: { x: 13.5, z: -96 },
  baseY: -0.35,
  yaw: -0.55,
  collider: { halfX: 2.1, halfZ: 1.7, height: 2.6 },
  budget: { min: 800, max: 2000 },
  parts: [
    // Corpo cilíndrico principal, deitado.
    { kind: "cylinder", radiusTop: 0.95, radiusBottom: 0.95, height: 3.1, radialSegments: 16, position: v(0, 1.0, 0), rotation: v(0, 0, Math.PI / 2) },
    // Dois anéis salientes: o que dava função a isto.
    { kind: "torus", radius: 1.02, tube: 0.16, radialSegments: 10, tubularSegments: 18, position: v(-0.75, 1.0, 0), rotation: v(0, 0, Math.PI / 2) },
    { kind: "torus", radius: 1.06, tube: 0.13, radialSegments: 10, tubularSegments: 18, position: v(0.82, 1.0, 0), rotation: v(0, 0, Math.PI / 2) },
    // Cavidade: um cilindro menor recuado numa das pontas.
    { kind: "cylinder", radiusTop: 0.56, radiusBottom: 0.62, height: 0.7, radialSegments: 14, position: v(1.62, 1.02, 0), rotation: v(0, 0, Math.PI / 2) },
    // Eixo atravessado, saindo pelos dois lados.
    { kind: "cylinder", radiusTop: 0.17, radiusBottom: 0.17, height: 4.4, radialSegments: 10, position: v(0, 1.0, 0), rotation: v(0, 0, Math.PI / 2) },
    // Placas inclinadas: superfícies horizontais e quase horizontais.
    box(v(2.2, 0.13, 1.28), v(-0.2, 1.86, 0.42), v(-0.26, 0.14, 0.1)),
    box(v(1.5, 0.12, 1.02), v(0.9, 1.62, -0.62), v(0.34, -0.3, -0.16)),
    box(v(1.75, 0.14, 0.88), v(-1.1, 0.52, -0.78), v(0.12, 0.42, 0.06)),
    // Pés e apoios, tortos.
    box(v(0.42, 0.86, 0.42), v(-1.24, 0.42, 0.74), v(0, 0.3, 0.22)),
    box(v(0.38, 0.7, 0.38), v(1.18, 0.34, 0.8), v(0, -0.2, -0.18)),
    // Bojo esférico junto do eixo: quebra a leitura de máquina simétrica.
    { kind: "sphere", radius: 0.62, widthSegments: 12, heightSegments: 8, scale: v(1, 0.85, 1), position: v(-1.72, 1.12, -0.18), rotation: v(0.2, 0.4, 0) },
  ],
};

export const COMPLEX_SHAPES: readonly ComplexShape[] = [FORMA_ERODIDA, MECANISMO_EMBORCADO];
