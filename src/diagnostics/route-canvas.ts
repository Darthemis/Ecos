// Visualização local do percurso registrado. Só em desenvolvimento.
//
// Uma linha simples sobre a planta do lugar, desenhada num canvas 2D próprio:
// nenhuma biblioteca, nenhuma rede, nada sai da máquina.

import type { Vec2 } from "../world/geometry";
import type { SceneDefinition } from "../world/scene";
import type { RouteSample } from "./route-log";

const ROUTE_COLOR: Record<string, string> = {
  direta: "#39ff88",
  lateral: "#36d6d0",
  comum: "#c9a227",
};

export type RouteCanvas = {
  canvas: HTMLCanvasElement;
  setVisible: (visible: boolean) => void;
  draw: (samples: readonly RouteSample[], player: Vec2) => void;
};

export function createRouteCanvas(scene: SceneDefinition, width = 190, height = 250): RouteCanvas {
  const canvas = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.className = "ecos-route";
  canvas.hidden = true;

  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Contexto 2D indisponivel para o percurso");
  ctx.scale(dpr, dpr);

  // Enquadramento fixo, derivado dos setores: a planta não se move com o corpo.
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const sector of scene.sectors) {
    minX = Math.min(minX, sector.area.minX);
    maxX = Math.max(maxX, sector.area.maxX);
    minZ = Math.min(minZ, sector.area.minZ);
    maxZ = Math.max(maxZ, sector.area.maxZ);
  }
  const pad = 8;
  const scale = Math.min((width - pad * 2) / (maxX - minX), (height - pad * 2) / (maxZ - minZ));
  const toScreen = (point: Vec2): [number, number] => [
    pad + (point.x - minX) * scale,
    pad + (maxZ - point.z) * scale,
  ];

  return {
    canvas,
    setVisible(visible) {
      canvas.hidden = !visible;
    },
    draw(samples, player) {
      if (canvas.hidden) return;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(57, 255, 136, 0.22)";
      ctx.lineWidth = 1;
      for (const sector of scene.sectors) {
        const [x0, y0] = toScreen({ x: sector.area.minX, z: sector.area.maxZ });
        const [x1, y1] = toScreen({ x: sector.area.maxX, z: sector.area.minZ });
        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      }

      ctx.strokeStyle = "rgba(226, 217, 191, 0.35)";
      for (const landmark of scene.landmarks) {
        const [x, y] = toScreen(landmark.position);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Um traço por amostra, colorido pela rota inferida naquele ponto.
      ctx.lineWidth = 1.6;
      for (let i = 1; i < samples.length; i += 1) {
        const a = samples[i - 1]!;
        const b = samples[i]!;
        const [ax, ay] = toScreen(a);
        const [bx, by] = toScreen(b);
        ctx.strokeStyle = ROUTE_COLOR[b.route] ?? "#7a7a7a";
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      const [px, py] = toScreen(player);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
    },
  };
}
