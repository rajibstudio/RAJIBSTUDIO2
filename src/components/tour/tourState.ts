import { STOPS, type Pose } from "./layout";

/**
 * Shared, mutable walkthrough state. Written every frame by the player controller and
 * read by the DOM overlay (HUD, minimap) without React re-renders; discrete changes
 * (mode, zone, guided step) are broadcast through `subscribe`.
 */
export type Mode = "loading" | "intro" | "explore" | "paused" | "guided";
type Listener = () => void;
type Jump = { to: Pose; t: number; done: boolean; then: Mode };
type Flight = { from: Pose & { eye: number }; to: Pose; t: number; dur: number };

export const tour = {
  mode: "loading" as Mode,
  ready: false,
  pos: { x: 0, z: 21.9 },
  eye: 2.3,
  yaw: 0,
  pitch: 0.2,
  zone: "lane",
  keys: new Set<string>(),
  stick: { x: 0, y: 0, run: false },
  look: { x: 0, y: 0 },
  fade: 0,
  jump: null as Jump | null,
  flight: null as Flight | null,
  guided: { index: 0, t: 0 },
  photo: false,
  onPhoto: null as ((url: string) => void) | null,
  calm: false, // prefers-reduced-motion: no head bob, no fireworks
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

export function setMode(m: Mode) {
  if (tour.mode !== m) {
    tour.mode = m;
    emit();
  }
}

/** Teleport with a quick fade through black. */
export function jumpTo(index: number, then: Mode = "explore") {
  const s = STOPS[index];
  if (s) tour.jump = { to: s, t: 0, done: false, then };
}

/** Smooth camera flight (used from the intro, where the path is clear). */
export function flyTo(index: number) {
  const s = STOPS[index];
  tour.flight = { from: { x: tour.pos.x, z: tour.pos.z, yaw: tour.yaw, pitch: tour.pitch, eye: tour.eye }, to: s, t: 0, dur: 2.2 };
}

export function startGuided(fromIntro: boolean) {
  tour.guided = { index: 0, t: 0 };
  if (fromIntro) flyTo(0);
  else jumpTo(0, "guided");
  setMode("guided");
  emit();
}
