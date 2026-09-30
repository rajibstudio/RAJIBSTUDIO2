"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { materials } from "../three/materials";
import { sareeTexture, solaTexture } from "../three/textures";
import { lathe, scallopedCone, smoothProfile } from "../three/geometry";
import { Flames } from "../three/Flames";
import { MirrorlessCamera } from "../three/MirrorlessCamera";
import { tourMaterials } from "./assets";
import { Batch, Blooms, BloomMesh, Inst, JASMINE, ROSE, at } from "./kit";
import { BulbBuilder, Bulbs, TWINKLE, WARM_WHITE } from "./Bulbs";
import * as L from "./layout";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ================================ reception stage ================================ */

export function Stage() {
  const m = materials();
  const t = tourMaterials();
  const top = L.PLINTH + 0.3;
  const d = useMemo(() => {
    const drape = new THREE.PlaneGeometry(6.8, 4.2, 140, 1);
    const p = drape.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9) * 0.05 + Math.sin(p.getX(i) * 2.3) * 0.06);
    drape.computeVertexNormals();
    const back = new THREE.Shape();
    back.moveTo(-1.0, 0);
    back.lineTo(1.0, 0);
    back.lineTo(1.0, 0.7);
    back.bezierCurveTo(0.92, 1.2, 0.35, 1.02, 0, 1.3);
    back.bezierCurveTo(-0.35, 1.02, -0.92, 1.2, -1.0, 0.7);
    back.lineTo(-1.0, 0);
    const backGeo = new THREE.ExtrudeGeometry(back, { depth: 0.16, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3, curveSegments: 24 });
    // floral ring behind the throne
    const b = new Blooms(33);
    const bulbs = new BulbBuilder();
    for (let i = 0; i < 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      for (const [r, col] of [
        [1.5, i % 4 === 0 ? ROSE : JASMINE],
        [1.42, ROSE],
        [1.58, JASMINE],
      ] as const)
        b.add(V(Math.cos(a) * r, top + 2.75 + Math.sin(a) * r, -12.95), col, 1.1);
    }
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      bulbs.add(V(Math.cos(a) * 1.32, top + 2.75 + Math.sin(a) * 1.32, -12.92), WARM_WHITE, i * 0.05, TWINKLE);
    }
    // fairy-light curtain in front of the drapes
    for (let x = -3.3; x <= 3.31; x += 0.16) bulbs.line([V(x, top + 4.1, -12.85), V(x, top + 0.25, -12.85)], 0.14, WARM_WHITE, TWINKLE, x * 2);
    // flower balls on gold stands
    for (const s of [-1, 1])
      for (let i = 0; i < 140; i++) {
        const y = 1 - (i / 139) * 2;
        const r = Math.sqrt(1 - y * y);
        const a = i * 2.39996;
        b.add(V(s * 2.5 + Math.cos(a) * r * 0.32, top + 1.62 + y * 0.32, -12.2 + Math.sin(a) * r * 0.32), i % 3 ? ROSE : JASMINE, 1.1);
      }
    // swag along the stage front
    b.swag(V(-3.6, top + 0.02, -10.88), V(3.6, top + 0.02, -10.88), 0.0, 0.05);
    const candles = [-3.2, -2.9, 2.9, 3.2].map((x, i) => ({ p: V(x, top, -11.2 - (i % 2) * 0.25), h: 0.3 + (i % 2) * 0.18 }));
    return { drape, backGeo, b, bulbs, candles };
  }, [top]);
  return (
    <group>
      <mesh position={[0, (L.PLINTH + top) / 2, (L.STAGE.z0 + L.STAGE.z1) / 2]} material={t.carpet} receiveShadow>
        <boxGeometry args={[L.STAGE.x1 - L.STAGE.x0, top - L.PLINTH, L.STAGE.z1 - L.STAGE.z0]} />
      </mesh>
      <mesh position={[0, top - 0.01, L.STAGE.z1 - 0.01]} material={m.gold}>
        <boxGeometry args={[7.24, 0.04, 0.04]} />
      </mesh>
      <mesh position={[0, L.PLINTH + 0.075, -10.72]} material={t.carpet}>
        <boxGeometry args={[3.2, 0.15, 0.35]} />
      </mesh>
      <mesh geometry={d.drape} material={t.silk} position={[0, top + 2.1, -13.1]} />
      <mesh position={[0, top + 4.2, -13.0]} material={m.gold}>
        <boxGeometry args={[7.0, 0.12, 0.12]} />
      </mesh>
      {/* the throne */}
      <group position={[0, top, -12.25]}>
        <RoundedBox args={[1.9, 0.45, 0.78]} radius={0.08} smoothness={3} position-y={0.225} material={t.velvet} castShadow />
        <mesh geometry={d.backGeo} material={t.velvet} position={[0, 0.42, -0.42]} castShadow />
        <mesh geometry={d.backGeo} material={m.gold} position={[0, 0.39, -0.47]} scale={[1.07, 1.06, 0.5]} />
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.2, 0.55, 0.78]} radius={0.06} smoothness={3} position={[s * 1.02, 0.5, 0]} material={m.gold} />
        ))}
        {[-0.45, 0.45].map((x) => (
          <RoundedBox key={x} args={[0.5, 0.36, 0.14]} radius={0.06} smoothness={3} position={[x, 0.66, -0.28]} rotation-x={-0.2} material={m.shawl} />
        ))}
      </group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.5, top + 0.65, -12.2]} material={m.gold}>
          <cylinderGeometry args={[0.03, 0.12, 1.3, 16]} />
        </mesh>
      ))}
      {d.candles.map(({ p, h }, i) => (
        <mesh key={i} position={[p.x, p.y + h / 2, p.z]} material={m.chandan}>
          <cylinderGeometry args={[0.05, 0.05, h, 16]} />
        </mesh>
      ))}
      <Flames positions={d.candles.map(({ p, h }) => V(p.x, p.y + h + 0.012, p.z))} size={0.035} glowSize={0.22} />
      <BloomMesh blooms={d.b} />
      <Bulbs builder={d.bulbs} size={0.07} />
    </group>
  );
}

/* ==================================== feast ==================================== */

export function Feast() {
  const t = tourMaterials();
  const d = useMemo(() => {
    const plates: THREE.Matrix4[] = [];
    const items: Record<string, THREE.Matrix4[]> = { rice: [], luchi: [], dal: [], curry: [], rosogolla: [], pantua: [], lime: [], bhaar: [] };
    const y = L.TABLE.top + 0.004;
    for (const s of L.FEAST_SEATS) {
      const dir = s.x < L.TABLE.x ? 1 : -1; // towards the table
      const px = L.TABLE.x - dir * 0.21;
      const q = (dx: number, dz: number) => [px + dir * dx, s.z + dz] as const;
      plates.push(at(null, px, y, s.z, 0, [0.3, 1, 0.44]));
      const [rx, rz] = q(0, -0.05);
      items.rice.push(at(null, rx, y, rz, 0, [1, 0.7, 1]));
      for (const k of [0, 1]) {
        const [lx, lz] = q(0.07 - k * 0.03, 0.1 + k * 0.03);
        items.luchi.push(at(null, lx, y + 0.006 + k * 0.012, lz));
      }
      const [dx, dz] = q(-0.08, 0.02);
      items.dal.push(at(null, dx, y + 0.003, dz));
      const [cx, cz] = q(0.08, -0.12);
      items.curry.push(at(null, cx, y + 0.012, cz, 0.4, [1.4, 0.55, 0.8]));
      const [mx, mz] = q(-0.07, -0.14);
      items.rosogolla.push(at(null, mx, y + 0.022, mz));
      items.pantua.push(at(null, mx + 0.05 * dir, y + 0.022, mz + 0.03));
      const [ix, iz] = q(0.1, 0.16);
      items.lime.push(at(null, ix, y + 0.01, iz, 0.6, [1.4, 0.7, 0.8]));
      items.bhaar.push(at(null, px + dir * 0.22, y, s.z + 0.2));
    }
    const bhaar = lathe(
      [
        [0.0, 0],
        [0.03, 0],
        [0.036, 0.05],
        [0.042, 0.09],
        [0.038, 0.092],
      ],
      14,
    );
    const geo = {
      plate: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      rice: new THREE.SphereGeometry(0.06, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      luchi: new THREE.CylinderGeometry(0.055, 0.055, 0.012, 18),
      dal: new THREE.CylinderGeometry(0.045, 0.045, 0.006, 16),
      curry: new THREE.SphereGeometry(0.035, 12, 8),
      sweet: new THREE.SphereGeometry(0.022, 10, 8),
      lime: new THREE.SphereGeometry(0.02, 10, 8),
    };
    return { plates, items, bhaar, geo };
  }, []);
  const len = L.TABLE.z1 - L.TABLE.z0;
  return (
    <group>
      <mesh position={[L.TABLE.x, L.PLINTH + 0.37, 0]} material={t.cloth} castShadow receiveShadow>
        <boxGeometry args={[L.TABLE.w, 0.74, len]} />
      </mesh>
      <mesh position={[L.TABLE.x, L.TABLE.top - 0.01, 0]} material={t.cloth} receiveShadow>
        <boxGeometry args={[L.TABLE.w + 0.06, 0.02, len + 0.06]} />
      </mesh>
      <Inst geometry={d.geo.plate} material={t.leafPlate} matrices={d.plates} receiveShadow />
      <Inst geometry={d.geo.rice} material={t.rice} matrices={d.items.rice} />
      <Inst geometry={d.geo.luchi} material={t.luchi} matrices={d.items.luchi} />
      <Inst geometry={d.geo.dal} material={t.dal} matrices={d.items.dal} />
      <Inst geometry={d.geo.curry} material={t.curry} matrices={d.items.curry} />
      <Inst geometry={d.geo.sweet} material={t.rosogolla} matrices={d.items.rosogolla} />
      <Inst geometry={d.geo.sweet} material={t.pantua} matrices={d.items.pantua} />
      <Inst geometry={d.geo.lime} material={t.lime} matrices={d.items.lime} />
      <Inst geometry={d.bhaar} material={t.terracotta} matrices={d.items.bhaar} />
    </group>
  );
}

/* ============================ tattwa & photo corner ============================ */

export function Tattwa() {
  const m = materials();
  const t = tourMaterials();
  const X = -12.6;
  const top = L.PLINTH + 0.62;
  const d = useMemo(() => {
    const cloth = sareeTexture().clone();
    cloth.repeat.set(3, 1);
    cloth.needsUpdate = true;
    const sola = solaTexture();
    const pot = lathe(
      smoothProfile(
        [
          [0.0, 0],
          [0.1, 0.01],
          [0.16, 0.09],
          [0.14, 0.18],
          [0.08, 0.23],
          [0.09, 0.25],
        ],
        24,
      ),
      20,
    );
    const pyramid: THREE.Matrix4[] = [];
    [
      [3, 0],
      [2, 0.05],
      [1, 0.1],
    ].forEach(([n, y]) => {
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) pyramid.push(at(null, (i - (n - 1) / 2) * 0.052, y, (j - (n - 1) / 2) * 0.052));
    });
    const bangles: THREE.Matrix4[] = [];
    for (let i = 0; i < 8; i++) bangles.push(new THREE.Matrix4().compose(V(0, 0.02 + i * 0.012, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)));
    const panel = scallopedCone(0.7, 0.7, 0.02, 14, 0.12);
    const photoFrame = new THREE.Shape();
    photoFrame.moveTo(-0.85, -0.65);
    photoFrame.lineTo(0.85, -0.65);
    photoFrame.lineTo(0.85, 0.65);
    photoFrame.lineTo(-0.85, 0.65);
    photoFrame.lineTo(-0.85, -0.65);
    const hole = new THREE.Path();
    hole.moveTo(-0.68, -0.48);
    hole.lineTo(0.68, -0.48);
    hole.lineTo(0.68, 0.48);
    hole.lineTo(-0.68, 0.48);
    hole.lineTo(-0.68, -0.48);
    photoFrame.holes.push(hole);
    const frameGeo = new THREE.ExtrudeGeometry(photoFrame, { depth: 0.06, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
    const geo = {
      sweet: new THREE.SphereGeometry(0.026, 12, 8),
      bangle: new THREE.TorusGeometry(0.045, 0.008, 6, 24),
      topor: scallopedCone(0.07, 0.01, 0.3, 12, 0.03),
      mukut: scallopedCone(0.08, 0.1, 0.1, 11, 0.04),
    };
    const shankha = bangles.filter((_, i) => i % 2 === 1);
    const pola = bangles.filter((_, i) => i % 2 === 0);
    return { cloth, sola, pot, pyramid, shankha, pola, panel, frameGeo, geo };
  }, []);
  const clothMat = useMemo(() => new THREE.MeshStandardMaterial({ map: d.cloth, roughness: 0.6 }), [d.cloth]);
  const solaMat = useMemo(() => new THREE.MeshStandardMaterial({ map: d.sola, roughness: 0.7, side: THREE.DoubleSide }), [d.sola]);
  const trays = [-2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7];

  return (
    <group>
      {/* gift table */}
      <mesh position={[X, (L.PLINTH + top) / 2, 0]} material={clothMat} castShadow receiveShadow>
        <boxGeometry args={[0.95, top - L.PLINTH, 7.1]} />
      </mesh>
      {trays.map((z) => (
        <mesh key={z} position={[X, top + 0.015, z]} material={m.gold}>
          <cylinderGeometry args={[0.26, 0.24, 0.03, 32]} />
        </mesh>
      ))}
      {/* 1 — a fish dressed as a bride */}
      <group position={[X, top + 0.1, trays[0]]} rotation-y={0.3}>
        <mesh material={t.fish} scale={[0.34, 0.075, 0.11]}>
          <sphereGeometry args={[1, 24, 14]} />
        </mesh>
        <mesh material={t.fish} position={[0.36, 0, 0]} rotation-z={Math.PI / 2} scale={[1, 1, 0.25]}>
          <coneGeometry args={[0.1, 0.14, 12]} />
        </mesh>
        <mesh material={m.saree} position={[-0.02, 0.02, 0]} scale={[0.2, 0.09, 0.125]}>
          <sphereGeometry args={[1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
        </mesh>
        <mesh material={m.gold} position={[-0.3, 0.02, 0.05]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.025, 0.004, 6, 20]} />
        </mesh>
        <mesh material={m.sindoor} position={[-0.26, 0.05, 0]}>
          <sphereGeometry args={[0.012, 8, 6]} />
        </mesh>
      </group>
      {/* 2 — rosogolla pyramid */}
      <group position={[X, top + 0.055, trays[1]]}>
        <Inst geometry={d.geo.sweet} material={t.rosogolla} matrices={d.pyramid} />
      </group>
      {/* 3 — folded saree with a gold ribbon */}
      <group position={[X, top + 0.06, trays[2]]}>
        <mesh material={m.saree}>
          <boxGeometry args={[0.3, 0.07, 0.24]} />
        </mesh>
        <mesh material={m.gold} position-y={0.001}>
          <boxGeometry args={[0.31, 0.072, 0.03]} />
        </mesh>
        <mesh material={m.gold} position-y={0.04}>
          <torusGeometry args={[0.03, 0.01, 6, 16]} />
        </mesh>
      </group>
      {/* 4 — shola topor and mukut */}
      <group position={[X, top + 0.03, trays[3]]}>
        <mesh material={solaMat} position={[0, 0.16, -0.08]} geometry={d.geo.topor} />
        <mesh material={solaMat} position={[0, 0.06, 0.1]} geometry={d.geo.mukut} />
      </group>
      {/* 5 — paan (betel) cone */}
      <mesh material={t.betel} position={[X, top + 0.2, trays[4]]}>
        <coneGeometry args={[0.13, 0.34, 16]} />
      </mesh>
      {/* 6 — mishti hari (sweet pot) */}
      <group position={[X, top + 0.03, trays[5]]}>
        <mesh geometry={d.pot} material={t.terracotta} />
        <mesh material={m.chandan} position-y={0.12} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.152, 0.012, 6, 32]} />
        </mesh>
      </group>
      {/* 7 — shankha-pola and a hand mirror */}
      <group position={[X, top + 0.03, trays[6]]}>
        <Inst geometry={d.geo.bangle} material={m.pola} matrices={d.pola} />
        <Inst geometry={d.geo.bangle} material={m.shankha} matrices={d.shankha} />
        <mesh material={m.gold} position={[0.1, 0.1, 0.08]} rotation-y={-Math.PI / 2}>
          <torusGeometry args={[0.07, 0.012, 8, 28]} />
        </mesh>
      </group>
      {/* shola art on the wall above */}
      <mesh geometry={d.panel} material={solaMat} position={[L.INNER * -1 + 0.03, 2.5, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]} scale={[1.6, 1, 1.6]} />

      {/* photo corner */}
      <group>
        <mesh position={[-13.12, 2.0, -6.5]} rotation-y={Math.PI / 2} material={t.purpleVelvet}>
          <planeGeometry args={[2.4, 3.1]} />
        </mesh>
        <mesh position={[-13.08, 3.95, -6.5]} rotation-y={Math.PI / 2} material={t.sign}>
          <planeGeometry args={[1.8, 0.9]} />
        </mesh>
        <mesh geometry={d.frameGeo} material={m.gold} position={[-12.0, 1.55, -6.5]} rotation-y={Math.PI / 2} castShadow />
        <mesh position={[-12.0, 0.9, -6.5]} material={m.gold}>
          <cylinderGeometry args={[0.02, 0.2, 0.9, 12]} />
        </mesh>
        <Tripod position={[-10.2, L.PLINTH, -6.5]} />
        <group position={[-10.6, L.PLINTH, -8.3]} rotation-y={Math.atan2(-12 - -10.6, -6.5 - -8.3)}>
          <mesh position-y={0.9} material={t.concrete}>
            <cylinderGeometry args={[0.015, 0.02, 1.8, 8]} />
          </mesh>
          <mesh position-y={1.85} material={t.ringLight}>
            <torusGeometry args={[0.24, 0.025, 8, 40]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Tripod({ position }: { position: [number, number, number] }) {
  const m = materials();
  return (
    <group position={position} rotation-y={-Math.PI / 2}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.22, 0.62, Math.sin(a) * 0.22]} rotation={[Math.sin(a) * 0.34, 0, -Math.cos(a) * 0.34]} material={m.camMetal}>
            <cylinderGeometry args={[0.012, 0.012, 1.3, 6]} />
          </mesh>
        );
      })}
      <group position-y={1.3}>
        <Suspense fallback={null}>
          <MirrorlessCamera />
        </Suspense>
      </group>
    </group>
  );
}

/* ================================= people & chairs ================================= */

function chairGeo() {
  return new Batch()
    .box(0.48, 0.46, 0.48, 0, 0.23, 0, undefined, 1)
    .box(0.5, 0.06, 0.5, 0, 0.49, 0, undefined, 1)
    .box(0.48, 0.62, 0.07, 0, 0.83, -0.21, undefined, 1)
    .build();
}

function bodyGeo(kind: "woman" | "man" | "sit") {
  if (kind === "sit") {
    const torso = lathe(
      smoothProfile([
        [0.17, 0.46],
        [0.18, 0.62],
        [0.16, 0.85],
        [0.18, 1.08],
        [0.15, 1.2],
        [0.07, 1.26],
        [0.04, 1.28],
      ]),
      24,
      0.72,
    );
    return new Batch()
      .add(torso, undefined, 1, true)
      .add(new THREE.BoxGeometry(0.34, 0.15, 0.44).translate(0, 0.53, 0.17), undefined, 1, true)
      .add(new THREE.BoxGeometry(0.3, 0.47, 0.13).translate(0, 0.24, 0.36), undefined, 1, true)
      .build();
  }
  const profile: [number, number][] =
    kind === "woman"
      ? [
          [0.25, 0],
          [0.23, 0.35],
          [0.19, 0.8],
          [0.15, 0.98],
          [0.16, 1.18],
          [0.14, 1.3],
          [0.07, 1.36],
          [0.04, 1.38],
        ]
      : [
          [0.12, 0],
          [0.13, 0.5],
          [0.2, 0.62],
          [0.21, 1.0],
          [0.22, 1.28],
          [0.17, 1.4],
          [0.07, 1.45],
          [0.04, 1.46],
        ];
  return lathe(smoothProfile(profile), 24, 0.72);
}

export function People() {
  const m = materials();
  const t = tourMaterials();
  const heads = useRef<THREE.InstancedMesh>(null);
  const hair = useRef<THREE.InstancedMesh>(null);
  const g = useMemo(() => {
    const hairF = new Batch()
      .add(new THREE.SphereGeometry(0.105, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5).rotateX(-0.5), undefined, 1, true)
      .add(new THREE.SphereGeometry(0.06, 12, 10).translate(0, -0.03, -0.1), undefined, 1, true)
      .build();
    return {
      chair: chairGeo(),
      sash: new THREE.BoxGeometry(0.5, 0.1, 0.09).translate(0, 0.8, -0.21),
      woman: bodyGeo("woman"),
      man: bodyGeo("man"),
      sit: bodyGeo("sit"),
      head: new THREE.SphereGeometry(0.1, 20, 16).scale(0.86, 1.08, 0.96),
      hairF,
      arm: new THREE.CapsuleGeometry(0.04, 0.5, 4, 8),
    };
  }, []);

  const d = useMemo(() => {
    const chairs = [...L.CEREMONY_SEATS, ...L.FEAST_SEATS].map((s) => at(null, s.x, s.y, s.z, s.rot));
    const bodies = { woman: [] as THREE.Matrix4[], man: [] as THREE.Matrix4[], sit: [] as THREE.Matrix4[] };
    const colors = { woman: [] as THREE.Color[], man: [] as THREE.Color[], sit: [] as THREE.Color[] };
    const arms: THREE.Matrix4[] = [];
    const armColors: THREE.Color[] = [];
    const headBase: { p: THREE.Vector3; rot: number; phase: number }[] = [];
    const skins: THREE.Color[] = [];
    L.GUESTS.forEach((p, i) => {
      const kind = p.sit ? "sit" : p.woman ? "woman" : "man";
      bodies[kind].push(at(null, p.x, p.y, p.z, p.rot));
      colors[kind].push(new THREE.Color(p.cloth));
      const headY = p.sit ? 1.39 : p.woman ? 1.49 : 1.57;
      const look = Math.atan2(p.lookX - p.x, p.lookZ - p.z);
      headBase.push({ p: V(p.x, p.y + headY, p.z), rot: p.sit ? look : p.rot, phase: i * 1.7 });
      skins.push(new THREE.Color(p.skin));
      if (!p.sit) {
        const sy = p.y + (p.woman ? 1.27 : 1.33);
        for (const s of [-1, 1]) {
          const local = V(s * 0.2, 0, 0).applyAxisAngle(V(0, 1, 0), p.rot);
          arms.push(new THREE.Matrix4().compose(V(p.x + local.x, sy - 0.3, p.z + local.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rot, s * 0.12)), V(1, 1, 1)));
          armColors.push(p.woman ? new THREE.Color(p.skin) : new THREE.Color(p.cloth));
        }
      }
    });
    return { chairs, bodies, colors, arms, armColors, headBase, skins };
  }, []);

  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const h = heads.current;
    const hr = hair.current;
    if (!h || !hr) return;
    d.headBase.forEach((b, i) => {
      tmp.position.copy(b.p);
      tmp.rotation.set(Math.sin(time * 0.6 + b.phase) * 0.06, b.rot + Math.sin(time * 0.23 + b.phase) * 0.35, Math.sin(time * 0.4 + b.phase) * 0.04, "YXZ");
      tmp.updateMatrix();
      h.setMatrixAt(i, tmp.matrix);
      hr.setMatrixAt(i, tmp.matrix);
    });
    h.instanceMatrix.needsUpdate = true;
    hr.instanceMatrix.needsUpdate = true;
  });

  const setup = (im: THREE.InstancedMesh | null, ref: React.RefObject<THREE.InstancedMesh | null>, colors?: THREE.Color[]) => {
    (ref as React.MutableRefObject<THREE.InstancedMesh | null>).current = im;
    if (!im) return;
    d.headBase.forEach((b, i) => {
      tmp.position.copy(b.p);
      tmp.rotation.set(0, b.rot, 0);
      tmp.updateMatrix();
      im.setMatrixAt(i, tmp.matrix);
      if (colors) im.setColorAt(i, colors[i]);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  };

  return (
    <group>
      <Inst geometry={g.chair} material={t.cloth} matrices={d.chairs} castShadow receiveShadow />
      <Inst geometry={g.sash} material={t.satin} matrices={d.chairs} />
      <Inst geometry={g.woman} material={m.saree} matrices={d.bodies.woman} colors={d.colors.woman} castShadow />
      <Inst geometry={g.man} material={m.groomSilk} matrices={d.bodies.man} colors={d.colors.man} castShadow />
      <Inst geometry={g.sit} material={m.groomSilk} matrices={d.bodies.sit} colors={d.colors.sit} castShadow />
      <Inst geometry={g.arm} material={m.skinBride} matrices={d.arms} colors={d.armColors} />
      <instancedMesh ref={(im) => setup(im, heads, d.skins)} args={[g.head, m.skinBride, d.headBase.length]} frustumCulled={false} />
      <instancedMesh ref={(im) => setup(im, hair)} args={[g.hairF, m.hair, d.headBase.length]} frustumCulled={false} />
    </group>
  );
}

/** The purohit, seated cross-legged by the sacred fire. */
export function Priest() {
  const m = materials();
  const geo = useMemo(
    () => ({
      torso: lathe(
        smoothProfile([
          [0.16, 0],
          [0.17, 0.15],
          [0.19, 0.38],
          [0.15, 0.5],
          [0.06, 0.56],
          [0.03, 0.57],
        ]),
        24,
        0.75,
      ),
    }),
    [],
  );
  return (
    <group position={[-0.85, L.FLOORS.find((f) => f.h === 0.24)?.h ?? 0.24, 0.95]} rotation-y={Math.PI / 2}>
      <mesh material={m.dhoti} position-y={0.08} scale={[0.4, 0.1, 0.3]}>
        <sphereGeometry args={[1, 20, 12]} />
      </mesh>
      <mesh geometry={geo.torso} material={m.skinGroom} position-y={0.12} castShadow />
      <mesh material={m.chandan} position={[0, 0.42, 0]} rotation={[0.25, 0, 0.7]}>
        <torusGeometry args={[0.18, 0.006, 6, 32]} />
      </mesh>
      <mesh material={m.skinGroom} position-y={0.8} scale={[0.86, 1.05, 0.95]}>
        <sphereGeometry args={[0.1, 20, 16]} />
      </mesh>
      <mesh material={m.chandan} position={[0, 0.84, 0.09]}>
        <boxGeometry args={[0.06, 0.012, 0.01]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.skinGroom} position={[s * 0.16, 0.42, 0.14]} rotation={[1.1, 0, s * -0.2]}>
          <capsuleGeometry args={[0.035, 0.32, 4, 8]} />
        </mesh>
      ))}
      <mesh material={m.brass} position={[0, 0.2, 0.34]}>
        <cylinderGeometry args={[0.12, 0.1, 0.02, 24]} />
      </mesh>
    </group>
  );
}
