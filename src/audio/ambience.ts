// Som espacial do lugar. Vários emissores fixos, orientados a dados, mais a
// presença móvel herdada da Fase 1.
//
// Todos os timbres são sintetizados a partir de seed: nenhum arquivo de áudio
// entra no repositório e nenhuma dependência é acrescentada. O som nunca é o
// único canal de uma informação crítica — direção também aparece no radar, nos
// marcos e na forma do lugar.
//
// O navegador exige um gesto do usuário antes de tocar áudio, por isso o
// contexto só nasce em unlock().

import { createRng } from "../core/rng";
import type { Vec2 } from "../world/geometry";
import type { EmitterVoice, SceneDefinition, SoundEmitter } from "../world/scene";

const BUFFER_SECONDS = 6;

/** Parâmetros de cada timbre. Nenhum deles depende do relógio de parede. */
const VOICES: Record<EmitterVoice, { seed: number; filter: number; drone: number; pulse: number; noise: number }> = {
  // Sopro largo e contínuo: o espaço aberto da praça.
  vento: { seed: 811, filter: 0.012, drone: 31, pulse: 0.21, noise: 2.4 },
  // Gotas irregulares num vão fechado: antecipação no corredor.
  gotejo: { seed: 1723, filter: 0.28, drone: 0, pulse: 1.7, noise: 1.1 },
  // Zumbido grave e preso: alguma coisa ainda funciona sob o assento vazio.
  ressonancia: { seed: 2939, filter: 0.05, drone: 43, pulse: 0.13, noise: 0.5 },
  // Atrito seco e curto: a brecha por onde o ar passa.
  atrito: { seed: 4127, filter: 0.09, drone: 0, pulse: 0.61, noise: 3.1 },
};

function createVoiceBuffer(context: AudioContext, voice: EmitterVoice): AudioBuffer {
  const spec = VOICES[voice];
  const length = Math.floor(context.sampleRate * BUFFER_SECONDS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  const rng = createRng(spec.seed);

  let low = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / context.sampleRate;

    const noise = rng() * 2 - 1;
    low += (noise - low) * spec.filter;

    const breath = Math.sin(t * spec.pulse * 2 * Math.PI) * 0.5 + Math.sin(t * spec.pulse * 0.37 * 2 * Math.PI + 1.4) * 0.5;
    const envelope = Math.max(0, breath) ** 2;

    const drone = spec.drone === 0
      ? 0
      : Math.sin(t * 2 * Math.PI * spec.drone) * 0.12 + Math.sin(t * 2 * Math.PI * spec.drone * 1.51) * 0.05;

    data[i] = low * spec.noise * envelope + drone * (0.4 + envelope * 0.6);
  }

  // Junta as pontas para que o laço não estale.
  const fade = Math.floor(context.sampleRate * 0.25);
  for (let i = 0; i < fade; i += 1) {
    const k = i / fade;
    const head = data[i] ?? 0;
    const tail = data[length - fade + i] ?? 0;
    data[i] = head * k + tail * (1 - k);
  }

  return buffer;
}

type Voice = { panner: PannerNode; source: AudioBufferSourceNode; gain: GainNode };

export type Ambience = {
  unlock: () => Promise<void>;
  /** Atualiza ouvinte e presença móvel. Emissores fixos não se movem. */
  update: (listener: Vec2, yaw: number, presence: Vec2) => void;
  isRunning: () => boolean;
  emitterCount: () => number;
  dispose: () => void;
};

function connect(context: AudioContext, voice: EmitterVoice, gainValue: number, radius: number): Voice {
  const gain = context.createGain();
  gain.gain.value = gainValue;

  const panner = context.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 1.8;
  panner.maxDistance = radius;
  panner.rolloffFactor = 1.4;

  const source = context.createBufferSource();
  source.buffer = createVoiceBuffer(context, voice);
  source.loop = true;
  source.connect(panner);
  panner.connect(gain);
  gain.connect(context.destination);
  source.start();

  return { panner, source, gain };
}

function place(panner: PannerNode, time: number, x: number, y: number, z: number): void {
  if (panner.positionX === undefined) return;
  panner.positionX.setValueAtTime(x, time);
  panner.positionY.setValueAtTime(y, time);
  panner.positionZ.setValueAtTime(z, time);
}

export function createAmbience(scene: SceneDefinition): Ambience {
  let context: AudioContext | null = null;
  let presenceVoice: Voice | null = null;
  const fixed: { voice: Voice; emitter: SoundEmitter }[] = [];

  return {
    async unlock() {
      if (context !== null) {
        if (context.state === "suspended") await context.resume();
        return;
      }

      const created = new AudioContext();

      for (const emitter of scene.emitters) {
        const voice = connect(created, emitter.voice, emitter.gain, emitter.radius);
        place(voice.panner, created.currentTime, emitter.position.x, 0.8, emitter.position.z);
        fixed.push({ voice, emitter });
      }

      // A presença móvel continua existindo: é ela que o radar detecta.
      presenceVoice = connect(created, "atrito", 0.72, 45);

      context = created;
      if (created.state === "suspended") await created.resume();
    },

    update(listener, yaw, presence) {
      if (context === null) return;

      const time = context.currentTime;
      const audioListener = context.listener;

      // yaw 0 olha para -Z, o mesmo eixo que a câmera usa.
      const forwardX = -Math.sin(yaw);
      const forwardZ = -Math.cos(yaw);

      if (audioListener.positionX !== undefined) {
        audioListener.positionX.setValueAtTime(listener.x, time);
        audioListener.positionY.setValueAtTime(0, time);
        audioListener.positionZ.setValueAtTime(listener.z, time);
        audioListener.forwardX.setValueAtTime(forwardX, time);
        audioListener.forwardY.setValueAtTime(0, time);
        audioListener.forwardZ.setValueAtTime(forwardZ, time);
        audioListener.upX.setValueAtTime(0, time);
        audioListener.upY.setValueAtTime(1, time);
        audioListener.upZ.setValueAtTime(0, time);
      }

      if (presenceVoice !== null) place(presenceVoice.panner, time, presence.x, 0, presence.z);
    },

    isRunning() {
      return context !== null && context.state === "running";
    },

    emitterCount() {
      return fixed.length + (presenceVoice === null ? 0 : 1);
    },

    dispose() {
      for (const { voice } of fixed) {
        voice.source.stop();
        voice.source.disconnect();
        voice.panner.disconnect();
      }
      presenceVoice?.source.stop();
      presenceVoice?.panner.disconnect();
      void context?.close();
      context = null;
      fixed.length = 0;
      presenceVoice = null;
    },
  };
}
