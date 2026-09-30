"use client";

import { memo, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { Mandap } from "../three/Mandap";
import { Flowers } from "../three/Flowers";
import { Couple } from "../three/Couple";
import { Photographer } from "../three/Photographer";
import { Atmosphere } from "../three/Atmosphere";
import { House } from "./House";
import { Street } from "./Street";
import { Feast, People, Priest, Stage, Tattwa } from "./Rooms";
import { Sky, TourLights } from "./Atmos";
import { PhotoCapture, Player, ReadySignal } from "./Player";
import type { Tier } from "@/lib/device";

function TourCanvas({ tier, capture }: { tier: Tier; capture?: number }) {
  const maxDpr = capture !== undefined ? 1 : tier === "high" ? 1.5 : tier === "medium" ? 1.25 : 1;
  const [dpr, setDpr] = useState(maxDpr);
  const ceremonyTier = tier === "low" ? "medium" : tier;

  return (
    <Canvas
      frameloop={capture !== undefined ? "demand" : "always"}
      dpr={dpr}
      shadows={tier === "high" ? "percentage" : false}
      flat
      camera={{ fov: 62, near: 0.05, far: 160, position: [0, 2.3, 21.9] }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false, preserveDrawingBuffer: capture !== undefined }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      {capture === undefined && (
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
          onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
        />
      )}
      <Suspense fallback={null}>
        <TourLights tier={tier} />
        <Sky tier={tier} />
        <House tier={tier} />
        <Street tier={tier} />
        <Mandap tier={ceremonyTier} floor={false} backdrop={false} />
        <Flowers tier={ceremonyTier} />
        <Couple />
        <Photographer />
        <Priest />
        <Atmosphere tier={ceremonyTier} />
        <Stage />
        <Feast />
        <Tattwa />
        <People />
        <Player capture={capture} />
        <EffectComposer multisampling={tier === "high" ? 4 : 0} enableNormalPass={false}>
          <Bloom mipmapBlur intensity={0.95} luminanceThreshold={0.85} luminanceSmoothing={0.25} radius={0.72} />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
        <PhotoCapture />
        <ReadySignal capture={capture} />
      </Suspense>
    </Canvas>
  );
}

// Memoised: the page overlay re-renders on every zone/mode change, the 3D world must not.
export default memo(TourCanvas);
