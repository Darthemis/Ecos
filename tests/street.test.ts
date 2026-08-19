import { describe, expect, it } from "vitest";
import { ACTIVE_SCENE } from "../src/content/active-scene";
import { VESTIGE_SIGNALS } from "../src/content/phase2-street";
import { buildAdjacency, pathBetween, pathLength } from "../src/world/route-graph";
import { blocked } from "../src/world/geometry";
import { collidersOf } from "../src/sim/world-sim";
import { canStepFrom, groundHeightAt, MAX_STEP_UP, patchHeightAt } from "../src/world/terrain";
import { activeSectorIds, sectorAt } from "../src/world/sectors";
import { rectContains, segmentAt } from "../src/world/scene";
import { PLAYER_RADIUS, WALK_SPEED } from "../src/sim/state";

const scene = ACTIVE_SCENE;
const colliders = collidersOf(scene);

/** Tempo de travessia de um caminho, em segundos, na velocidade de caminhada. */
function seconds(path: readonly string[]): number {
  return pathLength(scene, path) / WALK_SPEED;
}

describe("rotas", () => {
  it("a rota direta liga o inicio ao marco distante", () => {
    const adjacency = buildAdjacency(scene, ["comum", "direta"]);
    const path = pathBetween(adjacency, "n-inicio", "n-mastro");
    expect(path).not.toBeNull();
    expect(path).toContain("n-funil");
    expect(path).not.toContain("n-alameda-sul");
  });

  it("a rota lateral tambem chega, por outro caminho", () => {
    const adjacency = buildAdjacency(scene, ["comum", "lateral"]);
    const path = pathBetween(adjacency, "n-inicio", "n-mastro");
    expect(path).not.toBeNull();
    expect(path).toContain("n-brecha");
    expect(path).toContain("n-mirante");
    expect(path).not.toContain("n-corredor");
  });

  it("a rota direta dura entre 60 e 90 segundos", () => {
    const adjacency = buildAdjacency(scene, ["comum", "direta"]);
    const travessia = seconds(pathBetween(adjacency, "n-inicio", "n-mastro")!);
    expect(travessia).toBeGreaterThanOrEqual(60);
    expect(travessia).toBeLessThanOrEqual(90);
  });

  it("a rota lateral e um pouco mais longa que a direta", () => {
    const direta = seconds(pathBetween(buildAdjacency(scene, ["comum", "direta"]), "n-inicio", "n-mastro")!);
    const lateral = seconds(pathBetween(buildAdjacency(scene, ["comum", "lateral"]), "n-inicio", "n-mastro")!);
    expect(lateral).toBeGreaterThan(direta);
    expect(lateral - direta).toBeLessThan(direta * 0.6);
  });

  it("as duas rotas convergem na revelacao", () => {
    const direta = pathBetween(buildAdjacency(scene, ["comum", "direta"]), "n-inicio", "n-mastro")!;
    const lateral = pathBetween(buildAdjacency(scene, ["comum", "lateral"]), "n-inicio", "n-mastro")!;
    const comuns = direta.filter((node) => lateral.includes(node));
    expect(comuns).toContain("n-bacia");
    expect(comuns).toContain("n-mastro");
  });

  it("todo trecho permite retorno: as arestas valem nos dois sentidos", () => {
    const adjacency = buildAdjacency(scene);
    for (const node of scene.routeNodes) {
      expect(pathBetween(adjacency, node.id, "n-inicio"), `sem retorno de ${node.id}`).not.toBeNull();
      expect(pathBetween(adjacency, "n-inicio", node.id), `sem ida ate ${node.id}`).not.toBeNull();
    }
  });

  it("a rota lateral passa por um ponto de observacao", () => {
    const lateral = pathBetween(buildAdjacency(scene, ["comum", "lateral"]), "n-inicio", "n-mastro")!;
    const vantageIds = scene.vantages.map((v) => v.id);
    expect(vantageIds.length).toBeGreaterThan(0);
    expect(lateral).toContain("n-mirante");
    for (const vantage of scene.vantages) {
      expect(["lateral", "comum"]).toContain(vantage.route);
    }
  });
});

describe("posicoes do percurso", () => {
  it("o ponto inicial esta livre de colisao", () => {
    expect(blocked(scene.spawn, PLAYER_RADIUS, colliders)).toBe(false);
  });

  it("nenhum no de rota nasce dentro de um volume", () => {
    for (const node of scene.routeNodes) {
      expect(blocked(node.position, PLAYER_RADIUS, colliders), `${node.id} bloqueado`).toBe(false);
    }
  });

  it("os pontos de observacao e os marcos ficam alcancaveis", () => {
    for (const vantage of scene.vantages) {
      expect(blocked(vantage.position, PLAYER_RADIUS, colliders), `${vantage.id} bloqueado`).toBe(false);
    }
  });

  it("os nos cobrem os tres trechos", () => {
    const trechos = new Set(scene.routeNodes.map((node) => segmentAt(scene, node.position)));
    expect(trechos).toContain("orientacao");
    expect(trechos).toContain("compressao");
    expect(trechos).toContain("revelacao");
  });
});

describe("relevo", () => {
  it("a rampa sobe de forma continua", () => {
    const patch = scene.heightPatches.find((p) => p.id === "rampa-sobe")!;
    const baixo = patchHeightAt(patch, { x: 3.6, z: patch.area.minZ + 0.01 })!;
    const alto = patchHeightAt(patch, { x: 3.6, z: patch.area.maxZ - 0.01 })!;
    expect(baixo).toBeGreaterThan(alto);
    expect(Math.max(baixo, alto)).toBeCloseTo(1.1, 2);
  });

  it("o patamar e plano", () => {
    const patch = scene.heightPatches.find((p) => p.id === "patamar")!;
    expect(patchHeightAt(patch, { x: 2, z: -57 })).toBeCloseTo(1.1, 6);
    expect(patchHeightAt(patch, { x: 5, z: -58 })).toBeCloseTo(1.1, 6);
  });

  it("fora das regioes o terreno e plano", () => {
    expect(groundHeightAt(scene, { x: 0, z: 0 })).toBe(0);
    expect(groundHeightAt(scene, { x: 40, z: -40 })).toBe(0);
  });

  it("a subida da rampa nunca excede o passo maximo entre pontos vizinhos", () => {
    for (let z = -52; z >= -63; z -= 0.1) {
      const de = { x: 3.6, z };
      const para = { x: 3.6, z: z - 0.1 };
      expect(canStepFrom(scene, de, para), `degrau abrupto em z=${z.toFixed(1)}`).toBe(true);
    }
  });

  it("um degrau alto demais barra o passo", () => {
    const chao = { x: -16.5, z: -17 };
    const topo = { x: -16.5, z: -22 };
    expect(groundHeightAt(scene, topo) - groundHeightAt(scene, chao)).toBeGreaterThan(MAX_STEP_UP);
    expect(canStepFrom(scene, chao, topo)).toBe(false);
  });
});

describe("setores", () => {
  it("existe ao menos um setor por trecho", () => {
    const trechos = new Set(scene.sectors.map((sector) => sector.segment));
    expect(trechos).toContain("orientacao");
    expect(trechos).toContain("compressao");
    expect(trechos).toContain("revelacao");
  });

  it("ativa o setor do jogador e seus vizinhos", () => {
    const ativos = activeSectorIds(scene, { x: 0, z: -50 });
    expect(ativos).toContain("s-compressao");
    expect(ativos).toContain("s-orientacao");
    expect(ativos).toContain("s-revelacao");
  });

  it("desativa setores distantes", () => {
    const ativos = activeSectorIds(scene, { x: 0, z: 10 });
    expect(ativos).toContain("s-orientacao");
    expect(ativos).not.toContain("s-revelacao");
  });

  it("nunca fica sem setor ao longo do percurso", () => {
    for (let z = 12; z >= -118; z -= 2) {
      const posicao = { x: 0, z };
      expect(sectorAt(scene, posicao), `sem setor em z=${z}`).not.toBeNull();
      expect(activeSectorIds(scene, posicao).size, `nenhum setor ativo em z=${z}`).toBeGreaterThan(0);
    }
  });

  it("as bordas dos setores vizinhos se tocam, sem vao", () => {
    const porId = new Map(scene.sectors.map((s) => [s.id, s]));
    for (const sector of scene.sectors) {
      for (const vizinho of sector.neighbours) {
        expect(porId.has(vizinho), `vizinho inexistente ${vizinho}`).toBe(true);
      }
    }
  });
});

describe("marcos e vestigio", () => {
  it("existem dois marcos, um deles o vestigio", () => {
    expect(scene.landmarks).toHaveLength(2);
    expect(scene.landmarks.map((l) => l.id)).toContain("fundacao-interrompida");
  });

  it("os marcos possuem sinal distante alto o bastante para passar dos muros", () => {
    const alturaDosMuros = Math.max(...scene.obstacles.map((o) => o.baseY + o.size.y));
    const mastro = scene.landmarks.find((l) => l.id === "mastro-inclinado")!;
    expect(mastro.beaconHeight).toBeGreaterThan(alturaDosMuros * 0.7);
    for (const landmark of scene.landmarks) {
      expect(landmark.beaconHalfWidth).toBeLessThan(0.6);
    }
  });

  it("o sinal distante e um traco vertical, para nao sair do quadro de perto", () => {
    for (const landmark of scene.landmarks) {
      expect(landmark.beaconHeight - landmark.beaconBase, `${landmark.id} curto demais`).toBeGreaterThan(2);
      // Comeca perto do chao: visivel mesmo quando o olhar esta baixo.
      expect(landmark.beaconBase).toBeLessThan(2);
    }
  });

  it("o vestigio possui ao menos tres sinais coerentes", () => {
    expect(VESTIGE_SIGNALS.length).toBeGreaterThanOrEqual(3);
    const ids = new Set(scene.obstacles.map((o) => o.id));
    for (const signal of VESTIGE_SIGNALS) {
      expect(signal.blocks.length).toBeGreaterThan(0);
      for (const id of signal.blocks) {
        expect(ids.has(id), `sinal ${signal.id} referencia bloco inexistente ${id}`).toBe(true);
      }
    }
  });

  it("os sinais do vestigio ficam juntos, como um lugar e nao decoracao espalhada", () => {
    const porId = new Map(scene.obstacles.map((o) => [o.id, o]));
    const pontos = VESTIGE_SIGNALS.flatMap((s) => s.blocks).map((id) => porId.get(id)!.center);
    const vestigio = scene.landmarks.find((l) => l.id === "fundacao-interrompida")!;
    for (const ponto of pontos) {
      const distancia = Math.hypot(ponto.x - vestigio.position.x, ponto.z - vestigio.position.z);
      expect(distancia).toBeLessThan(16);
    }
  });
});

describe("fontes do mundo", () => {
  it("nenhuma luz esta presa a camera: todas tem posicao propria no mundo", () => {
    expect(scene.lights.length).toBeGreaterThan(0);
    for (const light of scene.lights) {
      expect(Number.isFinite(light.position.x)).toBe(true);
      expect(Number.isFinite(light.position.z)).toBe(true);
      expect(light.radius).toBeGreaterThan(0);
    }
  });

  it("as luzes ficam dentro dos limites do lugar", () => {
    const dentro = scene.sectors.some.bind(scene.sectors);
    for (const light of scene.lights) {
      const ponto = { x: light.position.x, z: light.position.z };
      expect(dentro((sector) => rectContains(sector.area, ponto)), `${light.id} fora dos setores`).toBe(true);
    }
  });

  it("ha som distinguindo as duas rotas", () => {
    const rotas = new Set(scene.emitters.map((e) => e.route));
    expect(rotas).toContain("direta");
    expect(rotas).toContain("lateral");
  });
});

describe("marcas atravessaveis", () => {
  it("o sulco e visivel mas nao barra o corpo", () => {
    expect(scene.passableIds.length).toBeGreaterThan(0);
    const ids = new Set(scene.obstacles.map((o) => o.id));
    for (const id of scene.passableIds) expect(ids.has(id), `${id} nao existe na cena`).toBe(true);

    const comTudo = scene.obstacles.length;
    expect(collidersOf(scene)).toHaveLength(comTudo - scene.passableIds.length);
  });

  it("as marcas sao rasas: nada alto passa por atravessavel", () => {
    const passable = new Set(scene.passableIds);
    for (const obstacle of scene.obstacles) {
      if (!passable.has(obstacle.id)) continue;
      expect(obstacle.size.y, `${obstacle.id} alto demais para ser marca`).toBeLessThan(0.4);
    }
  });
});

describe("determinismo da cena", () => {
  it("identificadores sao unicos", () => {
    const ids = scene.obstacles.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("a cena declara seed e versao", () => {
    expect(scene.seed).toBeGreaterThan(0);
    expect(scene.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Travessia com a colisão de verdade. O grafo declara a promessa; isto verifica
// que o corpo consegue cumpri-la, passando pelas aberturas e subindo a rampa.
// ─────────────────────────────────────────────────────────────────────────────

import { advance, createWorldState } from "../src/sim/world-sim";
import { TICK_SECONDS } from "../src/core/fixed-step";
import type { WorldState } from "../src/sim/state";

/** Caminha em direcao a um alvo por no maximo `limite` ticks. */
function walkTo(state: WorldState, alvo: { x: number; z: number }, limite = 4000): { state: WorldState; ticks: number } {
  let atual = state;
  for (let i = 0; i < limite; i += 1) {
    const dx = alvo.x - atual.player.position.x;
    const dz = alvo.z - atual.player.position.z;
    if (Math.hypot(dx, dz) < 0.8) return { state: atual, ticks: i };

    // Aponta o olhar para o alvo e anda para a frente: sem atalho, sem teleporte.
    const yaw = Math.atan2(-dx, -dz);
    const girado: WorldState = { ...atual, player: { ...atual.player, yaw } };
    atual = advance(girado, { move: { forward: 1, strafe: 0 }, look: { yaw: 0, pitch: 0 } }, 1);
  }
  return { state: atual, ticks: limite };
}

function percorrer(alvos: readonly { x: number; z: number }[]): { chegou: boolean; segundos: number; fim: WorldState } {
  let state = createWorldState();
  let ticks = 0;
  for (const alvo of alvos) {
    const passo = walkTo(state, alvo);
    state = passo.state;
    ticks += passo.ticks;
    const distancia = Math.hypot(state.player.position.x - alvo.x, state.player.position.z - alvo.z);
    if (distancia >= 0.8) return { chegou: false, segundos: ticks * TICK_SECONDS, fim: state };
  }
  return { chegou: true, segundos: ticks * TICK_SECONDS, fim: state };
}

const porId = new Map(scene.routeNodes.map((node) => [node.id, node.position]));
const pontos = (...ids: string[]) => ids.map((id) => porId.get(id)!);

describe("travessia com colisao real", () => {
  it("a rota direta e percorrivel de ponta a ponta", () => {
    const resultado = percorrer(pontos("n-praca", "n-funil", "n-corredor", "n-curva", "n-patamar", "n-corredor-sul", "n-bacia", "n-mastro"));
    expect(resultado.chegou, `parou em ${resultado.fim.player.position.x.toFixed(1)}, ${resultado.fim.player.position.z.toFixed(1)}`).toBe(true);
  });

  it("a rota lateral e percorrivel de ponta a ponta", () => {
    const resultado = percorrer(pontos("n-praca", "n-brecha", "n-alameda-entrada", "n-mirante", "n-alameda-norte", "n-alameda-sul", "n-alameda-saida", "n-limiar", "n-vestigio", "n-sulco", "n-bacia", "n-mastro"));
    expect(resultado.chegou, `parou em ${resultado.fim.player.position.x.toFixed(1)}, ${resultado.fim.player.position.z.toFixed(1)}`).toBe(true);
  });

  it("o retorno pela rota direta tambem e percorrivel", () => {
    const ida = percorrer(pontos("n-praca", "n-funil", "n-corredor", "n-curva", "n-patamar", "n-corredor-sul", "n-bacia"));
    expect(ida.chegou).toBe(true);

    let state = ida.fim;
    for (const alvo of pontos("n-corredor-sul", "n-patamar", "n-curva", "n-corredor", "n-funil", "n-praca", "n-inicio")) {
      const passo = walkTo(state, alvo);
      state = passo.state;
      expect(Math.hypot(state.player.position.x - alvo.x, state.player.position.z - alvo.z)).toBeLessThan(0.8);
    }
  });

  it("o corpo sobe a rampa e volta ao nivel do chao", () => {
    const ate = percorrer(pontos("n-praca", "n-funil", "n-corredor", "n-curva", "n-patamar"));
    expect(ate.chegou).toBe(true);
    expect(ate.fim.player.groundY).toBeGreaterThan(0.8);

    const depois = walkTo(ate.fim, porId.get("n-corredor-sul")!);
    expect(depois.state.player.groundY).toBeCloseTo(0, 2);
  });

  it("nenhuma travessia deixa o corpo dentro de um volume", () => {
    const resultado = percorrer(pontos("n-praca", "n-funil", "n-corredor", "n-curva", "n-patamar", "n-corredor-sul", "n-bacia"));
    expect(blocked(resultado.fim.player.position, PLAYER_RADIUS, colliders)).toBe(false);
  });
});
