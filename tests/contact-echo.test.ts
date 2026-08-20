import { readFileSync } from "node:fs";
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

describe("ondulacao da borda", () => {
  const fonte = readFileSync("src/render/contact-echo-material.ts", "utf8");

  it("o ruido e ancorado no mundo e nao depende do tempo nem da tela", () => {
    expect(fonte).toContain("ecoNoise( vEchoWorld.xz * uEchoNoiseScale )");
    // Nenhum termo temporal ou de tela pode entrar no eco.
    expect(fonte).not.toMatch(/uTime|elapsed|gl_FragCoord|frame/i);
  });

  it("nao usa smoothstep com bordas invertidas, que e indefinido em GLSL", () => {
    const invertidas = /smoothstep\(\s*([\d.]+),\s*([\d.]+),/g;
    for (const m of fonte.matchAll(invertidas)) {
      expect(Number(m[1]), `smoothstep( ${m[1]}, ${m[2]}, ... )`).toBeLessThan(Number(m[2]));
    }
  });

  it("o peso da ondulacao zera no corpo do eco e no vazio", () => {
    // Espelha o peso do shader: bump sobre a faixa em que o eco ja se apaga.
    const suave = (a: number, b: number, v: number) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const peso = (fall: number) => suave(0.015, 0.05, fall) * (1 - suave(0.05, 0.18, fall));
    expect(peso(1)).toBe(0);      // nucleo saturado
    expect(peso(0.8)).toBe(0);    // corpo do eco
    expect(peso(0.3)).toBe(0);    // ainda corpo
    expect(peso(0.18)).toBe(0);   // limite do corpo
    expect(peso(0.1)).toBeLessThan(peso(0.05)); // decai depois do pico
    expect(peso(0)).toBe(0);      // vazio
    expect(peso(0.05)).toBeCloseTo(1, 6); // o pico da franja externa
  });

  it("a ondulacao e discreta perto da faixa de transicao", () => {
    const amplitude = /const ECHO_EDGE_NOISE = ([\d.]+);/.exec(fonte)?.[1];
    const faixa = /const ECHO_FADE = ([\d.]+);/.exec(fonte)?.[1];
    expect(amplitude).toBeDefined();
    expect(Number(amplitude)).toBeCloseTo(0.12, 6);
    // O deslocamento maximo e metade da amplitude, bem abaixo da faixa: a borda
    // ondula sem nunca se desprender do contorno.
    expect(Number(amplitude) / 2).toBeLessThan(Number(faixa) / 2);
  });
});
