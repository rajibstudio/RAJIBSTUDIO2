"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { materials } from "./materials";
import { rng } from "./textures";
import type { Tier } from "@/lib/device";

/** Slowly drifting rose petals and dust motes catching the key light. */
export function Atmosphere({ tier }: { tier: Tier }) {
  const m = materials();
  const count = tier === "high" ? 90 : 40;
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 8, 6);
    g.scale(0.022, 0.004, 0.016);
    return g;
  }, []);
  const seeds = useMemo(() => {
    const r = rng(101);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 3.2,
      z: (r() - 0.5) * 3 + 0.6,
      y: r() * 3,
      speed: 0.08 + r() * 0.1,
      spin: r() * 6,
      phase: r() * 10,
      color: new THREE.Color(["#a30f1c", "#c8243a", "#e56a86", "#ff9a10"][Math.floor(r() * 4)]),
    }));
  }, [count]);
  const d = useMemo(() => new THREE.Object3D(), []);

  const init = (im: THREE.InstancedMesh | null) => {
    ref.current = im;
    if (!im) return;
    seeds.forEach((s, i) => im.setColorAt(i, s.color));
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  };

  useFrame(({ clock }) => {
    const im = ref.current;
    if (!im) return;
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      const y = 3.1 - ((s.y + t * s.speed) % 3.1);
      d.position.set(s.x + Math.sin(t * 0.6 + s.phase) * 0.15, y, s.z + Math.cos(t * 0.4 + s.phase) * 0.1);
      d.rotation.set(t * 0.9 + s.spin, t * 0.5 + s.phase, Math.sin(t + s.spin) * 0.8);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={init} args={[geo, m.petal, count]} frustumCulled={false} />
      <Sparkles count={tier === "high" ? 160 : 70} scale={[5, 3.2, 5]} position={[-0.6, 1.7, 1.4]} size={1.6} speed={0.18} opacity={0.5} color="#ffd9a0" noise={0.6} />
    </group>
  );
}
