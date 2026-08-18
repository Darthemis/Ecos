// Medicao separada de simulacao e renderizacao (AGENT_RULES §5 e §12).
// Puro acumulador: nao desenha e nao depende do DOM.

export type Sample = {
  averageMs: number;
  maxMs: number;
};

export type MetricsSnapshot = {
  fps: number;
  sim: Sample;
  render: Sample;
  ticksPerFrame: number;
  droppedSeconds: number;
  frames: number;
};

const WINDOW = 60;

class Channel {
  private readonly samples: number[] = [];

  push(ms: number): void {
    this.samples.push(ms);
    if (this.samples.length > WINDOW) this.samples.shift();
  }

  read(): Sample {
    if (this.samples.length === 0) return { averageMs: 0, maxMs: 0 };
    let total = 0;
    let max = 0;
    for (const value of this.samples) {
      total += value;
      if (value > max) max = value;
    }
    return { averageMs: total / this.samples.length, maxMs: max };
  }
}

export class Metrics {
  private readonly sim = new Channel();
  private readonly render = new Channel();
  private readonly frame = new Channel();
  private ticks = 0;
  private dropped = 0;
  private frames = 0;

  recordFrame(deltaSeconds: number): void {
    this.frame.push(deltaSeconds * 1000);
    this.frames += 1;
  }

  recordSim(ms: number, ticks: number, droppedSeconds: number): void {
    this.sim.push(ms);
    this.ticks = ticks;
    this.dropped += droppedSeconds;
  }

  recordRender(ms: number): void {
    this.render.push(ms);
  }

  snapshot(): MetricsSnapshot {
    const frame = this.frame.read();
    return {
      fps: frame.averageMs > 0 ? 1000 / frame.averageMs : 0,
      sim: this.sim.read(),
      render: this.render.read(),
      ticksPerFrame: this.ticks,
      droppedSeconds: this.dropped,
      frames: this.frames,
    };
  }
}
