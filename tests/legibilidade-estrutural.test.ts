// Legibilidade estrutural: o que a Fase 2.1A promete, provado fora do navegador.
//
// A grandeza é a segunda diferença normalizada do inverso da profundidade. Os
// testes abaixo constroem profundidades brutas a partir de distâncias em metros
// e verificam cada regra perceptiva declarada na tarefa.

import { readFileSync } from "node:fs";
import {
  MeshLambertMaterial,
  type WebGLProgramParametersWithUniforms,
  type WebGLRenderer,
} from "three";
import { describe, expect, it } from "vitest";
import { attachContactEcho } from "../src/render/contact-echo-material";
import { stabilizeLambertHue } from "../src/render/stable-hue-material";
import {
  fogVisibility,
  inverseDepth,
  reinforce,
  sourceAmount,
  STRUCTURE,
  structuralResponse,
  structureDefines,
  viewDepth,
  type StructuralSamples,
} from "../src/render/structural-legibility";

const NEAR = 0.1;
const FAR = 220;

/** Profundidade bruta do buffer para uma distância em metros. */
function bruta(metros: number): number {
  const ndc = (FAR + NEAR - (2 * NEAR * FAR) / metros) / (FAR - NEAR);
  return (ndc + 1) / 2;
}

const amostras = (
  centro: number,
  esquerda: number,
  direita: number,
  cima = centro,
  baixo = centro,
): StructuralSamples => ({
  centro: bruta(centro),
  esquerda: bruta(esquerda),
  direita: bruta(direita),
  cima: bruta(cima),
  baixo: bruta(baixo),
});

const responder = (a: StructuralSamples) => structuralResponse(a, NEAR, FAR);

/** O vazio: sem geometria, a profundidade bruta é 1. */
const VAZIO = 1;

describe("profundidade", () => {
  it("ida e volta entre metros e profundidade bruta", () => {
    for (const m of [0.5, 2, 5, 15, 60, 219]) {
      expect(viewDepth(bruta(m), NEAR, FAR)).toBeCloseTo(m, 4);
      expect(inverseDepth(bruta(m), NEAR, FAR)).toBeCloseTo(1 / m, 6);
    }
  });

  it("o vazio fica no plano de corte", () => {
    expect(viewDepth(VAZIO, NEAR, FAR)).toBeCloseTo(FAR, 3);
  });
});

describe("resposta estrutural", () => {
  it("entrada uniforme não produz resposta alguma", () => {
    const r = responder(amostras(5, 5, 5));
    expect(r.total).toBe(0);
    expect(r.silhueta).toBe(0);
    expect(r.descontinuidade).toBe(0);
    expect(r.vinco).toBe(0);
    expect(r.canto).toBe(0);
  });

  it("um plano visto de raspão não produz resposta — nem perto do horizonte", () => {
    // Três linhas de chão consecutivas, com a câmera na altura dos olhos. Em
    // metros a variação é enorme; no inverso da profundidade ela é linear, e é
    // por isso que o chão não acende. Este é o teste que decidiu a alternativa.
    const linhas = [13.4, 17.9, 26.8];
    const meio = linhas[1]!;
    const r = responder({
      centro: bruta(meio),
      esquerda: bruta(meio),
      direita: bruta(meio),
      cima: bruta(linhas[2]!),
      baixo: bruta(linhas[0]!),
    });
    expect(r.total).toBeLessThan(0.02);

    // E a primeira diferença, que seria a escolha ingênua, é enorme: 33%.
    const relativo =
      (inverseDepth(bruta(linhas[0]!), NEAR, FAR) - inverseDepth(bruta(meio), NEAR, FAR)) /
      inverseDepth(bruta(meio), NEAR, FAR);
    expect(Math.abs(relativo)).toBeGreaterThan(0.3);
  });

  it("uma superfície inclinada em ambos os eixos também não produz resposta", () => {
    // Plano genérico: o inverso é afim, então centro é a média das vizinhas.
    const inv = (m: number) => inverseDepth(bruta(m), NEAR, FAR);
    const alvo = (i: number) => 1 / i;
    const c = 8;
    const dx = 0.01;
    const dy = 0.004;
    const r = responder({
      centro: bruta(c),
      esquerda: bruta(alvo(inv(c) - dx)),
      direita: bruta(alvo(inv(c) + dx)),
      cima: bruta(alvo(inv(c) + dy)),
      baixo: bruta(alvo(inv(c) - dy)),
    });
    expect(r.total).toBeLessThan(0.01);
  });

  it("uma descontinuidade de profundidade responde mais que uma superfície plana", () => {
    const plana = responder(amostras(5, 5, 5));
    const pequeno = responder(amostras(5, 5, 5.5));
    const grande = responder(amostras(5, 5, 6.5));
    expect(pequeno.total).toBeGreaterThan(plana.total);
    expect(grande.total).toBeGreaterThan(pequeno.total);
    // Meio metro a 5 m é uma sobreposição discreta; um metro e meio é clara.
    expect(pequeno.descontinuidade).toBeGreaterThan(0.05);
    expect(grande.descontinuidade).toBeGreaterThan(0.3);
  });

  it("silhueta contra o vazio é o sinal mais forte, bem acima de uma sobreposição pequena", () => {
    const silhueta = responder({
      centro: bruta(5),
      esquerda: bruta(5),
      direita: VAZIO,
      cima: bruta(5),
      baixo: bruta(5),
    });
    const sobreposicao = responder(amostras(5, 5, 5.5));
    const superficie = responder(amostras(5, 5.02, 4.98));

    expect(silhueta.silhueta).toBeGreaterThan(0.9);
    expect(silhueta.total).toBeGreaterThan(sobreposicao.total * 1.5);
    expect(sobreposicao.total).toBeGreaterThan(superficie.total);
    expect(superficie.total).toBeLessThan(0.05);
  });

  it("a hierarquia declarada vale em ordem: silhueta > degrau > vinco", () => {
    const silhueta = responder({
      centro: bruta(5),
      esquerda: bruta(5),
      direita: VAZIO,
      cima: bruta(5),
      baixo: bruta(5),
    }).total;
    const degrau = responder(amostras(5, 5, 7.5)).total;
    // Vinco: quebra de plano simétrica, sem degrau.
    const vinco = responder(amostras(5, 5.3, 5.3)).total;
    expect(silhueta).toBeGreaterThan(degrau);
    expect(degrau).toBeGreaterThan(vinco);
    expect(vinco).toBeGreaterThan(0);
  });

  it("o reforço fica no corpo da frente: a superfície de trás não recebe halo", () => {
    // Mesma fronteira, vista das duas células. A de trás não é reforçada.
    const frente = responder({
      centro: bruta(5),
      esquerda: bruta(5),
      direita: VAZIO,
      cima: bruta(5),
      baixo: bruta(5),
    });
    const atras = responder({
      centro: VAZIO,
      esquerda: bruta(5),
      direita: VAZIO,
      cima: VAZIO,
      baixo: VAZIO,
    });
    expect(frente.silhueta).toBeGreaterThan(0.9);
    expect(atras.silhueta).toBe(0);
    expect(atras.descontinuidade).toBe(0);
  });

  it("vinco convexo e vinco côncavo são ambos detectados", () => {
    const convexo = responder(amostras(5, 5.3, 5.3));
    const concavo = responder(amostras(5.3, 5, 5));
    expect(convexo.vinco).toBeGreaterThan(0.3);
    expect(concavo.vinco).toBeGreaterThan(0.3);
  });

  it("canto responde nos dois eixos; aresta responde só em um", () => {
    const aresta = responder({
      centro: bruta(5),
      esquerda: bruta(5.3),
      direita: bruta(5.3),
      cima: bruta(5),
      baixo: bruta(5),
    });
    const canto = responder({
      centro: bruta(5),
      esquerda: bruta(5.3),
      direita: bruta(5.3),
      cima: bruta(5.3),
      baixo: bruta(5.3),
    });
    expect(aresta.canto).toBe(0);
    expect(canto.canto).toBeGreaterThan(0.5);
    expect(canto.total).toBeGreaterThan(aresta.total);
  });

  it("o total nunca passa do teto declarado", () => {
    const extremo = responder({
      centro: bruta(0.6),
      esquerda: VAZIO,
      direita: VAZIO,
      cima: VAZIO,
      baixo: VAZIO,
    });
    expect(extremo.total).toBeLessThanOrEqual(STRUCTURE.teto);
  });

  it("é determinística: a mesma entrada dá exatamente a mesma saída", () => {
    const entrada = amostras(4.2, 4.2, VAZIO === 1 ? 9.1 : 9.1, 4.2, 5.3);
    const a = responder(entrada);
    const b = responder(entrada);
    expect(a).toEqual(b);
  });
});

describe("alcance e oclusão", () => {
  it("fora do alcance perceptivo nada é revelado", () => {
    expect(fogVisibility(20, 3, 15)).toBe(0);
    expect(fogVisibility(15, 3, 15)).toBe(0);
    expect(fogVisibility(9, 3, 15)).toBeCloseTo(0.5, 6);
    expect(fogVisibility(1, 3, 15)).toBe(1);
  });

  it("os três alcances continuam distintos e 15 m continua o padrão", async () => {
    const { VISUAL_RANGES, DEFAULT_VISUAL_RANGE } = await import("../src/world/perception");
    expect([...VISUAL_RANGES]).toEqual([8, 15, 25]);
    expect(DEFAULT_VISUAL_RANGE).toBe(15);
    // A porta do reforço acompanha cada alcance, sem acender nada além dele.
    for (const alcance of VISUAL_RANGES) {
      expect(fogVisibility(alcance + 0.01, alcance * 0.2, alcance)).toBe(0);
      expect(fogVisibility(alcance * 0.2, alcance * 0.2, alcance)).toBe(1);
    }
  });

  it("nada aparece através de um volume: a resposta só conhece o que foi rasterizado", () => {
    // Uma parede a 3 m, e atrás dela uma aresta que existiria a 9 m. O que a
    // célula vê é a parede; a aresta encoberta não entra em conta alguma.
    const semOculto = responder(amostras(3, 3, 3));
    const comOculto = responder(amostras(3, 3, 3));
    expect(comOculto).toEqual(semOculto);
    expect(comOculto.total).toBe(0);
  });
});

describe("aplicação do reforço", () => {
  it("não inventa matiz para uma célula sem cor própria", () => {
    const passe = readFileSync("src/render/ascii-pass.ts", "utf8");
    expect(passe).toContain("vec3 hue = peak > 0.001 ? src / peak : vec3(0.0);");
    expect(passe).not.toMatch(/matizEstrutural|uAmbientTint|setAmbientTint|corDe\(/);
  });

  it("luzes alteram o brilho, mas preservam o matiz do material", () => {
    const material = readFileSync("src/render/stable-hue-material.ts", "utf8");
    const cena = readFileSync("src/render/scene-view.ts", "utf8");

    expect(material).toContain("ecosLitLuminance");
    expect(material).toContain("ecosMaterialHue");
    expect(material).toContain("vec3 outgoingLight = ecosStableDiffuse + totalEmissiveRadiance;");
    expect(cena.match(/stabilizeLambertHue\(/g)).toHaveLength(3);
  });

  it("preservação de matiz e Eco de Contato compõem o mesmo shader", () => {
    const material = new MeshLambertMaterial();
    attachContactEcho(material);
    stabilizeLambertHue(material);

    const shader = {
      uniforms: {},
      vertexShader: "#include <begin_vertex>",
      fragmentShader: [
        "#include <emissivemap_fragment>",
        "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
      ].join("\n"),
    } as unknown as WebGLProgramParametersWithUniforms;

    material.onBeforeCompile(shader, {} as WebGLRenderer);
    expect(shader.vertexShader).toContain("vEchoWorld");
    expect(shader.fragmentShader).toContain("totalEmissiveRadiance += uEchoColor");
    expect(shader.fragmentShader).toContain("vec3 outgoingLight = ecosStableDiffuse + totalEmissiveRadiance;");
  });

  it("uma célula clara quase não muda — nada de halo", () => {
    expect(reinforce(0.92, STRUCTURE.teto)).toBeLessThan(0.98);
    expect(reinforce(0.92, STRUCTURE.teto) - 0.92).toBeLessThan(0.06);
  });

  it("uma célula quase preta sobe o bastante para existir", () => {
    expect(reinforce(0, STRUCTURE.pesoSilhueta)).toBeCloseTo(STRUCTURE.pesoSilhueta, 6);
    // Na rampa de dez glifos, silhueta, degrau e vinco caem em degraus distintos.
    const degrauDeGlifo = (v: number) => Math.floor(Math.min(v, 0.999) * 10);
    expect(degrauDeGlifo(reinforce(0, STRUCTURE.pesoSilhueta))).toBeGreaterThan(
      degrauDeGlifo(reinforce(0, STRUCTURE.pesoDescontinuidade)),
    );
    expect(degrauDeGlifo(reinforce(0, STRUCTURE.pesoDescontinuidade))).toBeGreaterThan(
      degrauDeGlifo(reinforce(0, STRUCTURE.pesoVinco)),
    );
    expect(degrauDeGlifo(reinforce(0, STRUCTURE.pesoVinco))).toBeGreaterThan(0);
  });

  it("nunca passa de 1", () => {
    expect(reinforce(1, 1)).toBe(1);
    expect(reinforce(0.99, 1)).toBeLessThanOrEqual(1);
  });
});

describe("a grade continua em pixels inteiros", () => {
  it("o quadro é sempre múltiplo exato da célula, em qualquer largura", async () => {
    const { computeGrid } = await import("../src/render/grid");
    for (const largura of [320, 800, 1101, 1277, 1280, 1366, 1440, 1919, 2560]) {
      for (const dpr of [1, 1.25, 1.5, 2, 3]) {
        const g = computeGrid(largura, 720, dpr);
        expect(g.bufferWidth % g.cellWidth).toBe(0);
        expect(g.bufferHeight % g.cellHeight).toBe(0);
        expect(g.bufferWidth).toBe(g.columns * g.cellWidth);
        expect(g.bufferHeight).toBe(g.rows * g.cellHeight);
        expect(Number.isInteger(g.cellWidth)).toBe(true);
        expect(Number.isInteger(g.cellHeight)).toBe(true);
        // O quadro nunca ultrapassa o espaço disponível.
        expect(g.bufferWidth).toBeLessThanOrEqual(Math.max(320, Math.floor(largura * Math.min(3, dpr))));
      }
    }
  });

  it("uma janela minúscula ainda produz uma grade utilizável", async () => {
    const { computeGrid } = await import("../src/render/grid");
    const g = computeGrid(40, 30, 1);
    expect(g.columns).toBeGreaterThanOrEqual(2);
    expect(g.rows).toBeGreaterThanOrEqual(2);
  });
});

describe("diagnóstico e arquitetura", () => {
  it("isolar uma parte do sinal devolve menos que o todo", () => {
    const r = responder({
      centro: bruta(5),
      esquerda: bruta(5.3),
      direita: VAZIO,
      cima: bruta(5.3),
      baixo: bruta(5.3),
    });
    expect(sourceAmount(r, "silhueta")).toBeLessThanOrEqual(sourceAmount(r, "todas"));
    expect(sourceAmount(r, "vinco")).toBeLessThanOrEqual(sourceAmount(r, "todas"));
    expect(sourceAmount(r, "silhueta")).toBeGreaterThan(sourceAmount(r, "vinco"));
  });

  it("o shader recebe exatamente as mesmas constantes, sem repetir número algum", () => {
    const glsl = structureDefines();
    for (const [nome, valor] of Object.entries(STRUCTURE)) {
      expect(glsl).toContain(`EST_${nome.toUpperCase()} = ${valor.toFixed(6)}`);
    }
    // O passe estrutural monta seus limiares a partir do módulo, e o passe
    // ASCII só reconstitui a escala pelo teto. Nenhum dos dois escreve à mão
    // um número que já vive aqui.
    const passeEstrutural = readFileSync("src/render/structure-pass.ts", "utf8");
    expect(passeEstrutural).toContain("${structureDefines()}");
    for (const nome of Object.keys(STRUCTURE)) {
      expect(passeEstrutural).toContain(`EST_${nome.toUpperCase()}`);
    }
    const passeAscii = readFileSync("src/render/ascii-pass.ts", "utf8");
    expect(passeAscii).toContain("${structureDefines()}");
    expect(passeAscii).toContain("EST_TETO");
    for (const valor of Object.values(STRUCTURE)) {
      expect(passeAscii).not.toContain(valor.toFixed(6));
    }
  });

  it("o reforço é representação, não simulação: não conhece mundo nem simulação", () => {
    const fonte = readFileSync("src/render/structural-legibility.ts", "utf8");
    expect(fonte).not.toMatch(/from "\.\.\/sim/);
    expect(fonte).not.toMatch(/from "\.\.\/world/);
    expect(fonte).not.toMatch(/from "three"/);
  });
});
