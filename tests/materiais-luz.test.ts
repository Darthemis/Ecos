import { describe, expect, it } from "vitest";
import {
  hueDistance,
  hslToHex,
  KIND_MATERIAL,
  MATERIAL_IDS,
  MATERIALS,
  materialColor,
  variationSeed,
  type MaterialFamily,
} from "../src/world/materials";
import {
  bakeLightField,
  blockersOf,
  coreAndTail,
  sampleLightField,
  TAIL_GAIN,
  TAIL_RADIUS_FACTOR,
  transmittance,
} from "../src/world/light-field";
import { ACTIVE_SCENE } from "../src/content/active-scene";
import { COMPLEX_SHAPES, partTriangles, shapeTriangles } from "../src/world/complex-shapes";
import { collidersOf } from "../src/sim/world-sim";
import { blocked } from "../src/world/geometry";
import { PLAYER_RADIUS } from "../src/sim/state";
import { ECHO_REACH_MAX, ECHO_REACH_MIN, contactFootprint, reachForPerimeter } from "../src/world/contact-echo";

const scene = ACTIVE_SCENE;

describe("materiais", () => {
  it("oferece as quatro familias provisorias", () => {
    expect(MATERIAL_IDS.sort()).toEqual(["anomalo", "metal-oxidado", "organico", "pedra"]);
  });

  it("mesma seed e identidade produzem sempre a mesma variacao", () => {
    const a = materialColor("pedra", "muro-7", scene.seed);
    const b = materialColor("pedra", "muro-7", scene.seed);
    expect(a).toEqual(b);
    expect(variationSeed("muro-7", scene.seed)).toBe(variationSeed("muro-7", scene.seed));
  });

  it("a variacao nao depende do setor nem do quadro, so de identidade e seed", () => {
    const antes = materialColor("pedra", "muro-7", scene.seed);
    // Nada no mundo muda a identidade visual: a funcao nao recebe mais nada.
    const depois = materialColor("pedra", "muro-7", scene.seed);
    expect(depois).toEqual(antes);
    expect(materialColor("pedra", "muro-8", scene.seed)).not.toEqual(antes);
  });

  it("a variacao fica dentro da faixa declarada pela familia", () => {
    for (const family of MATERIAL_IDS) {
      const definicao = MATERIALS[family];
      for (const obstacle of scene.obstacles) {
        const cor = materialColor(family, obstacle.id, scene.seed);
        expect(hueDistance(cor.h, definicao.base.h)).toBeLessThanOrEqual(definicao.variation.h + 1e-6);
        expect(Math.abs(cor.s - definicao.base.s)).toBeLessThanOrEqual(definicao.variation.s + 1e-6);
        expect(Math.abs(cor.l - definicao.base.l)).toBeLessThanOrEqual(definicao.variation.l + 1e-6);
      }
    }
  });

  it("objetos vizinhos do mesmo material variam, sem sair da familia", () => {
    const vizinhos = ["restos-agrupados-a", "restos-agrupados-b", "restos-agrupados-c"];
    const cores = vizinhos.map((id) => materialColor("pedra", id, scene.seed));
    // Diferentes entre si...
    expect(new Set(cores.map((c) => hslToHex(c))).size).toBe(vizinhos.length);
    // ...e ainda assim todos dentro da familia.
    for (const cor of cores) {
      expect(hueDistance(cor.h, MATERIALS.pedra.base.h)).toBeLessThanOrEqual(MATERIALS.pedra.variation.h);
    }
  });

  it("familias diferentes permanecem distinguiveis por cor", () => {
    const pares: [MaterialFamily, MaterialFamily][] = [
      ["pedra", "organico"],
      ["pedra", "anomalo"],
      ["metal-oxidado", "organico"],
      ["metal-oxidado", "anomalo"],
      ["organico", "anomalo"],
    ];
    for (const [a, b] of pares) {
      const distancia = hueDistance(MATERIALS[a].base.h, MATERIALS[b].base.h);
      const somaDasVariacoes = MATERIALS[a].variation.h + MATERIALS[b].variation.h;
      expect(distancia, `${a} x ${b} perto demais`).toBeGreaterThan(somaDasVariacoes * 1.5);
    }
  });

  it("familias diferentes tambem se separam por um segundo canal", () => {
    // Cor nunca e o unico canal: o padrao da superficie muda a densidade.
    const escalas = MATERIAL_IDS.map((id) => MATERIALS[id].pattern.scaleMeters);
    expect(new Set(escalas).size).toBe(MATERIAL_IDS.length);
    const respostas = MATERIAL_IDS.map((id) => MATERIALS[id].lightResponse);
    expect(new Set(respostas).size).toBeGreaterThan(1);
  });

  it("desligar a variacao devolve a cor base exata", () => {
    for (const family of MATERIAL_IDS) {
      expect(materialColor(family, "qualquer", scene.seed, false)).toEqual(MATERIALS[family].base);
    }
  });

  it("todo tipo de volume tem familia padrao", () => {
    for (const obstacle of scene.obstacles) {
      const family = obstacle.material ?? KIND_MATERIAL[obstacle.kind];
      expect(MATERIAL_IDS).toContain(family);
    }
  });
});

describe("campo luminoso", () => {
  const { field, stats } = bakeLightField(scene);

  it("produz nucleo e cauda, com a cauda mais extensa e mais fraca", () => {
    const fonte = scene.lights.find((l) => l.id === "assento-brasa")!;
    const perto = coreAndTail(1, fonte.radius, fonte.intensity);
    const longe = coreAndTail(fonte.radius * 2.2, fonte.radius, fonte.intensity);

    expect(perto.core).toBeGreaterThan(perto.tail);
    expect(longe.core).toBe(0);
    expect(longe.tail).toBeGreaterThan(0);
    expect(longe.tail).toBeLessThan(perto.core * 0.2);
  });

  it("a cauda alcanca muito mais longe que o nucleo", () => {
    expect(TAIL_RADIUS_FACTOR).toBeGreaterThan(2);
    expect(TAIL_GAIN).toBeLessThan(0.25);
    const fonte = scene.lights[0]!;
    const limite = fonte.radius * TAIL_RADIUS_FACTOR;
    expect(coreAndTail(limite * 0.95, fonte.radius, fonte.intensity).tail).toBeGreaterThan(0);
    expect(coreAndTail(limite * 1.05, fonte.radius, fonte.intensity).tail).toBe(0);
  });

  it("e deterministico: assar duas vezes da o mesmo campo", () => {
    const outro = bakeLightField(scene).field;
    expect(outro.cols).toBe(field.cols);
    expect(Array.from(outro.data.slice(0, 600))).toEqual(Array.from(field.data.slice(0, 600)));
  });

  it("grandes estruturas reduzem a propagacao", () => {
    const bloqueadores = blockersOf(scene);
    expect(bloqueadores.length).toBeGreaterThan(0);

    // Da brasa, atravessando a linha da fundacao e os muros do corredor.
    const fonte = scene.lights.find((l) => l.id === "assento-brasa")!;
    const livre = transmittance(fonte.position, { x: fonte.position.x, z: fonte.position.z - 6 }, bloqueadores);
    const atras = transmittance(fonte.position, { x: 2, z: -70 }, bloqueadores);
    expect(atras).toBeLessThan(livre);
  });

  it("um caminho sem obstaculo transmite tudo", () => {
    expect(transmittance({ x: 0, z: -100 }, { x: 2, z: -102 }, blockersOf(scene))).toBeCloseTo(1, 6);
  });

  it("desativar uma fonte remove a contribuicao dela", () => {
    const semBrasa = { ...scene, lights: scene.lights.filter((l) => l.id !== "assento-brasa") };
    const comBrasa = sampleLightField(field, -11.2, -86.2);
    const sem = sampleLightField(bakeLightField(semBrasa).field, -11.2, -86.2);
    expect(comBrasa[0]).toBeGreaterThan(sem[0]);
  });

  it("a cor da fonte aparece no campo", () => {
    // A brasa e alaranjada: mais vermelho que azul junto dela.
    const [r, , b] = sampleLightField(field, -11.2, -86.2);
    expect(r).toBeGreaterThan(b);
  });

  it("cai a quase nada longe de qualquer fonte", () => {
    const [r, g, b] = sampleLightField(field, 0, 6);
    expect(Math.max(r, g, b)).toBeLessThan(0.05 * field.scale);
  });

  it("a grade e rasa e assa rapido", () => {
    expect(stats.cells).toBeLessThan(20000);
    expect(stats.bakeMs).toBeLessThan(2000);
    expect(stats.sources).toBe(scene.lights.length);
  });
});

describe("eco escalavel", () => {
  it("cresce com o perimetro, mas de forma sublinear", () => {
    const pequeno = reachForPerimeter(4);
    const dobro = reachForPerimeter(8);
    const quadruplo = reachForPerimeter(16);
    expect(dobro).toBeGreaterThan(pequeno);
    expect(quadruplo).toBeGreaterThan(dobro);
    // Quadruplicar o perimetro nao quadruplica o alcance.
    expect(quadruplo).toBeLessThan(pequeno * 4);
    expect(dobro / pequeno).toBeLessThan(2);
  });

  it("respeita limite minimo e maximo", () => {
    expect(reachForPerimeter(0)).toBe(ECHO_REACH_MIN);
    expect(reachForPerimeter(1e6)).toBe(ECHO_REACH_MAX);
    for (const obstacle of scene.obstacles) {
      const print = contactFootprint(obstacle);
      expect(print.reach).toBeGreaterThanOrEqual(ECHO_REACH_MIN);
      expect(print.reach).toBeLessThanOrEqual(ECHO_REACH_MAX);
    }
  });

  it("uma fundacao longa alcanca mais que uma pedra pequena", () => {
    const pedra = contactFootprint(scene.obstacles.find((o) => o.id === "praca-resto-c")!);
    const muro = contactFootprint(scene.obstacles.find((o) => o.id === "alameda-oeste-3")!);
    expect(muro.reach).toBeGreaterThan(pedra.reach);
  });

  it("o objeto maior espalha mais, sem ficar mais raro por engano", () => {
    // A intensidade e a mesma para todos: so a extensao muda.
    const pedra = contactFootprint(scene.obstacles.find((o) => o.id === "praca-resto-c")!);
    const muro = contactFootprint(scene.obstacles.find((o) => o.id === "alameda-oeste-3")!);
    expect(muro.sparsity).toBeLessThan(pedra.sparsity);
  });
});

describe("formas complexas", () => {
  it("respeitam o orcamento declarado de triangulos", () => {
    for (const shape of COMPLEX_SHAPES) {
      const total = shapeTriangles(shape);
      expect(total, `${shape.id} fora do orcamento`).toBeGreaterThanOrEqual(shape.budget.min);
      expect(total, `${shape.id} fora do orcamento`).toBeLessThanOrEqual(shape.budget.max);
    }
  });

  it("os descritores sao validos e deterministicos", () => {
    for (const shape of COMPLEX_SHAPES) {
      expect(shape.parts.length).toBeGreaterThan(3);
      for (const part of shape.parts) {
        expect(partTriangles(part)).toBeGreaterThan(0);
        expect(Number.isFinite(part.position.x)).toBe(true);
      }
      expect(shapeTriangles(shape)).toBe(shapeTriangles(shape));
    }
  });

  it("uma delas e organica e a outra mecanica, de materiais diferentes", () => {
    const materiais = COMPLEX_SHAPES.map((s) => s.material);
    expect(new Set(materiais).size).toBe(2);
  });

  it("os colisores simplificados existem e nao bloqueiam nenhuma rota", () => {
    const colliders = collidersOf(scene);
    for (const shape of COMPLEX_SHAPES) {
      expect(scene.hiddenIds).toContain(shape.id);
      expect(scene.obstacles.some((o) => o.id === shape.id), `${shape.id} sem colisor`).toBe(true);
    }
    for (const node of scene.routeNodes) {
      expect(blocked(node.position, PLAYER_RADIUS, colliders), `${node.id} bloqueado`).toBe(false);
    }
  });

  it("ficam fora do eixo das rotas", () => {
    for (const shape of COMPLEX_SHAPES) {
      const perto = scene.routeNodes.some(
        (n) => Math.hypot(n.position.x - shape.origin.x, n.position.z - shape.origin.z) < 4,
      );
      expect(perto, `${shape.id} colado num no de rota`).toBe(false);
    }
  });
});
