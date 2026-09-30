"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Stars } from "@react-three/drei";
import * as THREE from "three";
import { heroState } from "../hero/heroState";
import { glowTexture } from "../three/textures";
import { tour } from "./tourState";
import * as L from "./layout";
import type { Tier } from "@/lib/device";

type SpotProps = {
  position: [number, number, number];
  target: [number, number, number];
  angle: number;
  penumbra: number;
  intensity: number;
  distance: number;
  decay: number;
  color: string;
  castShadow?: boolean;
};

/** A spot light whose target lives in the scene (so its direction updates). */
function Spot({ position, target, ...props }: SpotProps) {
  const scene = useThree((s) => s.scene);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const [tx, ty, tz] = target;
  useEffect(() => {
    obj.position.set(tx, ty, tz);
    scene.add(obj);
    return () => {
      scene.remove(obj);
    };
  }, [scene, obj, tx, ty, tz]);
  const light = useRef<THREE.SpotLight>(null);
  useEffect(() => {
    if (!light.current) return;
    light.current.shadow.mapSize.set(2048, 2048);
    light.current.shadow.bias = -0.0004;
    light.current.shadow.normalBias = 0.03;
    light.current.shadow.camera.near = 1;
    light.current.shadow.camera.far = 30;
  }, []);
  return <spotLight ref={light} position={position} target={obj} {...props} />;
}

export function TourLights({ tier }: { tier: Tier }) {
  const fire = useRef<THREE.PointLight>(null);
  const flash = useRef<THREE.PointLight>(null);
  const rich = tier === "high";
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (fire.current) fire.current.intensity = 3 + Math.sin(t * 17) * 0.4 + Math.sin(t * 7.3) * 0.5;
    if (flash.current) {
      const since = (performance.now() - heroState.lastShutter) / 1000;
      flash.current.intensity = since < 0.12 ? (1 - since / 0.12) * 30 : 0;
    }
  });
  return (
    <>
      <color attach="background" args={["#03040a"]} />
      <fogExp2 attach="fog" args={["#07070f", 0.02]} />
      <hemisphereLight args={["#3b4274", "#1c1008", 0.5]} />
      <directionalLight position={[-35, 48, -70]} intensity={0.35} color="#9fb2ff" />
      {/* halogen floods rigged on the first floor, as at every biye bari */}
      <Spot position={[-8.4, 8.3, 8.4]} target={[0, 1.2, 0]} angle={0.5} penumbra={0.9} intensity={95} distance={32} decay={2} color="#ffcf99" castShadow={rich} />
      <Spot position={[8.4, 8.3, -8.4]} target={[0, 1.2, 0]} angle={0.5} penumbra={0.9} intensity={70} distance={32} decay={2} color="#ffd6a8" />
      <pointLight ref={fire} position={[0, 0.6, 0.9]} color="#ff8a33" distance={6} decay={2} intensity={3} />
      <pointLight position={[0, 3.9, -11.2]} color="#ffc98a" intensity={10} distance={9} decay={2} />
      <pointLight position={[11.3, 3.8, 0]} color="#ffc98a" intensity={11} distance={13} decay={2} />
      <pointLight position={[-11.3, 3.6, -2.5]} color="#ffc98a" intensity={9} distance={11} decay={2} />
      <pointLight position={[0, 3.8, 11.2]} color="#ffc98a" intensity={8} distance={10} decay={2} />
      <pointLight position={[0, 3.3, L.GATE_Z + 0.8]} color="#ffb870" intensity={9} distance={11} decay={2} />
      {/* the glow of the facade lights spilling onto the house and the lane */}
      <Spot position={[0, 7.5, L.LANE_Z - 0.8]} target={[0, 4.5, L.OUTER]} angle={1.0} penumbra={1} intensity={30} distance={22} decay={2} color="#ffbe78" />
      {rich && (
        <>
          <pointLight position={[-8.5, 6.6, L.LANE_Z - 1.6]} color="#ff9a3c" intensity={7} distance={12} decay={2} />
          <pointLight position={[8.5, 6.6, L.LANE_Z - 1.6]} color="#ff9a3c" intensity={7} distance={12} decay={2} />
          <pointLight ref={flash} position={[1.25, 2.1, 3.1]} color="#fff4e6" intensity={0} distance={6} decay={2} />
        </>
      )}
      <Environment resolution={tier === "low" ? 64 : 128} frames={1}>
        <color attach="background" args={["#0a0708"]} />
        <Lightformer form="rect" intensity={2.5} color="#ffd9a8" position={[-3, 3, 3]} scale={[3, 2, 1]} target={[0, 1.4, 0]} />
        <Lightformer form="rect" intensity={1.5} color="#ffb070" position={[3, 2, -3]} scale={[3, 1, 1]} target={[0, 1.4, 0]} />
        <Lightformer form="ring" intensity={1.2} color="#9fb2ff" position={[0, 8, 0]} scale={4} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

/* ------------------------------------ sky ------------------------------------ */

const fwVertex = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform vec3 uOrigins[6];
  uniform float uStarts[6];
  uniform vec3 uColors[6];
  attribute float aBurst;
  attribute vec3 aDir;
  attribute float aSpeed;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    int b = int(aBurst);
    float t = uTime - uStarts[b];
    float life = 2.6;
    if (t < 0.0 || t > life) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }
    vec3 p = uOrigins[b] + aDir * aSpeed * (1.0 - exp(-t * 1.6)) / 1.6 + vec3(0.0, -0.9 * t * t, 0.0);
    float fade = 1.0 - smoothstep(0.35, life, t);
    float flicker = 0.75 + 0.25 * sin(t * 40.0 + aSpeed * 13.0);
    vColor = uColors[b] * (1.2 + 3.0 * fade) * flicker;
    vAlpha = fade;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(0.28 * uScale / -mv.z * (0.4 + fade), 1.0, 24.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const fwFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float k = max(1.0 - d, 0.0);
    float a = k * k * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(max(vColor * a, vec3(0.0)), 1.0);
  }
`;

function Fireworks({ tier }: { tier: Tier }) {
  const BURSTS = 6;
  const PER = tier === "low" ? 70 : 130;
  const { geometry, material } = useMemo(() => {
    const burst: number[] = [];
    const dir: number[] = [];
    const speed: number[] = [];
    const v = new THREE.Vector3();
    for (let b = 0; b < BURSTS; b++)
      for (let i = 0; i < PER; i++) {
        v.randomDirection();
        burst.push(b);
        dir.push(v.x, v.y, v.z);
        speed.push(5 + Math.random() * 3);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(burst.length * 3), 3));
    g.setAttribute("aBurst", new THREE.Float32BufferAttribute(burst, 1));
    g.setAttribute("aDir", new THREE.Float32BufferAttribute(dir, 3));
    g.setAttribute("aSpeed", new THREE.Float32BufferAttribute(speed, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: fwVertex,
      fragmentShader: fwFragment,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 800 },
        uOrigins: { value: Array.from({ length: BURSTS }, () => new THREE.Vector3(0, -100, 0)) },
        uStarts: { value: Array.from({ length: BURSTS }, () => -100) },
        uColors: { value: Array.from({ length: BURSTS }, () => new THREE.Color()) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [PER]);
  const next = useRef(3);
  const slot = useRef(0);
  const palette = useMemo(() => ["#ffd27a", "#ff5a4a", "#7dff9a", "#fff4e0", "#c47dff", "#ff9a2a"].map((c) => new THREE.Color(c)), []);
  const buf = useMemo(() => new THREE.Vector2(), []);
  useFrame(({ clock, gl, camera }) => {
    const t = clock.elapsedTime;
    const u = material.uniforms;
    u.uTime.value = t;
    u.uScale.value = gl.getDrawingBufferSize(buf).y / (2 * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov) / 2));
    if (!tour.calm && t > next.current) {
      const k = slot.current++ % BURSTS;
      (u.uOrigins.value[k] as THREE.Vector3).set((Math.random() - 0.5) * 18, 17 + Math.random() * 8, -12 + Math.random() * 16);
      u.uStarts.value[k] = t;
      (u.uColors.value[k] as THREE.Color).copy(palette[Math.floor(Math.random() * palette.length)]);
      next.current = t + 1.4 + Math.random() * 2.6;
    }
  });
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

export function Sky({ tier }: { tier: Tier }) {
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ map: glowTexture(), color: new THREE.Color(0.7, 0.75, 1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }), []);
  const moon = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.45, 1.3), fog: false, toneMapped: false }), []);
  const moonPos = useMemo(() => new THREE.Vector3(-34, 46, -68), []);
  const moonRef = useRef<THREE.Group>(null);
  useEffect(() => moonRef.current?.lookAt(0, 0, 0), []);
  return (
    <group>
      <Stars radius={95} depth={30} count={tier === "low" ? 1500 : 3500} factor={3.2} saturation={0} fade speed={0.4} />
      <group ref={moonRef} position={moonPos}>
        <mesh material={moon}>
          <circleGeometry args={[2.2, 40]} />
        </mesh>
        <mesh material={glow} position-z={-0.1}>
          <planeGeometry args={[26, 26]} />
        </mesh>
      </group>
      <Fireworks tier={tier} />
    </group>
  );
}
