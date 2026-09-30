"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { materials } from "./materials";
import { lathe, smoothProfile } from "./geometry";
import { Flames } from "./Flames";
import { LAYOUT } from "../hero/shots";
import type { Tier } from "@/lib/device";

const TOP = LAYOUT.platformTop;
const HALF = 1.55; // pillar offset from centre
const PILLAR_H = 2.85;

/** Traditional Bengali chhadnatala: alpana-painted platform, carved pillars, silk canopy, banana plants. */
export function Mandap({ tier }: { tier: Tier }) {
  const m = materials();

  const pillarGeo = useMemo(
    () =>
      lathe(
        smoothProfile(
          [
            [0.17, 0],
            [0.17, 0.08],
            [0.12, 0.14],
            [0.1, 0.3],
            [0.075, 0.5],
            [0.07, 1.4],
            [0.075, 2.3],
            [0.09, 2.55],
            [0.13, 2.7],
            [0.15, 2.8],
            [0.1, PILLAR_H],
          ],
          60,
        ),
        28,
      ),
    [],
  );
  const ringGeo = useMemo(() => new THREE.TorusGeometry(0.082, 0.014, 10, 32), []);
  const canopyGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(3.4, 3.4, 24, 24);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / 1.7;
      const z = p.getZ(i) / 1.7;
      p.setY(i, -0.32 * (1 - x * x) * (1 - z * z) + Math.sin(x * 12) * 0.012);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const drapeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(14, 7.5, 180, 4);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      p.setZ(i, Math.sin(x * 7.3) * 0.07 + Math.sin(x * 2.1) * 0.12);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const corners: [number, number][] = [
    [-HALF, -HALF],
    [HALF, -HALF],
    [-HALF, HALF],
    [HALF, HALF],
  ];

  const lampPositions = useMemo(() => {
    const out: THREE.Vector3[] = [];
    // Diyas along the front step
    for (let i = 0; i < 13; i++) out.push(new THREE.Vector3(-1.5 + i * 0.25, TOP + 0.035, 1.72));
    // Diyas ringing the havan kund
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      out.push(new THREE.Vector3(LAYOUT.fire.x + Math.cos(a) * 0.46, TOP + 0.035, LAYOUT.fire.z + Math.sin(a) * 0.46));
    }
    // Rows of diyas on the floor, leading the eye toward the mandap
    for (let i = 0; i < 12; i++) {
      out.push(new THREE.Vector3(-1.05, 0.035, 2.4 + i * 0.5));
      out.push(new THREE.Vector3(1.05, 0.035, 2.4 + i * 0.5));
    }
    return out;
  }, []);

  const candleData = useMemo(() => {
    // Pillar-candle clusters at the four outer corners
    const out: { p: THREE.Vector3; h: number }[] = [];
    const clusters: [number, number][] = [
      [-2.25, 2.1],
      [2.25, 2.1],
      [-2.3, -1.9],
      [2.3, -1.9],
    ];
    clusters.forEach(([cx, cz], k) => {
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3 + k;
        const h = 0.18 + ((i * 37 + k * 11) % 5) * 0.09;
        out.push({ p: new THREE.Vector3(cx + Math.cos(a) * 0.16, 0, cz + Math.sin(a) * 0.16), h });
      }
    });
    return out;
  }, []);

  const lampGeo = useMemo(
    () =>
      lathe(
        [
          [0.0, 0],
          [0.035, 0.004],
          [0.045, 0.02],
          [0.04, 0.03],
        ],
        14,
      ),
    [],
  );

  // Instance matrices are written once, via ref callbacks.
  const setupDiyas = (im: THREE.InstancedMesh | null) => {
    if (!im) return;
    const d = new THREE.Object3D();
    lampPositions.forEach((p, i) => {
      d.position.set(p.x, p.y - 0.035, p.z);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  };
  const setupCandles = (im: THREE.InstancedMesh | null) => {
    if (!im) return;
    const d = new THREE.Object3D();
    candleData.forEach(({ p, h }, i) => {
      d.position.set(p.x, h / 2, p.z);
      d.scale.set(1, h, 1);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  };

  const candleFlames = useMemo(() => candleData.map(({ p, h }) => new THREE.Vector3(p.x, h + 0.012, p.z)), [candleData]);
  const pradipFlames = useMemo(() => {
    const out: THREE.Vector3[] = [];
    [-2.35, 2.35].forEach((x) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        out.push(new THREE.Vector3(x + Math.cos(a) * 0.1, 1.43, 1.35 + Math.sin(a) * 0.1));
      }
    });
    return out;
  }, []);

  const pradipGeo = useMemo(
    () =>
      lathe(
        smoothProfile(
          [
            [0.16, 0],
            [0.14, 0.04],
            [0.05, 0.1],
            [0.03, 0.4],
            [0.06, 0.45],
            [0.025, 0.55],
            [0.022, 1.2],
            [0.05, 1.3],
            [0.14, 1.36],
            [0.16, 1.4],
          ],
          40,
        ),
        24,
      ),
    [],
  );

  const ghotGeo = useMemo(
    () =>
      lathe(
        smoothProfile(
          [
            [0.0, 0],
            [0.06, 0.005],
            [0.13, 0.08],
            [0.14, 0.14],
            [0.1, 0.22],
            [0.06, 0.26],
            [0.075, 0.3],
          ],
          30,
        ),
        28,
      ),
    [],
  );

  return (
    <group>
      {/* Venue floor */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 60]} />
        {tier === "high" ? (
          <MeshReflectorMaterial
            resolution={512}
            blur={[400, 120]}
            mixBlur={1}
            mixStrength={2.2}
            mixContrast={1}
            roughness={0.85}
            depthScale={0.6}
            minDepthThreshold={0.5}
            maxDepthThreshold={1.2}
            color="#0d0807"
            metalness={0.4}
            mirror={0}
          />
        ) : (
          <primitive object={m.floorDark} attach="material" />
        )}
      </mesh>

      {/* Aisle runner */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 5.2]} receiveShadow>
        <planeGeometry args={[1.7, 6.4]} />
        <meshStandardMaterial color="#4a0c10" roughness={0.9} />
      </mesh>

      {/* Platform */}
      <mesh position={[0, TOP / 2, 0]} castShadow receiveShadow material={m.platformSide}>
        <boxGeometry args={[3.6, TOP, 3.6]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, TOP + 0.002, 0]} receiveShadow material={m.alpana}>
        <planeGeometry args={[3.56, 3.56]} />
      </mesh>
      {/* Gold edge trim */}
      {[
        [0, 1.8, 3.62, 0.03],
        [0, -1.8, 3.62, 0.03],
        [1.8, 0, 0.03, 3.62],
        [-1.8, 0, 0.03, 3.62],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, TOP - 0.01, z]} material={m.gold}>
          <boxGeometry args={[w, 0.03, d]} />
        </mesh>
      ))}
      {/* Front step */}
      <mesh position={[0, 0.06, 2.0]} castShadow receiveShadow material={m.platformSide}>
        <boxGeometry args={[1.8, 0.12, 0.42]} />
      </mesh>

      {/* Pillars, rings and banana plants */}
      {corners.map(([x, z], i) => (
        <group key={i} position={[x, TOP, z]}>
          <mesh geometry={pillarGeo} material={m.wood} castShadow />
          {[0.35, 0.6, 1.4, 2.2, 2.45].map((y) => (
            <mesh key={y} geometry={ringGeo} material={m.gold} position-y={y} rotation-x={Math.PI / 2} />
          ))}
          <mesh position-y={PILLAR_H + 0.05} material={m.gold}>
            <sphereGeometry args={[0.09, 20, 14]} />
          </mesh>
          <BananaPlant position={[x > 0 ? 0.32 : -0.32, 0, z > 0 ? 0.32 : -0.32]} seed={i} />
        </group>
      ))}

      {/* Beams */}
      {[
        [0, -HALF, 3.3, 0.14],
        [0, HALF, 3.3, 0.14],
        [-HALF, 0, 0.14, 3.3],
        [HALF, 0, 0.14, 3.3],
      ].map(([x, z, w, d], i) => (
        <group key={i} position={[x, TOP + PILLAR_H - 0.06, z]}>
          <mesh material={m.wood} castShadow>
            <boxGeometry args={[w, 0.16, d]} />
          </mesh>
          <mesh material={m.gold} position-y={-0.09}>
            <boxGeometry args={[w + 0.02, 0.025, d + 0.02]} />
          </mesh>
          <mesh material={m.gold} position-y={0.09}>
            <boxGeometry args={[w + 0.02, 0.025, d + 0.02]} />
          </mesh>
        </group>
      ))}

      {/* Silk canopy */}
      <mesh geometry={canopyGeo} material={m.canopy} position-y={TOP + PILLAR_H + 0.05} receiveShadow />

      {/* Sheer drapes tied back on the rear pillars */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.25, TOP + 1.45, -1.62]} rotation-y={s * 0.15} material={m.sheer}>
          <planeGeometry args={[0.7, 2.8, 12, 1]} />
        </mesh>
      ))}

      {/* Havan kund — the sacred fire */}
      <group position={[LAYOUT.fire.x, TOP, LAYOUT.fire.z]}>
        <mesh position-y={0.07} material={m.brick} castShadow receiveShadow>
          <boxGeometry args={[0.46, 0.14, 0.46]} />
        </mesh>
        <mesh position-y={0.141} rotation-x={-Math.PI / 2} material={m.ember}>
          <planeGeometry args={[0.34, 0.34]} />
        </mesh>
        <Flames
          positions={[
            new THREE.Vector3(0, 0.15, 0),
            new THREE.Vector3(0.07, 0.15, 0.04),
            new THREE.Vector3(-0.06, 0.15, -0.04),
            new THREE.Vector3(0.02, 0.15, -0.07),
            new THREE.Vector3(-0.05, 0.15, 0.06),
          ]}
          size={0.2}
          glowSize={0.9}
          color="#ff8a2a"
          intensity={1.3}
        />
      </group>

      {/* Mangal ghot with mango leaves and coconut */}
      <group position={[0.62, TOP, 0.95]}>
        <mesh geometry={ghotGeo} material={m.brass} castShadow />
        <mesh position-y={0.36} material={m.clay}>
          <sphereGeometry args={[0.07, 16, 12]} />
        </mesh>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position-y={0.31} rotation={[0.9, (i / 7) * Math.PI * 2, 0]} material={m.leaf}>
            <planeGeometry args={[0.05, 0.16]} />
          </mesh>
        ))}
      </group>

      {/* Brass pradip lamp stands */}
      {[-2.35, 2.35].map((x) => (
        <mesh key={x} geometry={pradipGeo} material={m.brass} position={[x, 0, 1.35]} castShadow />
      ))}
      <Flames positions={pradipFlames} size={0.045} glowSize={0.35} />

      {/* Diyas */}
      <instancedMesh ref={setupDiyas} args={[lampGeo, m.clay, lampPositions.length]} castShadow={false} />
      <Flames positions={lampPositions} size={0.03} glowSize={0.18} />

      {/* Pillar candles */}
      <instancedMesh ref={setupCandles} args={[undefined, undefined, candleData.length]}>
        <cylinderGeometry args={[0.045, 0.045, 1, 18]} />
        <meshPhysicalMaterial color="#f4ead6" roughness={0.45} transmission={0} sheen={0.5} sheenColor="#ffd9a0" />
      </instancedMesh>
      <Flames positions={candleFlames} size={0.035} glowSize={0.25} />

      {/* Velvet backdrop */}
      <mesh geometry={drapeGeo} material={m.velvet} position={[0, 3.6, -3.4]} receiveShadow />
      <mesh geometry={drapeGeo} material={m.velvet} position={[-6.2, 3.6, 1.5]} rotation-y={Math.PI / 2.4} />
      <mesh geometry={drapeGeo} material={m.velvet} position={[6.2, 3.6, 1.5]} rotation-y={-Math.PI / 2.4} />
    </group>
  );
}

function BananaPlant({ position, seed }: { position: [number, number, number]; seed: number }) {
  const m = materials();
  const group = useRef<THREE.Group>(null);
  const leafGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.42, 1.5, 4, 16);
    g.translate(0, 0.75, 0);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const x = p.getX(i);
      // arch the leaf outward and droop the tip
      p.setZ(i, Math.pow(y / 1.5, 2) * 0.75 - Math.abs(x) * 0.25);
      p.setY(i, y - Math.pow(y / 1.5, 3) * 0.4);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.4 + seed) * 0.03;
  });

  return (
    <group position={position}>
      <mesh position-y={1.05} material={m.bananaStem} castShadow>
        <cylinderGeometry args={[0.055, 0.085, 2.1, 14]} />
      </mesh>
      <group ref={group} position-y={2.0}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh
            key={i}
            geometry={leafGeo}
            material={m.bananaLeaf}
            rotation={[0.15 + (i % 3) * 0.12, (i / 7) * Math.PI * 2 + seed, 0]}
            castShadow
          />
        ))}
      </group>
    </group>
  );
}
