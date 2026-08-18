import { describe, expect, it } from "vitest";
import {
  circleIntersectsAabb,
  obstacleAabb,
  resolveMove,
  wrapAngle,
  type Aabb,
} from "../src/world/geometry";

const box: Aabb = { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };

describe("colisao", () => {
  it("detecta sobreposicao pela borda mais proxima", () => {
    expect(circleIntersectsAabb({ x: 0, z: 0 }, 0.3, box)).toBe(true);
    expect(circleIntersectsAabb({ x: 1.2, z: 0 }, 0.3, box)).toBe(true);
    expect(circleIntersectsAabb({ x: 1.4, z: 0 }, 0.3, box)).toBe(false);
  });

  it("detecta o canto, nao apenas as faces", () => {
    // O canto mede pela distancia real ao vertice, nao pelos eixos: a 0.25 m
    // em cada eixo o ponto esta a 0.354 m do vertice e fica de fora.
    expect(circleIntersectsAabb({ x: 1.25, z: 1.25 }, 0.3, box)).toBe(false);
    expect(circleIntersectsAabb({ x: 1.2, z: 1.2 }, 0.3, box)).toBe(true);
  });

  it("desliza ao longo da parede em vez de travar", () => {
    // Encostado na face norte do obstaculo: o avanco em Z e recusado, o
    // deslocamento lateral em X continua.
    const from = { x: 0, z: 1.5 };
    const moved = resolveMove(from, { x: 0.5, z: -0.5 }, 0.34, [box]);
    expect(moved.x).toBeCloseTo(0.5, 6);
    expect(moved.z).toBeCloseTo(1.5, 6);
  });

  it("permite movimento livre longe dos obstaculos", () => {
    const moved = resolveMove({ x: 8, z: 8 }, { x: 0.4, z: 0.4 }, 0.34, [box]);
    expect(moved).toEqual({ x: 8.4, z: 8.4 });
  });

  it("nunca entra no obstaculo, venha de qual direcao vier", () => {
    const directions = [
      { x: 0.4, z: 0 },
      { x: -0.4, z: 0 },
      { x: 0, z: 0.4 },
      { x: 0, z: -0.4 },
    ];
    for (const delta of directions) {
      let position = { x: -delta.x * 10, z: -delta.z * 10 };
      for (let i = 0; i < 60; i += 1) {
        position = resolveMove(position, delta, 0.34, [box]);
        expect(circleIntersectsAabb(position, 0.34, box)).toBe(false);
      }
    }
  });
});

describe("caixa do obstaculo", () => {
  it("cresce conforme a rotacao, mantendo-se alinhada aos eixos", () => {
    const straight = obstacleAabb({
      id: "a",
      kind: "rock",
      center: { x: 0, z: 0 },
      size: { x: 2, y: 1, z: 1 },
      baseY: 0,
      yaw: 0,
    });
    expect(straight.maxX - straight.minX).toBeCloseTo(2, 6);

    const turned = obstacleAabb({
      id: "b",
      kind: "rock",
      center: { x: 0, z: 0 },
      size: { x: 2, y: 1, z: 1 },
      baseY: 0,
      yaw: Math.PI / 2,
    });
    expect(turned.maxX - turned.minX).toBeCloseTo(1, 6);
    expect(turned.maxZ - turned.minZ).toBeCloseTo(2, 6);
  });
});

describe("wrapAngle", () => {
  it("mantem o angulo em [-PI, PI)", () => {
    expect(wrapAngle(0)).toBeCloseTo(0, 9);
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(-Math.PI, 9);
    expect(wrapAngle(-Math.PI * 1.5)).toBeCloseTo(Math.PI / 2, 9);
    for (let i = -20; i <= 20; i += 1) {
      const wrapped = wrapAngle(i * 0.7);
      expect(wrapped).toBeGreaterThanOrEqual(-Math.PI);
      expect(wrapped).toBeLessThan(Math.PI);
    }
  });
});
