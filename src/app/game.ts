// Montagem do laço. Une entrada, simulação, percepção, renderização, áudio e
// diagnóstico sem que nenhum deles conheça o outro diretamente.

import { DepthFormat, DepthTexture, NearestFilter, UnsignedIntType, WebGLRenderer, WebGLRenderTarget } from "three";
import { planSteps, TICK_SECONDS } from "../core/fixed-step";
import { createInputSource } from "../core/input";
import { DEFAULT_COMFORT } from "../core/settings";
import { createAmbience } from "../audio/ambience";
import { ACTIVE_SCENE } from "../content/active-scene";
import { createDiagnosticsOverlay, DIAGNOSTICS_ENABLED } from "../diagnostics/overlay";
import { parseCapturePose, type CapturePose } from "../diagnostics/deterministic-capture";
import {
  applyDiagnosticCommand,
  INITIAL_DIAGNOSTIC_STATE,
  type DiagnosticState,
} from "./diagnostic-commands";
import { Metrics } from "../diagnostics/metrics";
import { createRouteLog } from "../diagnostics/route-log";
import { createRouteCanvas } from "../diagnostics/route-canvas";
import { createAsciiPass } from "../render/ascii-pass";
import { createStructurePass } from "../render/structure-pass";
import { createSceneView } from "../render/scene-view";
import { computeGrid } from "../render/grid";
import { createRadar } from "../render/radar";
import { advance, createWorldState } from "../sim/world-sim";
import { PLAYER_EYE_HEIGHT } from "../sim/state";
import { segmentAt } from "../world/scene";
import { ECHO_LEVELS } from "../world/contact-echo";
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

  // Indicação discreta, só antes da interação. Não explica o percurso.
  const hint = document.createElement("div");
  hint.className = "ecos-hint";
  hint.textContent = "clique para ouvir e olhar · WASD anda · setas olham · − e = sensibilidade";
  root.appendChild(hint);

  const lookBadge = document.createElement("div");
  lookBadge.className = "ecos-look-mode";
  root.appendChild(lookBadge);

  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });

  const view = createSceneView(ACTIVE_SCENE);
  const ascii = createAsciiPass();
  const structure = createStructurePass();
  const audio = createAmbience(ACTIVE_SCENE);
  const metrics = new Metrics();
  const routeLog = createRouteLog(ACTIVE_SCENE);

  const diagnostics = DIAGNOSTICS_ENABLED ? createDiagnosticsOverlay() : null;
  if (diagnostics !== null) root.appendChild(diagnostics.element);

  const routeCanvas = DIAGNOSTICS_ENABLED ? createRouteCanvas(ACTIVE_SCENE) : null;
  if (routeCanvas !== null) root.appendChild(routeCanvas.canvas);

  // A profundidade da mesma grade alimenta o reforco estrutural do passe ASCII.
  // Inteiro sem sinal: com corte de camera em 220 m, 16 bits nao separariam
  // celulas vizinhas de uma parede proxima.
  const criarAlvo = (w: number, h: number) => {
    const depthTexture = new DepthTexture(w, h, UnsignedIntType);
    depthTexture.format = DepthFormat;
    depthTexture.minFilter = NearestFilter;
    depthTexture.magFilter = NearestFilter;
    const alvo = new WebGLRenderTarget(w, h, { minFilter: NearestFilter, magFilter: NearestFilter });
    alvo.depthTexture = depthTexture;
    return alvo;
  };

  let target = criarAlvo(2, 2);
  let columns = 2;
  let rows = 2;
  let visualRange: VisualRange = DEFAULT_VISUAL_RANGE;
  let diag: DiagnosticState = INITIAL_DIAGNOSTIC_STATE;
  let flickerReduced = DEFAULT_COMFORT.flickerReduced;
  let state = createWorldState();
  let accumulator = 0;
  let previous = performance.now();
  let elapsed = 0;
  let running = true;
  let labelTimer = 0;
  // Pose de captura. Nula no jogo; nao nula so quando uma ferramenta de medicao
  // a define. Ver src/diagnostics/deterministic-capture.ts.
  let capture: CapturePose | null = null;

  // Aplica o estado inteiro, campo a campo. Nenhum campo pode ficar sem efeito
  // por esquecimento: foi assim que `F5` deixou de funcionar na Fase 2.
  const syncDiagnostics = () => {
    view.setWorldLightsEnabled(diag.worldLights);
    view.setEchoEnabled(diag.echo);
    view.setEchoLevel(diag.echoLevel);
    view.setSectorDebug(diag.sectorDebug);
    routeCanvas?.setVisible(diag.sectorDebug);
    ascii.setStructureEnabled(diag.structure);
    ascii.setStructureMask(diag.structureMask);
    ascii.setStructureSource(diag.structureSource);
    view.setPatternEnabled(diag.surfacePattern);
  };
  syncDiagnostics();

  const applyVisualRange = (meters: VisualRange) => {
    visualRange = meters;
    view.setVisualRange(meters);
    const planos = view.planes();
    structure.setDepthRange(planos.near, planos.far, planos.fogNear, planos.fogFar);
    rangeLabel.textContent = `${meters} m`;
    labelTimer = 2.2;
  };

  const resize = () => {
    // A grade precisa cair em pixels inteiros do dispositivo. Quando a largura
    // não é múltiplo exato da célula, cada célula ocupa uma fração de pixel e o
    // batimento entre as duas grades aparece como faixas verticais fixas na
    // tela. Por isso o quadro é reduzido até o múltiplo exato e centralizado; a
    // sobra fica preta, que já é parte do mundo.
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const grade = computeGrid(root.clientWidth, root.clientHeight, dpr);
    const { cellWidth, cellHeight, bufferWidth, bufferHeight } = grade;
    columns = grade.columns;
    rows = grade.rows;

    renderer.setPixelRatio(1);
    renderer.setSize(bufferWidth, bufferHeight, false);
    canvas.style.width = `${bufferWidth / dpr}px`;
    canvas.style.height = `${bufferHeight / dpr}px`;

    target.depthTexture?.dispose();
    target.dispose();
    target = criarAlvo(columns, rows);
    ascii.setGrid(columns, rows, cellWidth, cellHeight);
    structure.setGrid(columns, rows);

    view.camera.aspect = bufferWidth / bufferHeight;
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
      case "toggleFlickerReduction":
        // Conforto: vale no jogo normal, não é diagnóstico.
        flickerReduced = !flickerReduced;
        view.setFlickerReduced(flickerReduced);
        radar.setFlickerReduced(flickerReduced);
        break;
      case "toggleDiagnostics":
        if (diagnostics !== null) diagnostics.setVisible(diagnostics.element.hidden);
        break;
      case "exportRoute":
        // Exportação local: nada sai da máquina.
        if (DIAGNOSTICS_ENABLED) console.info(routeLog.toText());
        break;
      case "sensitivityDown":
      case "sensitivityUp":
        rangeLabel.textContent = `sensibilidade ${input.sensitivity().toFixed(1)}`;
        labelTimer = 1.6;
        break;
    }

    const proximo = applyDiagnosticCommand(diag, command, DIAGNOSTICS_ENABLED);
    if (proximo !== diag) {
      diag = proximo;
      syncDiagnostics();
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

    // O registro recebe uma cópia e não devolve nada à simulação.
    routeLog.sample(elapsed, { x: state.player.position.x, z: state.player.position.z });

    // Ponto de vista e instante da cena. Com uma pose de captura ativa os dois
    // ficam fixos, e o quadro deixa de depender do relogio de parede — que e o
    // que torna duas execucoes comparaveis. A simulacao continua intocada.
    const olhoX = capture?.x ?? state.player.position.x;
    const olhoZ = capture?.z ?? state.player.position.z;
    const olhoY = capture?.eyeY ?? state.player.groundY + PLAYER_EYE_HEIGHT;
    const olhoYaw = capture?.yaw ?? state.player.yaw;
    const olhoPitch = capture?.pitch ?? state.player.pitch;
    const tempo = capture?.seconds ?? elapsed;

    view.camera.position.set(olhoX, olhoY, olhoZ);
    view.camera.rotation.set(olhoPitch, olhoYaw, 0, "YXZ");

    const sectors = view.update(tempo, { x: olhoX, z: olhoZ });

    const renderStart = performance.now();
    if (diag.uniformProbe) {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x6a6a6a, 1);
      renderer.clear(true, true, false);
      renderer.setClearColor(0x000000, 1);
      structure.render(renderer, target.depthTexture!);
      ascii.render(renderer, target, structure.texture());
    } else if (diag.rawScene) {
      renderer.setRenderTarget(null);
      renderer.render(view.scene, view.camera);
    } else {
      renderer.setRenderTarget(target);
      renderer.render(view.scene, view.camera);
      structure.render(renderer, target.depthTexture!);
      ascii.render(renderer, target, structure.texture());
    }
    metrics.recordRender(performance.now() - renderStart);

    const contact = radarContact(state);
    radar.draw(olhoYaw, contact, tempo);
    audio.update(state.player.position, state.player.yaw, state.presence.position);
    routeCanvas?.draw(routeLog.samples(), state.player.position);

    if (labelTimer > 0) {
      labelTimer -= deltaSeconds;
      rangeLabel.style.opacity = labelTimer > 0 ? String(Math.min(1, labelTimer)) : "0";
    }

    lookBadge.textContent = describeLookMode(input.lookMode(), input.pointerLockAvailable());

    if (diagnostics !== null) {
      const summary = routeLog.summary();
      diagnostics.update(metrics.snapshot(), {
        cena: `${ACTIVE_SCENE.id} v${ACTIVE_SCENE.version} seed ${ACTIVE_SCENE.seed}`,
        grade: `${columns} x ${rows}`,
        alcance: `${visualRange} m`,
        posicao: `${state.player.position.x.toFixed(1)}, ${state.player.position.z.toFixed(1)} · y ${state.player.groundY.toFixed(2)}`,
        trecho: segmentAt(ACTIVE_SCENE, state.player.position) ?? "fora",
        setores: `${sectors.active}/${sectors.total} · objetos ${sectors.objectsActive}/${sectors.objectsTotal}`,
        percurso: `${summary.distance.toFixed(0)} m · ${summary.seconds.toFixed(0)} s · hesitacoes ${summary.hesitations} · retornos ${summary.returns}`,
        luzes: diag.worldLights ? "fontes do mundo ligadas" : "sem fonte proxima",
        eco: diag.echo ? `${diag.echoLevel} (${ECHO_LEVELS[diag.echoLevel]})` : "desligado",
        estrutura: diag.structure
          ? `ligada · ${diag.structureSource}${diag.structureMask ? " · MASCARA" : ""}`
          : "desligada (base Fase 2)",
        superficie: diag.surfacePattern ? "padrao por tipo ligado" : "padrao desligado",
        conforto: `sensibilidade ${input.sensitivity().toFixed(1)} · cintilacao ${flickerReduced ? "reduzida" : "normal"}`,
        modo: diag.uniformProbe ? "ENTRADA UNIFORME" : diag.rawScene ? "3D CONVENCIONAL" : "ascii",
        audio: audio.isRunning() ? `ativo · ${audio.emitterCount()} emissores` : "aguardando gesto",
      });
    }

    requestAnimationFrame(frame);
  };

  // Superficie de medicao, so em desenvolvimento. A construcao de producao nao
  // contem este bloco, entao o jogador nunca a alcanca — a mesma regra dos
  // outros diagnosticos.
  if (DIAGNOSTICS_ENABLED) {
    (window as unknown as Record<string, unknown>).__ecosCapture = (pose: unknown) => {
      if (pose === null) {
        capture = null;
        return true;
      }
      const analisada = parseCapturePose(pose);
      if (analisada === null) return false;
      capture = analisada;
      return true;
    };
  }

  requestAnimationFrame(frame);

  return {
    stop() {
      running = false;
      capture = null;
      if (DIAGNOSTICS_ENABLED) {
        delete (window as unknown as Record<string, unknown>).__ecosCapture;
      }
      window.removeEventListener("resize", resize);
      input.dispose();
      audio.dispose();
      ascii.dispose();
      structure.dispose();
      view.dispose();
      target.dispose();
      renderer.dispose();
    },
  };
}

/** Texto curto do indicador de controle. */
function describeLookMode(mode: ReturnType<ReturnType<typeof createInputSource>["lookMode"]>, lockAvailable: boolean): string {
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
