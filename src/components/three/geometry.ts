import * as THREE from "three";
import { rng } from "./textures";

/** Lathe from [radius, height] pairs, optionally squashed in depth (bodies aren't round). */
export function lathe(profile: [number, number][], segments = 32, depth = 1, phiStart = 0, phiLength = Math.PI * 2) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y));
  const g = new THREE.LatheGeometry(pts, segments, phiStart, phiLength);
  if (depth !== 1) g.scale(1, 1, depth);
  g.computeVertexNormals();
  return g;
}

/** Smooth a coarse profile with a Catmull-Rom spline — gives fabric-like silhouettes. */
export function smoothProfile(profile: [number, number][], samples = 40): [number, number][] {
  const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
  return curve.getPoints(samples).map((p) => [p.x, p.y]);
}

/**
 * A flat ribbon (fabric strip) swept along a curve. `normalHint` controls which
 * way the ribbon faces; `widthFn` lets drapes taper.
 */
export function ribbon(
  curve: THREE.Curve<THREE.Vector3>,
  width: number,
  segments = 64,
  normalHint: THREE.Vector3 | ((t: number, p: THREE.Vector3) => THREE.Vector3) = new THREE.Vector3(0, 0, 1),
  widthFn: (t: number) => number = () => 1,
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    curve.getTangentAt(t, tangent);
    const n = typeof normalHint === "function" ? normalHint(t, p) : normalHint;
    side.crossVectors(tangent, n).normalize();
    const w = (width * widthFn(t)) / 2;
    positions.push(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w);
    uvs.push(0, t, 1, t);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Open cone with a scalloped (lace-cut) rim — sola mukut / topor ornaments. */
export function scallopedCone(rBottom: number, rTop: number, height: number, scallops: number, depth: number, segments = 96) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, height, segments, 8, true);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y > height / 2 - 1e-4) {
      const a = Math.atan2(v.z, v.x);
      v.y += Math.pow(Math.abs(Math.cos((a * scallops) / 2)), 3) * depth;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Sagging catenary-ish curve between two points (garland swags). */
export function swag(a: THREE.Vector3, b: THREE.Vector3, sag: number, count: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    p.y -= Math.sin(t * Math.PI) * sag;
    pts.push(p);
  }
  return pts;
}

/** Ruffled marigold head: displaced icosahedron. */
export function marigoldGeometry(radius = 0.03) {
  const g = new THREE.IcosahedronGeometry(radius, 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const r = rng(42);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = 1 + (r() - 0.5) * 0.28 + Math.sin(v.x * 400) * 0.05;
    v.multiplyScalar(n);
    pos.setXYZ(i, v.x, v.y * 0.85, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Two-bone IK: returns the elbow/knee position. */
export function solveIK(root: THREE.Vector3, target: THREE.Vector3, a: number, b: number, pole: THREE.Vector3, out: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(target, root);
  let d = dir.length();
  d = Math.min(Math.max(d, Math.abs(a - b) + 1e-4), a + b - 1e-4);
  dir.normalize();
  const x = (a * a - b * b + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(a * a - x * x, 0));
  const poleDir = new THREE.Vector3().subVectors(pole, root);
  poleDir.sub(dir.clone().multiplyScalar(poleDir.dot(dir))).normalize();
  return out.copy(root).addScaledVector(dir, x).addScaledVector(poleDir, h);
}

const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

/** Places a unit-height, Y-aligned mesh so it spans from a to b. */
export function spanMesh(obj: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  tmp.subVectors(b, a);
  const len = tmp.length();
  obj.position.copy(a).addScaledVector(tmp, 0.5);
  obj.quaternion.setFromUnitVectors(UP, tmp.normalize());
  obj.scale.set(1, len, 1);
}
