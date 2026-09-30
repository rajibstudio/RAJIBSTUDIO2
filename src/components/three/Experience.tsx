"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { Mandap } from "./Mandap";
import { Flowers } from "./Flowers";
import { Couple } from "./Couple";
import { Photographer } from "./Photographer";
import { Lighting } from "./Lighting";
import { Atmosphere } from "./Atmosphere";
import { Director } from "./Director";
import { PostFX } from "./PostFX";
import { heroState, emit } from "../hero/heroState";
import type { Tier } from "@/lib/device";

type Props = {
  tier: Exclude<Tier, "low">;
  /** Pause rendering when the hero is off-screen. */
  active: boolean;
  onReady?: () => void;
  /** Render a single fixed shot (used to pre-render the mobile fallback stills). */
  capture?: number;
};

/** Signals readiness after a few rendered frames, so the poster can cross-fade to live 3D. */
function ReadySignal({ onReady, frames: needed = 8, demand = false }: { onReady?: () => void; frames?: number; demand?: boolean }) {
  const frames = useRef(0);
  const done = useRef(false);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (demand) invalidate();
  }, [demand, invalidate]);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (demand) invalidate();
    if (frames.current > needed) {
      done.current = true;
      heroState.sceneReady = true;
      emit();
      onReady?.();
    }
  });
  return null;
}

export default function Experience({ tier, active, onReady, capture }: Props) {
  const [quality, setQuality] = useState<"high" | "medium" | "low">(tier);
  // Progressive loading: core set first, dense details (thousands of flowers, particles) a moment later.
  const [details, setDetails] = useState(capture !== undefined);

  useEffect(() => {
    if (details) return;
    const id = (window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300)))(() => setDetails(true));
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id as number);
  }, [details]);

  const maxDpr = capture !== undefined ? 1 : tier === "high" ? 1.75 : 1.25;

  return (
    <Canvas
      frameloop={capture !== undefined ? "demand" : active ? "always" : "never"}
      dpr={[1, maxDpr]}
      shadows={quality !== "low" ? "percentage" : false}
      flat
      camera={{ fov: 34, near: 0.02, far: 60, position: [-0.9, 2.15, 9.4] }}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        stencil: false,
        preserveDrawingBuffer: capture !== undefined,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NoToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      {capture === undefined && (
        <PerformanceMonitor
        onDecline={() => setQuality((q) => (q === "high" ? "medium" : "low"))}
        flipflops={2}
          onFallback={() => setQuality("low")}
        />
      )}
      {capture === undefined && <AdaptiveDpr pixelated={false} />}
      <Suspense fallback={null}>
        <Lighting tier={tier} />
        <Mandap tier={quality === "high" ? "high" : "medium"} />
        <Couple />
        <Photographer />
        {details && (
          <>
            <Flowers tier={tier} />
            <Atmosphere tier={tier} />
          </>
        )}
        <Director capture={capture} />
        {!(typeof window !== "undefined" && window.location.search.includes("nofx")) && <PostFX quality={quality} />}
        <ReadySignal onReady={onReady} frames={capture !== undefined ? 24 : 8} demand={capture !== undefined} />
      </Suspense>
    </Canvas>
  );
}
