// Presenca sonora movel com audio espacial. O som e sintetizado a partir de uma
// seed: nao ha arquivo binario e o timbre e reproduzivel.
//
// O navegador exige um gesto do usuario antes de tocar audio, por isso o
// contexto so e criado em unlock().

import { createRng } from "../core/rng";
import type { Vec2 } from "../world/geometry";

const BUFFER_SECONDS = 6;
const SEED = 4127;

export type PresenceAudio = {
  unlock: () => Promise<void>;
  update: (listener: Vec2, yaw: number, source: Vec2) => void;
  isRunning: () => boolean;
  dispose: () => void;
};

function createVoiceBuffer(context: AudioContext): AudioBuffer {
  const length = Math.floor(context.sampleRate * BUFFER_SECONDS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  const rng = createRng(SEED);

  let low = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / context.sampleRate;

    // Ruido filtrado: passo arrastado, sem altura definida.
    const noise = rng() * 2 - 1;
    low += (noise - low) * 0.035;

    // Sopro lento e irregular, para que a fonte pareca viva e nao mecanica.
    const breath = Math.sin(t * 0.7) * 0.5 + Math.sin(t * 0.23 + 1.4) * 0.5;
    const envelope = Math.max(0, breath) ** 2;

    // Fundo grave que carrega a direcao mesmo quando o ruido cai.
    const drone = Math.sin(t * 2 * Math.PI * 47) * 0.12 + Math.sin(t * 2 * Math.PI * 71.3) * 0.05;

    data[i] = low * 3.2 * envelope + drone * (0.4 + envelope * 0.6);
  }

  // Junta as pontas para que o laco nao estale.
  const fade = Math.floor(context.sampleRate * 0.25);
  for (let i = 0; i < fade; i += 1) {
    const k = i / fade;
    const head = data[i] ?? 0;
    const tail = data[length - fade + i] ?? 0;
    data[i] = head * k + tail * (1 - k);
  }

  return buffer;
}

export function createPresenceAudio(): PresenceAudio {
  let context: AudioContext | null = null;
  let panner: PannerNode | null = null;
  let source: AudioBufferSourceNode | null = null;

  return {
    async unlock() {
      if (context !== null) {
        if (context.state === "suspended") await context.resume();
        return;
      }

      const created = new AudioContext();
      const gain = created.createGain();
      gain.gain.value = 0.85;

      const node = created.createPanner();
      node.panningModel = "HRTF";
      node.distanceModel = "inverse";
      node.refDistance = 1.6;
      node.maxDistance = 45;
      node.rolloffFactor = 1.3;

      const voice = created.createBufferSource();
      voice.buffer = createVoiceBuffer(created);
      voice.loop = true;
      voice.connect(node);
      node.connect(gain);
      gain.connect(created.destination);
      voice.start();

      context = created;
      panner = node;
      source = voice;

      if (created.state === "suspended") await created.resume();
    },

    update(listener, yaw, sourcePosition) {
      if (context === null || panner === null) return;

      const time = context.currentTime;
      const audioListener = context.listener;

      // yaw 0 olha para -Z, o mesmo eixo que a camera usa.
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

      if (panner.positionX !== undefined) {
        panner.positionX.setValueAtTime(sourcePosition.x, time);
        panner.positionY.setValueAtTime(0, time);
        panner.positionZ.setValueAtTime(sourcePosition.z, time);
      }
    },

    isRunning() {
      return context !== null && context.state === "running";
    },

    dispose() {
      source?.stop();
      source?.disconnect();
      panner?.disconnect();
      void context?.close();
      context = null;
      panner = null;
      source = null;
    },
  };
}
