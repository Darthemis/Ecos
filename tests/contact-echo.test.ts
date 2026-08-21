import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  contactFootprint,
  contactFootprints,
  ECHO_LEVELS,
  ECHO_LEVEL_ORDER,
  DEFAULT_ECHO_LEVEL,
  isGrounded,
  MAX_CONTACTS,
  nextEchoLevel,
  contactReach,
  ECHO_REACH,
  type EchoLevel,
} from "../src/world/contact-echo";
import { ACTIVE_SCENE } from "../src/content/active-scene";
const OBSTACLES = ACTIVE_SCENE.obstacles;
import type { Obstacle } from "../src/world/geometry";

function obstacle(overrides: Partial<Obstacle> = {}): Obstacle {
  return {
    id: "teste",
    kind: "rock",
    center: { x: 0, z: 0 },
    size: { x: 2, y: 1, z: 1 },
    baseY: -0.2,
    yaw: 0,
    ...overrides,
  };
}

describe("contato com o terreno", () => {
  it("reconhece objetos apoiados e enterrados", () => {
    expect(isGrounded(obstacle({ baseY: 0 }))).toBe(true);
    expect(isGrounded(obstacle({ baseY: -0.9 }))).toBe(true);
  });

  it("nao reconhece objeto suspenso", () => {
    expect(isGrounded(obstacle({ baseY: 0.4 }))).toBe(false);
    expect(isGrounded(obstacle({ baseY: 1.5 }))).toBe(false);
  });

  it("exclui do conjunto de contatos tudo que nao toca o terreno", () => {
    const chao = obstacle({ id: "apoiado", baseY: -0.1 });
    const ar = obstacle({ id: "suspenso", baseY: 2 });
    const prints = contactFootprints([chao, ar]);
    expect(prints.map((p) => p.id)).toEqual(["apoiado"]);
  });

  it("respeita o limite de contatos enviados", () => {
    const muitos = Array.from({ length: MAX_CONTACTS + 9 }, (_, i) => obstacle({ id: `pedra-${i}` }));
    expect(contactFootprints(muitos)).toHaveLength(MAX_CONTACTS);
  });
});

describe("area de contato", () => {
  it("acompanha a forma do objeto, nao um circulo igual para todos", () => {
    const largo = contactFootprint(obstacle({ size: { x: 6, y: 1, z: 0.8 } }));
    expect(largo.halfLength).toBeCloseTo(3, 6);
    expect(largo.halfWidth).toBeCloseTo(0.4, 6);
    expect(largo.halfLength).toBeGreaterThan(largo.halfWidth);
  });

  it("acompanha a rotacao do objeto", () => {
    const girado = contactFootprint(obstacle({ size: { x: 6, y: 1, z: 0.8 }, yaw: Math.PI / 2 }));
    expect(girado.axis.x).toBeCloseTo(0, 6);
    expect(girado.axis.z).toBeCloseTo(-1, 6);
  });

  it("fica no centro do objeto", () => {
    const print = contactFootprint(obstacle({ center: { x: -4.5, z: 7.25 } }));
    expect(print.center).toEqual({ x: -4.5, z: 7.25 });
  });

  it("usa o maior eixo mesmo quando ele e o eixo z local", () => {
    const profundo = contactFootprint(obstacle({ size: { x: 0.8, y: 1, z: 6 } }));
    expect(profundo.halfLength).toBeCloseTo(3, 6);
    expect(profundo.halfWidth).toBeCloseTo(0.4, 6);
    expect(profundo.axis).toEqual({ x: 0, z: 1 });
  });
});

describe("estabilidade do padrao", () => {
  it("o conjunto de contatos da cena nao depende do momento em que e lido", () => {
    expect(contactFootprints(OBSTACLES)).toEqual(contactFootprints(OBSTACLES));
  });
});

describe("intensidades comparaveis", () => {
  it("oferece tres niveis crescentes", () => {
    expect(ECHO_LEVEL_ORDER).toEqual(["sutil", "intermediario", "legivel"]);
    expect(ECHO_LEVELS.sutil).toBeLessThan(ECHO_LEVELS.intermediario);
    expect(ECHO_LEVELS.intermediario).toBeLessThan(ECHO_LEVELS.legivel);
  });

  it("usa o sutil como padrao jogavel provisorio", () => {
    expect(DEFAULT_ECHO_LEVEL).toBe("sutil");
    expect(ECHO_LEVELS[DEFAULT_ECHO_LEVEL]).toBe(0.016);
  });

  it("circula pelos tres e volta ao primeiro", () => {
    let level: EchoLevel = "sutil";
    const vistos: EchoLevel[] = [level];
    for (let i = 0; i < 3; i += 1) {
      level = nextEchoLevel(level);
      vistos.push(level);
    }
    expect(vistos).toEqual(["sutil", "intermediario", "legivel", "sutil"]);
  });
});

describe("ondulacao da borda", () => {
  const fonte = readFileSync("src/render/contact-echo-material.ts", "utf8");

  it("o ruido e ancorado no mundo e nao depende do tempo nem da tela", () => {
    expect(fonte).toContain("ecoNoise( vEchoWorld.xz * uEchoNoiseScale )");
    // Nenhum termo temporal ou de tela pode entrar no eco.
    expect(fonte).not.toMatch(/uTime|elapsed|gl_FragCoord|frame/i);
  });

  it("nao usa smoothstep com bordas invertidas, que e indefinido em GLSL", () => {
    const invertidas = /smoothstep\(\s*([\d.]+),\s*([\d.]+),/g;
    for (const m of fonte.matchAll(invertidas)) {
      expect(Number(m[1]), `smoothstep( ${m[1]}, ${m[2]}, ... )`).toBeLessThan(Number(m[2]));
    }
  });

  it("o peso da ondulacao zera no corpo do eco e no vazio", () => {
    // Espelha o peso do shader: bump sobre a faixa em que o eco ja se apaga.
    const suave = (a: number, b: number, v: number) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const peso = (fall: number) => suave(0.015, 0.05, fall) * (1 - suave(0.05, 0.18, fall));
    expect(peso(1)).toBe(0);      // nucleo saturado
    expect(peso(0.8)).toBe(0);    // corpo do eco
    expect(peso(0.3)).toBe(0);    // ainda corpo
    expect(peso(0.18)).toBe(0);   // limite do corpo
    expect(peso(0.1)).toBeLessThan(peso(0.05)); // decai depois do pico
    expect(peso(0)).toBe(0);      // vazio
    expect(peso(0.05)).toBeCloseTo(1, 6); // o pico da franja externa
  });

  it("o grao desfaz o limite, mas nao alcanca o nucleo", () => {
    const amplitude = /const ECHO_GRAIN = ([\d.]+);/.exec(fonte)?.[1];
    const faixa = /const ECHO_FADE = ([\d.]+);/.exec(fonte)?.[1];
    expect(amplitude).toBeDefined();
    expect(Number(amplitude)).toBeCloseTo(0.45, 6);
    // Comparado com a ondulacao anterior de 0,12 m, o deslocamento maximo passa
    // a ser da ordem da propria faixa de transicao: e o que dissolve o contorno
    // em vez de o ondular.
    expect(Number(amplitude) / 2).toBeGreaterThan(0.12 / 2);
    expect(Number(amplitude) / 2).toBeLessThan(Number(faixa));
  });

  it("a amplitude do grao e zero dentro da base", () => {
    // `fora` = smoothstep( -2f, f, dist ) vale 0 para dist <= -2f, isto e, bem
    // dentro da forma. O nucleo junto ao objeto nao ganha furos.
    const fora = (dist: number, f: number) => {
      const t = Math.max(0, Math.min(1, (dist - -2 * f) / (f - -2 * f)));
      return t * t * (3 - 2 * t);
    };
    const f = 0.65;
    expect(fora(-2 * f, f)).toBe(0);
    expect(fora(-3, f)).toBe(0);
    expect(fora(f, f)).toBe(1);
    expect(fora(0, f)).toBeGreaterThan(0);
  });
});

describe("cor do Eco", () => {
  const FONTE = readFileSync("src/render/contact-echo-material.ts", "utf8");

  it("o eco nao tem cor propria: toma a da superficie onde esta", () => {
    // Era um cinza fixo; antes disso, azul. Agora nao e nenhuma cor: e o matiz
    // normalizado da propria superficie, como o piso dos topos ja fazia. Quando
    // o chao tiver familias, o eco segue sozinho.
    expect(FONTE).toContain("vec3 ecoMatiz = ecoPico > 0.000001 ? diffuseColor.rgb / ecoPico : vec3( 0.0 );");
    expect(FONTE).not.toContain("uEchoColor");
    expect(FONTE).not.toContain("ECHO_COLOR");
  });

  it("mas conserva a luminancia calibrada, e nao a da superficie", () => {
    // Sem isto, um chao claro tornaria o eco mais forte e um escuro mais fraco:
    // as tres intensidades aprovadas deixariam de significar o que significam.
    expect(FONTE).toContain("vec3 ecoCor = ecoMatiz * ( uEchoLuminance / max( ecoMatizLum, 0.000001 ) );");
    const declarada = /const ECHO_LUMINANCE = ([^;]+);/.exec(FONTE)?.[1];
    expect(declarada).toBeDefined();
    // eslint-disable-next-line no-new-func
    expect(Function(`return ${declarada}`)()).toBe(0.2126 * 0.62 + 0.7152 * 0.66 + 0.0722 * 0.78);
  });

  it("conserva exatamente a luminancia da cor azulada anterior", () => {
    const anterior = 0.2126 * 0.62 + 0.7152 * 0.66 + 0.0722 * 0.78;
    const declarada = /const ECHO_LUMINANCE = ([^;]+);/.exec(FONTE)?.[1];
    expect(declarada).toBeDefined();
    // eslint-disable-next-line no-new-func
    expect(Function(`return ${declarada}`)()).toBe(anterior);
  });

  it("intensidade, alcance e ondulacao nao foram tocados", () => {
    expect(FONTE).toContain("const ECHO_GRAIN = 0.45;");
    expect(FONTE).toContain("const ECHO_NOISE_SCALE = 1.2;");
    expect(FONTE).toContain("totalEmissiveRadiance += ecoCor * eco * uEchoStrength;");
  });
});

describe("alcance condicionado ao tamanho do contato", () => {
  const FONTE_ECO = readFileSync("src/render/contact-echo-material.ts", "utf8");
  const pegada = (comprimento: number, largura: number) =>
    contactFootprint(obstacle({ size: { x: comprimento * 2, y: 1, z: largura * 2 } }));

  it("um objeto maior tem um eco maior", () => {
    const pequeno = contactReach(pegada(0.8, 0.4));
    const grande = contactReach(pegada(1.6, 0.8));
    expect(grande.length).toBeGreaterThan(pequeno.length);
    expect(grande.width).toBeGreaterThan(pequeno.width);
  });

  it("a lei e por eixo: um muro fino nao ganha halo largo", () => {
    // Mesmo comprimento, larguras diferentes: so a largura do eco muda.
    const muro = contactReach(pegada(2.0, 0.25));
    const bloco = contactReach(pegada(2.0, 1.0));
    expect(muro.length).toBe(bloco.length);
    expect(muro.width).toBeLessThan(bloco.width);
    // E o muro continua a ler-se como muro: bem mais comprido do que largo.
    expect(muro.length / muro.width).toBeGreaterThan(4);
  });

  it("o objeto mediano da cena conserva os valores anteriores", () => {
    // Calibracao: meia-base 1,41 x 0,45 dava 1,80 e 0,70 quando o alcance era
    // uma constante unica. E o que impede o eco ja aprovado de mudar de tamanho
    // onde ja estava certo.
    const r = contactReach(pegada(1.41, 0.45));
    expect(r.length).toBeCloseTo(1.8, 1);
    expect(r.width).toBeCloseTo(0.7, 1);
  });

  it("os limites prendem os extremos da cena", () => {
    const minusculo = contactReach(pegada(0.05, 0.05));
    expect(minusculo.length).toBe(ECHO_REACH.minimoComprimento);
    expect(minusculo.width).toBe(ECHO_REACH.minimoLargura);

    const enorme = contactReach(pegada(20, 20));
    expect(enorme.length).toBe(ECHO_REACH.maximoComprimento);
    expect(enorme.width).toBe(ECHO_REACH.maximoLargura);
  });

  it("todo contato da cena real fica dentro dos limites", () => {
    for (const print of contactFootprints(OBSTACLES)) {
      const r = contactReach(print);
      expect(r.length).toBeGreaterThanOrEqual(ECHO_REACH.minimoComprimento);
      expect(r.length).toBeLessThanOrEqual(ECHO_REACH.maximoComprimento);
      expect(r.width).toBeGreaterThanOrEqual(ECHO_REACH.minimoLargura);
      expect(r.width).toBeLessThanOrEqual(ECHO_REACH.maximoLargura);
    }
  });

  it("o shader le o alcance do contato, nao de uma constante", () => {
    expect(FONTE_ECO).toContain("vec2 reach = uEchoReach[ i ];");
    expect(FONTE_ECO).toContain("vec2 meia = vec2( area.z + reach.x, area.w + reach.y );");
    expect(FONTE_ECO).not.toContain("uEchoLengthReach");
    expect(FONTE_ECO).not.toContain("uEchoSideReach");
  });

  it("a borda suave continua constante, e nao proporcional", () => {
    expect(FONTE_ECO).toContain("const ECHO_FADE = 0.65;");
    expect(FONTE_ECO).toContain("const ECHO_GRAIN = 0.45;");
  });
});

// A forma passou de capsula a caixa arredondada. Estas asercoes espelham em JS a
// mesma funcao de distancia do shader e verificam o que ela promete, em vez de
// so conferir que o texto do GLSL nao mudou.
describe("forma do Eco: caixa arredondada", () => {
  const CANTO_MAX = 0.9;

  function distancia(localX: number, localY: number, meiaX: number, meiaY: number): number {
    const raio = Math.min(Math.min(meiaX, meiaY) * 0.45, CANTO_MAX);
    const qx = Math.abs(localX) - meiaX + raio;
    const qy = Math.abs(localY) - meiaY + raio;
    return (
      Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - raio
    );
  }

  function capsula(localX: number, localY: number, meiaX: number, meiaY: number): number {
    const along = Math.max(Math.abs(localX) - meiaX, 0);
    return Math.hypot(along, localY) - meiaY;
  }

  it("o centro esta dentro e a distancia cresce para fora", () => {
    expect(distancia(0, 0, 2, 0.8)).toBeLessThan(0);
    expect(distancia(4, 0, 2, 0.8)).toBeGreaterThan(0);
    expect(distancia(6, 0, 2, 0.8)).toBeGreaterThan(distancia(4, 0, 2, 0.8));
  });

  it("o contorno passa pelo meio de cada lado, como o retangulo manda", () => {
    expect(distancia(2, 0, 2, 0.8)).toBeCloseTo(0, 12);
    expect(distancia(0, 0.8, 2, 0.8)).toBeCloseTo(0, 12);
  });

  it("nao e uma capsula: as pontas deixam de ser um arco da largura", () => {
    // Base comprida e fina. Na ponta, fora do eixo, a capsula arredonda com o
    // raio da largura inteira; a caixa mantem o canto, entao esta mais longe.
    const meiaX = 2.5, meiaY = 0.5;
    expect(distancia(2.5, 0.5, meiaX, meiaY)).toBeGreaterThan(
      capsula(2.5, 0.5, meiaX, meiaY),
    );
    // E o formato so difere nos cantos: no meio do lado longo os dois coincidem.
    expect(distancia(0, 0.5, meiaX, meiaY)).toBeCloseTo(capsula(0, 0.5, meiaX, meiaY), 12);
  });

  it("o raio de canto nunca excede a meia-base, mesmo numa base minuscula", () => {
    for (const [mx, my] of [[0.1, 0.05], [0.6, 0.6], [8, 0.4], [20, 20]] as const) {
      const raio = Math.min(Math.min(mx, my) * 0.45, CANTO_MAX);
      expect(raio).toBeLessThanOrEqual(Math.min(mx, my));
      expect(raio).toBeGreaterThan(0);
    }
  });

  it("todo contato da cena real produz uma forma valida", () => {
    for (const print of contactFootprints(OBSTACLES)) {
      const r = contactReach(print);
      const mx = print.halfLength + r.length;
      const my = print.halfWidth + r.width;
      // Dentro no centro, fora bem longe, e contorno nos meios dos lados.
      expect(distancia(0, 0, mx, my)).toBeLessThan(0);
      expect(distancia(mx, 0, mx, my)).toBeCloseTo(0, 10);
      expect(distancia(0, my, mx, my)).toBeCloseTo(0, 10);
      expect(distancia(mx * 4 + 10, 0, mx, my)).toBeGreaterThan(0);
    }
  });
});
