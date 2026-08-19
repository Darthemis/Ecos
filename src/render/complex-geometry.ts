// Materializa descritores de forma em geometria Three.js. É o único lugar onde
// as primitivas viram malha: o conteúdo declara, a renderização constrói.
//
// As partes de uma forma são fundidas numa única malha, para que um objeto
// complexo continue custando uma chamada de desenho.

import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Matrix4,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ComplexShape, ShapePart } from "../world/complex-shapes";

function geometryOf(part: ShapePart): BufferGeometry {
  switch (part.kind) {
    case "box":
      return new BoxGeometry(part.size.x, part.size.y, part.size.z);
    case "sphere": {
      const geometry = new SphereGeometry(part.radius, part.widthSegments, part.heightSegments);
      geometry.scale(part.scale.x, part.scale.y, part.scale.z);
      return geometry;
    }
    case "cylinder":
      return new CylinderGeometry(part.radiusTop, part.radiusBottom, part.height, part.radialSegments);
    case "cone":
      return new ConeGeometry(part.radius, part.height, part.radialSegments);
    case "torus":
      return new TorusGeometry(part.radius, part.tube, part.radialSegments, part.tubularSegments);
  }
}

/** Geometria única de uma forma, já posicionada em torno da própria origem. */
export function buildComplexGeometry(shape: ComplexShape): BufferGeometry {
  const partes = shape.parts.map((part) => {
    const geometry = geometryOf(part);
    const rotacao = new Matrix4().makeRotationFromEuler(
      new Euler(part.rotation.x, part.rotation.y, part.rotation.z),
    );
    const matriz = rotacao.setPosition(
      new Vector3(part.position.x, part.position.y, part.position.z),
    );
    geometry.applyMatrix4(matriz);
    return geometry;
  });

  const merged = mergeGeometries(partes, false);
  for (const parte of partes) parte.dispose();
  if (merged === null) throw new Error(`Nao foi possivel fundir a forma ${shape.id}`);
  merged.computeVertexNormals();
  return merged;
}
