"use client";

import { useEffect, useState } from "react";

/**
 * Rendering tiers
 *  - high:   desktop, capable GPU → full 3D scene + depth of field + reflections
 *  - medium: tablets / modest laptops → 3D with fewer instances, no reflections, cheaper post
 *  - low:    phones, low memory, software GL, reduced-motion or save-data → no WebGL at all,
 *            a pre-rendered cinematic fallback is shown instead.
 */
export type Tier = "high" | "medium" | "low";

function webglInfo(): { ok: boolean; software: boolean } {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return { ok: false, software: false };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { ok: true, software: /swiftshader|llvmpipe|software|basic render/i.test(renderer) };
  } catch {
    return { ok: false, software: false };
  }
}

export function detectTier(): Tier {
  if (typeof window === "undefined") return "low";
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("tier");
  if (forced === "high" || forced === "medium" || forced === "low") return forced;

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const width = Math.min(window.innerWidth, window.screen?.width ?? window.innerWidth);
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const saveData = !!nav.connection?.saveData;

  if (reducedMotion || saveData) return "low";
  const gl = webglInfo();
  if (!gl.ok || gl.software) return "low";
  if (width < 768 || memory <= 2 || cores <= 2) return "low";
  if (coarse || width < 1200 || memory <= 4 || cores <= 4) return "medium";
  return "high";
}

/** Returns null until detection has run on the client (avoids hydration mismatch). */
export function useTier(): Tier | null {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => setTier(detectTier()), []);
  return tier;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
