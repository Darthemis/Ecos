// Estado dos diagnósticos e a única regra que o altera.
//
// Existe por causa de uma regressão real: `F5` — os dois estados de iluminação
// na mesma posição, decididos na Fase 1.1 — ficou mapeada e sem tratamento
// desde a Fase 2. A tecla existia, o rótulo do diagnóstico existia, e nada
// acontecia. Um `switch` no laço não é verificável sem navegador, então a
// decisão passou despercebida até a calibração seguinte.
//
// Aqui a decisão é pura: comando e estado entram, estado sai. O laço apenas
// aplica **todos** os campos do estado à cena a cada mudança, de modo que
// esquecer de propagar um campo deixa de ser possível.

import type { InputCommand } from "../core/input";
import { nextEchoLevel, DEFAULT_ECHO_LEVEL, type EchoLevel } from "../world/contact-echo";

export type DiagnosticState = {
  /** Fontes de luz do mundo ligadas. Desligá-las é o segundo estado da Fase 1.1. */
  worldLights: boolean;
  echo: boolean;
  echoLevel: EchoLevel;
  sectorDebug: boolean;
  /** Cena 3D convencional: diagnóstico, nunca experiência. */
  rawScene: boolean;
  /** Entrada uniforme pelo passe ASCII, para conferir as faixas verticais. */
  uniformProbe: boolean;
};

export const INITIAL_DIAGNOSTIC_STATE: DiagnosticState = {
  worldLights: true,
  echo: true,
  echoLevel: DEFAULT_ECHO_LEVEL,
  sectorDebug: false,
  rawScene: false,
  uniformProbe: false,
};

/**
 * Aplica um comando ao estado de diagnóstico. Devolve **o mesmo objeto** quando
 * o comando não é de diagnóstico ou quando os diagnósticos estão desligados —
 * na construção de produção, portanto, nenhuma tecla altera coisa alguma.
 */
export function applyDiagnosticCommand(
  state: DiagnosticState,
  command: InputCommand,
  enabled: boolean,
): DiagnosticState {
  if (!enabled) return state;

  switch (command) {
    case "toggleWorldLights":
      return { ...state, worldLights: !state.worldLights };
    case "toggleEcho":
      return { ...state, echo: !state.echo };
    case "cycleEchoLevel":
      return { ...state, echoLevel: nextEchoLevel(state.echoLevel) };
    case "toggleSectorDebug":
      return { ...state, sectorDebug: !state.sectorDebug };
    case "toggleRawScene":
      return { ...state, rawScene: !state.rawScene };
    case "toggleUniformProbe":
      return { ...state, uniformProbe: !state.uniformProbe };
    default:
      return state;
  }
}
