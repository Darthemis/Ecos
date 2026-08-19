// A fiação dos diagnósticos. Existe por causa da regressão de `F5`: a tecla
// ficou mapeada e sem tratamento entre a Fase 2 e a Fase 2.1, e nenhum teste
// percebeu porque a decisão morava num `switch` dentro do laço de renderização.

import { describe, expect, it } from "vitest";
import {
  applyDiagnosticCommand,
  INITIAL_DIAGNOSTIC_STATE,
  type DiagnosticState,
} from "../src/app/diagnostic-commands";
import { COMMAND_KEYS } from "../src/core/input";
import { ECHO_LEVELS } from "../src/world/contact-echo";

const ligado = (state: DiagnosticState, command: Parameters<typeof applyDiagnosticCommand>[1]) =>
  applyDiagnosticCommand(state, command, true);

describe("fiação dos diagnósticos", () => {
  it("F5 está mapeada para alternar as fontes de luz do mundo", () => {
    expect(COMMAND_KEYS.F5).toBe("toggleWorldLights");
  });

  it("F5 alterna de fato o estado, e volta ao alternar de novo", () => {
    expect(INITIAL_DIAGNOSTIC_STATE.worldLights).toBe(true);

    const desligado = ligado(INITIAL_DIAGNOSTIC_STATE, "toggleWorldLights");
    expect(desligado.worldLights).toBe(false);
    expect(desligado).not.toBe(INITIAL_DIAGNOSTIC_STATE);

    const devolta = ligado(desligado, "toggleWorldLights");
    expect(devolta.worldLights).toBe(true);
  });

  it("alternar as fontes não mexe em nenhum outro campo", () => {
    const depois = ligado(INITIAL_DIAGNOSTIC_STATE, "toggleWorldLights");
    const { worldLights: _a, ...restoDepois } = depois;
    const { worldLights: _b, ...restoAntes } = INITIAL_DIAGNOSTIC_STATE;
    expect(restoDepois).toEqual(restoAntes);
  });

  it("todo comando de diagnóstico mapeado por tecla produz uma mudança de estado", () => {
    // Prova a classe inteira da regressão: uma tecla mapeada que não faz nada
    // falha aqui, e não apenas `F5`.
    const semEfeitoEsperado = new Set([
      "toggleDiagnostics", // liga a sobreposição, que não é estado de cena
      "exportRoute",
      "toggleFlickerReduction", // conforto: vale também no jogo normal
      "sensitivityDown",
      "sensitivityUp",
      "cycleRange",
      "range8",
      "range15",
      "range25",
    ]);

    for (const command of Object.values(COMMAND_KEYS)) {
      if (semEfeitoEsperado.has(command)) continue;
      const depois = ligado(INITIAL_DIAGNOSTIC_STATE, command);
      expect(depois, `comando sem efeito: ${command}`).not.toBe(INITIAL_DIAGNOSTIC_STATE);
    }
  });

  it("o nível do Eco percorre os três valores e volta ao início", () => {
    let state = INITIAL_DIAGNOSTIC_STATE;
    const vistos: string[] = [state.echoLevel];
    for (let i = 0; i < 3; i += 1) {
      state = ligado(state, "cycleEchoLevel");
      vistos.push(state.echoLevel);
    }
    expect(new Set(vistos).size).toBe(Object.keys(ECHO_LEVELS).length);
    expect(vistos[3]).toBe(vistos[0]);
  });

  it("com os diagnósticos desligados nenhuma tecla altera coisa alguma", () => {
    for (const command of Object.values(COMMAND_KEYS)) {
      expect(applyDiagnosticCommand(INITIAL_DIAGNOSTIC_STATE, command, false)).toBe(
        INITIAL_DIAGNOSTIC_STATE,
      );
    }
  });
});
