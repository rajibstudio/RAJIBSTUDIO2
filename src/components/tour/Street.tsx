"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { materials } from "../three/materials";
import { rng } from "../three/textures";
import { Flames } from "../three/Flames";
import { BananaPlant } from "../three/Mandap";
import { tourMaterials } from "./assets";
import { Blooms, BloomMesh, Ghot, Inst, ROSE, JASMINE, at, diya } from "./kit";
import { BulbBuilder, Bulbs, FESTIVE, GOLD, STEADY, TWINKLE, WARM_WHITE } from "./Bulbs";
import * as L from "./layout";
import type { Tier } from "@/lib/device";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const HOUSE_COLORS = ["#c9b99c", "#b39c86", "#a2b1a6", "#c3a79e", "#bcb28e", "#a8a9b8", "#cdb99a", "#b8a0a8", "#9fb3b8"];

/** Neighbouring houses along the lane, merged into one mesh (vertex-coloured) plus instanced windows. */
function buildNeighbours() {
  const r = rng(314);
  const houseParts: THREE.BufferGeometry[] = [];
  const lit: THREE.Matrix4[] = [];
  const litCol: THREE.Color[] = [];
  const dark: THREE.Matrix4[] = [];
  const shops: THREE.Matrix4[] = [];

  const house = (cx: number, w: number, h: number, faceZ: number, dir: 1 | -1, depth: number) => {
    const color = new THREE.Color(HOUSE_COLORS[Math.floor(r() * HOUSE_COLORS.length)]).multiplyScalar(0.8 + r() * 0.2);
    const g = new THREE.BoxGeometry(w, h, depth).translate(cx, h / 2, faceZ + (dir * depth) / 2 * -1);
    houseParts.push(g);
    const col = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < col.length; i += 3) {
      col[i] = color.r;
      col[i + 1] = color.g;
      col[i + 2] = color.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const floors = Math.floor((h - 0.6) / 3.1);
    const cols = Math.max(1, Math.floor(w / 1.9));
    const rot = dir === 1 ? 0 : Math.PI;
    for (let f = 0; f < floors; f++)
      for (let c = 0; c < cols; c++) {
        const x = cx - w / 2 + (c + 0.5) * (w / cols);
        const y = 1.7 + f * 3.1;
        const z = faceZ + dir * 0.02;
        if (f === 0 && r() < 0.5) {
          if (c % 2 === 0) shops.push(at(null, x, 1.25, z, rot, [Math.min(2.4, w / cols - 0.3), 2.3, 1]));
          continue;
        }
        if (r() < 0.4) {
          lit.push(at(null, x, y, z, rot, [1, 1.35, 1]));
          const warm = r() < 0.75;
          litCol.push(warm ? new THREE.Color(1.4 + r() * 0.6, 0.85 + r() * 0.3, 0.45 + r() * 0.2) : new THREE.Color(0.9, 1.1, 1.3));
        } else dark.push(at(null, x, y, z, rot, [1, 1.35, 1]));
      }
  };

  // across the lane (their fronts face the rajbari)
  for (let x = -46; x < 46; ) {
    const w = 6 + r() * 4;
    house(x + w / 2, w, 7 + r() * 7, L.LANE_Z, -1, 9);
    x += w + 0.05;
  }
  // beside the rajbari, on the same side of the lane
  for (const s of [-1, 1]) {
    for (let x = L.OUTER + 0.05; x < 46; ) {
      const w = 6 + r() * 4;
      house(s * (x + w / 2), w, 8 + r() * 5, L.OUTER, 1, 10);
      x += w + 0.05;
    }
  }

  return { houses: mergeWithColors(houseParts), lit, litCol, dark, shops };
}

function mergeWithColors(geos: THREE.BufferGeometry[]) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  for (const g0 of geos) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    const p = g.attributes.position;
    const n = g.attributes.normal;
    const c = g.attributes.color;
    for (let i = 0; i < p.count; i++) {
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
      normals.push(n.getX(i), n.getY(i), n.getZ(i));
      colors.push(c.getX(i), c.getY(i), c.getZ(i));
      const ax = Math.abs(n.getX(i));
      const ay = Math.abs(n.getY(i));
      const az = Math.abs(n.getZ(i));
      if (ay >= ax && ay >= az) uvs.push(p.getX(i) / 2, p.getZ(i) / 2);
      else if (ax >= az) uvs.push(p.getZ(i) / 2, p.getY(i) / 2);
      else uvs.push(p.getX(i) / 2, p.getY(i) / 2);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  out.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return out;
}

/** A white Ambassador, dressed with flowers for the groom. Faces -x. */
function Car() {
  const t = tourMaterials();
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(2.2, 0.36);
    s.lineTo(1.35 + 0.42, 0.36);
    s.absarc(1.35, 0.36, 0.42, 0, Math.PI, false);
    s.lineTo(-1.35 + 0.42, 0.36);
    s.absarc(-1.35, 0.36, 0.42, 0, Math.PI, false);
    s.lineTo(-2.2, 0.36);
    s.lineTo(-2.22, 0.72);
    s.quadraticCurveTo(-2.18, 0.92, -1.9, 0.94);
    s.lineTo(-0.95, 0.99);
    s.lineTo(-0.55, 1.42);
    s.quadraticCurveTo(0.2, 1.6, 0.95, 1.44);
    s.lineTo(1.42, 1.02);
    s.lineTo(2.08, 0.97);
    s.quadraticCurveTo(2.24, 0.93, 2.22, 0.72);
    s.lineTo(2.2, 0.36);
    const body = new THREE.ExtrudeGeometry(s, { depth: 1.62, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.08, bevelSegments: 3, curveSegments: 16 }).translate(0, 0, -0.81);
    const w = new THREE.Shape();
    w.moveTo(-0.86, 1.03);
    w.lineTo(-0.54, 1.38);
    w.quadraticCurveTo(0.2, 1.54, 0.9, 1.4);
    w.lineTo(1.3, 1.05);
    w.lineTo(-0.86, 1.03);
    const glass = new THREE.ExtrudeGeometry(w, { depth: 1.8, bevelEnabled: false, curveSegments: 12 }).translate(0, 0, -0.9);
    return { body, glass, wheel: new THREE.CylinderGeometry(0.34, 0.34, 0.26, 24).rotateX(Math.PI / 2) };
  }, []);
  const flowers = useMemo(() => {
    const b = new Blooms(9);
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(a), 3);
      const hy = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
      b.add(V(-1.45 - hy * 0.018, 1.07, hx * 0.018), ROSE, 1.1);
    }
    for (let i = 0; i < 40; i++) b.add(V(-1.45 + (b.rand() - 0.5) * 0.35, 1.07, (b.rand() - 0.5) * 0.3), JASMINE, 0.9);
    for (const z of [-0.9, 0.9]) b.swag(V(-0.55, 1.47, z), V(0.95, 1.49, z), 0.06, 0.05);
    b.swag(V(-2.25, 0.8, -0.8), V(-2.25, 0.8, 0.8), 0.18, 0.05);
    return b;
  }, []);
  return (
    <group position={[7.0, 0, 19.4]}>
      <mesh geometry={geo.body} material={t.carPaint} castShadow />
      <mesh geometry={geo.glass} material={t.carGlass} />
      {[
        [-1.35, -0.84],
        [-1.35, 0.84],
        [1.35, -0.84],
        [1.35, 0.84],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0.34, z]}>
          <mesh geometry={geo.wheel} material={t.rubber} />
          <mesh material={t.chrome} position-z={z > 0 ? 0.135 : -0.135} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.16, 0.16, 0.02, 20]} />
          </mesh>
        </group>
      ))}
      {[-0.55, 0.55].map((z) => (
        <mesh key={z} material={t.headlight} position={[-2.3, 0.72, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
        </mesh>
      ))}
      {[-0.65, 0.65].map((z) => (
        <mesh key={z} material={t.taillight} position={[2.28, 0.78, z]}>
          <boxGeometry args={[0.04, 0.12, 0.22]} />
        </mesh>
      ))}
      <mesh material={t.chrome} position={[-2.3, 0.45, 0]}>
        <boxGeometry args={[0.08, 0.1, 1.7]} />
      </mesh>
      <BloomMesh blooms={flowers} />
    </group>
  );
}

function Gate() {
  const t = tourMaterials();
  const m = materials();
  const decor = useMemo(() => {
    const b = new Blooms(11);
    const bulbs = new BulbBuilder();
    // marigold strings hanging from the banner, framing the opening
    for (let x = -2.1; x <= 2.11; x += 0.14) {
      const len = 0.35 + Math.pow(Math.abs(x) / 2.1, 2) * 1.6;
      b.strand(V(x, 4.02, L.GATE_Z + 0.08), len, 0.05, Math.abs(x) > 1.2 ? JASMINE : ROSE);
    }
    // spirals round the pillars
    for (const s of [-1, 1])
      for (let i = 0; i < 150; i++) {
        const u = i / 150;
        const a = u * Math.PI * 16;
        b.add(V(s * 2.3 + Math.cos(a) * 0.24, 0.2 + u * 3.9, L.GATE_Z + Math.sin(a) * 0.24), i % 9 === 0 ? ROSE : b.marigoldColor(), 0.9);
        if (i % 3 === 0) bulbs.add(V(s * 2.3 + Math.cos(a + 1.5) * 0.27, 0.25 + u * 3.9, L.GATE_Z + Math.sin(a + 1.5) * 0.27), GOLD, i * 0.07, TWINKLE);
      }
    bulbs.line([V(-2.55, 5.0, L.GATE_Z + 0.1), V(2.55, 5.0, L.GATE_Z + 0.1)], 0.12, WARM_WHITE, TWINKLE);
    bulbs.line([V(-2.55, 4.05, L.GATE_Z + 0.1), V(2.55, 4.05, L.GATE_Z + 0.1)], 0.12, (i) => FESTIVE[i % FESTIVE.length], 1);
    for (let i = 0; i < 9; i++) b.add(V(-2.4 + i * 0.6, 5.12, L.GATE_Z), i % 2 ? ROSE : b.marigoldColor(), 2.2);
    return { b, bulbs };
  }, []);
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.3, 2.2, L.GATE_Z]} material={t.stripes} castShadow>
          <cylinderGeometry args={[0.2, 0.22, 4.4, 20]} />
        </mesh>
      ))}
      <mesh position={[0, 4.52, L.GATE_Z]} material={t.bannerFaces} castShadow>
        <boxGeometry args={[5.2, 0.95, 0.14]} />
      </mesh>
      <mesh position={[0, 5.05, L.GATE_Z]} material={m.gold}>
        <boxGeometry args={[5.3, 0.08, 0.2]} />
      </mesh>
      <mesh position={[0, 4.02, L.GATE_Z]} material={m.gold}>
        <boxGeometry args={[5.3, 0.06, 0.18]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={`g${s}`}>
          <BananaPlant position={[s * 3.1, 0, L.GATE_Z]} seed={s + 3} />
          <Ghot position={[s * 3.05, 0, L.GATE_Z + 0.45]} />
          <BananaPlant position={[s * 2.3, 0, L.OUTER + 0.95]} seed={s + 7} />
          <Ghot position={[s * 2.75, 0, L.OUTER + 0.95]} scale={0.9} />
        </group>
      ))}
      <BloomMesh blooms={decor.b} />
      <Bulbs builder={decor.bulbs} size={0.1} />
    </group>
  );
}

export function Street({ tier }: { tier: Tier }) {
  const t = tourMaterials();
  const m = materials();
  const n = useMemo(() => buildNeighbours(), []);
  const g = useMemo(() => ({ win: new THREE.PlaneGeometry(1, 1), shop: new THREE.PlaneGeometry(1, 1), post: new THREE.CylinderGeometry(0.05, 0.06, 1.4, 8), diya: diya() }), []);

  const fence = useMemo(() => {
    const posts: THREE.Matrix4[] = [];
    const rails: THREE.Matrix4[] = [];
    const b = new Blooms(21);
    for (const x of [-L.LANE_X, L.LANE_X]) {
      for (let z = L.OUTER + 0.2; z < L.LANE_Z; z += 1.2) posts.push(at(null, x, 0.7, z));
      for (const y of [0.45, 0.85, 1.25]) rails.push(new THREE.Matrix4().compose(V(x, y, (L.OUTER + L.LANE_Z) / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(0.9, (L.LANE_Z - L.OUTER) / 1.4, 0.9)));
      for (let z = L.OUTER + 0.2; z < L.LANE_Z - 1.2; z += 1.2) b.swag(V(x, 1.3, z), V(x, 1.3, z + 1.2), 0.25, 0.06);
    }
    return { posts, rails, b };
  }, []);

  const lights = useMemo(() => {
    const bulbs = new BulbBuilder();
    // strings of lights across the lane, from the rajbari's parapet to the houses opposite
    [-10, -6, -2, 2, 6, 10].forEach((x, i) => bulbs.catenary(V(x, L.PARAPET - 0.2, L.OUTER + 0.5), V(x + (i % 2 ? -2 : 2), 8.2, L.LANE_Z - 0.1), 2.2, 0.2, i % 2 ? GOLD : (k) => FESTIVE[k % FESTIVE.length], i % 2 ? TWINKLE : 1));
    // sodium street lamps
    for (const x of [-8.5, 8.5]) bulbs.add(V(x, 7.05, L.LANE_Z - 1.4), new THREE.Color(1.3, 0.55, 0.15), 0, STEADY, 7);
    return bulbs;
  }, []);

  const wires = useMemo(() => {
    const pts: number[] = [];
    const seg = (a: THREE.Vector3, b: THREE.Vector3, sag: number) => {
      let prev = a.clone();
      for (let i = 1; i <= 16; i++) {
        const u = i / 16;
        const p = new THREE.Vector3().lerpVectors(a, b, u);
        p.y -= Math.sin(u * Math.PI) * sag;
        pts.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
        prev = p;
      }
    };
    const z = L.LANE_Z - 0.6;
    for (const [dy, dz] of [
      [0, 0],
      [-0.3, 0.12],
      [-0.55, -0.1],
      [-0.2, 0.25],
    ] as const) {
      seg(V(-8.5, 7.6 + dy, z + dz), V(8.5, 7.6 + dy, z + dz), 0.7 + dy);
      seg(V(-48, 7.4 + dy, z + dz), V(-8.5, 7.6 + dy, z + dz), 1.3);
      seg(V(8.5, 7.6 + dy, z + dz), V(48, 7.4 + dy, z + dz), 1.3);
    }
    seg(V(8.5, 7.3, z), V(10.5, 5.6, L.OUTER + 0.1), 0.4);
    seg(V(-8.5, 7.3, z), V(-9.8, 5.2, L.OUTER + 0.1), 0.35);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  const carpetDiyas = useMemo(() => {
    const p: THREE.Vector3[] = [];
    for (let z = L.OUTER + 1.0; z < 21.6; z += 0.75) p.push(V(-1.0, 0.0, z), V(1.0, 0.0, z));
    return { matrices: p.map((q) => at(null, q.x, 0, q.z)), flames: p.map((q) => q.clone().setY(0.035)) };
  }, []);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (L.OUTER + 30) / 2]} material={t.asphalt} receiveShadow>
        <planeGeometry args={[100, 30 - L.OUTER]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, (L.OUTER + 0.7 + 21.8) / 2]} material={t.carpet} receiveShadow>
        <planeGeometry args={[1.6, 21.8 - L.OUTER - 0.7]} />
      </mesh>

      <mesh geometry={n.houses} material={t.houses} receiveShadow />
      <Inst geometry={g.win} material={t.windowLit} matrices={n.lit} colors={n.litCol} />
      <Inst geometry={g.win} material={t.windowDark} matrices={n.dark} />
      <Inst geometry={g.shop} material={t.shopShutter} matrices={n.shops} />

      <Inst geometry={g.post} material={t.bamboo} matrices={fence.posts} />
      <Inst geometry={g.post} material={t.bamboo} matrices={fence.rails} />
      <BloomMesh blooms={fence.b} />

      {[-8.5, 8.5].map((x) => (
        <group key={x} position={[x, 0, L.LANE_Z - 0.5]}>
          <mesh position-y={4.2} material={t.concrete} castShadow={tier === "high"}>
            <boxGeometry args={[0.22, 8.4, 0.22]} />
          </mesh>
          <mesh position-y={7.6} material={t.concrete}>
            <boxGeometry args={[1.8, 0.1, 0.12]} />
          </mesh>
          <mesh position={[0, 7.1, -0.5]} material={t.concrete}>
            <boxGeometry args={[0.06, 0.06, 1.0]} />
          </mesh>
          <mesh position={[0, 7.05, -0.95]} material={t.sodium}>
            <boxGeometry args={[0.26, 0.08, 0.4]} />
          </mesh>
        </group>
      ))}
      <lineSegments geometry={wires} material={t.wire} />

      <Gate />
      <Car />
      <Inst geometry={g.diya} material={m.clay} matrices={carpetDiyas.matrices} />
      <Flames positions={carpetDiyas.flames} size={0.03} glowSize={0.16} />
      <Bulbs builder={lights} size={0.1} />
    </group>
  );
}
