"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { materials } from "./materials";
import { lathe, smoothProfile, solveIK, spanMesh } from "./geometry";
import { Arm, ArmApi, Head } from "./Anatomy";
import { MirrorlessCamera } from "./MirrorlessCamera";
import { LAYOUT } from "../hero/shots";
import { fireShutter, heroState } from "../hero/heroState";
import { sceneRefs } from "./sceneRefs";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** Shots in which the photographer must be actively shooting (camera at the eye). */
const SHOOTING_SHOTS = new Set([1, 2, 7]);

/**
 * The wedding photographer. Procedural rig:
 *  - legs solved with IK so he can dip/crouch for angles while feet stay planted
 *  - head aims at the couple; the camera is locked to the eye (EVF) while shooting
 *  - a behaviour loop: compose → burst → lower to review the LCD ("chimping") → raise again
 *  - hands are IK-attached to the camera grip and lens barrel
 */
export function Photographer() {
  const m = materials();
  const { x, z } = LAYOUT.photographer;
  const yaw = Math.atan2(LAYOUT.coupleCentre[0] - x, LAYOUT.coupleCentre[2] - z);

  const root = useRef<THREE.Group | null>(null);
  const pelvis = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const cam = useRef<THREE.Group | null>(null);
  const headProxy = useRef<THREE.Group | null>(null);
  const armR = useRef<ArmApi>(null);
  const armL = useRef<ArmApi>(null);
  const thighs = useRef<(THREE.Mesh | null)[]>([]);
  const shins = useRef<(THREE.Mesh | null)[]>([]);
  const knees = useRef<(THREE.Mesh | null)[]>([]);

  const geo = useMemo(() => {
    const torso = lathe(
      smoothProfile([
        [0.16, 0.0],
        [0.165, 0.1],
        [0.175, 0.28],
        [0.2, 0.42],
        [0.2, 0.5],
        [0.14, 0.56],
        [0.06, 0.59],
      ]),
      40,
      0.62,
    );
    const hips = lathe(
      smoothProfile([
        [0.12, -0.12],
        [0.165, -0.05],
        [0.17, 0.02],
        [0.16, 0.08],
      ]),
      32,
      0.7,
    );
    const strap = new THREE.TorusGeometry(0.2, 0.006, 6, 48, Math.PI * 1.2);
    return { torso, hips, strap };
  }, []);

  // Rig state (all vectors in the photographer's root space)
  const s = useMemo(
    () => ({
      raise: 1,
      target: V(0, 0, 0),
      headPos: V(),
      camPos: V(),
      camQuat: new THREE.Quaternion(),
      lookQuat: new THREE.Quaternion(),
      chimpQuat: new THREE.Quaternion(),
      m4: new THREE.Matrix4(),
      hipL: V(),
      hipR: V(),
      footL: V(0.13, 0.07, 0.12),
      footR: V(-0.14, 0.07, -0.14),
      knee: V(),
      tmp: V(),
      tmp2: V(),
      handR: V(),
      handL: V(),
      shoulderR: V(),
      shoulderL: V(),
      poleR: V(),
      poleL: V(),
      nextShot: 1.2,
      burst: 0,
      shoulderLocalR: V(-0.19, 0.53, 0),
      shoulderLocalL: V(0.19, 0.53, 0),
    }),
    [],
  );


  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (!root.current || !cam.current || !pelvis.current || !chest.current || !head.current) return;

    // ---- behaviour loop ----
    const cycle = t % 16;
    const chimping = cycle > 9 && cycle < 11.6;
    const forced = SHOOTING_SHOTS.has(heroState.shot);
    const wantRaise = forced || !chimping ? 1 : 0;
    s.raise = THREE.MathUtils.damp(s.raise, wantRaise, 3.2, dt);

    // Weight shift + dip for a lower angle now and then
    const dip = (Math.sin(t * 0.21) * 0.5 + 0.5) * 0.09;
    const sway = Math.sin(t * 0.37) * 0.025;
    const hipY = 0.95 - dip;
    pelvis.current.position.set(sway, hipY, -dip * 0.3);
    pelvis.current.rotation.z = -sway * 1.5;
    chest.current.rotation.x = 0.1 + dip * 0.8 + (1 - s.raise) * 0.12;
    chest.current.rotation.z = sway * 1.2;

    // ---- legs (IK, feet planted) ----
    pelvis.current.updateMatrix();
    s.hipL.set(0.095, 0, 0).applyMatrix4(pelvis.current.matrix);
    s.hipR.set(-0.095, 0, 0).applyMatrix4(pelvis.current.matrix);
    [
      [s.hipL, s.footL],
      [s.hipR, s.footR],
    ].forEach(([hip, foot], i) => {
      s.tmp.copy(hip).add(V(0, -0.2, 0.6));
      solveIK(hip, foot, 0.45, 0.45, s.tmp, s.knee);
      if (thighs.current[i]) spanMesh(thighs.current[i]!, hip, s.knee);
      if (shins.current[i]) spanMesh(shins.current[i]!, s.knee, foot);
      knees.current[i]?.position.copy(s.knee);
    });

    // ---- head + camera ----
    root.current.updateMatrixWorld(true);
    head.current.getWorldPosition(s.headPos);
    root.current.worldToLocal(s.headPos);

    // Aim at the couple with tiny reframing movements
    s.target.set(LAYOUT.coupleCentre[0] + Math.sin(t * 0.7) * 0.05, LAYOUT.coupleCentre[1] - 0.08 + Math.sin(t * 0.53) * 0.03, LAYOUT.coupleCentre[2]);
    root.current.worldToLocal(s.target);
    s.m4.lookAt(s.target, s.headPos, V(0, 1, 0));
    s.lookQuat.setFromRotationMatrix(s.m4);

    // Shooting pose: EVF pressed to the right eye
    const eye = V(-0.045, -0.03, 0.145).applyQuaternion(s.lookQuat).add(s.headPos);
    // Reviewing pose: camera at chest height, screen tilted toward the face
    const chimpPos = V(0, -0.36, 0.3).applyQuaternion(s.lookQuat).add(s.headPos);
    s.chimpQuat.copy(s.lookQuat).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.95, 0, 0)));
    s.camPos.lerpVectors(chimpPos, eye, s.raise);
    s.camQuat.slerpQuaternions(s.chimpQuat, s.lookQuat, s.raise);
    // Hand-held micro shake
    s.camPos.x += Math.sin(t * 7.1) * 0.0008;
    s.camPos.y += Math.sin(t * 5.3) * 0.0008;
    cam.current.position.copy(s.camPos);
    cam.current.quaternion.copy(s.camQuat);
    if (headProxy.current) {
      headProxy.current.position.copy(s.headPos);
      headProxy.current.quaternion.copy(s.lookQuat);
    }

    // Head follows the camera (looks down when reviewing)
    const headLocal = head.current.parent!;
    const hq = s.lookQuat.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((1 - s.raise) * 0.55, 0, s.raise * 0.08)));
    // convert root-space quaternion into the head parent's space
    const parentQ = new THREE.Quaternion();
    headLocal.getWorldQuaternion(parentQ);
    const rootQ = new THREE.Quaternion();
    root.current.getWorldQuaternion(rootQ);
    head.current.quaternion.copy(parentQ.invert().multiply(rootQ).multiply(hq));

    // ---- arms: right hand on the grip, left hand cradling the lens ----
    s.handR.set(-0.056, -0.02, 0.02).applyQuaternion(s.camQuat).add(s.camPos);
    s.handL.set(0.0, -0.05, 0.09).applyQuaternion(s.camQuat).add(s.camPos);
    chest.current.localToWorld(s.shoulderR.copy(s.shoulderLocalR));
    chest.current.localToWorld(s.shoulderL.copy(s.shoulderLocalL));
    root.current.worldToLocal(s.shoulderR);
    root.current.worldToLocal(s.shoulderL);
    s.poleR.copy(s.shoulderR).add(V(-0.35, -0.45, -0.1));
    s.poleL.copy(s.shoulderL).add(V(0.15, -0.6, 0.05));
    armR.current?.update(s.handR, s.poleR);
    armL.current?.update(s.handL, s.poleL);

    // ---- shutter bursts while the camera is at the eye ----
    if (s.raise > 0.95 && t > s.nextShot) {
      fireShutter();
      s.burst += 1;
      if (s.burst < 3) s.nextShot = t + 0.14;
      else {
        s.burst = 0;
        s.nextShot = t + 2.2 + ((t * 13.37) % 1) * 2.5;
      }
    }
  });

  return (
    <group
      ref={(g) => {
        root.current = g;
      }}
      position={[x, 0, z]}
      rotation-y={yaw}
    >
      {/* Legs */}
      {[0, 1].map((i) => (
        <group key={i}>
          <mesh ref={(r) => { thighs.current[i] = r; }} material={m.suit} castShadow>
            <cylinderGeometry args={[0.058, 0.07, 1, 14]} />
          </mesh>
          <mesh ref={(r) => { knees.current[i] = r; }} material={m.suit}>
            <sphereGeometry args={[0.058, 12, 10]} />
          </mesh>
          <mesh ref={(r) => { shins.current[i] = r; }} material={m.suit} castShadow>
            <cylinderGeometry args={[0.052, 0.056, 1, 14]} />
          </mesh>
        </group>
      ))}
      {/* Shoes */}
      <mesh material={m.shoe} position={[0.13, 0.04, 0.17]} rotation-y={0.12} scale={[0.055, 0.04, 0.14]} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>
      <mesh material={m.shoe} position={[-0.14, 0.04, -0.09]} rotation-y={-0.3} scale={[0.055, 0.04, 0.14]} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>

      <group ref={pelvis}>
        <mesh geometry={geo.hips} material={m.suit} castShadow />
        {/* Camera bag on the hip */}
        <mesh material={m.camGrip} position={[0.19, -0.04, -0.02]} scale={[0.05, 0.12, 0.13]}>
          <boxGeometry />
        </mesh>
        <group ref={chest} position-y={0.02}>
          <mesh geometry={geo.torso} material={m.shirt} castShadow />
          {/* Camera strap across the chest */}
          <mesh geometry={geo.strap} material={m.camGrip} position={[0, 0.3, 0.02]} rotation={[0, 0, 0.9]} scale={[1, 1.2, 0.55]} />
          {[s.shoulderLocalR, s.shoulderLocalL].map((p, i) => (
            <mesh key={i} material={m.shirt} position={p}>
              <sphereGeometry args={[0.06, 14, 10]} />
            </mesh>
          ))}
          <mesh material={m.skinPhoto} position-y={0.63}>
            <cylinderGeometry args={[0.046, 0.052, 0.1, 14]} />
          </mesh>
          <Head ref={head} position={[0, 0.75, 0.01]} radius={0.098} skin={m.skinPhoto} variant="photographer" />
        </group>
      </group>

      <Arm ref={armR} shoulder={s.shoulderR} upper={0.3} lower={0.28} radius={0.044} sleeve={m.shirt} forearm={m.shirt} skin={m.skinPhoto} />
      <Arm ref={armL} shoulder={s.shoulderL} upper={0.3} lower={0.28} radius={0.044} sleeve={m.shirt} forearm={m.shirt} skin={m.skinPhoto} />

      <group
        ref={(g) => {
          cam.current = g;
          sceneRefs.stillCamera = g;
        }}
      >
        <Suspense fallback={null}>
          <MirrorlessCamera />
        </Suspense>
      </group>
      <group
        ref={(g) => {
          headProxy.current = g;
          sceneRefs.photographerHead = g;
        }}
      />
    </group>
  );
}
