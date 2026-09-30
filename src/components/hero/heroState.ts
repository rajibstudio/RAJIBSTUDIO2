/**
 * Tiny mutable store shared between the DOM overlay (HUD, captions) and the WebGL scene.
 * It is deliberately NOT React state: it is written/read every frame without re-rendering.
 * Discrete changes (active shot, shutter) are broadcast via `subscribe`.
 */
type Listener = () => void;

export const heroState = {
  /** 0..1 scroll progress through the pinned hero. */
  progress: 0,
  /** Normalised pointer, -1..1. */
  pointer: { x: 0, y: 0 },
  /** Index of the shot we are currently closest to. */
  shot: 0,
  /** Screen-space (0..1) position of the current focus point, for the AF reticle. */
  focus: { x: 0.5, y: 0.5, visible: true },
  /** 0..1 — how sharp the lens currently is (1 = focus locked). */
  focusLock: 1,
  /** Current (animated) focus distance in metres, for the HUD readout. */
  focusDistance: 4,
  /** performance.now() of the last still-camera shutter release. */
  lastShutter: 0,
  /** True once the WebGL scene has rendered its first frames. */
  sceneReady: false,
};

const listeners = new Set<Listener>();

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emit() {
  listeners.forEach((l) => l());
}

export function setShot(i: number) {
  if (heroState.shot !== i) {
    heroState.shot = i;
    emit();
  }
}

export function fireShutter() {
  heroState.lastShutter = performance.now();
  emit();
}
