"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { materials } from "./materials";
import { heroState } from "../hero/heroState";
import { asset } from "@/lib/site";

/**
 * A full-frame mirrorless body with a fast 85mm prime.
 * Local frame: origin at the body centre, lens pointing +Z, top +Y.
 *
 * Animated parts:
 *  - 9-blade aperture iris (stops down on every shutter release, opens wide in the lens shot)
 *  - focus ring rotation while the photographer racks focus
 *  - AF-assist lamp blink before capture
 *  - rear LCD that shows the captured frame (image review)
 */
const BLADES = 9;

export const MirrorlessCamera = forwardRef<THREE.Group>(function MirrorlessCamera(_props, ref) {
  const m = materials();
  const focusRing = useRef<THREE.Mesh>(null);
  const blades = useRef<THREE.Group[]>([]);
  const screenMat = useMemo(() => m.screen.clone(), [m]);
  const lampMat = useMemo(() => m.afLamp.clone(), [m]);
  const lcd = useLoader(THREE.TextureLoader, asset("/images/scene/lcd.jpg"));

  useEffect(() => {
    lcd.colorSpace = THREE.SRGBColorSpace;
    screenMat.map = lcd;
    screenMat.needsUpdate = true;
  }, [lcd, screenMat]);

  const bladeGeo = useMemo(() => {
    // Curved blade shape pivoting on the outer ring
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(0.012, -0.004, 0.026, 0.004);
    s.quadraticCurveTo(0.02, 0.016, 0.004, 0.018);
    s.quadraticCurveTo(-0.002, 0.009, 0, 0);
    return new THREE.ShapeGeometry(s, 8);
  }, []);

  const frontGlass = useMemo(() => new THREE.SphereGeometry(0.052, 48, 24, 0, Math.PI * 2, 0, 0.72), []);
  const openness = useRef(0.6);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const now = performance.now();
    const since = (now - heroState.lastShutter) / 1000;

    // Aperture: wide open for the lens hero shot, otherwise working aperture; snaps down on release
    const target = heroState.shot === 7 ? 1 : 0.62 + Math.sin(t * 0.3) * 0.04;
    openness.current = THREE.MathUtils.damp(openness.current, target, 2.2, dt);
    const snap = since < 0.16 ? 1 - Math.sin((since / 0.16) * Math.PI) * 0.75 : 1;
    const open = openness.current * snap;
    blades.current.forEach((b, i) => {
      if (!b) return;
      b.rotation.z = (i / BLADES) * Math.PI * 2;
      const blade = b.children[0] as THREE.Object3D;
      blade.rotation.z = -0.15 - (1 - open) * 1.05;
    });

    // Focus ring breathes with the photographer's focus pulls
    if (focusRing.current) focusRing.current.rotation.z = Math.sin(t * 0.8) * 0.35 + Math.sin(t * 2.3) * 0.05;

    // AF lamp: brief red glow just before and during capture
    const lamp = since < 0.35 ? 1 - since / 0.35 : 0;
    lampMat.color.setRGB(0.2 + lamp * 6, 0.03 + lamp * 0.6, 0.02 + lamp * 0.3);

    // Rear screen: bright review after capture, dim live view otherwise
    const review = since < 2.5 ? 1 : 0.35;
    screenMat.color.setScalar(THREE.MathUtils.damp(screenMat.color.r, review, 6, dt));
  });

  return (
    <group ref={ref}>
      {/* Body */}
      <RoundedBox args={[0.128, 0.078, 0.046]} radius={0.008} smoothness={4} material={m.camBody} castShadow />
      {/* Grip (camera right = -X) */}
      <RoundedBox args={[0.036, 0.074, 0.064]} radius={0.014} smoothness={4} position={[-0.05, -0.002, 0.012]} material={m.camGrip} castShadow />
      {/* EVF hump + eyecup */}
      <RoundedBox args={[0.05, 0.03, 0.05]} radius={0.008} smoothness={3} position={[0.018, 0.045, -0.002]} material={m.camBody} />
      <RoundedBox args={[0.042, 0.03, 0.02]} radius={0.008} smoothness={3} position={[0.018, 0.043, -0.03]} material={m.camGrip} />
      {/* Hot shoe */}
      <mesh position={[0.018, 0.062, 0]} material={m.camMetal}>
        <boxGeometry args={[0.022, 0.004, 0.02]} />
      </mesh>
      {/* Top dials & shutter button */}
      <mesh position={[-0.048, 0.043, 0.024]} material={m.camMetal}>
        <cylinderGeometry args={[0.007, 0.007, 0.006, 20]} />
      </mesh>
      <mesh position={[-0.03, 0.043, -0.006]} material={m.camMetal}>
        <cylinderGeometry args={[0.012, 0.012, 0.008, 28]} />
      </mesh>
      <mesh position={[0.05, 0.043, -0.004]} material={m.camMetal}>
        <cylinderGeometry args={[0.011, 0.011, 0.007, 28]} />
      </mesh>
      {/* Rear LCD */}
      <mesh position={[0.008, -0.006, -0.0235]} rotation-y={Math.PI} material={screenMat}>
        <planeGeometry args={[0.078, 0.052]} />
      </mesh>
      {/* AF-assist lamp */}
      <mesh position={[0.046, 0.024, 0.0235]} material={lampMat}>
        <sphereGeometry args={[0.0035, 10, 8]} />
      </mesh>
      {/* Strap lugs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.066, 0.028, 0]} rotation-z={Math.PI / 2} material={m.camMetal}>
          <torusGeometry args={[0.005, 0.0015, 6, 12]} />
        </mesh>
      ))}

      {/* ---- Lens (85mm f/1.2) ---- */}
      <group position={[0.004, -0.004, 0.023]}>
        <mesh position-z={0.004} rotation-x={Math.PI / 2} material={m.camMetal}>
          <cylinderGeometry args={[0.031, 0.031, 0.008, 40]} />
        </mesh>
        <mesh position-z={0.022} rotation-x={Math.PI / 2} material={m.camBody}>
          <cylinderGeometry args={[0.041, 0.036, 0.028, 48]} />
        </mesh>
        {/* Aperture/print ring */}
        <mesh position-z={0.045} rotation-x={Math.PI / 2} material={m.lensPrint}>
          <cylinderGeometry args={[0.042, 0.042, 0.018, 64, 1, true]} />
        </mesh>
        {/* Focus ring (rubber knurl) */}
        <mesh ref={focusRing} position-z={0.078} rotation-x={Math.PI / 2} material={m.camKnurl}>
          <cylinderGeometry args={[0.046, 0.046, 0.046, 64, 1, true]} />
        </mesh>
        <mesh position-z={0.11} rotation-x={Math.PI / 2} material={m.camBody}>
          <cylinderGeometry args={[0.048, 0.046, 0.02, 64, 1, true]} />
        </mesh>
        {/* Gold accent ring */}
        <mesh position-z={0.1} rotation-x={Math.PI / 2} material={m.gold}>
          <torusGeometry args={[0.0465, 0.0012, 6, 64]} />
        </mesh>
        {/* Front bezel */}
        <mesh position-z={0.121} material={m.camBody}>
          <ringGeometry args={[0.038, 0.048, 64]} />
        </mesh>
        {/* Inner darkness + iris */}
        <mesh position-z={0.085} rotation-x={Math.PI / 2} material={m.lensInner}>
          <cylinderGeometry args={[0.038, 0.038, 0.07, 48, 1, true]} />
        </mesh>
        <mesh position-z={0.078} material={m.lensInner}>
          <circleGeometry args={[0.039, 40]} />
        </mesh>
        <group position-z={0.098}>
          {Array.from({ length: BLADES }).map((_, i) => (
            <group key={i} ref={(g) => { if (g) blades.current[i] = g; }}>
              <group position={[0, 0.032, 0]}>
                <mesh geometry={bladeGeo} material={m.blade} scale={1.25} />
              </group>
            </group>
          ))}
        </group>
        {/* Front element — coated glass with iridescent purple/green reflections */}
        <mesh geometry={frontGlass} material={m.lensGlass} position-z={0.083} rotation-x={Math.PI / 2} />
      </group>
    </group>
  );
});
