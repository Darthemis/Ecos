// Materializacao visual da cena fixa. Le o conteudo e o estado; nunca os altera
// (AGENT_RULES §5: renderizacao nao muta a simulacao).

import {
  AmbientLight,
  BoxGeometry,
  HemisphereLight,
  CanvasTexture,
  Color,
  Fog,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  Scene,
  type Texture,
} from "three";
import { createRng } from "../core/rng";
import {
  GROUND_HALF_EXTENT,
  LIGHT_SOURCES,
  OBSTACLES,
  SCENE_SEED,
} from "../content/desert-scene";
import type { ObstacleKind } from "../world/geometry";
import { PLAYER_EYE_HEIGHT } from "../sim/state";

const KIND_COLOR: Record<ObstacleKind, number> = {
  rock: 0xa8aeb6,
  ruin: 0xe2d9bf,
  monolith: 0x8b9fb2,
};

const SAND_COLOR = 0x94703f;

/** Lado do ladrilho de areia, em metros. Define o tamanho das manchas no chao. */
const SAND_TILE_METERS = 24;

/** Ruido em grade, interpolado. Estavel no mundo: nao cintila ao caminhar. */
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
      // Suavizacao cubica: evita as arestas retas da interpolacao linear.
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
 * Textura do solo. Duas oitavas: manchas largas que abrem clareiras escuras no
 * chao e um grao fino por cima. As clareiras existem para que o piso proximo
 * nao vire uma folha continua de glifos — o preto tambem faz parte do chao.
 */
function createSandTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Contexto 2D indisponivel para a textura do solo");

  const coarse = latticeNoise(size, 12, SCENE_SEED);
  const fine = latticeNoise(size, 48, SCENE_SEED + 977);

  const image = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i += 1) {
    const mixed = (coarse[i] ?? 0) * 0.74 + (fine[i] ?? 0) * 0.26;
    // Expoente maior joga mais area para o escuro: as clareiras precisam cair
    // abaixo do primeiro degrau da rampa para virarem preto de verdade.
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
  const tiles = (GROUND_HALF_EXTENT * 2) / SAND_TILE_METERS;
  texture.repeat.set(tiles, tiles);
  return texture;
}

export type DesertView = {
  scene: Scene;
  camera: PerspectiveCamera;
  setVisualRange: (meters: number) => void;
  /** Diagnostico: desliga as fontes do mundo para comparar os dois estados. */
  setWorldLightsEnabled: (enabled: boolean) => void;
  update: (seconds: number) => void;
  dispose: () => void;
};

export function createDesertView(): DesertView {
  const scene = new Scene();
  scene.background = new Color(0x000000);
  scene.fog = new Fog(0x000000, 1, 15);

  const camera = new PerspectiveCamera(72, 1, 0.1, 60);
  camera.position.y = PLAYER_EYE_HEIGHT;

  const sand = createSandTexture();
  const ground = new Mesh(
    new PlaneGeometry(GROUND_HALF_EXTENT * 2, GROUND_HALF_EXTENT * 2),
    new MeshLambertMaterial({ color: SAND_COLOR, map: sand }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  for (const obstacle of OBSTACLES) {
    const mesh = new Mesh(
      new BoxGeometry(obstacle.size.x, obstacle.size.y, obstacle.size.z),
      new MeshLambertMaterial({ color: KIND_COLOR[obstacle.kind] }),
    );
    mesh.position.set(obstacle.center.x, obstacle.baseY + obstacle.size.y / 2, obstacle.center.z);
    mesh.rotation.y = obstacle.yaw;
    scene.add(mesh);
  }

  // O personagem nao ilumina o mundo. Nao existe luz presa a camera.
  //
  // Resta apenas a claridade do lugar, e ela e deliberadamente assimetrica: o
  // hemisferio ilumina de baixo, de modo que faces verticais recebem um fio de
  // luz rasante e formam silhueta, enquanto o chao — cuja normal aponta para
  // cima — recebe o lado preto e desaparece. O ambiente minusculo existe apenas
  // para que os picos do ruido da areia cruzem o primeiro degrau da rampa e
  // sobrem alguns glifos esparsos, evitando perda total de orientacao.
  scene.add(new HemisphereLight(0x000000, 0x2b3550, 0.85));
  scene.add(new AmbientLight(0x2c3750, 0.16));

  // Fontes que pertencem ao mundo. Sao elas que revelam o terreno.
  const worldLights = LIGHT_SOURCES.map((source) => {
    const light = new PointLight(source.color, source.intensity, source.radius, 1.7);
    light.position.set(source.position.x, source.position.y, source.position.z);
    scene.add(light);
    return { light, source };
  });

  scene.add(camera);

  return {
    scene,
    camera,
    setVisualRange(meters) {
      // O alcance mexe apenas na nevoa e no corte da camera. Nenhuma luz
      // acompanha o olhar, portanto nenhum alcance acende o chao aos pes.
      const fog = scene.fog as Fog;
      fog.near = Math.max(0.6, meters * 0.2);
      fog.far = meters;
      camera.far = meters + 6;
      camera.updateProjectionMatrix();
    },
    setWorldLightsEnabled(enabled) {
      for (const { light } of worldLights) light.visible = enabled;
    },
    update(seconds) {
      // Oscilacao lenta: a fonte e calor, nao uma lampada.
      for (const { light, source } of worldLights) {
        const wobble = Math.sin(seconds * 2.3 + light.position.x) * 0.6 + Math.sin(seconds * 5.7) * 0.4;
        light.intensity = source.intensity * (1 + wobble * source.flicker);
      }
    },
    dispose() {
      sand.dispose();
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
