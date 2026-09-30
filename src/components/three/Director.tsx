"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { SHOTS, segmentFor, type Shot, type V3 } from "../hero/shots";
import { heroState, setShot } from "../hero/heroState";
import { sceneRefs } from "./sceneRefs";

type Resolved = { pos: THREE.Vector3; target: THREE.Vector3; focus: THREE.Vector3 };

/** Converts shot offsets [right, up, forward] into an object's local frame (+Z forward, -X right). */
function anchored(obj: THREE.Object3D, v: V3, out: THREE.Vector3) {
  return obj.localToWorld(out.set(-v[0], v[1], v[2]));
}

function resolve(shot: Shot, out: Resolved) {
  const anchor = shot.anchor === "lens" ? sceneRefs.stillCamera : shot.anchor === "photographer" ? sceneRefs.photographerHead : null;
  if (anchor) {
    anchor.updateWorldMatrix(true, false);
    anchored(anchor, shot.pos, out.pos);
    anchored(anchor, shot.target, out.target);
    if (shot.anchor === "lens") anchored(anchor, shot.focus, out.focus);
    else out.focus.set(...shot.focus);
  } else {
    out.pos.set(...shot.pos);
    out.target.set(...shot.target);
    out.focus.set(...shot.focus);
  }
  return out;
}

/**
 * The cinematographer. Scroll picks the shot; this component flies a virtual
 * cinema camera between shots with crane-like arcs, adds operator hand-held
 * motion and mouse parallax, and pulls focus with a slightly slower follow so
 * every move ends in a visible rack-focus.
 */
export function Director({ capture }: { capture?: number }) {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const A = useMemo<Resolved>(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), focus: new THREE.Vector3() }), []);
  const B = useMemo<Resolved>(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), focus: new THREE.Vector3() }), []);
  const want = useMemo(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), focus: new THREE.Vector3() }), []);
  const cur = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; focus: THREE.Vector3; fov: number; focusDist: number; range: number; bokeh: number } | null>(null);
  const progress = useRef(capture !== undefined ? capture / (SHOTS.length - 1) : heroState.progress);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const t = clock.elapsedTime;
    const p = capture !== undefined ? capture / (SHOTS.length - 1) : heroState.progress;
    progress.current = capture !== undefined ? p : THREE.MathUtils.damp(progress.current, p, 4, dt);

    const seg = segmentFor(progress.current);
    const sa = SHOTS[seg.from];
    const sb = SHOTS[seg.to];
    resolve(sa, A);
    resolve(sb, B);
    const e = seg.t;

    want.pos.lerpVectors(A.pos, B.pos, e);
    // Crane arc: lift the camera mid-move, proportional to travel distance
    const travel = A.pos.distanceTo(B.pos);
    want.pos.y += Math.sin(e * Math.PI) * Math.min(travel * 0.12, 0.45);
    want.target.lerpVectors(A.target, B.target, e);
    want.focus.lerpVectors(A.focus, B.focus, e);
    const fov = THREE.MathUtils.lerp(sa.fov, sb.fov, e);
    const range = THREE.MathUtils.lerp(sa.focusRange, sb.focusRange, e);
    const bokeh = THREE.MathUtils.lerp(sa.bokeh, sb.bokeh, e);
    const handheld = THREE.MathUtils.lerp(sa.handheld, sb.handheld, e);

    // Mouse parallax (in camera space, scaled by distance to subject)
    if (capture === undefined) easing.damp2(pointer, [heroState.pointer.x, heroState.pointer.y], 0.6, dt);
    fwd.subVectors(want.target, want.pos);
    const dist = fwd.length();
    fwd.normalize();
    right.crossVectors(fwd, THREE.Object3D.DEFAULT_UP).normalize();
    up.crossVectors(right, fwd).normalize();
    const par = Math.min(0.02 + dist * 0.025, 0.2);
    want.pos.addScaledVector(right, pointer.x * par).addScaledVector(up, pointer.y * par * 0.6);

    // Operator hand-held: layered low-frequency noise
    const h = handheld * (capture !== undefined ? 0 : 1);
    const hx = (Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3 + 1) * 0.3 + Math.sin(t * 5.1) * 0.1) * 0.006 * h;
    const hy = (Math.sin(t * 1.1 + 2) * 0.6 + Math.sin(t * 2.9) * 0.3 + Math.sin(t * 6.3 + 3) * 0.1) * 0.005 * h;
    want.pos.addScaledVector(right, hx).addScaledVector(up, hy);

    if (!cur.current) {
      cur.current = { pos: want.pos.clone(), target: want.target.clone(), focus: want.focus.clone(), fov, focusDist: want.focus.distanceTo(want.pos), range, bokeh };
    }
    const c = cur.current;
    if (capture !== undefined) {
      c.pos.copy(want.pos);
      c.target.copy(want.target);
      c.focus.copy(want.focus);
      c.fov = fov;
    } else {
      easing.damp3(c.pos, want.pos, 0.38, dt);
      easing.damp3(c.target, want.target, 0.32, dt);
      easing.damp3(c.focus, want.focus, 0.5, dt);
      c.fov = THREE.MathUtils.damp(c.fov, fov, 5, dt);
    }

    cam.position.copy(c.pos);
    cam.lookAt(c.target);
    // Dutch roll that breathes with the move
    cam.rotateZ(Math.sin(t * 0.7) * 0.003 * h + Math.sin(e * Math.PI) * 0.01 * (seg.from % 2 ? 1 : -1));
    if (Math.abs(cam.fov - c.fov) > 1e-3) {
      cam.fov = c.fov;
      cam.updateProjectionMatrix();
    }

    // ---- focus pull ----
    const wantDist = cam.position.distanceTo(c.focus);
    // Focus follows a beat behind the camera — the visible "rack"
    c.focusDist = capture !== undefined ? wantDist : THREE.MathUtils.damp(c.focusDist, wantDist, 2.4, dt);
    c.range = capture !== undefined ? range : THREE.MathUtils.damp(c.range, range, 3, dt);
    c.bokeh = capture !== undefined ? bokeh : THREE.MathUtils.damp(c.bokeh, bokeh, 3, dt);
    const dof = sceneRefs.dof;
    if (dof) {
      dof.cocMaterial.focusDistance = c.focusDist;
      dof.cocMaterial.focusRange = c.range;
      // Large kernels produce artefacts in the DOF pass — keep bokeh within a safe range.
      dof.bokehScale = Math.min(c.bokeh * Math.min(size.height / 900, 1.2), 6);
    }

    // ---- HUD sync ----
    ndc.copy(c.focus).project(cam);
    heroState.focus.x = ndc.x * 0.5 + 0.5;
    heroState.focus.y = 1 - (ndc.y * 0.5 + 0.5);
    heroState.focus.visible = ndc.z < 1 && Math.abs(ndc.x) < 1 && Math.abs(ndc.y) < 1;
    heroState.focusDistance = c.focusDist;
    heroState.focusLock = 1 - Math.min(Math.abs(c.focusDist - wantDist) / Math.max(range, 0.2), 1);
    setShot(seg.nearest);
  });

  return null;
}
