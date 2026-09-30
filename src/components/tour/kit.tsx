"use client";

import { useCallback, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { materials } from "../three/materials";
import { lathe, smoothProfile } from "../three/geometry";

/* Small building blocks shared by every part of the walkthrough world. */

/** Box-projected UVs (one texture tile per `tile` metres) so merged pieces share one texel density. */
export function worldUV(g: THREE.BufferGeometry, tile: number) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    let u: number;
    let v: number;
    if (ay >= ax && ay >= az) {
      u = p.getX(i);
      v = p.getZ(i);
    } else if (ax >= az) {
      u = p.getZ(i);
      v = p.getY(i);
    } else {
      u = p.getX(i);
      v = p.getY(i);
    }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Collects many static pieces into one geometry (one draw call per material). */
export class Batch {
  private parts: THREE.BufferGeometry[] = [];
  add(g: THREE.BufferGeometry, m?: THREE.Matrix4, tile = 2, keepUV = false) {
    let geo = g;
    if (g.index) {
      geo = g.toNonIndexed();
      g.dispose();
    }
    for (const name of Object.keys(geo.attributes)) if (name !== "position" && name !== "normal" && name !== "uv") geo.deleteAttribute(name);
    if (!keepUV) worldUV(geo, tile);
    if (m) geo.applyMatrix4(m);
    this.parts.push(geo);
    return this;
  }
  box(w: number, h: number, d: number, x: number, y: number, z: number, m?: THREE.Matrix4, tile = 2) {
    return this.add(new THREE.BoxGeometry(w, h, d).translate(x, y, z), m, tile);
  }
  build() {
    const g = this.parts.length ? mergeGeometries(this.parts, false) : new THREE.BufferGeometry();
    this.parts.forEach((p) => p.dispose());
    this.parts = [];
    return g ?? new THREE.BufferGeometry();
  }
}

const Y = new THREE.Vector3(0, 1, 0);
export const Ry = (a: number) => new THREE.Matrix4().makeRotationY(a);
export const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);

/** Matrix for an object at (x, y, z) in a local frame `M`, turned by `ry` and scaled. */
export function at(M: THREE.Matrix4 | null, x: number, y: number, z: number, ry = 0, s: number | [number, number, number] = 1) {
  const sc = typeof s === "number" ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s);
  const local = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(Y, ry), sc);
  return M ? M.clone().multiply(local) : local;
}

export const pt = (M: THREE.Matrix4 | null, x: number, y: number, z: number) => {
  const v = new THREE.Vector3(x, y, z);
  return M ? v.applyMatrix4(M) : v;
};

/** Instanced mesh from a list of matrices (and optional colours). */
export function Inst({
  geometry,
  material,
  matrices,
  colors,
  castShadow,
  receiveShadow,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
  colors?: THREE.Color[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  // A callback ref (not an effect) so positions are applied to every new mesh object,
  // including when React rebuilds it; otherwise all instances would sit at the origin.
  const apply = useCallback(
    (im: THREE.InstancedMesh | null) => {
      if (!im) return;
      matrices.forEach((m, i) => im.setMatrixAt(i, m));
      colors?.forEach((c, i) => im.setColorAt(i, c));
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
    },
    [matrices, colors],
  );
  if (!matrices.length) return null;
  // dispose={null}: geometries and materials are shared, so unmounting one mesh must not free them
  return <instancedMesh ref={apply} args={[geometry, material, matrices.length]} castShadow={castShadow} receiveShadow={receiveShadow} dispose={null} />;
}

/* ------------------------------------ flowers ------------------------------------ */

let flowerGeo: THREE.BufferGeometry | null = null;
/** Low-poly marigold head. Displacement is hashed from position so faces stay sealed. */
export function marigold() {
  if (!flowerGeo) {
    const g = new THREE.IcosahedronGeometry(0.032, 1);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = 1 + Math.sin(v.x * 913 + v.y * 377 + v.z * 531) * 0.15;
      p.setXYZ(i, v.x * k, v.y * k * 0.85, v.z * k);
    }
    g.computeVertexNormals();
    flowerGeo = g;
  }
  return flowerGeo;
}

export const MARIGOLD = ["#ff7a00", "#ff9408", "#ffb000", "#f06800"].map((c) => new THREE.Color(c));
export const ROSE = new THREE.Color("#a50f1d");
export const JASMINE = new THREE.Color("#fbf6ea");

/** Accumulates flower positions/colours, then turns them into instance matrices. */
export class Blooms {
  m: THREE.Matrix4[] = [];
  c: THREE.Color[] = [];
  private r: () => number;
  constructor(seed = 1) {
    let s = seed >>> 0;
    this.r = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  rand() {
    return this.r();
  }
  marigoldColor() {
    return MARIGOLD[Math.floor(this.r() * MARIGOLD.length)].clone().multiplyScalar(0.8 + this.r() * 0.35);
  }
  add(p: THREE.Vector3, color: THREE.Color, s = 1) {
    const r = this.r;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6));
    const k = s * (0.85 + r() * 0.3);
    this.m.push(new THREE.Matrix4().compose(p, q, new THREE.Vector3(k, k, k)));
    this.c.push(color);
  }
  swag(a: THREE.Vector3, b: THREE.Vector3, sag: number, spacing: number, color?: () => THREE.Color, s = 1) {
    const n = Math.max(2, Math.floor((a.distanceTo(b) + sag) / spacing));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y -= Math.sin(t * Math.PI) * sag;
      this.add(p, color ? color() : this.marigoldColor(), s);
    }
  }
  strand(top: THREE.Vector3, length: number, spacing: number, tip = ROSE) {
    for (let y = 0; y < length; y += spacing) this.add(new THREE.Vector3(top.x, top.y - y, top.z), this.marigoldColor());
    this.add(new THREE.Vector3(top.x, top.y - length - 0.02, top.z), tip, 1.3);
  }
}

export function BloomMesh({ blooms, castShadow }: { blooms: Blooms; castShadow?: boolean }) {
  const m = materials();
  return <Inst geometry={marigold()} material={m.flower} matrices={blooms.m} colors={blooms.c} castShadow={castShadow} />;
}

/* --------------------------------- small props --------------------------------- */

/** Brass mangal ghot with a coconut and mango leaves. */
export function Ghot({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const m = materials();
  const geo = useMemo(
    () =>
      lathe(
        smoothProfile(
          [
            [0.0, 0],
            [0.08, 0.01],
            [0.17, 0.1],
            [0.18, 0.18],
            [0.12, 0.28],
            [0.07, 0.32],
            [0.09, 0.36],
          ],
          30,
        ),
        24,
      ),
    [],
  );
  return (
    <group position={position} scale={scale}>
      <mesh geometry={geo} material={m.brass} castShadow />
      <mesh position-y={0.44} material={m.clay}>
        <sphereGeometry args={[0.09, 16, 12]} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position-y={0.38} rotation={[0.9, (i / 7) * Math.PI * 2, 0]} material={m.leaf}>
          <planeGeometry args={[0.06, 0.2]} />
        </mesh>
      ))}
    </group>
  );
}

let diyaGeo: THREE.BufferGeometry | null = null;
export function diya() {
  if (!diyaGeo)
    diyaGeo = lathe(
      [
        [0.0, 0],
        [0.035, 0.004],
        [0.045, 0.02],
        [0.04, 0.03],
      ],
      12,
    );
  return diyaGeo;
}
