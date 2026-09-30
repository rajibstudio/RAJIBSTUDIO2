"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { glowTexture, rng } from "./textures";
import { materials } from "./materials";
import { LAYOUT } from "../hero/shots";
import { heroState } from "../hero/heroState";
import type { Tier } from "@/lib/device";

/**
 * Low-key wedding lighting:
 *  - warm key from a photographer's octabox (it pops on every shutter release)
 *  - purple rim/back light for separation
 *  - flickering fire light from the havan kund
 *  - hundreds of fairy lights that the lens turns into bokeh
 *  - a procedural environment (no HDR download) for metal and glass reflections
 */
export function Lighting({ tier }: { tier: Tier }) {
  const key = useRef<THREE.SpotLight>(null);
  const fire = useRef<THREE.PointLight>(null);
  const flashFace = useRef<THREE.MeshBasicMaterial>(null);
  const { scene } = useThree();
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 1.4, 0);
    return o;
  }, []);
  const rimTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 1.4, 0.3);
    return o;
  }, []);

  useEffect(() => {
    scene.add(target, rimTarget);
    return () => {
      scene.remove(target, rimTarget);
    };
  }, [scene, target, rimTarget]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const since = (performance.now() - heroState.lastShutter) / 1000;
    const pop = since < 0.12 ? 1 - since / 0.12 : 0;
    if (key.current) key.current.intensity = 24 + pop * 45;
    if (flashFace.current) flashFace.current.color.setScalar(0.5 + pop * 6);
    if (fire.current) fire.current.intensity = 2.4 + Math.sin(t * 17) * 0.35 + Math.sin(t * 7.3) * 0.4 + Math.sin(t * 31) * 0.2;
  });

  const softbox = new THREE.Vector3(-2.3, 2.5, 2.7);

  return (
    <>
      <color attach="background" args={["#070506"]} />
      <fogExp2 attach="fog" args={["#0a0608", 0.045]} />

      <hemisphereLight args={["#6d4a7e", "#1a0b06", 0.35]} />

      {/* Key: octabox camera-left */}
      <spotLight
        ref={key}
        position={softbox}
        target={target}
        angle={0.55}
        penumbra={0.9}
        intensity={24}
        distance={14}
        decay={2}
        color="#ffd2a1"
        castShadow
        shadow-mapSize={tier === "high" ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* Warm fill from camera-right (bounce) */}
      <pointLight position={[2.6, 1.8, 3.2]} intensity={3.2} distance={9} decay={2} color="#ffb877" />
      {/* Purple rim from behind the rajnigandha curtain */}
      <spotLight position={[0.6, 3.6, -3]} target={rimTarget} angle={0.6} penumbra={1} intensity={40} distance={12} decay={2} color="#9c6bff" />
      <spotLight position={[-1.8, 3.2, -2.6]} target={rimTarget} angle={0.7} penumbra={1} intensity={14} distance={10} decay={2} color="#d98aff" />
      {/* The sacred fire */}
      <pointLight ref={fire} position={[LAYOUT.fire.x, LAYOUT.platformTop + 0.35, LAYOUT.fire.z]} intensity={2.4} distance={4.5} decay={2} color="#ff8a33" />
      {/* Lamps / candles — a couple of lights represent many flames */}
      <pointLight position={[-2.3, 1.5, 1.6]} intensity={1.4} distance={4} decay={2} color="#ffb060" />
      <pointLight position={[2.3, 1.5, 1.6]} intensity={1.4} distance={4} decay={2} color="#ffb060" />
      <pointLight position={[0, 0.4, 5]} intensity={1.2} distance={6} decay={2} color="#ffa050" />

      <Softbox position={softbox} lookAt={target.position} faceRef={flashFace} />
      <FairyLights tier={tier} />

      <Environment resolution={tier === "high" ? 256 : 128} frames={1}>
        <color attach="background" args={["#0a0708"]} />
        <Lightformer form="rect" intensity={3} color="#ffd9a8" position={[-3, 2.5, 3]} scale={[2.2, 2.2, 1]} target={[0, 1.4, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#ffb070" position={[3, 1.5, 3]} scale={[2, 1, 1]} target={[0, 1.4, 0]} />
        <Lightformer form="ring" intensity={2.4} color="#b98aff" position={[0, 3, -4]} scale={2} target={[0, 1.4, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#ff9a4a" position={[0, -1, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
}

/** The photographer's octabox on a light stand. */
function Softbox({ position, lookAt, faceRef }: { position: THREE.Vector3; lookAt: THREE.Vector3; faceRef: React.RefObject<THREE.MeshBasicMaterial | null> }) {
  const m = materials();
  const head = useRef<THREE.Group>(null);
  useEffect(() => {
    head.current?.lookAt(lookAt);
  }, [lookAt]);
  return (
    <group>
      {/* Stand */}
      <mesh position={[position.x, position.y / 2, position.z]} material={m.camMetal}>
        <cylinderGeometry args={[0.012, 0.016, position.y, 10]} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[position.x + Math.cos(a) * 0.22, 0.2, position.z + Math.sin(a) * 0.22]} rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]} material={m.camMetal}>
            <cylinderGeometry args={[0.008, 0.008, 0.6, 6]} />
          </mesh>
        );
      })}
      <group ref={head} position={position}>
        <mesh rotation-x={Math.PI / 2} position-z={-0.25} material={m.camGrip}>
          <cylinderGeometry args={[0.45, 0.08, 0.45, 8, 1, true]} />
        </mesh>
        <mesh position-z={-0.02}>
          <circleGeometry args={[0.45, 8]} />
          <meshBasicMaterial ref={faceRef} color="#ffffff" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** Strings of warm fairy lights behind the mandap and overhead — pure bokeh fuel. */
function FairyLights({ tier }: { tier: Tier }) {
  const pts = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    const r = rng(77);
    const pos: number[] = [];
    const col: number[] = [];
    const c = new THREE.Color();
    const strands = tier === "high" ? 46 : 28;
    // Vertical curtain behind the mandap
    for (let i = 0; i < strands; i++) {
      const x = -6.5 + (13 * i) / strands + (r() - 0.5) * 0.1;
      const z = -3.1 + (r() - 0.5) * 0.3;
      for (let y = 0.4; y < 6.5; y += 0.22 + r() * 0.1) {
        pos.push(x + Math.sin(y * 2 + i) * 0.03, y, z);
        c.setHSL(0.09 + r() * 0.03, 0.9, 0.6 + r() * 0.2);
        col.push(c.r, c.g, c.b);
      }
    }
    // Overhead catenaries across the venue
    for (let k = 0; k < 7; k++) {
      const z = -1 + k * 1.6;
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        pos.push(-6 + t * 12, 5.2 - Math.sin(t * Math.PI) * 0.9 - k * 0.05, z + Math.sin(t * 9) * 0.05);
        c.setHSL(0.1, 0.85, 0.65);
        col.push(c.r, c.g, c.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      map: glowTexture(),
      size: 0.13,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      sizeAttenuation: true,
    });
    return { geometry: g, material: mat };
  }, [tier]);

  useFrame(({ clock }) => {
    material.opacity = 0.85 + Math.sin(clock.elapsedTime * 1.3) * 0.1;
  });

  return <points ref={pts} geometry={geometry} material={material} frustumCulled={false} />;
}
