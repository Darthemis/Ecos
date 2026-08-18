// Montagem do laco. Une entrada, simulacao, percepcao, renderizacao, audio e
// diagnostico sem que nenhum deles conheca o outro diretamente.

import { NearestFilter, WebGLRenderer, WebGLRenderTarget } from "three";
import { planSteps, TICK_SECONDS } from "../core/fixed-step";
import { createInputSource, type LookMode } from "../core/input";
import { createPresenceAudio } from "../audio/presence-audio";
import { createDiagnosticsOverlay, DIAGNOSTICS_ENABLED } from "../diagnostics/overlay";
import { Metrics } from "../diagnostics/metrics";
import { createAsciiPass } from "../render/ascii-pass";
import { createDesertView } from "../render/desert-view";
import { GLYPH_CELL_HEIGHT, GLYPH_CELL_WIDTH } from "../render/glyph-atlas";
import { createRadar } from "../render/radar";
import { advance, createWorldState } from "../sim/world-sim";
import { PLAYER_EYE_HEIGHT } from "../sim/state";
import {
  DEFAULT_VISUAL_RANGE,
  nextVisualRange,
  radarContact,
  type VisualRange,
} from "../world/perception";

export type Game = {
  stop: () => void;
};

export function startGame(root: HTMLElement): Game {
  const canvas = document.createElement("canvas");
  canvas.className = "ecos-canvas";
  root.appendChild(canvas);

  const radar = createRadar();
  root.appendChild(radar.canvas);

  const rangeLabel = document.createElement("div");
  rangeLabel.className = "ecos-range";
  root.appendChild(rangeLabel);

  const hint = document.createElement("div");
  hint.className = "ecos-hint";
  hint.textContent = "clique para ouvir e olhar · WASD anda · setas olham · 1 2 3 alcance";
  root.appendChild(hint);

  // Indicacao discreta de qual caminho de visada esta em uso. O jogador nao
  // deve precisar adivinhar por que o olhar responde de um jeito ou de outro.
  const lookBadge = document.createElement("div");
  lookBadge.className = "ecos-look-mode";
  root.appendChild(lookBadge);

  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);

  const view = createDesertView();
  const ascii = createAsciiPass();
  const audio = createPresenceAudio();
  const metrics = new Metrics();

  const diagnostics = DIAGNOSTICS_ENABLED ? createDiagnosticsOverlay() : null;
  if (diagnostics !== null) root.appendChild(diagnostics.element);

  let target = new WebGLRenderTarget(2, 2, { minFilter: NearestFilter, magFilter: NearestFilter });
  let columns = 2;
  let rows = 2;
  let visualRange: VisualRange = DEFAULT_VISUAL_RANGE;
  let showRawScene = false;
  let state = createWorldState();
  let accumulator = 0;
  let previous = performance.now();
  let elapsed = 0;
  let running = true;
  let labelTimer = 0;

  const applyVisualRange = (meters: VisualRange) => {
    visualRange = meters;
    view.setVisualRange(meters);
    rangeLabel.textContent = `${meters} m`;
    labelTimer = 2.2;
  };

  const resize = () => {
    const width = Math.max(320, root.clientWidth);
    const height = Math.max(240, root.clientHeight);

    renderer.setSize(width, height, false);

    columns = Math.max(2, Math.floor(width / GLYPH_CELL_WIDTH));
    rows = Math.max(2, Math.floor(height / GLYPH_CELL_HEIGHT));

    target.dispose();
    target = new WebGLRenderTarget(columns, rows, { minFilter: NearestFilter, magFilter: NearestFilter });
    ascii.setGrid(columns, rows);

    view.camera.aspect = width / height;
    view.camera.updateProjectionMatrix();
  };

  const input = createInputSource(canvas);

  input.onFirstGesture(() => {
    void audio.unlock();
    hint.hidden = true;
  });

  input.onCommand((command) => {
    switch (command) {
      case "range8":
        applyVisualRange(8);
        break;
      case "range15":
        applyVisualRange(15);
        break;
      case "range25":
        applyVisualRange(25);
        break;
      case "cycleRange":
        applyVisualRange(nextVisualRange(visualRange));
        break;
      case "toggleDiagnostics":
        if (diagnostics !== null) diagnostics.setVisible(diagnostics.element.hidden);
        break;
      case "toggleRawScene":
        // Modo 3D convencional: diagnostico apenas. Ausente da construcao de
        // producao, portanto nunca alcancavel pelo jogador.
        if (DIAGNOSTICS_ENABLED) showRawScene = !showRawScene;
        break;
    }
  });

  window.addEventListener("resize", resize);
  resize();
  applyVisualRange(DEFAULT_VISUAL_RANGE);

  const frame = () => {
    if (!running) return;

    const now = performance.now();
    const deltaSeconds = Math.min(0.25, (now - previous) / 1000);
    previous = now;
    elapsed += deltaSeconds;
    metrics.recordFrame(deltaSeconds);

    accumulator += deltaSeconds;
    const plan = planSteps(accumulator);
    accumulator = plan.carry;

    const intent = input.takeIntent(deltaSeconds);
    const simStart = performance.now();
    state = advance(state, intent, plan.ticks);
    metrics.recordSim(performance.now() - simStart, plan.ticks, plan.dropped);

    view.camera.position.set(state.player.position.x, PLAYER_EYE_HEIGHT, state.player.position.z);
    view.camera.rotation.set(state.player.pitch, state.player.yaw, 0, "YXZ");

    const renderStart = performance.now();
    if (showRawScene) {
      renderer.setRenderTarget(null);
      renderer.render(view.scene, view.camera);
    } else {
      renderer.setRenderTarget(target);
      renderer.render(view.scene, view.camera);
      ascii.render(renderer, target);
    }
    metrics.recordRender(performance.now() - renderStart);

    const contact = radarContact(state);
    radar.draw(state.player.yaw, contact, elapsed);
    audio.update(state.player.position, state.player.yaw, state.presence.position);

    lookBadge.textContent = describeLookMode(input.lookMode(), input.pointerLockAvailable());

    if (labelTimer > 0) {
      labelTimer -= deltaSeconds;
      rangeLabel.style.opacity = labelTimer > 0 ? String(Math.min(1, labelTimer)) : "0";
    }

    diagnostics?.update(metrics.snapshot(), {
      grade: `${columns} x ${rows}`,
      alcance: `${visualRange} m`,
      tick: String(state.tick),
      modo: showRawScene ? "3D CONVENCIONAL (diagnostico)" : "ascii",
      audio: audio.isRunning() ? "ativo" : "aguardando gesto",
    });

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);

  return {
    stop() {
      running = false;
      window.removeEventListener("resize", resize);
      input.dispose();
      audio.dispose();
      ascii.dispose();
      view.dispose();
      target.dispose();
      renderer.dispose();
    },
  };
}

/** Texto curto do indicador de controle. */
function describeLookMode(mode: LookMode, lockAvailable: boolean): string {
  switch (mode) {
    case "pointerLock":
      return "olhar: mouse capturado · esc solta";
    case "drag":
      return "olhar: arraste · setas tambem olham";
    case "keys":
      return "olhar: setas";
    default:
      return lockAvailable
        ? "olhar: clique e arraste, ou use as setas"
        : "olhar: arraste ou setas · captura indisponivel aqui";
  }
}

export { TICK_SECONDS };
