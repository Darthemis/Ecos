// Entrada: mapeia teclado, mouse e touchpad para intencoes. Nao altera o mundo
// diretamente (AGENT_RULES §5).
//
// Olhar tem tres caminhos, em ordem de preferencia. O primeiro que o ambiente
// permitir e o que vale; os outros continuam disponiveis:
//
//   1. ponteiro capturado — mouse livre, sem limite de borda;
//   2. clicar, segurar e arrastar — funciona no touchpad e dentro de um quadro
//      incorporado, onde a captura costuma ser bloqueada;
//   3. setas do teclado — gira e inclina sem depender de apontador algum.
//
// Por isso as setas deixaram de ser atalho de caminhada: caminhar e sempre WASD.

import { clampAxis, type FrameIntent } from "./intent";
import { adjustSensitivity, SENSITIVITY_DEFAULT } from "./settings";

/** Radianos por pixel de deslocamento do apontador. */
const LOOK_SENSITIVITY = 0.0022;

// Radianos por segundo com a seta mantida pressionada. O giro e mais rapido que
// a inclinacao: o pitch percorre apenas 85 graus ate o limite, e uma taxa alta
// levava ao zenite — tela inteiramente preta — em menos de um segundo.
const KEY_YAW_RATE = 1.05;
const KEY_PITCH_RATE = 0.62;

export type InputCommand =
  | "cycleRange"
  | "range8"
  | "range15"
  | "range25"
  | "toggleDiagnostics"
  | "toggleRawScene"
  | "toggleUniformProbe"
  | "toggleWorldLights"
  | "toggleEcho"
  | "cycleEchoLevel"
  | "toggleSectorDebug"
  | "toggleFlickerReduction"
  | "exportRoute"
  | "sensitivityDown"
  | "sensitivityUp"
  | "toggleStructure"
  | "toggleStructureMask"
  | "cycleStructureSource"
  | "toggleSurfacePattern";

/** Como o jogador olhou por ultimo. Serve a indicacao na tela. */
export type LookMode = "pointerLock" | "drag" | "keys" | "idle";

export type InputSource = {
  /** Consome a intencao do quadro e zera o acumulo de visada. */
  takeIntent: (deltaSeconds: number) => FrameIntent;
  lookMode: () => LookMode;
  /** Falso quando o ambiente recusou a captura do ponteiro. */
  pointerLockAvailable: () => boolean;
  onCommand: (handler: (command: InputCommand) => void) => void;
  /** Multiplicador da visada, ajustável em execução. */
  sensitivity: () => number;
  setSensitivity: (value: number) => void;
  onFirstGesture: (handler: () => void) => void;
  dispose: () => void;
};

/** Exportado para que o teste prove que toda tecla mapeada tem efeito. */
export const COMMAND_KEYS: Record<string, InputCommand> = {
  Digit1: "range8",
  Digit2: "range15",
  Digit3: "range25",
  KeyV: "cycleRange",
  F3: "toggleDiagnostics",
  F4: "toggleRawScene",
  F5: "toggleWorldLights",
  F6: "toggleUniformProbe",
  F7: "toggleEcho",
  F8: "cycleEchoLevel",
  F9: "toggleSectorDebug",
  F10: "toggleFlickerReduction",
  F11: "exportRoute",
  Minus: "sensitivityDown",
  Equal: "sensitivityUp",
  // Fase 1.1. Longe de WASD de proposito: sao diagnosticos, nao movimento.
  KeyB: "toggleStructure",
  KeyN: "toggleStructureMask",
  KeyM: "cycleStructureSource",
  KeyP: "toggleSurfacePattern",
};

const TURN_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

export function createInputSource(target: HTMLElement): InputSource {
  const pressed = new Set<string>();
  const commandHandlers: ((command: InputCommand) => void)[] = [];
  const gestureHandlers: (() => void)[] = [];

  let gestureFired = false;
  let yawDelta = 0;
  let pitchDelta = 0;
  let lockAvailable = true;
  let dragging = false;
  let dragPointer: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let mode: LookMode = "idle";
  let sensitivity = SENSITIVITY_DEFAULT;

  const locked = () => document.pointerLockElement === target;

  const fireGesture = () => {
    if (gestureFired) return;
    gestureFired = true;
    for (const handler of gestureHandlers) handler();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    fireGesture();
    const command = COMMAND_KEYS[event.code];
    if (command !== undefined) {
      event.preventDefault();
      // A sensibilidade é do próprio olhar: resolvida aqui, não no jogo.
      if (command === "sensitivityDown") sensitivity = adjustSensitivity(sensitivity, -1);
      if (command === "sensitivityUp") sensitivity = adjustSensitivity(sensitivity, 1);
      for (const handler of commandHandlers) handler(command);
      return;
    }
    // As setas rolariam a pagina dentro de um quadro incorporado.
    if (TURN_KEYS.has(event.code)) event.preventDefault();
    pressed.add(event.code);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    pressed.delete(event.code);
  };

  const onPointerDown = (event: PointerEvent) => {
    fireGesture();

    if (locked()) return;

    // Tenta a captura; se o ambiente recusar, o arrasto assume daqui em diante.
    if (lockAvailable) {
      const request = target.requestPointerLock() as unknown;
      if (request instanceof Promise) {
        request.catch(() => {
          lockAvailable = false;
        });
      }
    }

    dragging = true;
    dragPointer = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;

    // A captura do ponteiro so ajuda a nao perder o arrasto ao sair do elemento;
    // ela falha se a captura do mouse tiver vencido a corrida, e o arrasto
    // funciona sem ela porque pointermove escuta na janela.
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      /* sem captura: o arrasto continua valendo */
    }
  };

  const endDrag = (event: PointerEvent) => {
    if (dragPointer !== event.pointerId) return;
    dragging = false;
    dragPointer = null;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (locked()) {
      yawDelta += event.movementX * LOOK_SENSITIVITY * sensitivity;
      pitchDelta += event.movementY * LOOK_SENSITIVITY * sensitivity;
      mode = "pointerLock";
      return;
    }

    if (!dragging || dragPointer !== event.pointerId) return;

    yawDelta += (event.clientX - lastX) * LOOK_SENSITIVITY * sensitivity;
    pitchDelta += (event.clientY - lastY) * LOOK_SENSITIVITY * sensitivity;
    lastX = event.clientX;
    lastY = event.clientY;
    mode = "drag";
  };

  const onLockChange = () => {
    if (locked()) {
      // Com o ponteiro capturado o arrasto perde sentido.
      dragging = false;
      dragPointer = null;
      mode = "pointerLock";
    }
  };

  const onLockError = () => {
    lockAvailable = false;
  };

  const onBlur = () => {
    pressed.clear();
    dragging = false;
    dragPointer = null;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  document.addEventListener("pointerlockchange", onLockChange);
  document.addEventListener("pointerlockerror", onLockError);
  target.addEventListener("pointerdown", onPointerDown);

  const axis = (positive: string[], negative: string[]): number => {
    let value = 0;
    if (positive.some((code) => pressed.has(code))) value += 1;
    if (negative.some((code) => pressed.has(code))) value -= 1;
    return clampAxis(value);
  };

  return {
    takeIntent(deltaSeconds) {
      const turn = axis(["ArrowRight"], ["ArrowLeft"]);
      const tilt = axis(["ArrowDown"], ["ArrowUp"]);
      if (turn !== 0 || tilt !== 0) {
        yawDelta += turn * KEY_YAW_RATE * deltaSeconds * sensitivity;
        pitchDelta += tilt * KEY_PITCH_RATE * deltaSeconds * sensitivity;
        mode = "keys";
      }

      const intent: FrameIntent = {
        move: {
          forward: axis(["KeyW"], ["KeyS"]),
          strafe: axis(["KeyD"], ["KeyA"]),
        },
        look: { yaw: yawDelta, pitch: pitchDelta },
      };
      yawDelta = 0;
      pitchDelta = 0;
      return intent;
    },
    lookMode() {
      return mode;
    },
    pointerLockAvailable() {
      return lockAvailable;
    },
    sensitivity() {
      return sensitivity;
    },
    setSensitivity(value) {
      sensitivity = value;
    },
    onCommand(handler) {
      commandHandlers.push(handler);
    },
    onFirstGesture(handler) {
      gestureHandlers.push(handler);
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
      target.removeEventListener("pointerdown", onPointerDown);
    },
  };
}
