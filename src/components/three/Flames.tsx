"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { glowTexture } from "./textures";
import { lathe, smoothProfile } from "./geometry";
import { materials } from "./materials";

/**
 * Instanced candle/diya flames with additive halo sprites. Every flame flickers
 * independently (cheap per-instance matrix updates, one draw call per layer).
 */
let flameGeo: THREE.BufferGeometry | null = null;
function getFlameGeo() {
  if (!flameGeo) {
    flameGeo = lathe(
      smoothProfile(
        [
          [0.0, 0],
          [0.55, 0.18],
          [0.62, 0.38],
          [0.4, 0.7],
          [0.0, 1],
        ],
        16,
      ),
      12,
    );
    flameGeo.translate(0, -0.05, 0);
  }
  return flameGeo;
}

type Props = {
  positions: THREE.Vector3[];
  /** Flame height in metres. */
  size?: number;
  glowSize?: number;
  color?: string;
  intensity?: number;
};

export function Flames({ positions, size = 0.028, glowSize = 0.22, color = "#ffb45a", intensity = 1 }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => positions.map((_, i) => Math.random() * 100 + i), [positions]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const m = materials();

  const glowGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions.flatMap((p) => [p.x, p.y + size * 0.45, p.z]), 3));
    return g;
  }, [positions, size]);

  const glowMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glowTexture(),
        color: new THREE.Color(color).multiplyScalar(1.4 * intensity),
        size: glowSize,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [color, glowSize, intensity],
  );

  useLayoutEffect(() => {
    if (!mesh.current) return;
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.scale.set(size * 0.35, size, size * 0.35);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [positions, size, dummy]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < positions.length; i++) {
      const s = seeds[i];
      const f = 0.82 + Math.sin(t * 13 + s) * 0.08 + Math.sin(t * 23.7 + s * 2) * 0.06 + Math.sin(t * 5.3 + s) * 0.05;
      dummy.position.copy(positions[i]);
      dummy.rotation.set(Math.sin(t * 3 + s) * 0.06, 0, Math.sin(t * 4.1 + s) * 0.08);
      dummy.scale.set(size * 0.35 * (2 - f), size * f, size * 0.35 * (2 - f));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    glowMat.opacity = 0.85 + Math.sin(t * 9) * 0.05;
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[getFlameGeo(), m.flame, positions.length]} frustumCulled={false} />
      <points geometry={glowGeo} material={glowMat} frustumCulled={false} />
    </group>
  );
}
