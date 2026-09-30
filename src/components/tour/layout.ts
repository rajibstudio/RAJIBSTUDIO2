/**
 * Floor plan of the biye bari, in metres. The mandap sits at the origin; the house wraps
 * around an open courtyard (uthon) and faces the lane to the south (+z).
 * The 3D world, the walking/collision rules and the minimap all read from this file.
 * No three.js here, so the walking rules can be tested in plain Node.
 */
export type Rect = { x0: number; x1: number; z0: number; z1: number };
export type Floor = Rect & { h: number };
export type Pose = { x: number; z: number; yaw: number; pitch: number };

export const PLINTH = 0.45; // veranda floor height
export const STEP = 0.15;
export const COURT = 9; // courtyard edge = courtyard face of the arcades
export const ARCADE_T = 0.5;
export const INNER = 13.2; // back wall of the verandas
export const OUTER = 13.6; // street face of the house
export const LANE_Z = 23; // houses across the lane start here
export const LANE_X = 12; // bamboo fences close the lane beyond this
export const GATE_Z = 17;
export const DOOR_W = 3;

export const G_COL = 3.2; // ground-floor column height (above the plinth)
export const FLOOR1 = 5.25; // first-floor level
export const F_COL = 2.6;
export const ROOF = 9.15;
export const PARAPET = 10.1;
export const ARCH_R = 1.05;

export const OPENINGS = 7;
export const ARCADE_LEN = 2 * (COURT + ARCADE_T);
export const PIER = (ARCADE_LEN - OPENINGS * 2 * ARCH_R) / (OPENINGS + 1);
const BAY = 2 * ARCH_R + PIER;
export const OPENING_CENTERS = Array.from({ length: OPENINGS }, (_, i) => -ARCADE_LEN / 2 + PIER + ARCH_R + i * BAY);
export const COLUMN_CENTERS = Array.from({ length: OPENINGS + 1 }, (_, k) => -ARCADE_LEN / 2 + PIER / 2 + k * BAY);

export const EYE = 1.62;
export const RADIUS = 0.28;
export const MAX_STEP = 0.34;

const rect = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 });
const sq = (x: number, z: number, s: number): Rect => rect(x - s, x + s, z - s, z + s);
const ring = (a: number, b: number, h: number): Floor[] => [
  { ...rect(-b, b, a, b), h },
  { ...rect(-b, b, -b, -a), h },
  { ...rect(a, b, -a, a), h },
  { ...rect(-b, -a, -a, a), h },
];

/** Three steps down from the verandas into the courtyard, all the way round. [inner, outer, height] */
export const STEP_RINGS: [number, number, number][] = [
  [8.1, 8.4, STEP],
  [8.4, 8.7, 2 * STEP],
  [8.7, COURT, 3 * STEP],
];

export const STAGE = rect(-3.6, 3.6, -INNER, -10.9);
export const TABLE = { x: 11.4, z0: -7.2, z1: 7.2, w: 0.84, top: PLINTH + 0.75 };

export const FLOORS: Floor[] = [
  { ...rect(-INNER, INNER, COURT, INNER), h: PLINTH },
  { ...rect(-INNER, INNER, -INNER, -COURT), h: PLINTH },
  { ...rect(COURT, INNER, -COURT, COURT), h: PLINTH },
  { ...rect(-INNER, -COURT, -COURT, COURT), h: PLINTH },
  ...STEP_RINGS.flatMap(([a, b, h]) => ring(a, b, h)),
  { ...rect(-DOOR_W / 2, DOOR_W / 2, INNER, OUTER), h: PLINTH },
  { ...rect(-2.2, 2.2, OUTER, OUTER + 0.35), h: 2 * STEP },
  { ...rect(-2.5, 2.5, OUTER + 0.35, OUTER + 0.7), h: STEP },
  { ...rect(-1.8, 1.8, -1.8, 1.8), h: 0.24 },
  { ...rect(-0.9, 0.9, 1.79, 2.21), h: 0.12 },
  { ...STAGE, h: PLINTH + 0.3 },
  { ...rect(-1.6, 1.6, -10.9, -10.55), h: PLINTH + 0.15 },
];

/* ---------------------------------- people ---------------------------------- */

export type Seat = { x: number; z: number; y: number; rot: number };
/** rot = direction the seat faces: (sin rot, cos rot) on the x/z plane. */
export const CEREMONY_SEATS: Seat[] = [];
for (const side of [-1, 1])
  for (const dx of [4.6, 5.4, 6.2])
    for (let i = 0; i < 6; i++) CEREMONY_SEATS.push({ x: side * dx, z: -2.25 + i * 0.9, y: 0, rot: side < 0 ? Math.PI / 2 : -Math.PI / 2 });

export const FEAST_SEATS: Seat[] = [];
for (let i = 0; i < 21; i++) {
  const z = -6.9 + i * 0.69;
  FEAST_SEATS.push({ x: 10.62, z, y: PLINTH, rot: Math.PI / 2 }, { x: 12.18, z, y: PLINTH, rot: -Math.PI / 2 });
}

export type Guest = { x: number; z: number; y: number; rot: number; sit: boolean; woman: boolean; cloth: string; skin: string; lookX: number; lookZ: number };

const SAREE = ["#b3121b", "#c2185b", "#d99a00", "#1f6f5c", "#6a1b9a", "#d35400", "#1a4f8b", "#eadbb9", "#8e0d14", "#0f5f6b"];
const KURTA = ["#efe6d0", "#7b1a1a", "#203a5c", "#c9a45c", "#3d5a3d", "#e3dccb", "#5a2d6e"];
const SKIN = ["#c68a63", "#b07650", "#d9a07a", "#9e6a48", "#c98f6b", "#a8704f"];
const facing = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);

function buildGuests(): Guest[] {
  const out: Guest[] = [];
  const person = (x: number, z: number, y: number, rot: number, sit: boolean, lookX: number, lookZ: number) => {
    const n = out.length;
    const woman = n % 2 === 0;
    out.push({ x, z, y, rot, sit, woman, cloth: woman ? SAREE[n % SAREE.length] : KURTA[n % KURTA.length], skin: SKIN[(n * 5) % SKIN.length], lookX, lookZ });
  };
  [0, 2, 4, 7, 9, 14, 19, 22, 24, 27, 31, 33].forEach((i) => {
    const s = CEREMONY_SEATS[i];
    person(s.x, s.z, s.y, s.rot, true, 0, 0.3);
  });
  [3, 4, 9, 12, 19, 26, 31, 36].forEach((i) => {
    const s = FEAST_SEATS[i];
    person(s.x, s.z, s.y, s.rot, true, TABLE.x, s.z);
  });
  const group = (cx: number, cz: number, y: number, angles: number[], rad: number) =>
    angles.forEach((a) => {
      const x = cx + Math.cos(a) * rad;
      const z = cz + Math.sin(a) * rad;
      person(x, z, y, facing(x, z, cx, cz), false, cx, cz);
    });
  group(3.5, 5.9, 0, [0.3, 2.4, 4.4], 0.55);
  group(-4.8, -6.0, 0, [1.2, 4.3], 0.45);
  group(-4.3, 19.3, 0, [0.5, 3.6], 0.42);
  person(-2.8, 11.5, PLINTH, 0, false, -2.8, 15); // hosts greeting at the door
  person(2.8, 11.5, PLINTH, 0, false, 2.8, 15);
  person(2.4, -7.4, 0, facing(2.4, -7.4, 0, -12), false, 0, -12);
  person(3.0, -7.1, 0, facing(3.0, -7.1, 0, -12), false, 0, -12);
  return out;
}
export const GUESTS = buildGuests();

/* --------------------------------- colliders --------------------------------- */

const arcadeLine = COURT + ARCADE_T / 2;
export const SOLIDS: Rect[] = [
  ...COLUMN_CENTERS.flatMap((c, k) => {
    const out = [sq(c, arcadeLine, 0.3), sq(c, -arcadeLine, 0.3)];
    if (k > 0 && k < OPENINGS) out.push(sq(arcadeLine, c, 0.3), sq(-arcadeLine, c, 0.3));
    return out;
  }),
  rect(-OUTER, OUTER, -OUTER, -INNER),
  rect(INNER, OUTER, -OUTER, OUTER),
  rect(-OUTER, -INNER, -OUTER, OUTER),
  rect(-OUTER, -DOOR_W / 2, INNER, OUTER),
  rect(DOOR_W / 2, OUTER, INNER, OUTER),
  rect(1.44, 1.56, 12.45, INNER), // open door leaves
  rect(-1.56, -1.44, 12.45, INNER),
  rect(-60, 60, LANE_Z, LANE_Z + 4),
  rect(-60, -LANE_X, OUTER, LANE_Z),
  rect(LANE_X, 60, OUTER, LANE_Z),
  // mandap: pillars, banana plants, couple, flower curtain, fire, ghot, priest, photographer, lamps, candles
  ...[-1, 1].flatMap((sx) => [-1, 1].flatMap((sz) => [sq(1.55 * sx, 1.55 * sz, 0.2), sq(1.87 * sx, 1.87 * sz, 0.14)])),
  rect(-0.7, 0.7, -0.32, 0.42),
  rect(-1.45, 1.45, -1.56, -1.36),
  sq(0, 0.9, 0.27),
  sq(0.62, 0.95, 0.15),
  sq(-0.85, 0.95, 0.3),
  sq(1.25, 3.1, 0.3),
  sq(-2.35, 1.35, 0.2),
  sq(2.35, 1.35, 0.2),
  sq(-2.25, 2.1, 0.28),
  sq(2.25, 2.1, 0.28),
  sq(-2.3, -1.9, 0.28),
  sq(2.3, -1.9, 0.28),
  // guest chairs, stage, feast, tattwa, photo corner
  rect(-6.5, -4.3, -2.75, 2.75),
  rect(4.3, 6.5, -2.75, 2.75),
  rect(-1.3, 1.3, -INNER, -11.75),
  sq(-2.5, -12.2, 0.3),
  sq(2.5, -12.2, 0.3),
  rect(10.3, 12.5, -7.3, 7.3),
  rect(-INNER, -11.95, -3.6, 3.6),
  rect(-INNER, -11.4, -7.6, -5.4),
  sq(-10.2, -6.5, 0.35),
  sq(-10.6, -8.3, 0.3),
  // lane: gate, plants, car, poles
  sq(-2.3, GATE_Z, 0.3),
  sq(2.3, GATE_Z, 0.3),
  sq(-3.1, GATE_Z, 0.35),
  sq(3.1, GATE_Z, 0.35),
  sq(-2.3, OUTER + 0.95, 0.3),
  sq(2.3, OUTER + 0.95, 0.3),
  rect(4.8, 9.2, 18.5, 20.3),
  sq(-8.5, 22.5, 0.2),
  sq(8.5, 22.5, 0.2),
  ...GUESTS.filter((g) => !g.sit).map((g) => sq(g.x, g.z, 0.26)),
];

/* ---------------------------------- walking ---------------------------------- */

export function groundAt(x: number, z: number) {
  let h = 0;
  for (const f of FLOORS) if (x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1 && f.h > h) h = f.h;
  return h;
}

export function blocked(x: number, z: number, fromH: number) {
  for (const s of SOLIDS) if (x > s.x0 - RADIUS && x < s.x1 + RADIUS && z > s.z0 - RADIUS && z < s.z1 + RADIUS) return true;
  // anything more than a step higher than where we stand acts as a wall
  for (const f of FLOORS) if (f.h - fromH > MAX_STEP && x > f.x0 - 0.12 && x < f.x1 + 0.12 && z > f.z0 - 0.12 && z < f.z1 + 0.12) return true;
  return false;
}

/** Moves with collisions, one axis at a time so the walker slides along walls. */
export function moveBy(p: { x: number; z: number }, dx: number, dz: number) {
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  for (let i = 0; i < n; i++) {
    if (!blocked(p.x + dx / n, p.z, groundAt(p.x, p.z))) p.x += dx / n;
    if (!blocked(p.x, p.z + dz / n, groundAt(p.x, p.z))) p.z += dz / n;
  }
}

/** Yaw that looks from one point towards another (yaw 0 looks towards -z). */
export const yawTo = (fx: number, fz: number, tx: number, tz: number) => Math.atan2(-(tx - fx), -(tz - fz));

/* ------------------------------- places & stops ------------------------------- */

export type Zone = { id: string; name: string; bn: string; text: string; rect: Rect };
export const ZONES: Zone[] = [
  { id: "mandap", rect: rect(-2.9, 2.9, -2.7, 3.9), name: "Chhadnatala", bn: "ছাদনাতলা", text: "The wedding mandap, under a canopy of marigold and rajnigandha." },
  { id: "stage", rect: rect(-4.6, 4.6, -INNER, -COURT), name: "Reception stage", bn: "মঞ্চ", text: "Where the couple will greet every guest." },
  { id: "feast", rect: rect(COURT, INNER, -COURT, COURT), name: "Bhoj — the feast", bn: "ভোজ", text: "The wedding feast, served on banana leaves." },
  { id: "tattwa", rect: rect(-INNER, -COURT, -4.4, 4.6), name: "Tattwa", bn: "তত্ত্ব", text: "Wedding gifts exchanged between the two families." },
  { id: "photo", rect: rect(-INNER, -COURT, -COURT, -4.4), name: "Photo corner", bn: "ফটো কর্নার", text: "Press P, or the Photo button, to take a picture." },
  { id: "gate", rect: rect(-LANE_X, LANE_X, 15.2, 18.8), name: "Shubho Bibaho gate", bn: "তোরণ", text: "The flower gate that welcomes the baraat." },
  { id: "lane", rect: rect(-LANE_X, LANE_X, OUTER, LANE_Z), name: "The lane", bn: "গলি", text: "The whole para can see the lights." },
  { id: "court", rect: rect(-COURT, COURT, -COURT, COURT), name: "Uthon — the courtyard", bn: "উঠোন", text: "The open courtyard at the heart of the house." },
  { id: "dalan", rect: rect(-OUTER, OUTER, -OUTER, OUTER), name: "Dalan — the verandas", bn: "দালান", text: "Red-oxide floors and carved columns around the courtyard." },
];

export function zoneAt(x: number, z: number) {
  for (const zn of ZONES) if (x >= zn.rect.x0 && x <= zn.rect.x1 && z >= zn.rect.z0 && z <= zn.rect.z1) return zn.id;
  return "lane";
}

export type Stop = Pose & { id: string; title: string; bn: string; text: string };
export const STOPS: Stop[] = [
  { id: "lane", x: 0, z: 21.4, yaw: 0, pitch: 0.3, title: "The Lane", bn: "গলি", text: "A whole house wrapped in golden lights — every biye bari announces itself to the para." },
  { id: "gate", x: 0, z: 18.7, yaw: 0, pitch: 0.12, title: "Shubho Bibaho Gate", bn: "তোরণ", text: "Banana plants, marigold strings and the brass mangal ghot welcome the baraat." },
  { id: "dalan", x: 0, z: 11.8, yaw: 0, pitch: -0.05, title: "Dalan — the veranda", bn: "দালান", text: "Red-oxide floors, carved columns and an alpana at the threshold. The courtyard glows ahead." },
  { id: "mandap", x: -2.4, z: 3.9, yaw: yawTo(-2.4, 3.9, 0, 0.2), pitch: 0.02, title: "Chhadnatala — the mandap", bn: "ছাদনাতলা", text: "The sacred fire, the priest's mantras, Mala Badal — and our photographer, already in position." },
  { id: "stage", x: 0, z: -7.3, yaw: 0, pitch: 0.06, title: "Reception stage", bn: "মঞ্চ", text: "A floral ring, a curtain of fairy lights and a throne for two, waiting for the couple." },
  { id: "feast", x: 9.95, z: 8.5, yaw: yawTo(9.95, 8.5, 11.3, 0), pitch: -0.12, title: "Bhoj — the feast", bn: "ভোজ", text: "Banana-leaf plates, luchi, dal, fish, mishti and clay bhaar cups laid down the pangti." },
  { id: "tattwa", x: -10.1, z: 3.3, yaw: yawTo(-10.1, 3.3, -12.6, 0.2), pitch: -0.16, title: "Tattwa — the gifts", bn: "তত্ত্ব", text: "Gifts between the families: a fish dressed as a bride, sweets, sarees and shola art." },
  { id: "photo", x: -10.3, z: -3.3, yaw: yawTo(-10.3, -3.3, -12.3, -6.5), pitch: -0.02, title: "Photo corner", bn: "ফটো কর্নার", text: "Rajib Studio's lights are set. Press P — or the Photo button — to take a picture of your visit." },
];
