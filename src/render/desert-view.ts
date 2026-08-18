// Materializacao visual da cena fixa. Le o conteudo e o estado; nunca os altera
// (AGENT_RULES §5: renderizacao nao muta a simulacao).

import {
  AmbientLight,
  BoxGeometry,
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
  OBSTACLES,
  SCENE_SEED,
} from "../content/desert-scene";
import type { ObstacleKind } from "../world/geometry";
import { PLAYER_EYE_HEIGHT } from "../sim/state";

const KIND_COLOR: Record<ObstacleKind, number> = {
  rock: 0x9aa0a8,
  ruin: 0xd6cdb4,
  monolith: 0x7f93a6,
};

const SAND_COLOR = 0xc79a5c;

/** Ruido do solo. Sem granulacao o chao vira um campo uniforme de glifos. */
function createSandTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Contexto 2D indisponivel para a textura do solo");

  const rng = createRng(SCENE_SEED);
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i += 1) {
    const value = 150 + rng() * 105;
    image.data[i * 4] = value;
    image.data[i * 4 + 1] = value;
    image.data[i * 4 + 2] = value;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(GROUND_HALF_EXTENT / 1.5, GROUND_HALF_EXTENT / 1.5);
  return texture;
}

export type DesertView = {
  scene: Scene;
  camera: PerspectiveCamera;
  setVisualRange: (meters: number) => void;
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

  scene.add(new AmbientLight(0x4a5570, 0.9));

  // Luz presa ao olhar: o alcance visual passa a ser algo que se ve, nao apenas
  // um valor. Sem ela a nevoa preta corta a cena sem gradiente de proximidade.
  const carried = new PointLight(0xffe6c2, 6.5, 20, 1.25);
  carried.position.set(0, 0, 0);
  camera.add(carried);
  scene.add(camera);

  return {
    scene,
    camera,
    setVisualRange(meters) {
      const fog = scene.fog as Fog;
      fog.near = Math.max(0.6, meters * 0.18);
      fog.far = meters;
      camera.far = meters + 6;
      camera.updateProjectionMatrix();
      carried.distance = meters * 1.4;
      carried.intensity = 5.5 + meters * 0.55;
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
