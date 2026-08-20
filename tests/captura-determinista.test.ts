// A captura determinista existe para que uma comparacao de pixels volte a valer
// como prova. Estes testes cobrem o que pode falhar em silencio: uma pose
// invalida aceita, um campo esquecido, e o caminho vazar para a producao.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCapturePose, type CapturePose } from "../src/diagnostics/deterministic-capture";

const GAME = readFileSync("src/app/game.ts", "utf8");

const POSE: CapturePose = { x: 1.5, z: -4, eyeY: 1.7, yaw: 0.3, pitch: -0.1, seconds: 12.5 };

describe("pose de captura", () => {
  it("aceita uma pose completa e devolve os mesmos numeros", () => {
    expect(parseCapturePose({ ...POSE })).toEqual(POSE);
  });

  it("aceita zero e negativos, que sao poses legitimas", () => {
    const zerada = { x: 0, z: 0, eyeY: 0, yaw: 0, pitch: 0, seconds: 0 };
    expect(parseCapturePose(zerada)).toEqual(zerada);
  });

  it("recusa qualquer campo em falta", () => {
    for (const campo of Object.keys(POSE)) {
      const incompleta: Record<string, number> = { ...POSE };
      delete incompleta[campo];
      expect(parseCapturePose(incompleta)).toBeNull();
    }
  });

  it("recusa NaN e infinito, que produziriam um quadro preto lido como resultado", () => {
    for (const campo of Object.keys(POSE)) {
      expect(parseCapturePose({ ...POSE, [campo]: Number.NaN })).toBeNull();
      expect(parseCapturePose({ ...POSE, [campo]: Number.POSITIVE_INFINITY })).toBeNull();
      expect(parseCapturePose({ ...POSE, [campo]: Number.NEGATIVE_INFINITY })).toBeNull();
    }
  });

  it("recusa strings numericas: nao converte por conveniencia", () => {
    expect(parseCapturePose({ ...POSE, x: "1.5" })).toBeNull();
  });

  it("recusa o que nao e objeto", () => {
    for (const lixo of [null, undefined, 3, "pose", true, [], () => 0]) {
      expect(parseCapturePose(lixo)).toBeNull();
    }
  });

  it("ignora campos a mais em vez de os deixar passar para a pose", () => {
    const analisada = parseCapturePose({ ...POSE, intruso: 9 });
    expect(analisada).toEqual(POSE);
    expect(analisada).not.toHaveProperty("intruso");
  });
});

describe("as duas causas de indeterminismo morrem juntas", () => {
  it("a pose fixa o ponto de vista", () => {
    expect(GAME).toContain("view.camera.position.set(olhoX, olhoY, olhoZ);");
    expect(GAME).toContain('view.camera.rotation.set(olhoPitch, olhoYaw, 0, "YXZ");');
  });

  it("e congela o relogio que move as oscilacoes", () => {
    // Nao basta parar a camera: `elapsed` alimenta o tremor das luzes, entao um
    // quadro imovel continuaria a variar. Tudo o que le o tempo tem de ler
    // `tempo`, e nao `elapsed`.
    expect(GAME).toContain("const tempo = capture?.seconds ?? elapsed;");
    expect(GAME).toContain("const sectors = view.update(tempo, { x: olhoX, z: olhoZ });");
    expect(GAME).toContain("radar.draw(olhoYaw, contact, tempo);");
    // Depois de `tempo` existir, `elapsed` so pode aparecer onde nao pinta nada:
    // na declaracao, ao acumular-se, no registro de percurso — que segue o
    // jogador real, nao o ponto de vista da captura — e na definicao de `tempo`.
    // Sao quatro. Um quinto uso seria algo visivel a ler o relogio de parede.
    const usos = GAME.match(/\belapsed\b/g) ?? [];
    expect(usos).toHaveLength(4);
  });

  it("a simulacao nao e tocada pela captura", () => {
    // A pose substitui o ponto de vista, nunca o estado do mundo.
    expect(GAME).not.toMatch(/capture\s*\.\s*\w+\s*;?\s*state\s*=/);
    expect(GAME).toContain("state = advance(state, intent, plan.ticks);");
  });
});

describe("nao alcanca a producao", () => {
  it("a superficie so e montada com os diagnosticos ligados", () => {
    const bloco = GAME.indexOf("__ecosCapture");
    const guarda = GAME.lastIndexOf("if (DIAGNOSTICS_ENABLED) {", bloco);
    expect(guarda).toBeGreaterThan(-1);
    expect(bloco - guarda).toBeLessThan(400);
  });

  it("e e retirada ao parar o jogo", () => {
    expect(GAME).toContain('delete (window as unknown as Record<string, unknown>).__ecosCapture;');
    expect(GAME).toContain("capture = null;");
  });

  it("o interruptor dos diagnosticos continua a ser a construcao", () => {
    const overlay = readFileSync("src/diagnostics/overlay.ts", "utf8");
    expect(overlay).toContain("export const DIAGNOSTICS_ENABLED = import.meta.env.DEV;");
  });
});
