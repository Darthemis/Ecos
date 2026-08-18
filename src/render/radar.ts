// Radar/bussola circular verde (GDD §13). Nao desenha terreno e nao substitui o
// mapa. Nesta fase mostra orientacao e um unico contato ambiguo.
//
// Desenhado em um canvas 2D proprio, sobreposto ao mundo: uma superficie, nao
// uma grade de elementos.

import type { RadarContact } from "../world/perception";

const GREEN = "#39ff88";
const DIM = "rgba(57, 255, 136, 0.28)";
const CARDINALS = ["N", "L", "S", "O"] as const;

export type Radar = {
  canvas: HTMLCanvasElement;
  draw: (yaw: number, contact: RadarContact | null, seconds: number) => void;
};

export function createRadar(diameter = 132): Radar {
  const canvas = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = diameter * dpr;
  canvas.height = diameter * dpr;
  canvas.style.width = `${diameter}px`;
  canvas.style.height = `${diameter}px`;
  canvas.className = "ecos-radar";

  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Contexto 2D indisponivel para o radar");
  ctx.scale(dpr, dpr);

  const center = diameter / 2;
  const radius = center - 10;

  return {
    canvas,
    draw(yaw, contact, seconds) {
      ctx.clearRect(0, 0, diameter, diameter);

      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = DIM;
      ctx.lineWidth = 1;
      for (const fraction of [0.34, 0.67]) {
        ctx.beginPath();
        ctx.arc(center, center, radius * fraction, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rosa dos ventos girando com o olhar: a letra diz para onde se olha.
      ctx.fillStyle = GREEN;
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      CARDINALS.forEach((label, index) => {
        const angle = (index * Math.PI) / 2 - yaw;
        const x = center + Math.sin(angle) * (radius - 9);
        const y = center - Math.cos(angle) * (radius - 9);
        ctx.globalAlpha = label === "N" ? 1 : 0.55;
        ctx.fillText(label, x, y);
      });
      ctx.globalAlpha = 1;

      // Marca fixa da frente: a direcao do olhar nunca gira na tela.
      ctx.strokeStyle = GREEN;
      ctx.beginPath();
      ctx.moveTo(center, center - radius + 2);
      ctx.lineTo(center - 4, center - radius + 9);
      ctx.moveTo(center, center - radius + 2);
      ctx.lineTo(center + 4, center - radius + 9);
      ctx.stroke();

      ctx.fillStyle = DIM;
      ctx.beginPath();
      ctx.arc(center, center, 2, 0, Math.PI * 2);
      ctx.fill();

      if (contact === null) return;

      // Contato unico e ambiguo: intensidade e tremor, sem icone nem rotulo.
      const jitter = Math.sin(seconds * 2.7) * 0.05 + Math.sin(seconds * 6.1) * 0.02;
      const angle = contact.bearing;
      const distance = radius * Math.min(1, contact.normalizedDistance + jitter * 0.4);
      const x = center + Math.sin(angle) * distance;
      const y = center - Math.cos(angle) * distance;
      const pulse = 0.55 + 0.45 * Math.sin(seconds * 3.4);
      const alpha = Math.max(0.12, contact.strength * pulse);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.arc(x, y, 2.4 + contact.strength * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha * 0.35;
      ctx.beginPath();
      ctx.arc(x, y, 5.5 + contact.strength * 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  };
}
