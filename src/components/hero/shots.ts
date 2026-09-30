/**
 * The shot list — the "screenplay" for the hero. Shared by the WebGL director,
 * the viewfinder HUD and the lightweight (non-WebGL) fallback.
 *
 * Coordinates are metres. The mandap is centred on the origin, the couple faces
 * each other on the platform and the photographer stands in front-right of them.
 */
import { asset } from "@/lib/site";

export type V3 = [number, number, number];

export type Anchor = "world" | "photographer" | "lens";

export type Shot = {
  id: string;
  title: string;
  caption: string;
  /** How the positions below are interpreted. */
  anchor: Anchor;
  /**
   * world:        absolute positions
   * photographer: offsets in the photographer's head frame  [right, up, forward]
   * lens:         offsets in the still camera's frame       [right, up, forward]
   */
  pos: V3;
  target: V3;
  focus: V3;
  /** Vertical field of view (degrees). */
  fov: number;
  /** Depth-of-field: world-space range that stays sharp, and bokeh size. */
  focusRange: number;
  bokeh: number;
  /** Handheld intensity multiplier. */
  handheld: number;
  /** Display settings for the HUD. */
  iso: number;
  shutter: string;
  aperture: string;
  /** Pre-rendered still for the fallback experience + AF point (0..1 screen space). */
  still: string;
  stillFocus: [number, number];
};

export const LAYOUT = {
  platformTop: 0.24,
  groom: { x: -0.36, z: 0.05, rotY: 0.95 },
  bride: { x: 0.36, z: 0.05, rotY: -0.95 },
  photographer: { x: 1.25, z: 3.1 },
  fire: { x: 0, z: 0.9 },
  /** Face centres in world space (used for focus & framing). */
  groomFace: [-0.34, 1.86, 0.07] as V3,
  brideFace: [0.34, 1.73, 0.07] as V3,
  coupleCentre: [0, 1.76, 0.06] as V3,
};

const C = LAYOUT.coupleCentre;
const B = LAYOUT.brideFace;
const G = LAYOUT.groomFace;

export const SHOTS: Shot[] = [
  {
    id: "wide",
    title: "The Mandap",
    caption: "Godhuli lagna — the auspicious hour of dusk.",
    anchor: "world",
    pos: [-0.9, 2.15, 9.4],
    target: [0.2, 1.38, 0],
    focus: C,
    fov: 34,
    focusRange: 4.5,
    bokeh: 1.6,
    handheld: 0.6,
    iso: 800,
    shutter: "1/50",
    aperture: "T2.8",
    still: asset("/images/scene/shot-0.jpg"),
    stillFocus: [0.47, 0.42],
  },
  {
    id: "pov",
    title: "Behind the Lens",
    caption: "Our photographer finds the frame before the moment arrives.",
    anchor: "world",
    pos: [2.3, 2.2, 5.0],
    target: [0.05, 1.62, 0.1],
    focus: C,
    fov: 30,
    focusRange: 1.6,
    bokeh: 3.2,
    handheld: 1,
    iso: 1250,
    shutter: "1/50",
    aperture: "T2.0",
    still: asset("/images/scene/shot-1.jpg"),
    stillFocus: [0.44, 0.4],
  },
  {
    id: "ots",
    title: "Over the Shoulder",
    caption: "Mala Badal — garlands exchanged, framed through the viewfinder.",
    anchor: "photographer",
    pos: [0.36, 0.08, -0.5],
    target: [0, -0.02, 3],
    focus: C,
    fov: 26,
    focusRange: 1.2,
    bokeh: 4,
    handheld: 1.2,
    iso: 1600,
    shutter: "1/50",
    aperture: "T1.8",
    still: asset("/images/scene/shot-2.jpg"),
    stillFocus: [0.5, 0.42],
  },
  {
    id: "portrait",
    title: "The Portrait",
    caption: "Two families, one frame. Warm tungsten, soft shadows.",
    anchor: "world",
    pos: [0.1, 1.8, 2.4],
    target: [0, 1.68, 0.05],
    focus: C,
    fov: 24,
    focusRange: 0.55,
    bokeh: 5,
    handheld: 0.8,
    iso: 1600,
    shutter: "1/50",
    aperture: "T1.5",
    still: asset("/images/scene/shot-3.jpg"),
    stillFocus: [0.5, 0.36],
  },
  {
    id: "bride",
    title: "Kone Bou",
    caption: "Chandan, sola mukut and a lowered gaze.",
    anchor: "world",
    pos: [-0.2, 1.66, 2.15],
    target: [B[0] - 0.02, B[1] - 0.06, B[2]],
    focus: B,
    fov: 19,
    focusRange: 0.28,
    bokeh: 5.5,
    handheld: 0.7,
    iso: 2000,
    shutter: "1/50",
    aperture: "T1.4",
    still: asset("/images/scene/shot-4.jpg"),
    stillFocus: [0.5, 0.4],
  },
  {
    id: "groom",
    title: "Bor",
    caption: "The topor sits high; the smile gives him away.",
    anchor: "world",
    pos: [0.3, 1.8, 2.2],
    target: [G[0] + 0.02, G[1] - 0.06, G[2]],
    focus: G,
    fov: 19,
    focusRange: 0.28,
    bokeh: 5.5,
    handheld: 0.7,
    iso: 2000,
    shutter: "1/50",
    aperture: "T1.4",
    still: asset("/images/scene/shot-5.jpg"),
    stillFocus: [0.5, 0.4],
  },
  {
    id: "bokeh",
    title: "Couple, in Bokeh",
    caption: "135mm, wide open. Rajnigandha and fairy lights melt into gold.",
    anchor: "world",
    pos: [0.12, 1.68, 5.6],
    target: [0, 1.66, 0.05],
    focus: C,
    fov: 10.5,
    focusRange: 0.7,
    bokeh: 5.5,
    handheld: 0.5,
    iso: 1000,
    shutter: "1/100",
    aperture: "T2.0",
    still: asset("/images/scene/shot-6.jpg"),
    stillFocus: [0.5, 0.38],
  },
  {
    id: "lens",
    title: "The Lens",
    caption: "Aperture opens. The memory is made — চিরস্থায়ী.",
    anchor: "lens",
    pos: [0.07, 0.035, 0.52],
    target: [0, 0, 0.13],
    focus: [0, 0, 0.15],
    fov: 26,
    focusRange: 0.09,
    bokeh: 6,
    handheld: 0.6,
    iso: 400,
    shutter: "1/200",
    aperture: "T1.2",
    still: asset("/images/scene/shot-7.jpg"),
    stillFocus: [0.5, 0.5],
  },
];

/** Full-frame equivalent focal length for a given vertical FOV (24mm sensor height). */
export const focalLength = (fovDeg: number) => Math.round(12 / Math.tan((fovDeg * Math.PI) / 360));

/**
 * Maps hero progress (0..1) to a shot segment with "holds" on each shot, so the
 * camera settles on every angle before moving on.
 */
export function segmentFor(progress: number) {
  const n = SHOTS.length;
  const f = Math.min(Math.max(progress, 0), 1) * (n - 1);
  const i = Math.min(Math.floor(f), n - 2);
  const t = f - i;
  const hold = 0.22;
  const x = Math.min(Math.max((t - hold) / (1 - 2 * hold), 0), 1);
  // easeInOutCubic — a slow dolly start and a gentle landing
  const e = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  return { from: i, to: i + 1, t: e, nearest: Math.round(f) };
}
