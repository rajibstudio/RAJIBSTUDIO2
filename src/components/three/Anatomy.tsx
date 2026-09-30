"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { materials } from "./materials";
import { marigoldGeometry, solveIK, spanMesh } from "./geometry";

/* ------------------------------------------------------------------------------------------
 * Head — sculpted from primitives. Features are subtle on purpose: the scene is always seen
 * through shallow depth of field and warm low-key light, where silhouette, skin sheen and
 * jewellery read more than facial detail.
 * ---------------------------------------------------------------------------------------- */

type HeadProps = {
  radius: number;
  skin: THREE.Material;
  variant: "bride" | "groom" | "photographer";
};

export const Head = forwardRef<THREE.Group, HeadProps & Omit<ThreeElements["group"], "ref">>(function Head({ radius: r, skin, variant, children, ...props }, ref) {
  const m = materials();
  const chandan = useMemo(() => {
    // Arc of chandan dots over the brows (bride & groom)
    const pts: [number, number, number][] = [];
    const n = variant === "bride" ? 15 : 9;
    for (let i = 0; i < n; i++) {
      const a = -1 + (2 * i) / (n - 1);
      const x = a * r * 0.52;
      const y = r * (0.28 + (1 - a * a) * 0.18);
      const z = Math.sqrt(Math.max(r * r * 0.9 - x * x - y * y * 0.5, 0)) * 0.97;
      pts.push([x, y, z]);
    }
    return pts;
  }, [r, variant]);

  return (
    <group ref={ref} {...props}>
      {/* Cranium + jaw */}
      <mesh material={skin} scale={[0.86, 1.08, 0.96]} castShadow>
        <sphereGeometry args={[r, 40, 32]} />
      </mesh>
      <mesh material={skin} position={[0, -r * 0.42, r * 0.18]} scale={[0.62, 0.5, 0.62]}>
        <sphereGeometry args={[r, 28, 20]} />
      </mesh>
      {/* Nose */}
      <mesh material={skin} position={[0, -r * 0.08, r * 0.9]} rotation-x={Math.PI / 2 + 0.25} scale={[1, 1, 0.8]}>
        <coneGeometry args={[r * 0.13, r * 0.34, 12]} />
      </mesh>
      {/* Eyes (lowered lids) */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={m.eye} position={[s * r * 0.32, r * 0.1, r * 0.8]} scale={[r * 0.14, r * 0.05, r * 0.06]}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh material={m.hair} position={[s * r * 0.33, r * 0.26, r * 0.83]} rotation-z={s * -0.12} scale={[r * 0.16, r * 0.022, r * 0.04]}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        </group>
      ))}
      {/* Lips */}
      <mesh material={m.lips} position={[0, -r * 0.43, r * 0.8]} scale={[r * 0.2, r * 0.065, r * 0.08]}>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>
      {variant === "groom" && (
        <mesh material={m.hair} position={[0, -r * 0.3, r * 0.86]} scale={[r * 0.22, r * 0.035, r * 0.06]}>
          <sphereGeometry args={[1, 14, 8]} />
        </mesh>
      )}
      {/* Ears */}
      {[-1, 1].map((s) => (
        <mesh key={`ear${s}`} material={skin} position={[s * r * 0.84, 0, -r * 0.05]} scale={[r * 0.1, r * 0.22, r * 0.14]}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      ))}
      {/* Hair — cap tilted back so the hairline sits cleanly above the forehead */}
      <mesh material={m.hair} position={[0, r * 0.06, -r * 0.04]} rotation-x={-0.6} scale={[0.93, 1.04, 1]}>
        <sphereGeometry args={[r * 1.02, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
      </mesh>
      <mesh material={m.hair} position={[0, -r * 0.08, -r * 0.42]} scale={[0.88, 0.95, 0.85]}>
        <sphereGeometry args={[r * 0.95, 24, 18]} />
      </mesh>

      {variant !== "photographer" &&
        chandan.map((p, i) => (
          <mesh key={i} material={m.chandan} position={p}>
            <sphereGeometry args={[r * 0.035, 6, 5]} />
          </mesh>
        ))}

      {variant === "bride" && (
        <>
          {/* Bun */}
          <mesh material={m.hair} position={[0, -r * 0.25, -r * 1.05]}>
            <sphereGeometry args={[r * 0.55, 20, 16]} />
          </mesh>
          {/* Bindi, sindoor parting, maang tikka */}
          <mesh material={m.sindoor} position={[0, r * 0.4, r * 0.9]}>
            <sphereGeometry args={[r * 0.07, 12, 8]} />
          </mesh>
          <mesh material={m.gold} position={[0, r * 0.66, r * 0.72]}>
            <sphereGeometry args={[r * 0.08, 14, 10]} />
          </mesh>
          {/* Nath */}
          <mesh material={m.gold} position={[r * 0.14, -r * 0.3, r * 0.86]} rotation-y={0.4}>
            <torusGeometry args={[r * 0.16, r * 0.012, 6, 32]} />
          </mesh>
          {/* Jhumkas */}
          {[-1, 1].map((s) => (
            <mesh key={`j${s}`} material={m.gold} position={[s * r * 0.86, -r * 0.4, 0]}>
              <coneGeometry args={[r * 0.1, r * 0.2, 12, 1, true]} />
            </mesh>
          ))}
        </>
      )}
      {children}
    </group>
  );
});

/* ------------------------------------------------------------------------------------------
 * Arm — two-bone IK limb. The parent sets a hand target and calls update() every frame.
 * ---------------------------------------------------------------------------------------- */

export type ArmApi = { update: (hand: THREE.Vector3, pole: THREE.Vector3, handUp?: THREE.Vector3) => void };

type ArmProps = {
  shoulder: THREE.Vector3;
  upper: number;
  lower: number;
  radius: number;
  sleeve: THREE.Material;
  /** Material for the forearm (skin for short sleeves, fabric for full sleeves). */
  forearm: THREE.Material;
  skin: THREE.Material;
  bangles?: boolean;
};

export const Arm = forwardRef<ArmApi, ArmProps>(function Arm({ shoulder, upper, lower, radius, sleeve, forearm, skin, bangles }, ref) {
  const m = materials();
  const up = useRef<THREE.Mesh>(null);
  const lo = useRef<THREE.Mesh>(null);
  const elbow = useRef<THREE.Mesh>(null);
  const hand = useRef<THREE.Group>(null);
  const bangleGroup = useRef<THREE.Group>(null);
  const e = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const Y = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useImperativeHandle(ref, () => ({
    update(h, pole) {
      solveIK(shoulder, h, upper, lower, pole, e);
      if (up.current) spanMesh(up.current, shoulder, e);
      if (lo.current) spanMesh(lo.current, e, h);
      elbow.current?.position.copy(e);
      dir.subVectors(h, e).normalize();
      if (hand.current) {
        hand.current.position.copy(h);
        hand.current.quaternion.setFromUnitVectors(Y, dir);
      }
      if (bangleGroup.current) {
        bangleGroup.current.position.copy(h).addScaledVector(dir, -0.05);
        bangleGroup.current.quaternion.setFromUnitVectors(Y, dir);
      }
    },
  }));

  return (
    <group>
      <mesh ref={up} material={sleeve} castShadow>
        <cylinderGeometry args={[radius * 0.9, radius * 1.05, 1, 14]} />
      </mesh>
      <mesh ref={elbow} material={forearm}>
        <sphereGeometry args={[radius * 0.9, 12, 10]} />
      </mesh>
      <mesh ref={lo} material={forearm} castShadow>
        <cylinderGeometry args={[radius * 0.62, radius * 0.85, 1, 14]} />
      </mesh>
      <group ref={hand}>
        {/* palm + fingers as a soft wedge */}
        <mesh material={skin} position-y={0.04} scale={[radius * 1.05, 0.045, radius * 0.5]}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh material={skin} position={[radius * 0.6, 0.02, radius * 0.25]} rotation-z={-0.5} scale={[radius * 0.3, 0.03, radius * 0.3]}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      </group>
      {bangles && (
        <group ref={bangleGroup}>
          {[
            [0, m.shankha],
            [0.012, m.pola],
            [0.022, m.gold],
            [0.03, m.gold],
            [-0.012, m.gold],
          ].map(([y, mat], i) => (
            <mesh key={i} position-y={y as number} rotation-x={Math.PI / 2} material={mat as THREE.Material}>
              <torusGeometry args={[radius * 0.82, 0.0045, 6, 24]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
});

/* ------------------------------------------------------------------------------------------
 * Garland — flowers instanced along a curve.
 * ---------------------------------------------------------------------------------------- */

let gGeo: THREE.BufferGeometry | null = null;

export function Garland({ curve, spacing = 0.026, palette = ["#fbf6ea", "#fbf6ea", "#a30f1c"], scale = 0.75 }: { curve: THREE.Curve<THREE.Vector3>; spacing?: number; palette?: string[]; scale?: number }) {
  const m = materials();
  if (!gGeo) gGeo = marigoldGeometry(0.03);
  const count = Math.max(2, Math.floor(curve.getLength() / spacing));
  const setup = (im: THREE.InstancedMesh | null) => {
    if (!im) return;
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const p = curve.getPointAt(i / count);
      d.position.copy(p);
      d.rotation.set(i * 1.7, i * 2.3, i * 0.7);
      d.scale.setScalar(scale * (0.9 + ((i * 13) % 7) * 0.03));
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
      im.setColorAt(i, c.set(palette[i % palette.length]));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
  };
  return <instancedMesh key={count} ref={setup} args={[gGeo, m.flower, count]} castShadow />;
}
