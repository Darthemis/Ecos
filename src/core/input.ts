// Entrada: mapeia teclado e mouse para intencoes. Nao altera o mundo
// diretamente (AGENT_RULES §5).

import { clampAxis, type FrameIntent } from "./intent";

const LOOK_SENSITIVITY = 0.0022;

export type InputCommand = "cycleRange" | "range8" | "range15" | "range25" | "toggleDiagnostics" | "toggleRawScene";

export type InputSource = {
  /** Consome a intencao do quadro e zera o acumulo de visada. */
  takeIntent: () => FrameIntent;
  onCommand: (handler: (command: InputCommand) => void) => void;
  onFirstGesture: (handler: () => void) => void;
  dispose: () => void;
};

const COMMAND_KEYS: Record<string, InputCommand> = {
  Digit1: "range8",
  Digit2: "range15",
  Digit3: "range25",
  KeyV: "cycleRange",
  F3: "toggleDiagnostics",
  F4: "toggleRawScene",
};

export function createInputSource(target: HTMLElement): InputSource {
  const pressed = new Set<string>();
  const commandHandlers: ((command: InputCommand) => void)[] = [];
  const gestureHandlers: (() => void)[] = [];
  let gestureFired = false;
  let yawDelta = 0;
  let pitchDelta = 0;

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
      for (const handler of commandHandlers) handler(command);
      return;
    }
    pressed.add(event.code);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    pressed.delete(event.code);
  };

  const onPointerDown = () => {
    fireGesture();
    if (document.pointerLockElement !== target) void target.requestPointerLock();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (document.pointerLockElement !== target) return;
    yawDelta += event.movementX * LOOK_SENSITIVITY;
    pitchDelta += event.movementY * LOOK_SENSITIVITY;
  };

  const onBlur = () => pressed.clear();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("pointermove", onPointerMove);
  target.addEventListener("pointerdown", onPointerDown);

  const axis = (positive: string[], negative: string[]): number => {
    let value = 0;
    if (positive.some((code) => pressed.has(code))) value += 1;
    if (negative.some((code) => pressed.has(code))) value -= 1;
    return clampAxis(value);
  };

  return {
    takeIntent() {
      const intent: FrameIntent = {
        move: {
          forward: axis(["KeyW", "ArrowUp"], ["KeyS", "ArrowDown"]),
          strafe: axis(["KeyD", "ArrowRight"], ["KeyA", "ArrowLeft"]),
        },
        look: { yaw: yawDelta, pitch: pitchDelta },
      };
      yawDelta = 0;
      pitchDelta = 0;
      return intent;
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
      target.removeEventListener("pointerdown", onPointerDown);
    },
  };
}
