// Sobreposicao de diagnostico. Existe apenas em desenvolvimento: a construcao de
// producao nunca a instancia (AGENT_RULES §5, linha Diagnostico).

import type { MetricsSnapshot } from "./metrics";

export const DIAGNOSTICS_ENABLED = import.meta.env.DEV;

export type DiagnosticsOverlay = {
  element: HTMLElement;
  setVisible: (visible: boolean) => void;
  update: (snapshot: MetricsSnapshot, extra: Record<string, string>) => void;
};

export function createDiagnosticsOverlay(): DiagnosticsOverlay {
  const element = document.createElement("pre");
  element.className = "ecos-diagnostics";
  element.hidden = true;

  return {
    element,
    setVisible(visible) {
      element.hidden = !visible;
    },
    update(snapshot, extra) {
      if (element.hidden) return;
      const lines = [
        `fps          ${snapshot.fps.toFixed(1)}`,
        `sim          ${snapshot.sim.averageMs.toFixed(3)} ms  (pico ${snapshot.sim.maxMs.toFixed(3)})`,
        `render       ${snapshot.render.averageMs.toFixed(3)} ms  (pico ${snapshot.render.maxMs.toFixed(3)})`,
        `ticks/quadro ${snapshot.ticksPerFrame}`,
        `descartado   ${snapshot.droppedSeconds.toFixed(3)} s`,
        `quadros      ${snapshot.frames}`,
      ];
      for (const [key, value] of Object.entries(extra)) {
        lines.push(`${key.padEnd(12)} ${value}`);
      }
      element.textContent = lines.join("\n");
    },
  };
}
