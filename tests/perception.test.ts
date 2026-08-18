import { describe, expect, it } from "vitest";
import {
  DEFAULT_VISUAL_RANGE,
  nextVisualRange,
  radarContact,
  relativeBearing,
  RADAR_RANGE,
  VISUAL_RANGES,
  type VisualRange,
} from "../src/world/perception";
import { createWorldState } from "../src/sim/world-sim";
import { glyphIndexForLuminance, GLYPH_RAMP } from "../src/render/glyph-atlas";
import type { WorldState } from "../src/sim/state";

function stateWith(player: { x: number; z: number }, yaw: number, presence: { x: number; z: number }): WorldState {
  const base = createWorldState();
  return {
    ...base,
    player: { ...base.player, position: player, yaw },
    presence: { position: presence, travelled: 0 },
  };
}

describe("orientacao relativa", () => {
  it("aponta zero para a frente e cresce para a direita", () => {
    const from = { x: 0, z: 0 };
    // yaw 0 olha para -Z.
    expect(relativeBearing(from, { x: 0, z: -5 }, 0)).toBeCloseTo(0, 6);
    expect(relativeBearing(from, { x: 5, z: 0 }, 0)).toBeCloseTo(Math.PI / 2, 6);
    expect(relativeBearing(from, { x: -5, z: 0 }, 0)).toBeCloseTo(-Math.PI / 2, 6);
  });

  it("acompanha a rotacao do olhar", () => {
    const from = { x: 0, z: 0 };
    const target = { x: 5, z: 0 };
    expect(relativeBearing(from, target, Math.PI / 2)).toBeCloseTo(0, 6);
  });

  it("permanece em [-PI, PI) em qualquer volta", () => {
    for (let i = 0; i < 40; i += 1) {
      const bearing = relativeBearing({ x: 0, z: 0 }, { x: 3, z: -2 }, i * 0.37);
      expect(bearing).toBeGreaterThanOrEqual(-Math.PI);
      expect(bearing).toBeLessThan(Math.PI);
    }
  });
});

describe("contato do radar", () => {
  it("some alem do alcance do radar", () => {
    const far = stateWith({ x: 0, z: 0 }, 0, { x: RADAR_RANGE + 1, z: 0 });
    expect(radarContact(far)).toBeNull();
  });

  it("enfraquece com a distancia", () => {
    const near = radarContact(stateWith({ x: 0, z: 0 }, 0, { x: 0, z: -3 }));
    const distant = radarContact(stateWith({ x: 0, z: 0 }, 0, { x: 0, z: -24 }));

    expect(near).not.toBeNull();
    expect(distant).not.toBeNull();
    expect(near!.strength).toBeGreaterThan(distant!.strength);
    expect(near!.normalizedDistance).toBeLessThan(distant!.normalizedDistance);
  });

  it("nao informa nada alem de direcao, distancia e intensidade", () => {
    const contact = radarContact(stateWith({ x: 0, z: 0 }, 0, { x: 2, z: -2 }));
    expect(Object.keys(contact!).sort()).toEqual(["bearing", "normalizedDistance", "strength"]);
  });
});

describe("alcance visual", () => {
  it("oferece exatamente 8, 15 e 25 metros", () => {
    expect([...VISUAL_RANGES]).toEqual([8, 15, 25]);
    expect(VISUAL_RANGES).toContain(DEFAULT_VISUAL_RANGE);
  });

  it("circula pelos tres valores e volta ao primeiro", () => {
    let range: VisualRange = 8;
    const seen: VisualRange[] = [range];
    for (let i = 0; i < 3; i += 1) {
      range = nextVisualRange(range);
      seen.push(range);
    }
    expect(seen).toEqual([8, 15, 25, 8]);
  });
});

describe("rampa de glifos", () => {
  it("mapeia luminancia para indice de forma monotonica", () => {
    const count = GLYPH_RAMP.length;
    let previous = -1;
    for (let i = 0; i <= 20; i += 1) {
      const index = glyphIndexForLuminance(i / 20, count);
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
    }
  });

  it("mantem o indice dentro da rampa mesmo fora da faixa", () => {
    const count = GLYPH_RAMP.length;
    expect(glyphIndexForLuminance(-1, count)).toBe(0);
    expect(glyphIndexForLuminance(0, count)).toBe(0);
    expect(glyphIndexForLuminance(1, count)).toBe(count - 1);
    expect(glyphIndexForLuminance(4, count)).toBe(count - 1);
  });

  it("reserva o espaco para o preto, que e ausencia de sinal", () => {
    expect(GLYPH_RAMP[0]).toBe(" ");
    expect(GLYPH_RAMP[GLYPH_RAMP.length - 1]).not.toBe(" ");
  });
});
