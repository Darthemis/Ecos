import { describe, expect, it } from "vitest";
import { planSteps, MAX_TICKS_PER_FRAME, TICK_SECONDS } from "../src/core/fixed-step";
import { NEUTRAL_INTENT, type FrameIntent } from "../src/core/intent";
import { createRng } from "../src/core/rng";
import { advance, createWorldState, COLLIDERS } from "../src/sim/world-sim";
import { loopLength, pointOnLoop } from "../src/sim/presence";
import { PRESENCE_PATH, PRESENCE_SPEED } from "../src/content/desert-scene";
import { blocked } from "../src/world/geometry";
import { PLAYER_RADIUS, WALK_SPEED } from "../src/sim/state";

function intent(forward: number, strafe: number, yaw = 0): FrameIntent {
  return { move: { forward, strafe }, look: { yaw, pitch: 0 } };
}

/** Sequencia de intencoes reproduzivel, sem depender do relogio de parede. */
function scriptedIntents(count: number): FrameIntent[] {
  const rng = createRng(9001);
  return Array.from({ length: count }, () =>
    intent(Math.round(rng() * 2) - 1, Math.round(rng() * 2) - 1, (rng() - 0.5) * 0.2),
  );
}

describe("passo fixo", () => {
  it("converte tempo acumulado em ticks inteiros e guarda a sobra", () => {
    const plan = planSteps(TICK_SECONDS * 2.5);
    expect(plan.ticks).toBe(2);
    expect(plan.carry).toBeCloseTo(TICK_SECONDS * 0.5, 9);
    expect(plan.dropped).toBe(0);
  });

  it("limita os ticks por quadro e contabiliza o descarte", () => {
    const plan = planSteps(TICK_SECONDS * 40);
    expect(plan.ticks).toBe(MAX_TICKS_PER_FRAME);
    expect(plan.dropped).toBeCloseTo(TICK_SECONDS * (40 - MAX_TICKS_PER_FRAME), 9);
  });

  it("nao avanca com menos de um tick acumulado", () => {
    expect(planSteps(TICK_SECONDS * 0.9).ticks).toBe(0);
  });
});

describe("determinismo", () => {
  it("mesma sequencia de intencoes produz o mesmo estado final", () => {
    const script = scriptedIntents(400);

    const runA = script.reduce((state, next) => advance(state, next, 1), createWorldState());
    const runB = script.reduce((state, next) => advance(state, next, 1), createWorldState());

    expect(runA).toEqual(runB);
    expect(runA.tick).toBe(400);
  });

  it("diverge quando uma unica intencao muda", () => {
    const script = scriptedIntents(120);
    const baseline = script.reduce((state, next) => advance(state, next, 1), createWorldState());

    const altered = [...script];
    altered[60] = intent(1, 0);
    const other = altered.reduce((state, next) => advance(state, next, 1), createWorldState());

    expect(other.player.position).not.toEqual(baseline.player.position);
  });

  it("a presenca depende apenas do tick decorrido", () => {
    const still = advance(createWorldState(), NEUTRAL_INTENT, 300);
    const walking = advance(createWorldState(), intent(1, 0), 300);
    expect(walking.presence.position).toEqual(still.presence.position);
    expect(still.presence.travelled).toBeCloseTo(PRESENCE_SPEED * 300 * TICK_SECONDS, 9);
  });
});

describe("invariantes de simulacao", () => {
  it("10000 ticks nao produzem NaN nem entrada em obstaculo", () => {
    const script = scriptedIntents(500);
    let state = createWorldState();

    for (let i = 0; i < 10000; i += 1) {
      state = advance(state, script[i % script.length]!, 1);
      if (i % 250 === 0) {
        expect(Number.isFinite(state.player.position.x)).toBe(true);
        expect(Number.isFinite(state.player.position.z)).toBe(true);
        expect(blocked(state.player.position, PLAYER_RADIUS, COLLIDERS)).toBe(false);
      }
    }

    expect(state.tick).toBe(10000);
    expect(Number.isFinite(state.presence.position.x)).toBe(true);
  });

  it("o passo respeita a velocidade de caminhada", () => {
    const before = createWorldState();
    const after = advance(before, intent(1, 0), 1);
    const travelled = Math.hypot(
      after.player.position.x - before.player.position.x,
      after.player.position.z - before.player.position.z,
    );
    expect(travelled).toBeCloseTo(WALK_SPEED * TICK_SECONDS, 9);
  });

  it("a diagonal nao anda mais rapido que a linha reta", () => {
    const straight = advance(createWorldState(), intent(1, 0), 60);
    const diagonal = advance(createWorldState(), intent(1, 1), 60);
    const spawn = createWorldState().player.position;

    const straightDistance = Math.hypot(straight.player.position.x - spawn.x, straight.player.position.z - spawn.z);
    const diagonalDistance = Math.hypot(diagonal.player.position.x - spawn.x, diagonal.player.position.z - spawn.z);

    expect(diagonalDistance).toBeCloseTo(straightDistance, 6);
  });
});

describe("percurso da presenca", () => {
  it("fecha o laco: percorrer o comprimento total volta ao inicio", () => {
    const total = loopLength(PRESENCE_PATH);
    const start = pointOnLoop(PRESENCE_PATH, 0);
    const round = pointOnLoop(PRESENCE_PATH, total);
    expect(round.x).toBeCloseTo(start.x, 6);
    expect(round.z).toBeCloseTo(start.z, 6);
  });

  it("avanca de forma continua, sem saltos", () => {
    const step = 0.05;
    let previous = pointOnLoop(PRESENCE_PATH, 0);
    for (let d = step; d < loopLength(PRESENCE_PATH); d += step) {
      const current = pointOnLoop(PRESENCE_PATH, d);
      expect(Math.hypot(current.x - previous.x, current.z - previous.z)).toBeLessThan(step * 1.5);
      previous = current;
    }
  });
});

describe("gerador com seed", () => {
  it("a mesma seed produz a mesma sequencia", () => {
    const a = Array.from({ length: 8 }, createRng(7));
    const b = Array.from({ length: 8 }, createRng(7));
    expect(a).toEqual(b);
    expect(Array.from({ length: 8 }, createRng(8))).not.toEqual(a);
  });

  it("permanece dentro de [0, 1)", () => {
    const rng = createRng(31);
    for (let i = 0; i < 5000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
