import { describe, expect, it } from "vitest";
import {
  contactFootprint,
  contactFootprints,
  ECHO_LEVELS,
  ECHO_LEVEL_ORDER,
  DEFAULT_ECHO_LEVEL,
  isGrounded,
  MAX_CONTACTS,
  nextEchoLevel,
  type EchoLevel,
} from "../src/world/contact-echo";
import { ACTIVE_SCENE } from "../src/content/active-scene";
const OBSTACLES = ACTIVE_SCENE.obstacles;
import type { Obstacle } from "../src/world/geometry";

function obstacle(overrides: Partial<Obstacle> = {}): Obstacle {
  return {
    id: "teste",
    kind: "rock",
    center: { x: 0, z: 0 },
    size: { x: 2, y: 1, z: 1 },
    baseY: -0.2,
    yaw: 0,
    ...overrides,
  };
}

describe("contato com o terreno", () => {
  it("reconhece objetos apoiados e enterrados", () => {
    expect(isGrounded(obstacle({ baseY: 0 }))).toBe(true);
    expect(isGrounded(obstacle({ baseY: -0.9 }))).toBe(true);
  });

  it("nao reconhece objeto suspenso", () => {
    expect(isGrounded(obstacle({ baseY: 0.4 }))).toBe(false);
    expect(isGrounded(obstacle({ baseY: 1.5 }))).toBe(false);
  });

  it("exclui do conjunto de contatos tudo que nao toca o terreno", () => {
    const chao = obstacle({ id: "apoiado", baseY: -0.1 });
    const ar = obstacle({ id: "suspenso", baseY: 2 });
    const prints = contactFootprints([chao, ar]);
    expect(prints.map((p) => p.id)).toEqual(["apoiado"]);
  });

  it("respeita o limite de contatos enviados", () => {
    const muitos = Array.from({ length: MAX_CONTACTS + 9 }, (_, i) => obstacle({ id: `pedra-${i}` }));
    expect(contactFootprints(muitos)).toHaveLength(MAX_CONTACTS);
  });
});

describe("area de contato", () => {
  it("acompanha a forma do objeto, nao um circulo igual para todos", () => {
    const largo = contactFootprint(obstacle({ size: { x: 6, y: 1, z: 0.8 } }));
    expect(largo.halfLength).toBeCloseTo(3, 6);
    expect(largo.halfWidth).toBeCloseTo(0.4, 6);
    expect(largo.halfLength).toBeGreaterThan(largo.halfWidth);
  });

  it("acompanha a rotacao do objeto", () => {
    const girado = contactFootprint(obstacle({ size: { x: 6, y: 1, z: 0.8 }, yaw: Math.PI / 2 }));
    expect(girado.axis.x).toBeCloseTo(0, 6);
    expect(girado.axis.z).toBeCloseTo(-1, 6);
  });

  it("fica no centro do objeto", () => {
    const print = contactFootprint(obstacle({ center: { x: -4.5, z: 7.25 } }));
    expect(print.center).toEqual({ x: -4.5, z: 7.25 });
  });

  it("usa o maior eixo mesmo quando ele e o eixo z local", () => {
    const profundo = contactFootprint(obstacle({ size: { x: 0.8, y: 1, z: 6 } }));
    expect(profundo.halfLength).toBeCloseTo(3, 6);
    expect(profundo.halfWidth).toBeCloseTo(0.4, 6);
    expect(profundo.axis).toEqual({ x: 0, z: 1 });
  });
});

describe("estabilidade do padrao", () => {
  it("o conjunto de contatos da cena nao depende do momento em que e lido", () => {
    expect(contactFootprints(OBSTACLES)).toEqual(contactFootprints(OBSTACLES));
  });
});

describe("intensidades comparaveis", () => {
  it("oferece tres niveis crescentes", () => {
    expect(ECHO_LEVEL_ORDER).toEqual(["sutil", "intermediario", "legivel"]);
    expect(ECHO_LEVELS.sutil).toBeLessThan(ECHO_LEVELS.intermediario);
    expect(ECHO_LEVELS.intermediario).toBeLessThan(ECHO_LEVELS.legivel);
  });

  it("usa o sutil como padrao jogavel provisorio", () => {
    expect(DEFAULT_ECHO_LEVEL).toBe("sutil");
    expect(ECHO_LEVELS[DEFAULT_ECHO_LEVEL]).toBe(0.016);
  });

  it("circula pelos tres e volta ao primeiro", () => {
    let level: EchoLevel = "sutil";
    const vistos: EchoLevel[] = [level];
    for (let i = 0; i < 3; i += 1) {
      level = nextEchoLevel(level);
      vistos.push(level);
    }
    expect(vistos).toEqual(["sutil", "intermediario", "legivel", "sutil"]);
  });
});
