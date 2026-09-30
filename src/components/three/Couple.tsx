"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { materials } from "./materials";
import { lathe, ribbon, scallopedCone, smoothProfile } from "./geometry";
import { Arm, ArmApi, Garland, Head } from "./Anatomy";
import { LAYOUT } from "../hero/shots";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** Outward-facing normal for fabric wrapped around a vertical body axis, turning upward over the shoulders. */
const wrapNormal = (shoulderY: number) => (_t: number, p: THREE.Vector3) => {
  const n = V(p.x, 0, p.z).normalize();
  const k = THREE.MathUtils.smoothstep(p.y, shoulderY - 0.08, shoulderY + 0.02);
  return n.lerp(V(0, 1, 0), k).normalize();
};

/** Adds soft vertical pleats (kuchi) to the front of a lathe garment. */
function pleat(g: THREE.BufferGeometry, amount: number, count: number, yMax: number) {
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(x, z);
    const front = Math.max(Math.cos(a), 0);
    const k = 1 + Math.sin(a * count) * amount * front * (1 - Math.min(y / yMax, 1));
    p.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/* ================================ BRIDE ================================ */

function Bride() {
  const m = materials();
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<ArmApi>(null);
  const armR = useRef<ArmApi>(null);
  const heldGarland = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const skirt = pleat(
      lathe(
        smoothProfile([
          [0.285, 0],
          [0.27, 0.06],
          [0.24, 0.32],
          [0.2, 0.62],
          [0.165, 0.86],
          [0.14, 1.0],
          [0.132, 1.05],
        ]),
        56,
        0.86,
      ),
      0.05,
      18,
      1.0,
    );
    const bodice = lathe(
      smoothProfile([
        [0.132, 1.02],
        [0.128, 1.07],
        [0.148, 1.17],
        [0.158, 1.23],
        [0.15, 1.3],
        [0.105, 1.355],
        [0.045, 1.375],
      ]),
      40,
      0.72,
    );
    // Veil: a hood over the mukut and hair, open at the face, falling to the waist behind
    const veil = lathe(
      smoothProfile([
        [0.25, 0.98],
        [0.235, 1.12],
        [0.2, 1.3],
        [0.13, 1.44],
        [0.112, 1.54],
        [0.09, 1.61],
        [0.02, 1.64],
      ]),
      48,
      0.9,
      1.05,
      Math.PI * 2 - 2.1,
    );
    // Pallu — from the right hip, across the chest, over the left shoulder, down the back
    const palluCurve = new THREE.CatmullRomCurve3([
      V(0.13, 0.9, 0.12),
      V(0.08, 1.08, 0.135),
      V(-0.02, 1.2, 0.125),
      V(-0.11, 1.3, 0.085),
      V(-0.15, 1.36, 0.0),
      V(-0.14, 1.3, -0.1),
      V(-0.12, 1.05, -0.14),
      V(-0.1, 0.7, -0.17),
    ]);
    const pallu = ribbon(palluCurve, 0.21, 90, wrapNormal(1.34), (t) => 0.8 + t * 0.5);
    const neckGarland = new THREE.CatmullRomCurve3(
      [V(0, 1.37, -0.07), V(0.11, 1.34, -0.02), V(0.12, 1.22, 0.1), V(0.04, 1.06, 0.16), V(-0.04, 1.06, 0.16), V(-0.12, 1.22, 0.1), V(-0.11, 1.34, -0.02)],
      true,
    );
    const mukut = scallopedCone(0.076, 0.1, 0.075, 13, 0.035);
    return { skirt, bodice, veil, pallu, neckGarland, mukut };
  }, []);

  const shoulderL = useMemo(() => V(-0.155, 1.315, -0.005), []);
  const shoulderR = useMemo(() => V(0.155, 1.315, -0.005), []);
  const hand = useMemo(() => ({ l: V(), r: V(), pl: V(), pr: V() }), []);
  const heldCurve = useMemo(() => new THREE.CatmullRomCurve3([V(-0.06, 0, 0), V(-0.05, -0.16, 0.03), V(0, -0.24, 0.04), V(0.05, -0.16, 0.03), V(0.06, 0, 0)]), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const breath = Math.sin(t * 1.4) * 0.5 + 0.5;
    if (torso.current) torso.current.scale.set(1 + breath * 0.006, 1 + breath * 0.004, 1 + breath * 0.01);
    // Shy glance: lowered gaze that lifts toward the groom every ~11s
    const glance = THREE.MathUtils.smoothstep(Math.sin(t * 0.55) , 0.75, 1);
    if (head.current) {
      head.current.rotation.x = 0.28 - glance * 0.22 + Math.sin(t * 0.7) * 0.015;
      head.current.rotation.y = -0.05 + glance * 0.12 + Math.sin(t * 0.33) * 0.03;
      head.current.rotation.z = 0.06 + Math.sin(t * 0.45) * 0.015;
    }
    // Hands hold the garland for the exchange; subtle lift and sway
    const lift = Math.sin(t * 0.6) * 0.012;
    hand.l.set(-0.065, 1.13 + lift, 0.235);
    hand.r.set(0.065, 1.13 + lift, 0.235);
    hand.pl.set(-0.45, 0.95, -0.25);
    hand.pr.set(0.45, 0.95, -0.25);
    armL.current?.update(hand.l, hand.pl);
    armR.current?.update(hand.r, hand.pr);
    if (heldGarland.current) {
      heldGarland.current.position.set(0, 1.14 + lift, 0.255);
      heldGarland.current.rotation.x = Math.sin(t * 0.9) * 0.08;
    }
    if (root.current) root.current.rotation.z = Math.sin(t * 0.4) * 0.004;
  });

  return (
    <group ref={root}>
      <mesh geometry={geo.skirt} material={m.saree} castShadow receiveShadow />
      <group ref={torso}>
        <mesh geometry={geo.bodice} material={m.blouse} castShadow />
        <mesh geometry={geo.pallu} material={m.saree} castShadow />
        <Garland curve={geo.neckGarland} />
      </group>
      {/* Neck & choker */}
      <mesh material={m.skinBride} position-y={1.4}>
        <cylinderGeometry args={[0.038, 0.045, 0.1, 16]} />
      </mesh>
      <mesh material={m.gold} position-y={1.375} rotation-x={Math.PI / 2} scale={[1, 0.85, 1]}>
        <torusGeometry args={[0.05, 0.012, 8, 28]} />
      </mesh>
      <mesh material={m.goldSoft} position={[0, 1.31, 0.075]} rotation-x={-0.35} scale={[1, 1, 0.3]}>
        <sphereGeometry args={[0.055, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Shoulders */}
      {[shoulderL, shoulderR].map((s, i) => (
        <mesh key={i} material={m.blouse} position={s}>
          <sphereGeometry args={[0.048, 16, 12]} />
        </mesh>
      ))}
      <Arm ref={armL} shoulder={shoulderL} upper={0.26} lower={0.24} radius={0.036} sleeve={m.blouse} forearm={m.skinBride} skin={m.skinBride} bangles />
      <Arm ref={armR} shoulder={shoulderR} upper={0.26} lower={0.24} radius={0.036} sleeve={m.blouse} forearm={m.skinBride} skin={m.skinBride} bangles />
      <group ref={heldGarland}>
        <Garland curve={heldCurve} palette={["#fbf6ea", "#a30f1c", "#fbf6ea", "#ff9a10"]} scale={0.7} />
      </group>

      <Head ref={head} position-y={1.49} radius={0.092} skin={m.skinBride} variant="bride">
        {/* Sola mukut */}
        <mesh geometry={geo.mukut} material={m.sola} position={[0, 0.1, -0.018]} rotation-x={-0.22} />
        <mesh material={m.sola} position={[0, 0.17, 0.0]} rotation-x={-0.22}>
          <circleGeometry args={[0.055, 24, 0, Math.PI]} />
        </mesh>
      </Head>
      <mesh geometry={geo.veil} material={m.sareeVeil} castShadow />
    </group>
  );
}

/* ================================ GROOM ================================ */

function Groom() {
  const m = materials();
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<ArmApi>(null);
  const armR = useRef<ArmApi>(null);
  const heldGarland = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const dhoti = pleat(
      lathe(
        smoothProfile([
          [0.16, 0.02],
          [0.165, 0.15],
          [0.17, 0.45],
          [0.18, 0.7],
          [0.18, 0.9],
        ]),
        44,
        0.78,
      ),
      0.07,
      10,
      0.9,
    );
    const kurta = lathe(
      smoothProfile([
        [0.215, 0.56],
        [0.205, 0.72],
        [0.185, 0.92],
        [0.18, 1.04],
        [0.195, 1.2],
        [0.212, 1.34],
        [0.18, 1.43],
        [0.1, 1.47],
        [0.05, 1.48],
      ]),
      48,
      0.62,
    );
    const shawlCurve = new THREE.CatmullRomCurve3([
      V(0.16, 0.75, 0.1),
      V(0.1, 1.0, 0.125),
      V(0.0, 1.2, 0.125),
      V(-0.12, 1.38, 0.07),
      V(-0.18, 1.44, 0.0),
      V(-0.17, 1.36, -0.1),
      V(-0.15, 1.05, -0.13),
      V(-0.13, 0.7, -0.14),
    ]);
    const shawl = ribbon(shawlCurve, 0.16, 90, wrapNormal(1.42));
    const topor = lathe(
      smoothProfile([
        [0.098, 0],
        [0.104, 0.035],
        [0.092, 0.12],
        [0.078, 0.2],
        [0.055, 0.3],
        [0.03, 0.38],
        [0.012, 0.45],
        [0.0, 0.5],
      ]),
      40,
      0.95,
    );
    const toporCrest = scallopedCone(0.106, 0.118, 0.05, 13, 0.035);
    const neckGarland = new THREE.CatmullRomCurve3(
      [V(0, 1.49, -0.085), V(0.135, 1.44, -0.02), V(0.15, 1.3, 0.1), V(0.05, 1.08, 0.15), V(-0.05, 1.08, 0.15), V(-0.15, 1.3, 0.1), V(-0.135, 1.44, -0.02)],
      true,
    );
    return { dhoti, kurta, shawl, topor, toporCrest, neckGarland };
  }, []);

  const shoulderL = useMemo(() => V(-0.2, 1.415, -0.01), []);
  const shoulderR = useMemo(() => V(0.2, 1.415, -0.01), []);
  const hand = useMemo(() => ({ l: V(), r: V(), pl: V(-0.55, 1.0, -0.3), pr: V(0.55, 1.0, -0.3) }), []);
  const heldCurve = useMemo(() => new THREE.CatmullRomCurve3([V(-0.07, 0, 0), V(-0.06, -0.18, 0.03), V(0, -0.27, 0.04), V(0.06, -0.18, 0.03), V(0.07, 0, 0)]), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const breath = Math.sin(t * 1.25 + 1) * 0.5 + 0.5;
    if (torso.current) torso.current.scale.set(1 + breath * 0.006, 1 + breath * 0.004, 1 + breath * 0.012);
    if (head.current) {
      head.current.rotation.x = 0.1 + Math.sin(t * 0.5) * 0.02;
      head.current.rotation.y = 0.08 + Math.sin(t * 0.37 + 2) * 0.05;
      head.current.rotation.z = -0.03 + Math.sin(t * 0.3) * 0.01;
    }
    const lift = Math.sin(t * 0.6 + 0.8) * 0.014;
    hand.l.set(-0.075, 1.25 + lift, 0.27);
    hand.r.set(0.075, 1.25 + lift, 0.27);
    armL.current?.update(hand.l, hand.pl);
    armR.current?.update(hand.r, hand.pr);
    if (heldGarland.current) {
      heldGarland.current.position.set(0, 1.26 + lift, 0.29);
      heldGarland.current.rotation.x = Math.sin(t * 0.8) * 0.08;
    }
  });

  return (
    <group>
      <mesh geometry={geo.dhoti} material={m.dhoti} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.gold} position={[s * 0.07, 0.03, 0.05]} scale={[0.05, 0.03, 0.12]}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
      <group ref={torso}>
        <mesh geometry={geo.kurta} material={m.groomSilk} castShadow />
        <mesh geometry={geo.shawl} material={m.shawl} castShadow />
        <Garland curve={geo.neckGarland} spacing={0.028} palette={["#fbf6ea", "#fbf6ea", "#ff8a00", "#a30f1c"]} />
      </group>
      <mesh material={m.skinGroom} position-y={1.51}>
        <cylinderGeometry args={[0.046, 0.054, 0.12, 16]} />
      </mesh>
      {[shoulderL, shoulderR].map((s, i) => (
        <mesh key={i} material={m.groomSilk} position={s}>
          <sphereGeometry args={[0.056, 16, 12]} />
        </mesh>
      ))}
      <Arm ref={armL} shoulder={shoulderL} upper={0.3} lower={0.27} radius={0.042} sleeve={m.groomSilk} forearm={m.groomSilk} skin={m.skinGroom} />
      <Arm ref={armR} shoulder={shoulderR} upper={0.3} lower={0.27} radius={0.042} sleeve={m.groomSilk} forearm={m.groomSilk} skin={m.skinGroom} />
      <group ref={heldGarland}>
        <Garland curve={heldCurve} palette={["#fbf6ea", "#ff9a10", "#fbf6ea", "#a30f1c"]} scale={0.72} />
      </group>
      <Head ref={head} position-y={1.62} radius={0.1} skin={m.skinGroom} variant="groom">
        <group position={[0, 0.07, -0.012]} rotation-x={-0.12}>
          <mesh geometry={geo.topor} material={m.sola} castShadow />
          <mesh geometry={geo.toporCrest} material={m.sola} position-y={0.03} />
          <mesh material={m.gold} position-y={0.012} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.1, 0.005, 6, 40]} />
          </mesh>
          <mesh material={m.gold} position-y={0.5}>
            <sphereGeometry args={[0.012, 10, 8]} />
          </mesh>
        </group>
      </Head>
    </group>
  );
}

export function Couple() {
  const { platformTop: y, groom, bride } = LAYOUT;
  return (
    <group>
      <group position={[groom.x, y, groom.z]} rotation-y={groom.rotY}>
        <Groom />
      </group>
      <group position={[bride.x, y, bride.z]} rotation-y={bride.rotY}>
        <Bride />
      </group>
    </group>
  );
}
