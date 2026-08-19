import { describe, expect, it } from "vitest";
import {
  adjustSensitivity,
  clampSensitivity,
  DEFAULT_COMFORT,
  SENSITIVITY_MAX,
  SENSITIVITY_MIN,
} from "../src/core/settings";
import { createRouteLog, routeAt, SAMPLE_SECONDS } from "../src/diagnostics/route-log";
import { ACTIVE_SCENE } from "../src/content/active-scene";
import { advance, createWorldState } from "../src/sim/world-sim";
import { NEUTRAL_INTENT } from "../src/core/intent";

describe("ajuste de sensibilidade", () => {
  it("comeca neutro e nao reduz cintilacao por padrao", () => {
    expect(DEFAULT_COMFORT.sensitivity).toBe(1);
    expect(DEFAULT_COMFORT.flickerReduced).toBe(false);
  });

  it("respeita os limites nos dois extremos", () => {
    let valor = 1;
    for (let i = 0; i < 30; i += 1) valor = adjustSensitivity(valor, -1);
    expect(valor).toBe(SENSITIVITY_MIN);
    for (let i = 0; i < 60; i += 1) valor = adjustSensitivity(valor, 1);
    expect(valor).toBe(SENSITIVITY_MAX);
  });

  it("sobe e desce pelo mesmo passo", () => {
    const acima = adjustSensitivity(1, 1);
    expect(adjustSensitivity(acima, -1)).toBe(1);
  });

  it("arredonda valores fora da grade", () => {
    expect(clampSensitivity(1.03)).toBe(1);
    expect(clampSensitivity(99)).toBe(SENSITIVITY_MAX);
    expect(clampSensitivity(-4)).toBe(SENSITIVITY_MIN);
  });
});

describe("registro de percurso", () => {
  it("amostra no intervalo declarado, nao a cada quadro", () => {
    const log = createRouteLog(ACTIVE_SCENE);
    for (let i = 0; i < 100; i += 1) log.sample(i * 0.016, { x: i * 0.1, z: 10 });
    const esperado = Math.floor((99 * 0.016) / SAMPLE_SECONDS) + 1;
    expect(log.summary().samples).toBeLessThanOrEqual(esperado + 1);
    expect(log.summary().samples).toBeGreaterThan(0);
  });

  it("nao altera a simulacao", () => {
    const log = createRouteLog(ACTIVE_SCENE);

    const semRegistro = advance(createWorldState(), NEUTRAL_INTENT, 300);
    let comRegistro = createWorldState();
    for (let i = 0; i < 300; i += 1) {
      comRegistro = advance(comRegistro, NEUTRAL_INTENT, 1);
      log.sample(i * TICK, { ...comRegistro.player.position });
    }

    expect(comRegistro).toEqual(semRegistro);
    expect(log.summary().samples).toBeGreaterThan(0);
  });

  it("distingue as rotas pela posicao, sem estado escondido", () => {
    expect(routeAt(ACTIVE_SCENE, { x: 0, z: -50 })).toBe("direta");
    expect(routeAt(ACTIVE_SCENE, { x: -16.5, z: -50 })).toBe("lateral");
    expect(routeAt(ACTIVE_SCENE, { x: 0, z: 10 })).toBe("comum");
  });

  it("mede distancia e conta hesitacao quando o corpo fica parado", () => {
    const log = createRouteLog(ACTIVE_SCENE);
    for (let i = 0; i < 12; i += 1) log.sample(i * SAMPLE_SECONDS, { x: 0, z: 10 - i * 1.2 });
    for (let i = 12; i < 24; i += 1) log.sample(i * SAMPLE_SECONDS, { x: 0, z: 10 - 11 * 1.2 });

    const resumo = log.summary();
    expect(resumo.distance).toBeGreaterThan(12);
    expect(resumo.hesitations).toBeGreaterThan(0);
  });

  it("conta retorno quando o percurso volta a um trecho anterior", () => {
    const log = createRouteLog(ACTIVE_SCENE);
    let t = 0;
    for (const z of [10, -10, -40, -60, -90, -60, -40]) {
      log.sample(t, { x: 0, z });
      t += SAMPLE_SECONDS;
    }
    expect(log.summary().returns).toBeGreaterThan(0);
  });

  it("exporta localmente um texto legivel, sem rede", () => {
    const log = createRouteLog(ACTIVE_SCENE);
    log.sample(0, { x: 0, z: 10 });
    log.sample(SAMPLE_SECONDS, { x: 0, z: 8 });
    const texto = log.toText();
    expect(texto).toContain(ACTIVE_SCENE.id);
    expect(texto).toContain(String(ACTIVE_SCENE.seed));
    expect(texto.split("\n").length).toBeGreaterThan(3);
    expect(texto).not.toMatch(/https?:\/\//);
  });

  it("reinicia limpo", () => {
    const log = createRouteLog(ACTIVE_SCENE);
    log.sample(0, { x: 0, z: 10 });
    log.reset();
    expect(log.summary().samples).toBe(0);
  });
});

const TICK = 1 / 60;
