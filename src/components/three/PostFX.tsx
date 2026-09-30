"use client";

import { EffectComposer, Bloom, DepthOfField, Vignette, Noise, ChromaticAberration, ToneMapping, BrightnessContrast, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import { useMemo } from "react";
import * as THREE from "three";
import { sceneRefs } from "./sceneRefs";

/**
 * Film pipeline: depth of field (focus driven by the Director), highlight bloom
 * for flames and fairy lights, subtle lens fringing, film grain, vignette and a
 * filmic tone curve.
 */
export function PostFX({ quality }: { quality: "high" | "medium" | "low" }) {
  const ca = useMemo(() => new THREE.Vector2(0.0006, 0.0005), []);
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {quality !== "low" ? (
        <DepthOfField
          ref={(e: DepthOfFieldEffect | null) => {
            sceneRefs.dof = e;
          }}
          focusDistance={4}
          focusRange={2}
          bokehScale={3}
          resolutionScale={quality === "high" ? 0.75 : 0.5}
        />
      ) : (
        <></>
      )}
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.82} luminanceSmoothing={0.2} radius={0.7} />
      {quality === "high" ? <ChromaticAberration offset={ca} radialModulation modulationOffset={0.35} /> : <></>}
      <HueSaturation saturation={-0.04} />
      <BrightnessContrast contrast={0.06} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.28} darkness={0.72} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
    </EffectComposer>
  );
}
