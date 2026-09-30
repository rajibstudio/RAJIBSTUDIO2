"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EYE, OUTER, STOPS, ZONES, groundAt, moveBy, zoneAt } from "./layout";
import { emit, jumpTo, setMode, tour } from "./tourState";

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function shortest(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
const GUIDE_DWELL = 7.5;

/**
 * First-person walker: WASD / arrows / joystick to move, mouse / drag / touch to look,
 * collisions and steps from the floor plan, a gentle head bob, fade-through-black
 * teleports and an automatic guided tour.
 */
export function Player({ capture }: { capture?: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const vel = useRef({ x: 0, z: 0 });
  const stride = useRef(0);

  useEffect(() => {
    camera.rotation.order = "YXZ";
  }, [camera]);
  useEffect(() => {
    camera.fov = size.width < size.height ? 74 : 62;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    let bob = 0;

    if (capture !== undefined) {
      const s = STOPS[capture] ?? STOPS[0];
      Object.assign(tour.pos, { x: s.x, z: s.z });
      tour.yaw = s.yaw;
      tour.pitch = s.pitch;
      tour.eye = groundAt(s.x, s.z) + EYE;
    } else if (tour.flight) {
      tour.look.x = tour.look.y = 0;
      const f = tour.flight;
      f.t += dt;
      const k = ease(Math.min(f.t / f.dur, 1));
      tour.pos.x = THREE.MathUtils.lerp(f.from.x, f.to.x, k);
      tour.pos.z = THREE.MathUtils.lerp(f.from.z, f.to.z, k);
      tour.eye = THREE.MathUtils.lerp(f.from.eye, groundAt(f.to.x, f.to.z) + EYE, k);
      tour.yaw = f.from.yaw + shortest(f.from.yaw, f.to.yaw) * k;
      tour.pitch = THREE.MathUtils.lerp(f.from.pitch, f.to.pitch, k);
      if (f.t >= f.dur) {
        tour.flight = null;
        tour.guided.t = 0;
      }
    } else if (tour.jump) {
      tour.look.x = tour.look.y = 0;
      const j = tour.jump;
      j.t += dt;
      const OUT = 0.35;
      const HOLD = 0.12;
      const IN = 0.5;
      if (j.t < OUT) tour.fade = j.t / OUT;
      else {
        if (!j.done) {
          j.done = true;
          Object.assign(tour.pos, { x: j.to.x, z: j.to.z });
          tour.yaw = j.to.yaw;
          tour.pitch = j.to.pitch;
          tour.eye = groundAt(j.to.x, j.to.z) + EYE;
          vel.current.x = vel.current.z = 0;
        }
        const k = (j.t - OUT - HOLD) / IN;
        tour.fade = k <= 0 ? 1 : Math.max(0, 1 - k);
        if (k >= 1) {
          tour.jump = null;
          tour.fade = 0;
          tour.guided.t = 0;
          setMode(j.then);
        }
      }
    } else if (tour.mode === "loading" || tour.mode === "intro") {
      // attract camera drifting along the lane, looking up at the lit house
      const x = Math.sin(t * 0.06) * 3.2;
      tour.pos.x = x;
      tour.pos.z = 21.9;
      tour.eye = 2.3 + Math.sin(t * 0.09) * 0.25;
      const tx = x * 0.25;
      tour.yaw = Math.atan2(-(tx - x), -(OUTER - tour.pos.z));
      tour.pitch = Math.atan2(5.4 - tour.eye, Math.hypot(tx - x, OUTER - tour.pos.z));
    } else if (tour.mode === "explore") {
      const k = tour.keys;
      const key = (...codes: string[]) => (codes.some((c) => k.has(c)) ? 1 : 0);
      tour.yaw += (key("ArrowLeft", "KeyQ") - key("ArrowRight", "KeyE")) * 1.9 * dt;
      tour.yaw -= tour.look.x * 0.0024;
      tour.pitch = clamp(tour.pitch - tour.look.y * 0.0024, -1.2, 1.2);
      tour.look.x = tour.look.y = 0;

      let f = clamp(key("KeyW", "ArrowUp") - key("KeyS", "ArrowDown") + tour.stick.y, -1, 1);
      let s = clamp(key("KeyD") - key("KeyA") + tour.stick.x, -1, 1);
      const len = Math.hypot(f, s);
      if (len > 1) {
        f /= len;
        s /= len;
      }
      const speed = key("ShiftLeft", "ShiftRight") || tour.stick.run ? 4.3 : 2.2;
      const sin = Math.sin(tour.yaw);
      const cos = Math.cos(tour.yaw);
      const v = vel.current;
      v.x = damp(v.x, (-sin * f + cos * s) * speed, 10, dt);
      v.z = damp(v.z, (-cos * f - sin * s) * speed, 10, dt);
      const bx = tour.pos.x;
      const bz = tour.pos.z;
      moveBy(tour.pos, v.x * dt, v.z * dt);
      const moved = Math.hypot(tour.pos.x - bx, tour.pos.z - bz);
      if (moved < Math.hypot(v.x, v.z) * dt * 0.3) {
        v.x *= 0.5;
        v.z *= 0.5;
      }
      tour.eye = damp(tour.eye, groundAt(tour.pos.x, tour.pos.z) + EYE, 12, dt);
      if (!tour.calm) {
        stride.current += moved;
        bob = -Math.abs(Math.sin((stride.current * Math.PI) / 0.72)) * Math.min(Math.hypot(v.x, v.z) / 2.2, 1.4) * 0.022;
      }
    } else if (tour.mode === "guided") {
      const g = tour.guided;
      g.t += dt;
      const s = STOPS[g.index];
      tour.yaw = s.yaw + Math.sin(g.t * 0.32) * 0.2;
      tour.pitch = s.pitch + Math.sin(g.t * 0.21) * 0.035;
      tour.eye = damp(tour.eye, groundAt(tour.pos.x, tour.pos.z) + EYE, 6, dt);
      if (g.t > GUIDE_DWELL) {
        if (g.index + 1 >= STOPS.length) setMode("explore");
        else {
          g.index += 1;
          g.t = 0;
          emit();
          jumpTo(g.index, "guided");
        }
      }
    }

    const z = zoneAt(tour.pos.x, tour.pos.z);
    if (z !== tour.zone) {
      tour.zone = z;
      emit();
    }
    camera.position.set(tour.pos.x, tour.eye + bob, tour.pos.z);
    camera.rotation.set(tour.pitch, tour.yaw, 0);
  });

  return null;
}

/** Saves the current frame as a JPEG with a Rajib Studio caption strip. Runs right after post-processing. */
export function PhotoCapture() {
  const gl = useThree((s) => s.gl);
  useFrame(() => {
    if (!tour.photo) return;
    tour.photo = false;
    const src = gl.domElement;
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(src, 0, 0);
    const w = c.width;
    const h = c.height;
    const band = Math.round(h * 0.14);
    const g = ctx.createLinearGradient(0, h - band * 1.6, 0, h);
    g.addColorStop(0, "rgba(7,5,6,0)");
    g.addColorStop(1, "rgba(7,5,6,0.85)");
    ctx.fillStyle = g;
    ctx.fillRect(0, h - band * 1.6, w, band * 1.6);
    const css = getComputedStyle(document.documentElement);
    const display = css.getPropertyValue("--font-display").trim() || "serif";
    const bn = css.getPropertyValue("--font-bengali").trim() || "serif";
    const pad = Math.round(w * 0.035);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f3ead8";
    ctx.font = `400 ${Math.round(band * 0.34)}px ${display}`;
    ctx.fillText("RAJIB STUDIO", pad, h - band * 0.52);
    ctx.fillStyle = "#e4c786";
    ctx.font = `500 ${Math.round(band * 0.2)}px ${bn}`;
    ctx.fillText("স্মৃতিকে করি চিরস্থায়ী", pad, h - band * 0.2);
    const zone = ZONES.find((zz) => zz.id === tour.zone);
    ctx.textAlign = "right";
    ctx.fillStyle = "#f3ead8";
    ctx.font = `400 ${Math.round(band * 0.2)}px ${display}`;
    ctx.fillText(`${zone?.name ?? "Biye Bari"} · ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, w - pad, h - band * 0.3);
    c.toBlob((blob) => blob && tour.onPhoto?.(URL.createObjectURL(blob)), "image/jpeg", 0.92);
  }, 2);
  return null;
}

/** Marks the scene ready after a few rendered frames (and, for still captures, keeps rendering until then). */
export function ReadySignal({ capture }: { capture?: number }) {
  const frames = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (capture !== undefined) invalidate();
  }, [capture, invalidate]);
  useFrame(() => {
    frames.current += 1;
    if (capture !== undefined && frames.current < 30) invalidate();
    if (frames.current === (capture !== undefined ? 30 : 10)) {
      tour.ready = true;
      if (tour.mode === "loading") tour.mode = "intro";
      emit();
      if (capture !== undefined) (window as unknown as { __sceneReady: boolean }).__sceneReady = true;
    }
  });
  return null;
}
