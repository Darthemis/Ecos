// Materializacao visual de uma cena. Le a descricao e o estado; nunca os altera
// (AGENT_RULES §5: renderizacao nao muta a simulacao).
//
// Duas ideias governam este arquivo:
//
//   1. o personagem nao ilumina nada — toda luz pertence ao mundo;
//   2. um marco precisa existir alem do alcance visual, senao nao ha orientacao
//      possivel num mundo de nevoa curta. A solucao e uma representacao
//      simplificada, sem nevoa: um sinal pequeno e alto, nunca a geometria
//      inteira. De perto, o marco e o volume de verdade.

import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  Fog,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  Scene,
  type Texture,
} from "three";
import { createRng } from "../core/rng";
import { obstacleAabb, type Vec2 } from "../world/geometry";
import type { SceneDefinition } from "../world/scene";
import { activeSectorIds, sectorIdForPoint } from "../world/sectors";
import { nearestContacts, type EchoLevel, ECHO_LEVELS } from "../world/contact-echo";
import { bakeLightField, blockersOf } from "../world/light-field";
import { hslToHex, KIND_MATERIAL, materialColor, MATERIALS, type MaterialFamily } from "../world/materials";
import { COMPLEX_SHAPES, shapeTriangles } from "../world/complex-shapes";
import { attachSurfaceShading, lightFieldTexture, type SurfaceShading } from "./surface-shading";
import { createMaterialTexture } from "./material-textures";
import { buildComplexGeometry } from "./complex-geometry";

const SAND_COLOR = 0x94703f;
const SAND_TILE_METERS = 24;

/** Claridade da continuidade de superficie, em emissao linear. */
const CONTINUITY_STRENGTH = 0.021;

/** Converte o piso ambiental declarado pela familia em emissao linear. */
const MATERIAL_FLOOR_SCALE = 0.2;

/** Ate onde os sinais distantes dos marcos precisam existir, em metros. */
const LANDMARK_VIEW_DISTANCE = 220;

function latticeNoise(size: number, cells: number, seed: number): Float32Array {
  const rng = createRng(seed);
  const lattice = new Float32Array((cells + 1) * (cells + 1));
  for (let i = 0; i < lattice.length; i += 1) lattice[i] = rng();

  const at = (cx: number, cy: number): number =>
    lattice[(cy % (cells + 1)) * (cells + 1) + (cx % (cells + 1))] ?? 0;

  const out = new Float32Array(size * size);
  const scale = cells / size;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const fx = x * scale;
      const fy = y * scale;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
      const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
      out[y * size + x] = top * (1 - sy) + bottom * sy;
    }
  }
  return out;
}

/**
 * Textura do solo. Manchas largas abrem clareiras escuras e um grao fino cobre
 * o resto: o piso proximo nunca vira uma folha continua de glifos.
 */
function createSandTexture(seed: number, halfExtent: number): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Contexto 2D indisponivel para a textura do solo");

  const coarse = latticeNoise(size, 12, seed);
  const fine = latticeNoise(size, 48, seed + 977);

  const image = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i += 1) {
    const mixed = (coarse[i] ?? 0) * 0.74 + (fine[i] ?? 0) * 0.26;
    const value = 8 + Math.pow(mixed, 1.7) * 247;
    image.data[i * 4] = value;
    image.data[i * 4 + 1] = value;
    image.data[i * 4 + 2] = value;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const tiles = (halfExtent * 2) / SAND_TILE_METERS;
  texture.repeat.set(tiles, tiles);
  return texture;
}

export type RenderReport = {
  triangles: number;
  meshes: number;
  drawCalls: number;
  sources: number;
  fieldCells: number;
  fieldBakeMs: number;
  blockers: number;
};

export type SectorReport = {
  total: number;
  active: number;
  activeIds: readonly string[];
  objectsTotal: number;
  objectsActive: number;
};

export type SceneView = {
  scene: Scene;
  camera: PerspectiveCamera;
  setVisualRange: (meters: number) => void;
  setWorldLightsEnabled: (enabled: boolean) => void;
  setEchoLevel: (level: EchoLevel) => void;
  setEchoEnabled: (enabled: boolean) => void;
  /** Diagnostico: desenha as bordas dos setores. */
  setSectorDebug: (enabled: boolean) => void;
  /** Reduz oscilacao de luzes e pulsacoes, para conforto. */
  setFlickerReduced: (reduced: boolean) => void;
  /** Diagnostico: variacao individual de cor ligada ou desligada. */
  setVariationEnabled: (enabled: boolean) => void;
  /** Diagnostico: continuidade das superficies expostas. */
  setContinuityEnabled: (enabled: boolean) => void;
  /** Diagnostico: campo luminoso desenhado cru sobre as superficies. */
  setFieldDebug: (enabled: boolean) => void;
  /** Diagnostico: destaca os volumes que barram a propagacao. */
  setBlockerDebug: (enabled: boolean) => void;
  /** Diagnostico: mostra apenas as duas formas complexas. */
  setIsolateComplex: (enabled: boolean) => void;
  render: () => RenderReport;
  /** Atualiza setores, contatos e oscilacoes. Nao altera a simulacao. */
  update: (seconds: number, viewer: Vec2) => SectorReport;
  sectors: () => SectorReport;
  dispose: () => void;
};

export function createSceneView(definition: SceneDefinition, renderer?: { info: { render: { calls: number } } }): SceneView {
  const scene = new Scene();
  scene.background = new Color(0x000000);
  scene.fog = new Fog(0x000000, 1, 15);

  const camera = new PerspectiveCamera(72, 1, 0.1, LANDMARK_VIEW_DISTANCE);
  scene.add(camera);

  // O campo luminoso e assado uma unica vez, na abertura.
  const { field, stats: fieldStats } = bakeLightField(definition);
  const fieldTexture = lightFieldTexture(field);
  const shadings: SurfaceShading[] = [];

  const sand = createSandTexture(definition.seed, definition.groundHalfExtent);
  const groundMaterial = new MeshLambertMaterial({ color: SAND_COLOR, map: sand });
  const echo = attachSurfaceShading(groundMaterial, { role: "chao", field, fieldTexture });
  shadings.push(echo);

  // Uma textura por familia, compartilhada por todos os objetos dela.
  const materialTextures = new Map<MaterialFamily, ReturnType<typeof createMaterialTexture>>();
  const texturaDe = (family: MaterialFamily) => {
    const existente = materialTextures.get(family);
    if (existente !== undefined) return existente;
    const nova = createMaterialTexture(family, definition.seed);
    materialTextures.set(family, nova);
    return nova;
  };

  let variationEnabled = true;
  const objectMaterials: { material: MeshLambertMaterial; family: MaterialFamily; id: string }[] = [];

  /** Material de um objeto: familia, variacao individual e padrao da superficie. */
  const materialFor = (family: MaterialFamily, id: string): MeshLambertMaterial => {
    const definicao = MATERIALS[family];
    const material = new MeshLambertMaterial({
      color: hslToHex(materialColor(family, id, definition.seed, variationEnabled)),
      map: texturaDe(family),
      // Resposta a luz e piso ambiental sao propriedades da familia.
      reflectivity: definicao.lightResponse,
    });
    const shading = attachSurfaceShading(material, { role: "objeto", field, fieldTexture });
    // O piso declarado pela família é uma fração; aqui vira emissão linear.
    shading.setMaterialFloor(definicao.ambientFloor * MATERIAL_FLOOR_SCALE);
    shadings.push(shading);
    objectMaterials.push({ material, family, id });
    return material;
  };

  const ground = new Mesh(
    new PlaneGeometry(definition.groundHalfExtent * 2, definition.groundHalfExtent * 2),
    groundMaterial,
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Patamares e rampas: o relevo que a simulacao ja conhece, agora visivel.
  for (const patch of definition.heightPatches) {
    const width = patch.area.maxX - patch.area.minX;
    const depth = patch.area.maxZ - patch.area.minZ;
    const top = Math.max(patch.height, patch.heightTo ?? patch.height);
    const mesh = new Mesh(new BoxGeometry(width, Math.max(0.08, top), depth), materialFor("pedra", patch.id));
    mesh.position.set(
      (patch.area.minX + patch.area.maxX) / 2,
      Math.max(0.08, top) / 2 - 0.02,
      (patch.area.minZ + patch.area.maxZ) / 2,
    );
    scene.add(mesh);
  }

  // Volumes, agrupados por setor para que so o relevante alimente a cena.
  const bySector = new Map<string, Mesh[]>();
  const unsectored: Mesh[] = [];
  const hidden = new Set(definition.hiddenIds);
  for (const obstacle of definition.obstacles) {
    // A aparencia destes vem de uma forma complexa; a caixa so colide.
    if (hidden.has(obstacle.id)) continue;
    const family: MaterialFamily = obstacle.material ?? KIND_MATERIAL[obstacle.kind];
    const mesh = new Mesh(
      new BoxGeometry(obstacle.size.x, obstacle.size.y, obstacle.size.z),
      materialFor(family, obstacle.id),
    );
    mesh.position.set(obstacle.center.x, obstacle.baseY + obstacle.size.y / 2, obstacle.center.z);
    mesh.rotation.y = obstacle.yaw;
    scene.add(mesh);

    const caixa = obstacleAabb(obstacle);
    mesh.userData.blockerKey = `${caixa.minX.toFixed(2)}:${caixa.minZ.toFixed(2)}`;

    const sectorId = sectorIdForPoint(definition, obstacle.center);
    if (sectorId === null) unsectored.push(mesh);
    else {
      const list = bySector.get(sectorId) ?? [];
      list.push(mesh);
      bySector.set(sectorId, list);
    }
  }

  // Formas complexas: uma malha fundida por forma, uma chamada de desenho cada.
  const complexMeshes = COMPLEX_SHAPES.map((shape) => {
    const mesh = new Mesh(buildComplexGeometry(shape), materialFor(shape.material, shape.id));
    mesh.position.set(shape.origin.x, shape.baseY, shape.origin.z);
    mesh.rotation.y = shape.yaw;
    scene.add(mesh);
    return { mesh, shape };
  });
  const complexTriangles = COMPLEX_SHAPES.reduce((total, shape) => total + shapeTriangles(shape), 0);

  // Sinal distante dos marcos: sem nevoa, para existir alem do alcance visual.
  // Pequeno e alto de proposito — orienta sem acender o mundo.
  const beacons = definition.landmarks.map((landmark) => {
    const altura = Math.max(0.4, landmark.beaconHeight - landmark.beaconBase);
    const mesh = new Mesh(
      new BoxGeometry(landmark.beaconHalfWidth * 2, altura, landmark.beaconHalfWidth * 2),
      new MeshBasicMaterial({ color: landmark.beaconColor, fog: false }),
    );
    mesh.position.set(landmark.position.x, landmark.beaconBase + altura / 2, landmark.position.z);
    scene.add(mesh);
    return { mesh, landmark };
  });

  // Claridade do lugar, deliberadamente assimetrica: faces verticais recebem um
  // fio de luz rasante e formam silhueta; o chao, cuja normal aponta para cima,
  // recebe o lado preto e desaparece.
  scene.add(new HemisphereLight(0x000000, 0x2b3550, 0.85));
  scene.add(new AmbientLight(0x2c3750, 0.16));

  const worldLights = definition.lights.map((source) => {
    const light = new PointLight(source.color, source.intensity, source.radius, 1.7);
    light.position.set(source.position.x, source.position.y, source.position.z);
    scene.add(light);
    return { light, source };
  });

  // Bordas dos setores, apenas em diagnostico.
  const sectorFrames = definition.sectors.map((sector) => {
    const width = sector.area.maxX - sector.area.minX;
    const depth = sector.area.maxZ - sector.area.minZ;
    const mesh = new Mesh(
      new BoxGeometry(width, 0.06, depth),
      new MeshBasicMaterial({ color: 0x39ff88, wireframe: true, fog: false }),
    );
    mesh.position.set((sector.area.minX + sector.area.maxX) / 2, 0.03, (sector.area.minZ + sector.area.maxZ) / 2);
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  });

  let echoLevel: EchoLevel = "sutil";
  let echoOn = true;
  let continuityOn = true;
  let isolateComplex = false;
  const blockerBoxes = new Set(
    blockersOf(definition).map((b) => `${b.minX.toFixed(2)}:${b.minZ.toFixed(2)}`),
  );
  let flickerReduced = false;
  let report: SectorReport = {
    total: definition.sectors.length,
    active: 0,
    activeIds: [],
    objectsTotal: definition.obstacles.length,
    objectsActive: definition.obstacles.length,
  };

  const applyEcho = () => echo.setEchoStrength(echoOn ? ECHO_LEVELS[echoLevel] : 0);
  const applyContinuity = () => {
    for (const shading of shadings) shading.setContinuityStrength(continuityOn ? CONTINUITY_STRENGTH : 0);
  };
  applyEcho();
  applyContinuity();

  return {
    scene,
    camera,

    setVisualRange(meters) {
      // A continuidade some junto com a nevoa: ela pertence a percepcao.
      for (const shading of shadings) shading.setPerceptionRange(meters);
      // O alcance mexe apenas na nevoa e no corte da camera. Nenhuma luz
      // acompanha o olhar, portanto nenhum alcance acende o chao aos pes.
      const fog = scene.fog as Fog;
      fog.near = Math.max(0.6, meters * 0.2);
      fog.far = meters;
      // A nevoa e que escurece o mundo no alcance escolhido. O corte da camera
      // precisa ir muito alem dele, senao os sinais distantes dos marcos sao
      // descartados antes de existirem — e sem eles nao ha orientacao possivel.
      camera.far = Math.max(meters + 6, LANDMARK_VIEW_DISTANCE);
      camera.updateProjectionMatrix();
    },

    setWorldLightsEnabled(enabled) {
      for (const { light } of worldLights) light.visible = enabled;
      // O campo assado tambem responde: sem fontes, nao ha nucleo nem cauda.
      for (const shading of shadings) shading.setLightFieldEnabled(enabled);
    },

    setVariationEnabled(enabled) {
      variationEnabled = enabled;
      for (const entry of objectMaterials) {
        entry.material.color.setHex(hslToHex(materialColor(entry.family, entry.id, definition.seed, enabled)));
      }
    },

    setContinuityEnabled(enabled) {
      continuityOn = enabled;
      applyContinuity();
    },

    setFieldDebug(enabled) {
      for (const shading of shadings) shading.setLightFieldDebug(enabled);
    },

    setBlockerDebug(enabled) {
      for (const [, meshes] of bySector) {
        for (const mesh of meshes) {
          const material = mesh.material as MeshLambertMaterial;
          material.wireframe = enabled && blockerBoxes.has(mesh.userData.blockerKey as string);
        }
      }
    },

    setIsolateComplex(enabled) {
      isolateComplex = enabled;
    },

    render() {
      return {
        triangles: complexTriangles + definition.obstacles.length * 12 + definition.heightPatches.length * 12 + 2,
        meshes: definition.obstacles.length + definition.heightPatches.length + complexMeshes.length + beacons.length + 1,
        drawCalls: renderer?.info.render.calls ?? 0,
        sources: definition.lights.length,
        fieldCells: fieldStats.cells,
        fieldBakeMs: fieldStats.bakeMs,
        blockers: fieldStats.blockers,
      };
    },

    setEchoLevel(level) {
      echoLevel = level;
      applyEcho();
    },

    setEchoEnabled(enabled) {
      echoOn = enabled;
      applyEcho();
    },

    setSectorDebug(enabled) {
      for (const frame of sectorFrames) frame.visible = enabled;
    },

    setFlickerReduced(reduced) {
      flickerReduced = reduced;
    },

    update(seconds, viewer) {
      const active = activeSectorIds(definition, viewer);

      let objectsActive = unsectored.length;
      for (const [sectorId, meshes] of bySector) {
        const visible = active.has(sectorId);
        if (visible) objectsActive += meshes.length;
        for (const mesh of meshes) mesh.visible = visible;
      }

      // Oscilacao lenta: a fonte e calor, nao uma lampada. A reducao de
      // cintilacao a congela sem apagar a luz.
      for (const { light, source } of worldLights) {
        if (flickerReduced) {
          light.intensity = source.intensity;
          continue;
        }
        const wobble = Math.sin(seconds * 2.3 + light.position.x) * 0.6 + Math.sin(seconds * 5.7) * 0.4;
        light.intensity = source.intensity * (1 + wobble * source.flicker);
      }

      // O sinal distante precisa cobrir ao menos uma celula da grade, senao
      // desaparece na resolucao interna reduzida. So a largura acompanha a
      // distancia: a altura fica, e o marco continua sendo um traco vertical.
      for (const { mesh, landmark } of beacons) {
        const distancia = Math.hypot(viewer.x - landmark.position.x, viewer.z - landmark.position.z);
        const largura = Math.max(1, Math.min(8, distancia / 18));
        mesh.scale.set(largura, 1, largura);
      }

      echo.setFootprints(nearestContacts(definition.obstacles, viewer));

      for (const { mesh } of complexMeshes) mesh.visible = true;
      if (isolateComplex) {
        for (const [, meshes] of bySector) for (const mesh of meshes) mesh.visible = false;
        for (const mesh of unsectored) mesh.visible = false;
      }

      report = {
        total: definition.sectors.length,
        active: active.size,
        activeIds: [...active].sort(),
        objectsTotal: definition.obstacles.length,
        objectsActive,
      };
      return report;
    },

    sectors() {
      return report;
    },

    dispose() {
      sand.dispose();
      for (const { mesh } of beacons) mesh.geometry.dispose();
      scene.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material.dispose();
        }
      });
    },
  };
}
