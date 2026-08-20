import { describe, expect, it } from "vitest";
import {
  BASE_DEPTH,
  isRamp,
  rampGeometry,
  TOP_SINK,
} from "../src/render/height-patch-geometry";
import { patchHeightAt } from "../src/world/terrain";
import { ACTIVE_SCENE } from "../src/content/active-scene";
import type { HeightPatch } from "../src/world/scene";

const RAMPAS = ACTIVE_SCENE.heightPatches.filter(isRamp);
const PATAMARES = ACTIVE_SCENE.heightPatches.filter((p) => !isRamp(p));

/** Vertices do topo: os que estao acima da base do solido. */
function verticesDoTopo(patch: HeightPatch) {
  const pos = rampGeometry(patch).getAttribute("position");
  const topo: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    if (y > -BASE_DEPTH + 1e-6) topo.push({ x: pos.getX(i), y, z: pos.getZ(i) });
  }
  return topo;
}

describe("rampas e patamares", () => {
  it("a cena tem rampas e patamares, e sao coisas diferentes", () => {
    expect(RAMPAS.length).toBeGreaterThan(0);
    expect(PATAMARES.length).toBeGreaterThan(0);
  });

  it("so e rampa quem declara destino e eixo", () => {
    expect(isRamp({ id: "x", area: { minX: 0, maxX: 1, minZ: 0, maxZ: 1 }, height: 1 })).toBe(false);
    expect(
      isRamp({
        id: "x",
        area: { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
        height: 0,
        heightTo: 1,
        rampAxis: "z",
      }),
    ).toBe(true);
  });
});

describe("o solido da rampa", () => {
  it("comeca no nivel do chao, nao na altura final", () => {
    for (const patch of RAMPAS) {
      const alturas = verticesDoTopo(patch).map((v) => v.y);
      const menor = Math.min(...alturas);
      const maior = Math.max(...alturas);
      const inicio = Math.min(patch.height, patch.heightTo ?? patch.height);
      const fim = Math.max(patch.height, patch.heightTo ?? patch.height);
      // A ponta baixa fica na altura inicial da rampa — e nao na final, que era
      // o defeito: um bloco que ja nascia alto.
      expect(menor).toBeCloseTo(inicio - TOP_SINK, 6);
      expect(maior).toBeCloseTo(fim - TOP_SINK, 6);
      expect(maior - menor).toBeCloseTo(fim - inicio, 6);
    }
  });

  it("o topo segue exatamente a altura que a simulacao da", () => {
    for (const patch of RAMPAS) {
      for (const v of verticesDoTopo(patch)) {
        const esperado = patchHeightAt(patch, { x: v.x, z: v.z });
        expect(esperado).not.toBeNull();
        expect(v.y).toBeCloseTo((esperado as number) - TOP_SINK, 6);
      }
    }
  });

  it("nenhuma rampa da posicao ou normal invalida", () => {
    for (const patch of RAMPAS) {
      const g = rampGeometry(patch);
      for (const nome of ["position", "normal"] as const) {
        const attr = g.getAttribute(nome);
        for (let i = 0; i < attr.array.length; i += 1) {
          expect(Number.isFinite(attr.array[i] as number)).toBe(true);
        }
      }
    }
  });

  it("o plano do topo e inclinado, e voltado para cima", () => {
    for (const patch of RAMPAS) {
      const pos = rampGeometry(patch).getAttribute("position");
      const nor = rampGeometry(patch).getAttribute("normal");
      // Os dois primeiros triangulos sao o topo.
      for (let i = 0; i < 6; i += 1) {
        expect(pos.getY(i)).toBeGreaterThan(-BASE_DEPTH);
        expect(nor.getY(i)).toBeGreaterThan(0);
        // Inclinado de verdade: nao e um topo plano disfarcado.
        expect(nor.getY(i)).toBeLessThan(1 - 1e-6);
      }
    }
  });

  it("a inclinacao do topo corresponde ao declive real", () => {
    for (const patch of RAMPAS) {
      const span =
        patch.rampAxis === "x"
          ? patch.area.maxX - patch.area.minX
          : patch.area.maxZ - patch.area.minZ;
      const subida = Math.abs((patch.heightTo as number) - patch.height);
      const esperado = Math.cos(Math.atan(subida / span));
      const nor = rampGeometry(patch).getAttribute("normal");
      expect(nor.getY(0)).toBeCloseTo(esperado, 6);
    }
  });
});
