"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { materials } from "./materials";
import { marigoldGeometry, swag } from "./geometry";
import { rng } from "./textures";
import { LAYOUT } from "../hero/shots";
import type { Tier } from "@/lib/device";

const TOP = LAYOUT.platformTop;
const BEAM_Y = TOP + 2.78;
const HALF = 1.55;

type Inst = { p: THREE.Vector3; s: number; c: THREE.Color; r?: THREE.Euler; sv?: THREE.Vector3 };

const MARIGOLD = ["#ff7a00", "#ff8f0a", "#ffb000", "#ffc526", "#f06800"];

function Instanced({ items, geometry, material, castShadow = false }: { items: Inst[]; geometry: THREE.BufferGeometry; material: THREE.Material; castShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const d = new THREE.Object3D();
    items.forEach((it, i) => {
      d.position.copy(it.p);
      if (it.r) d.rotation.copy(it.r);
      else d.rotation.set(0, 0, 0);
      if (it.sv) d.scale.copy(it.sv).multiplyScalar(it.s);
      else d.scale.setScalar(it.s);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
      im.setColorAt(i, it.c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} />;
}

/** Marigold swags, hanging strands, pillar spirals, the rajnigandha curtain and scattered petals. */
export function Flowers({ tier }: { tier: Tier }) {
  const m = materials();
  const density = tier === "high" ? 1 : 0.6;

  const marigoldGeo = useMemo(() => marigoldGeometry(0.03), []);
  const budGeo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.008, 0.022, 2, 6);
    return g;
  }, []);
  const petalGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);

  const marigolds = useMemo(() => {
    const r = rng(9);
    const out: Inst[] = [];
    const col = () => new THREE.Color(MARIGOLD[Math.floor(r() * MARIGOLD.length)]).multiplyScalar(0.85 + r() * 0.3);
    const step = 0.05 / density;

    const add = (p: THREE.Vector3, s = 1, c = col()) => out.push({ p, s: s * (0.9 + r() * 0.25), c, r: new THREE.Euler(r() * 6, r() * 6, r() * 6) });

    // Swags between pillar tops, two layers on every side
    const corners = [
      new THREE.Vector3(-HALF, BEAM_Y - 0.12, HALF),
      new THREE.Vector3(HALF, BEAM_Y - 0.12, HALF),
      new THREE.Vector3(HALF, BEAM_Y - 0.12, -HALF),
      new THREE.Vector3(-HALF, BEAM_Y - 0.12, -HALF),
    ];
    for (let s = 0; s < 4; s++) {
      const a = corners[s];
      const b = corners[(s + 1) % 4];
      const len = a.distanceTo(b);
      [0.32, 0.55].forEach((sag, layer) => {
        const n = Math.floor((len + sag) / step);
        const layerColor = layer === 0 ? "#ff7a00" : "#ffc21a";
        swag(a, b, sag, n).forEach((p) => add(p, 1, new THREE.Color(layerColor).multiplyScalar(0.8 + r() * 0.35)));
      });
      // Hanging strands from the beam with a rose tassel
      const strands = Math.floor(9 * density) + 1;
      for (let k = 1; k < strands; k++) {
        const t = k / strands;
        const base = new THREE.Vector3().lerpVectors(a, b, t);
        base.y = BEAM_Y - 0.14;
        const L = 0.45 + ((k * 7) % 5) * 0.12;
        for (let y = 0; y < L; y += step) add(new THREE.Vector3(base.x, base.y - y, base.z), 0.9);
        add(new THREE.Vector3(base.x, base.y - L - 0.03, base.z), 1.2, new THREE.Color("#a0101c"));
      }
    }

    // Helical wraps around each pillar
    if (tier === "high") {
      [
        [-HALF, -HALF],
        [HALF, -HALF],
        [-HALF, HALF],
        [HALF, HALF],
      ].forEach(([x, z], k) => {
        const turns = 6;
        const h0 = TOP + 0.4;
        const h1 = TOP + 2.6;
        const count = Math.floor(160 * density);
        for (let i = 0; i < count; i++) {
          const t = i / count;
          const a = t * turns * Math.PI * 2 + k;
          add(new THREE.Vector3(x + Math.cos(a) * 0.1, h0 + (h1 - h0) * t, z + Math.sin(a) * 0.1), 0.85);
        }
      });
    }

    // Central floral chandelier under the canopy
    const arms = Math.floor(14 * density);
    for (let k = 0; k < arms; k++) {
      const a = (k / arms) * Math.PI * 2;
      const L = 0.9;
      for (let t = 0; t < L; t += step) {
        const rad = 0.08 + t * 0.35;
        add(new THREE.Vector3(Math.cos(a) * rad, TOP + 2.95 - t * 0.9, Math.sin(a) * rad + 0.05), 0.85);
      }
    }
    return out;
  }, [density, tier]);

  const buds = useMemo(() => {
    // Rajnigandha (tuberose) curtain between the rear pillars — the luminous backdrop behind the couple.
    const r = rng(17);
    const out: Inst[] = [];
    const spacing = tier === "high" ? 0.075 : 0.12;
    const vStep = tier === "high" ? 0.034 : 0.05;
    for (let x = -1.42; x <= 1.42; x += spacing) {
      const z = -1.45 + Math.sin(x * 3) * 0.03;
      const len = 2.35 - Math.cos(x * 1.1) * 0.25;
      for (let y = 0; y < len; y += vStep) {
        const red = r() < 0.05;
        out.push({
          p: new THREE.Vector3(x + (r() - 0.5) * 0.01, BEAM_Y - 0.15 - y, z + (r() - 0.5) * 0.02),
          s: red ? 1.6 : 1,
          c: red ? new THREE.Color("#9e0f1b") : new THREE.Color("#fbf6e9").multiplyScalar(0.9 + r() * 0.15),
          r: new THREE.Euler((r() - 0.5) * 0.6, r() * 6, (r() - 0.5) * 0.6),
        });
      }
    }
    return out;
  }, [tier]);

  const petals = useMemo(() => {
    const r = rng(23);
    const out: Inst[] = [];
    const n = Math.floor(900 * density);
    const cols = ["#8f0b16", "#b3121f", "#e0507a", "#ff8a0a", "#f6efe0"];
    for (let i = 0; i < n; i++) {
      let x: number, z: number, y: number;
      if (i % 3 === 0) {
        // along the aisle
        x = (r() - 0.5) * 1.6;
        z = 2.3 + r() * 6;
        y = 0.008;
      } else {
        // around the platform edge & the fire
        const a = r() * Math.PI * 2;
        const rad = 0.55 + r() * 1.15;
        x = Math.cos(a) * rad;
        z = Math.sin(a) * rad * 0.9 + 0.3;
        if (Math.abs(x) > 1.75 || Math.abs(z) > 1.75) continue;
        y = TOP + 0.006;
      }
      out.push({
        p: new THREE.Vector3(x, y, z),
        s: 0.018 + r() * 0.01,
        sv: new THREE.Vector3(1, 0.18, 0.75),
        c: new THREE.Color(cols[Math.floor(r() * cols.length)]),
        r: new THREE.Euler(0, r() * 6, (r() - 0.5) * 0.3),
      });
    }
    return out;
  }, [density]);

  return (
    <group>
      <Instanced items={marigolds} geometry={marigoldGeo} material={m.flower} castShadow={tier === "high"} />
      <Instanced items={buds} geometry={budGeo} material={m.flower} />
      <Instanced items={petals} geometry={petalGeo} material={m.petal} />
    </group>
  );
}
