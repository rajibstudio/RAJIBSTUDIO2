"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Tuni-bulb string lights — thousands of them — drawn as one GPU point cloud per set.
 * Each bulb twinkles, chases along its strand or glows steadily, entirely in the shader.
 */
export const TWINKLE = 0;
export const CHASE = 1;
export const STEADY = 2;

export const GOLD = new THREE.Color(1.0, 0.6, 0.24);
export const WARM_WHITE = new THREE.Color(1.0, 0.78, 0.5);
export const FESTIVE = [new THREE.Color(1, 0.15, 0.1), new THREE.Color(0.2, 1, 0.3), new THREE.Color(0.25, 0.45, 1), new THREE.Color(1, 0.75, 0.1), new THREE.Color(1, 0.3, 0.8)];

type ColorFn = THREE.Color | ((i: number) => THREE.Color);

export class BulbBuilder {
  p: number[] = [];
  c: number[] = [];
  ph: number[] = [];
  md: number[] = [];
  sz: number[] = [];

  add(v: THREE.Vector3, color: THREE.Color, phase: number, mode = TWINKLE, size = 1) {
    this.p.push(v.x, v.y, v.z);
    this.c.push(color.r, color.g, color.b);
    this.ph.push(phase);
    this.md.push(mode);
    this.sz.push(size);
  }

  /** Bulbs every `spacing` metres along a polyline. */
  line(points: THREE.Vector3[], spacing: number, color: ColorFn, mode = TWINKLE, phase0 = Math.random(), size = 1) {
    let carry = 0;
    let i = 0;
    const v = new THREE.Vector3();
    for (let k = 0; k < points.length - 1; k++) {
      const a = points[k];
      const b = points[k + 1];
      const len = a.distanceTo(b);
      let d = carry;
      while (d <= len) {
        v.lerpVectors(a, b, len ? d / len : 0);
        this.add(v, typeof color === "function" ? color(i) : color, phase0 + i * 0.037, mode, size);
        i++;
        d += spacing;
      }
      carry = d - len;
    }
  }

  catenary(a: THREE.Vector3, b: THREE.Vector3, sag: number, spacing: number, color: ColorFn, mode = TWINKLE, phase0 = Math.random(), size = 1) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y -= Math.sin(t * Math.PI) * sag;
      pts.push(p);
    }
    this.line(pts, spacing, color, mode, phase0, size);
  }

  get count() {
    return this.ph.length;
  }
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aMode;
  attribute float aSize;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float b;
    if (aMode < 0.5) {
      b = 0.62 + 0.38 * sin(uTime * (1.3 + fract(aPhase * 7.13) * 2.2) + aPhase * 50.0);
    } else if (aMode < 1.5) {
      // clamp first: sin() can overshoot -1 slightly, and pow() of a negative number is NaN
      float w = clamp(0.5 + 0.5 * sin(uTime * 3.2 - aPhase * 26.0), 0.0, 1.0);
      b = 0.2 + 0.8 * w * w * w;
    } else {
      b = 1.0;
    }
    vColor = aColor * (0.55 + 1.9 * b);
    float s = uSize * aSize * uScale / max(-mv.z, 0.1);
    gl_PointSize = clamp(s, 1.5, 80.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.3, d);
    float k = max(1.0 - d, 0.0);
    float halo = k * k * 0.5;
    float a = core + halo;
    if (a < 0.01) discard;
    gl_FragColor = vec4(max(vColor * a, vec3(0.0)), 1.0);
  }
`;

export function Bulbs({ builder, size = 0.09 }: { builder: BulbBuilder; size?: number }) {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(builder.p, 3));
    g.setAttribute("aColor", new THREE.Float32BufferAttribute(builder.c, 3));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(builder.ph, 1));
    g.setAttribute("aMode", new THREE.Float32BufferAttribute(builder.md, 1));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(builder.sz, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: { uTime: { value: 0 }, uScale: { value: 800 }, uSize: { value: size } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [builder, size]);

  const buf = useMemo(() => new THREE.Vector2(), []);
  useFrame(({ clock, gl, camera }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 60;
    material.uniforms.uScale.value = gl.getDrawingBufferSize(buf).y / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
  });

  if (!builder.count) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
