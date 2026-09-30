"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { materials } from "../three/materials";
import { alpanaTexture } from "../three/textures";
import { lathe, smoothProfile } from "../three/geometry";
import { Flames } from "../three/Flames";
import { tourMaterials } from "./assets";
import { Batch, Blooms, BloomMesh, Inst, Ry, at, diya, pt } from "./kit";
import { BulbBuilder, Bulbs, CHASE, FESTIVE, GOLD, TWINKLE, WARM_WHITE } from "./Bulbs";
import * as L from "./layout";
import type { Tier } from "@/lib/device";

/**
 * The rajbari: a two-storey house of columns and arches around an open courtyard,
 * red-oxide verandas, green khorkhori shutters, stained-glass fanlights and a street
 * facade wrapped in thousands of tuni lights. Built in a canonical "south side" frame
 * and rotated to the other three sides.
 */
const SIDES = [
  { id: "S", rot: 0, full: true },
  { id: "N", rot: Math.PI, full: true },
  { id: "E", rot: Math.PI / 2, full: false },
  { id: "W", rot: -Math.PI / 2, full: false },
] as const;

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Wall above a row of columns, with a semicircular arch cut between every pair. */
function spandrel(x0: number, x1: number, yb: number, yt: number) {
  const s = new THREE.Shape();
  s.moveTo(x0, yb);
  for (const c of L.OPENING_CENTERS) {
    if (c - L.ARCH_R < x0 || c + L.ARCH_R > x1) continue;
    s.lineTo(c - L.ARCH_R, yb);
    s.absarc(c, yb, L.ARCH_R, Math.PI, 0, true);
  }
  s.lineTo(x1, yb);
  s.lineTo(x1, yt);
  s.lineTo(x0, yt);
  s.lineTo(x0, yb);
  return new THREE.ExtrudeGeometry(s, { depth: L.ARCADE_T, bevelEnabled: false, curveSegments: 20 });
}

function columnGeo(h: number, r: number) {
  const shaft = lathe(
    [
      [r * 1.45, 0],
      [r * 1.45, h * 0.05],
      [r * 1.25, h * 0.075],
      [r * 1.1, h * 0.1],
      [r * 1.04, h * 0.14],
      [r, h * 0.5],
      [r * 0.92, h * 0.84],
      [r, h * 0.87],
      [r * 1.2, h * 0.91],
      [r * 1.38, h * 0.95],
      [r * 1.38, h * 0.96],
      [0.0001, h * 0.96],
    ],
    24,
  );
  const abacus = new THREE.BoxGeometry(r * 3, h * 0.04, r * 3).translate(0, h * 0.98, 0);
  return new Batch().add(shaft, undefined, 1, true).add(abacus, undefined, 1, true).build();
}

function facadeWall() {
  const s = new THREE.Shape();
  s.moveTo(-L.OUTER, 0);
  s.lineTo(L.OUTER, 0);
  s.lineTo(L.OUTER, L.PARAPET);
  s.lineTo(-L.OUTER, L.PARAPET);
  s.lineTo(-L.OUTER, 0);
  const R = L.DOOR_W / 2;
  const hole = new THREE.Path();
  hole.moveTo(-R, L.PLINTH);
  hole.lineTo(R, L.PLINTH);
  hole.lineTo(R, 2.7);
  hole.absarc(0, 2.7, R, 0, Math.PI, false);
  hole.lineTo(-R, L.PLINTH);
  s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth: L.OUTER - L.INNER, bevelEnabled: false, curveSegments: 24 }).translate(0, 0, L.INNER);
}

/** "∩"-shaped moulding around an arched opening. */
function archBand(r0: number, r1: number, bottom: number, spring: number, depth: number) {
  const s = new THREE.Shape();
  s.moveTo(-r1, bottom);
  s.lineTo(-r0, bottom);
  s.lineTo(-r0, spring);
  s.absarc(0, spring, r0, Math.PI, 0, true);
  s.lineTo(r0, bottom);
  s.lineTo(r1, bottom);
  s.lineTo(r1, spring);
  s.absarc(0, spring, r1, 0, Math.PI, false);
  s.lineTo(-r1, bottom);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 24 });
}

function railingPlane(width: number, height: number) {
  const g = new THREE.PlaneGeometry(width, height);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * width);
  return g;
}

function build(tier: Tier) {
  const b = {
    plaster: new Batch(),
    trim: new Batch(),
    red: new Batch(),
    steps: new Batch(),
    stone: new Batch(),
    ceiling: new Batch(),
    rail: new Batch(),
    carpet: new Batch(),
  };
  const I = {
    colG: [] as THREE.Matrix4[],
    colF: [] as THREE.Matrix4[],
    doors: [] as THREE.Matrix4[],
    frames: [] as THREE.Matrix4[],
    fans: [] as THREE.Matrix4[],
    shutters: [] as THREE.Matrix4[],
    lit: [] as THREE.Matrix4[],
    litColors: [] as THREE.Color[],
    lanterns: [] as THREE.Matrix4[],
    chains: [] as THREE.Matrix4[],
  };
  const blooms = new Blooms(5);
  const bulbs = new BulbBuilder();
  const diyas: THREE.Vector3[] = [];
  const rich = tier !== "low";
  const litWindow = () => blooms.rand() < 0.32;
  const litColor = () => new THREE.Color(1.6 + blooms.rand() * 0.4, 1.05 + blooms.rand() * 0.25, 0.6 + blooms.rand() * 0.2);

  b.stone.add(new THREE.PlaneGeometry(16.2, 16.2).rotateX(-Math.PI / 2).translate(0, 0.001, 0), undefined, 1.2);

  for (const side of SIDES) {
    const M = Ry(side.rot);
    const half = side.full ? L.ARCADE_LEN / 2 : L.COURT;
    const mid = (L.COURT + L.INNER) / 2;
    const gallery = (L.COURT + L.ARCADE_T + L.INNER) / 2;
    const skip = (k: number) => !side.full && (k === 0 || k === L.OPENINGS);

    // floors: red-oxide veranda + three stone steps down to the courtyard
    b.red.box(2 * (side.full ? L.INNER : L.COURT), L.PLINTH, L.INNER - L.COURT, 0, L.PLINTH / 2, mid, M, 1.2);
    for (const [a, c, h] of L.STEP_RINGS) b.steps.box(2 * (side.full ? c : a), h, c - a, 0, h / 2, (a + c) / 2, M, 1);

    // arcades on both floors
    b.plaster.add(spandrel(-half, half, L.PLINTH + L.G_COL, L.FLOOR1 - 0.3).translate(0, 0, L.COURT), M);
    b.plaster.add(spandrel(-half, half, L.FLOOR1 + L.F_COL, L.ROOF).translate(0, 0, L.COURT), M);
    L.COLUMN_CENTERS.forEach((c, k) => {
      if (skip(k)) return;
      I.colG.push(at(M, c, L.PLINTH, L.COURT + L.ARCADE_T / 2));
      I.colF.push(at(M, c, L.FLOOR1, L.COURT + L.ARCADE_T / 2));
    });

    // cornices, parapet and coping
    const cor = side.full ? 9.65 : 8.8;
    const par = side.full ? 9.7 : 8.9;
    b.trim.box(2 * cor, 0.3, 0.8, 0, L.FLOOR1 - 0.15, L.COURT + 0.25, M);
    b.trim.box(2 * (side.full ? 9.7 : 8.7), 0.25, 0.9, 0, L.ROOF + 0.125, L.COURT + 0.2, M);
    b.plaster.box(2 * par, L.PARAPET - L.ROOF - 0.25, 0.25, 0, (L.ROOF + 0.25 + L.PARAPET) / 2, L.COURT + 0.05, M);
    b.trim.box(2 * (side.full ? 9.75 : 8.85), 0.08, 0.36, 0, L.PARAPET + 0.04, L.COURT + 0.05, M);

    // first-floor cast-iron railing
    b.rail.add(railingPlane(2 * half, 0.95).translate(0, L.FLOOR1 + 0.475, L.COURT + 0.25), M, 1, true);
    b.trim.box(2 * half, 0.07, 0.12, 0, L.FLOOR1 + 0.98, L.COURT + 0.25, M);

    // beamed ceilings over the veranda and the upstairs gallery
    for (const y of [L.FLOOR1 - 0.3, L.ROOF - 0.02]) {
      const w = 2 * (side.full ? L.INNER : L.COURT + L.ARCADE_T);
      b.ceiling.add(new THREE.PlaneGeometry(w, L.INNER - L.COURT - L.ARCADE_T).rotateX(Math.PI / 2).translate(0, y, gallery), M, 2);
    }

    // back walls (the south one is the street facade, built below)
    if (side.id !== "S") b.plaster.box(2 * (side.full ? L.OUTER : L.INNER), L.ROOF, L.OUTER - L.INNER, 0, L.ROOF / 2, (L.INNER + L.OUTER) / 2, M);

    for (const u of L.OPENING_CENTERS) {
      const centre = Math.abs(u) < 0.01;
      // panelled doors with stained-glass fanlights (not where the main entrance is)
      if (!(side.id === "S" && centre)) {
        I.frames.push(at(M, u, L.PLINTH + 1.47, L.INNER - 0.02));
        I.doors.push(at(M, u, L.PLINTH + 1.35, L.INNER - 0.05));
        I.fans.push(at(M, u, L.PLINTH + 2.95, L.INNER - 0.045, Math.PI));
      }
      // upstairs: louvred shutters, some open with the room lit behind
      I.frames.push(at(M, u, L.FLOOR1 + 1.3, L.INNER - 0.02, 0, [0.95, 0.83, 1]));
      if (litWindow()) {
        I.lit.push(at(M, u, L.FLOOR1 + 1.25, L.INNER - 0.05, Math.PI, [1.15, 2.15, 1]));
        I.litColors.push(litColor());
      } else I.shutters.push(at(M, u, L.FLOOR1 + 1.25, L.INNER - 0.05));
      // hanging lanterns (chandeliers take the centre bays of the entrance and stage)
      if (!(centre && side.full)) {
        I.lanterns.push(at(M, u, 3.95, gallery));
        I.chains.push(at(M, u, 4.55, gallery));
      }
    }

    // marigold swags over every arch, strings at every column, swags along the railing
    const wf = L.COURT - 0.1;
    for (const u of L.OPENING_CENTERS) {
      const a = pt(M, u - L.ARCH_R - L.PIER * 0.3, L.PLINTH + L.G_COL + 0.12, wf);
      const c = pt(M, u + L.ARCH_R + L.PIER * 0.3, L.PLINTH + L.G_COL + 0.12, wf);
      blooms.swag(a, c, 0.42, 0.05);
      if (rich) {
        blooms.swag(a, c, 0.62, 0.055, () => new THREE.Color("#ffc21a").multiplyScalar(0.85 + blooms.rand() * 0.3));
        blooms.swag(pt(M, u - L.ARCH_R - L.PIER / 2, L.FLOOR1 + 1.0, wf), pt(M, u + L.ARCH_R + L.PIER / 2, L.FLOOR1 + 1.0, wf), 0.28, 0.055);
      }
      // tuni lights tracing each arch
      for (const spring of rich ? [L.PLINTH + L.G_COL, L.FLOOR1 + L.F_COL] : [L.PLINTH + L.G_COL]) {
        const arc: THREE.Vector3[] = [];
        for (let i = 0; i <= 20; i++) {
          const ang = Math.PI - (i / 20) * Math.PI;
          arc.push(pt(M, u + Math.cos(ang) * (L.ARCH_R + 0.06), spring + Math.sin(ang) * (L.ARCH_R + 0.06), L.COURT - 0.04));
        }
        bulbs.line(arc, 0.16, GOLD, TWINKLE, u * 0.1 + side.rot);
      }
    }
    L.COLUMN_CENTERS.forEach((c, k) => {
      if (!skip(k)) blooms.strand(pt(M, c, L.PLINTH + L.G_COL + 0.1, wf - 0.02), 1.15, 0.05);
    });

    // light lines along the cornice and the parapet
    bulbs.line([pt(M, -cor, L.FLOOR1 + 0.02, L.COURT - 0.17), pt(M, cor, L.FLOOR1 + 0.02, L.COURT - 0.17)], 0.2, WARM_WHITE, CHASE, side.rot);
    bulbs.line([pt(M, -par, L.PARAPET + 0.1, L.COURT - 0.08), pt(M, par, L.PARAPET + 0.1, L.COURT - 0.08)], 0.2, GOLD, TWINKLE, side.rot + 1);

    // diyas along the middle step
    for (let u = -8.3; u <= 8.31; u += 0.7) {
      if (side.id === "S" && Math.abs(u) < 1.4) continue;
      diyas.push(pt(M, u, 2 * L.STEP, 8.55));
    }
  }

  /* ----------------------------- street facade ----------------------------- */
  const O = L.OUTER;
  b.plaster.add(facadeWall());
  b.trim.add(archBand(1.5, 1.8, L.PLINTH, 2.7, 0.1).translate(0, 0, O));
  for (const s of [-1, 1]) b.trim.box(O + 0.1 - 1.8, L.PLINTH, 0.1, s * ((O + 0.1 + 1.8) / 2), L.PLINTH / 2, O + 0.05);
  b.trim.box(2 * O + 0.3, 0.3, 0.36, 0, L.FLOOR1 - 0.15, O + 0.18);
  b.trim.box(2 * O + 0.4, 0.25, 0.46, 0, L.ROOF + 0.125, O + 0.2);
  b.trim.box(2 * O + 0.1, 0.08, 0.32, 0, L.PARAPET + 0.04, O - 0.12);
  for (const x of [-12.8, -9.6, -6.4, -3.2, 3.2, 6.4, 9.6, 12.8]) {
    b.trim.box(0.42, L.FLOOR1 - 0.3 - L.PLINTH, 0.1, x, (L.PLINTH + L.FLOOR1 - 0.3) / 2, O + 0.05);
    b.trim.box(0.36, L.ROOF - L.FLOOR1, 0.1, x, (L.FLOOR1 + L.ROOF) / 2, O + 0.05);
  }
  for (const x of [-11.2, -8, -4.8, 4.8, 8, 11.2]) {
    I.frames.push(at(null, x, 2.35, O + 0.03, 0, [0.95, 0.9, 1]));
    I.shutters.push(at(null, x, 2.35, O + 0.06, 0, [1.05, 1, 1]));
    b.trim.box(1.9, 0.16, 0.34, x, 3.72, O + 0.17);
  }
  // balcony with a cast-iron railing on carved brackets
  b.trim.box(20.4, 0.2, 0.9, 0, L.FLOOR1 + 0.05, O + 0.45);
  b.rail.add(railingPlane(20.2, 1.0).translate(0, L.FLOOR1 + 0.65, O + 0.86), undefined, 1, true);
  for (const s of [-1, 1]) b.rail.add(railingPlane(0.9, 1.0).rotateY(Math.PI / 2).translate(s * 10.1, L.FLOOR1 + 0.65, O + 0.45), undefined, 1, true);
  b.trim.box(20.3, 0.07, 0.1, 0, L.FLOOR1 + 1.17, O + 0.86);
  for (const x of [-9.9, -8, -4.8, -1.6, 1.6, 4.8, 8, 9.9]) b.trim.box(0.14, 0.45, 0.7, x, L.FLOOR1 - 0.28, O + 0.35);
  for (const x of [-12.2, -9.6, -6.4, -3.2, 0, 3.2, 6.4, 9.6, 12.2]) {
    I.frames.push(at(null, x, L.FLOOR1 + 1.35, O + 0.03, 0, [0.95, 0.85, 1]));
    if (litWindow()) {
      I.lit.push(at(null, x, L.FLOOR1 + 1.28, O + 0.06, 0, [1.15, 2.15, 1]));
      I.litColors.push(litColor());
    } else I.shutters.push(at(null, x, L.FLOOR1 + 1.28, O + 0.06));
  }
  // pediment above the entrance
  b.plaster.box(5.4, 0.9, 0.3, 0, L.PARAPET + 0.45, O - 0.2);
  const ped = new THREE.Shape();
  ped.moveTo(1.3, 0);
  ped.absarc(0, 0, 1.3, 0, Math.PI, false);
  ped.lineTo(1.3, 0);
  b.plaster.add(new THREE.ExtrudeGeometry(ped, { depth: 0.3, bevelEnabled: false, curveSegments: 24 }).translate(0, L.PARAPET + 0.9, O - 0.35));
  b.trim.add(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 32).rotateX(Math.PI / 2).translate(0, L.PARAPET + 1.2, O));
  b.trim.box(5.6, 0.08, 0.4, 0, L.PARAPET + 0.94, O - 0.2);
  // steps from the street, carpet, alpana landing
  b.steps.box(4.4, 0.3, 0.35, 0, 0.15, O + 0.175, undefined, 1);
  b.steps.box(5.0, 0.15, 0.35, 0, 0.075, O + 0.525, undefined, 1);
  b.carpet.add(new THREE.PlaneGeometry(1.6, L.INNER - 12.15).rotateX(-Math.PI / 2).translate(0, L.PLINTH + 0.006, (12.15 + L.INNER) / 2), undefined, 1);
  b.carpet.add(new THREE.PlaneGeometry(1.6, 10.1 - L.COURT).rotateX(-Math.PI / 2).translate(0, L.PLINTH + 0.006, (L.COURT + 10.1) / 2), undefined, 1);

  // garlands on the facade: over the door and along the balcony
  blooms.swag(V(-1.9, 4.6, O + 0.14), V(1.9, 4.6, O + 0.14), 0.45, 0.05);
  blooms.swag(V(-1.9, 4.6, O + 0.16), V(1.9, 4.6, O + 0.16), 0.7, 0.055, () => new THREE.Color("#ffc21a"));
  for (let x = -10.1; x < 10; x += 2.02) blooms.swag(V(x, L.FLOOR1 + 1.2, O + 0.92), V(x + 2.02, L.FLOOR1 + 1.2, O + 0.92), 0.32, 0.055);

  // the facade curtain of tuni lights
  const zf = O + 0.42;
  let strand = 0;
  for (let x = -13.35; x <= 13.36; x += 0.26, strand++) {
    const festive = strand % 7 === 3;
    const col = festive ? (i: number) => FESTIVE[i % FESTIVE.length] : GOLD;
    const mode = festive ? CHASE : TWINKLE;
    const bottom = Math.abs(x) < 1.95 ? 4.9 : 0.9;
    if (Math.abs(x) < 10.25) {
      bulbs.line([V(x, L.PARAPET + 0.08, zf), V(x, L.FLOOR1 + 1.3, zf)], 0.24, col, mode, x);
      bulbs.line([V(x, L.FLOOR1 - 0.4, zf), V(x, bottom, zf)], 0.24, col, mode, x + 0.5);
    } else bulbs.line([V(x, L.PARAPET + 0.08, zf), V(x, bottom, zf)], 0.24, col, mode, x);
  }
  for (let x = -10.1; x <= 10.11; x += 0.26) {
    const bottom = Math.abs(x) < 1.95 ? L.FLOOR1 - 0.35 : L.FLOOR1 - 1.1;
    bulbs.line([V(x, L.FLOOR1 + 1.16, O + 0.97), V(x, bottom, O + 0.97)], 0.22, WARM_WHITE, TWINKLE, x * 3);
  }

  // a canopy of lights criss-crossing above the courtyard
  for (const x of [-7.5, -5, -2.5, 2.5, 5, 7.5]) bulbs.catenary(V(x, L.FLOOR1 + 1.0, 8.95), V(x, L.FLOOR1 + 1.0, -8.95), 1.1, 0.17, GOLD, TWINKLE);
  for (const z of [-7.5, -5, -2.5, 2.5, 5, 7.5]) bulbs.catenary(V(-8.95, L.FLOOR1 + 1.0, z), V(8.95, L.FLOOR1 + 1.0, z), 1.1, 0.17, WARM_WHITE, TWINKLE);

  return {
    geo: {
      plaster: b.plaster.build(),
      trim: b.trim.build(),
      red: b.red.build(),
      steps: b.steps.build(),
      stone: b.stone.build(),
      ceiling: b.ceiling.build(),
      rail: b.rail.build(),
      carpet: b.carpet.build(),
    },
    I,
    blooms,
    bulbs,
    diyas,
  };
}

function Chandelier({ position }: { position: [number, number, number] }) {
  const m = materials();
  const t = tourMaterials();
  const parts = useMemo(() => {
    const crystals: THREE.Matrix4[] = [];
    const rings: [number, number, number][] = [
      [0.5, -0.1, 18],
      [0.34, 0.12, 12],
      [0.2, 0.3, 8],
    ];
    for (const [r, y, n] of rings)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        crystals.push(at(null, Math.cos(a) * r, y - 0.12, Math.sin(a) * r, 0, [1, 1.6, 1]));
      }
    for (let i = 0; i < 5; i++) crystals.push(at(null, 0, -0.35 - i * 0.09, 0, 0, [1.2, 1.8, 1.2]));
    const candles = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return at(null, Math.cos(a) * 0.5, 0.02, Math.sin(a) * 0.5);
    });
    return { crystals, candles, crystalGeo: new THREE.OctahedronGeometry(0.035, 0), candleGeo: new THREE.SphereGeometry(0.035, 10, 8) };
  }, []);
  return (
    <group position={position}>
      <mesh material={m.brass} position-y={0.55}>
        <cylinderGeometry args={[0.012, 0.012, 1.0, 6]} />
      </mesh>
      {[
        [0.5, 0],
        [0.34, 0.22],
        [0.2, 0.4],
      ].map(([r, y]) => (
        <mesh key={r} material={m.gold} position-y={y} rotation-x={Math.PI / 2}>
          <torusGeometry args={[r, 0.014, 8, 48]} />
        </mesh>
      ))}
      <mesh material={m.gold} position-y={-0.05}>
        <sphereGeometry args={[0.09, 16, 12]} />
      </mesh>
      <Inst geometry={parts.crystalGeo} material={t.crystal} matrices={parts.crystals} />
      <Inst geometry={parts.candleGeo} material={t.warm} matrices={parts.candles} />
    </group>
  );
}

export const CHANDELIERS: [number, number, number][] = [
  [0, 3.9, -11.3],
  [0, 3.9, 11.3],
  [11.35, 3.9, -3.6],
  [11.35, 3.9, 3.6],
];

export function House({ tier }: { tier: Tier }) {
  const m = materials();
  const t = tourMaterials();
  const d = useMemo(() => build(tier), [tier]);
  const g = useMemo(
    () => ({
      colG: columnGeo(L.G_COL, 0.2),
      colF: columnGeo(L.F_COL, 0.17),
      door: new THREE.BoxGeometry(1.3, 2.7, 0.06),
      frame: new THREE.BoxGeometry(1.55, 2.95, 0.04),
      fan: new THREE.CircleGeometry(0.68, 24, 0, Math.PI),
      shutter: new THREE.BoxGeometry(1.15, 2.15, 0.06),
      lit: new THREE.PlaneGeometry(1, 1),
      lantern: lathe(
        smoothProfile(
          [
            [0.02, -0.2],
            [0.1, -0.14],
            [0.13, 0.0],
            [0.1, 0.13],
            [0.03, 0.2],
          ],
          16,
        ),
        12,
      ),
      chain: new THREE.CylinderGeometry(0.008, 0.008, 1.0, 5),
      diya: diya(),
    }),
    [],
  );
  const flames = useMemo(() => d.diyas.map((p) => p.clone().setY(p.y + 0.035)), [d.diyas]);
  const diyaMats = useMemo(() => d.diyas.map((p) => at(null, p.x, p.y, p.z)), [d.diyas]);
  const alpana = useMemo(() => new THREE.MeshStandardMaterial({ map: alpanaTexture(), roughness: 0.8 }), []);
  const shadows = tier === "high";

  return (
    <group>
      <mesh geometry={d.geo.plaster} material={t.plaster} castShadow={shadows} receiveShadow />
      <mesh geometry={d.geo.trim} material={t.trim} castShadow={shadows} receiveShadow />
      <mesh geometry={d.geo.red} material={t.redOxide} receiveShadow />
      <mesh geometry={d.geo.steps} material={t.step} receiveShadow />
      <mesh geometry={d.geo.stone} material={t.stone} receiveShadow />
      <mesh geometry={d.geo.ceiling} material={t.ceiling} />
      <mesh geometry={d.geo.rail} material={t.railing} />
      <mesh geometry={d.geo.carpet} material={t.carpet} receiveShadow />

      <Inst geometry={g.colG} material={t.trim} matrices={d.I.colG} castShadow={shadows} receiveShadow />
      <Inst geometry={g.colF} material={t.trim} matrices={d.I.colF} />
      <Inst geometry={g.frame} material={t.trim} matrices={d.I.frames} />
      <Inst geometry={g.door} material={t.door} matrices={d.I.doors} />
      <Inst geometry={g.fan} material={t.glass} matrices={d.I.fans} />
      <Inst geometry={g.shutter} material={t.shutter} matrices={d.I.shutters} />
      <Inst geometry={g.lit} material={t.windowLit} matrices={d.I.lit} colors={d.I.litColors} />
      <Inst geometry={g.lantern} material={t.warm} matrices={d.I.lanterns} />
      <Inst geometry={g.chain} material={m.brass} matrices={d.I.chains} />

      {/* the main door, swung open */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.5, L.PLINTH + 1.65, L.INNER - 0.73]} material={t.door}>
          <boxGeometry args={[0.07, 3.3, 1.45]} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, L.PLINTH + 0.008, 11.1]} material={alpana} receiveShadow>
        <circleGeometry args={[0.95, 48]} />
      </mesh>

      {CHANDELIERS.map((p) => (
        <Chandelier key={p.join()} position={p} />
      ))}

      <BloomMesh blooms={d.blooms} />
      <Inst geometry={g.diya} material={m.clay} matrices={diyaMats} />
      <Flames positions={flames} size={0.03} glowSize={0.16} />
      <Bulbs builder={d.bulbs} size={0.1} />
    </group>
  );
}
