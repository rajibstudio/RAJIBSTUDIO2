import * as THREE from "three";
import { rng } from "../three/textures";

/**
 * Procedural textures and materials for the biye bari walkthrough. Everything is painted on
 * <canvas> at runtime, so the whole 3D house downloads as code rather than image files.
 */
const cache = new Map<string, THREE.CanvasTexture>();
type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function make(key: string, w: number, h: number, draw: Draw, repeat = true) {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed: number) {
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Soft blotches that wrap around the edges, so the texture tiles without seams. */
function blotches(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, colors: string[], seed: number, rMin: number, rMax: number) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = rMin + r() * (rMax - rMin);
    const col = colors[Math.floor(r() * colors.length)];
    for (const ox of [-w, 0, w])
      for (const oy of [-h, 0, h]) {
        const cx = x + ox;
        const cy = y + oy;
        if (cx + rad < 0 || cx - rad > w || cy + rad < 0 || cy - rad > h) continue;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, col);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      }
  }
}

const cssVar = (name: string) => (typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(name).trim());

export const tex = {
  plaster: () =>
    make("plaster", 512, 512, (c, w, h) => {
      c.fillStyle = "#d6c4a0";
      c.fillRect(0, 0, w, h);
      blotches(c, w, h, 60, ["rgba(150,110,60,0.10)", "rgba(255,245,220,0.12)", "rgba(110,80,50,0.08)"], 3, 30, 140);
      const r = rng(8);
      for (let i = 0; i < 40; i++) {
        c.fillStyle = `rgba(90,70,45,${0.03 + r() * 0.04})`;
        c.fillRect(r() * w, 0, 1 + r() * 3, h);
      }
      grain(c, w, h, 18, 5);
    }),
  trim: () =>
    make("trim", 256, 256, (c, w, h) => {
      c.fillStyle = "#ece3d0";
      c.fillRect(0, 0, w, h);
      blotches(c, w, h, 20, ["rgba(140,120,90,0.08)", "rgba(255,255,255,0.1)"], 9, 20, 70);
      grain(c, w, h, 12, 10);
    }),
  stone: () =>
    make("stone", 512, 512, (c, w, h) => {
      const r = rng(12);
      for (let ty = 0; ty < 2; ty++)
        for (let tx = 0; tx < 2; tx++) {
          const v = 150 + Math.floor(r() * 24);
          c.fillStyle = `rgb(${v},${v - 10},${v - 24})`;
          c.fillRect(tx * 256, ty * 256, 256, 256);
        }
      blotches(c, w, h, 50, ["rgba(80,70,60,0.14)", "rgba(255,250,240,0.08)"], 13, 20, 90);
      c.fillStyle = "#5e564c";
      for (let i = 0; i <= 2; i++) {
        c.fillRect(i * 256 - 2, 0, 4, h);
        c.fillRect(0, i * 256 - 2, w, 4);
      }
      grain(c, w, h, 22, 14);
    }),
  redOxide: () =>
    make("redOxide", 512, 512, (c, w, h) => {
      c.fillStyle = "#7c2517";
      c.fillRect(0, 0, w, h);
      blotches(c, w, h, 70, ["rgba(60,12,6,0.18)", "rgba(170,70,40,0.14)", "rgba(40,8,4,0.12)"], 21, 20, 120);
      c.fillStyle = "rgba(30,6,3,0.55)";
      c.fillRect(0, 0, w, 2);
      c.fillRect(0, 0, 2, h);
      grain(c, w, h, 10, 22);
    }),
  shutter: () =>
    make(
      "shutter",
      256,
      512,
      (c, w, h) => {
        c.fillStyle = "#1c3a27";
        c.fillRect(0, 0, w, h);
        for (const x0 of [0, w / 2]) {
          c.fillStyle = "#2c5a3d";
          c.fillRect(x0 + 10, 12, w / 2 - 20, h - 24);
          for (let y = 24; y < h - 20; y += 13) {
            c.fillStyle = "#3f7552";
            c.fillRect(x0 + 16, y, w / 2 - 32, 3);
            c.fillStyle = "#264d35";
            c.fillRect(x0 + 16, y + 3, w / 2 - 32, 7);
            c.fillStyle = "#132a1c";
            c.fillRect(x0 + 16, y + 10, w / 2 - 32, 2);
          }
          c.fillStyle = "#1c3a27";
          c.fillRect(x0 + 10, h / 2 - 6, w / 2 - 20, 12);
        }
        c.fillStyle = "#b08d45";
        c.fillRect(w / 2 - 3, h / 2 - 14, 6, 28);
        grain(c, w, h, 16, 31);
      },
      false,
    ),
  door: () =>
    make(
      "door",
      256,
      512,
      (c, w, h) => {
        c.fillStyle = "#23452f";
        c.fillRect(0, 0, w, h);
        for (const x0 of [0, w / 2])
          for (let k = 0; k < 3; k++) {
            const y = 22 + k * 160;
            c.fillStyle = "#2f5b3e";
            c.fillRect(x0 + 16, y, w / 2 - 32, 140);
            c.fillStyle = "#3d7050";
            c.fillRect(x0 + 16, y, w / 2 - 32, 4);
            c.fillStyle = "#15301f";
            c.fillRect(x0 + 16, y + 136, w / 2 - 32, 4);
          }
        c.fillStyle = "#c79a45";
        c.beginPath();
        c.arc(w / 2 - 12, h / 2, 6, 0, Math.PI * 2);
        c.arc(w / 2 + 12, h / 2, 6, 0, Math.PI * 2);
        c.fill();
        grain(c, w, h, 14, 32);
      },
      false,
    ),
  glass: () =>
    make(
      "glass",
      256,
      256,
      (c, w, h) => {
        const cx = w / 2;
        const cy = h / 2;
        const R = w / 2;
        const cols = ["#c0162f", "#1f8a44", "#1d57b0", "#e6a41c", "#7a1fa2", "#d8205f"];
        c.fillStyle = "#140d08";
        c.fillRect(0, 0, w, h);
        const n = 12;
        for (let i = 0; i < n; i++) {
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(cx, cy, R * 0.95, (i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2);
          c.closePath();
          c.fillStyle = cols[i % cols.length];
          c.fill();
        }
        c.beginPath();
        c.arc(cx, cy, R * 0.32, 0, Math.PI * 2);
        c.fillStyle = "#f0b63a";
        c.fill();
        c.strokeStyle = "#140d08";
        c.lineWidth = 5;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
          c.stroke();
        }
        for (const k of [0.32, 0.64, 0.95]) {
          c.beginPath();
          c.arc(cx, cy, R * k, 0, Math.PI * 2);
          c.stroke();
        }
      },
      false,
    ),
  ceiling: () =>
    make("ceiling", 512, 512, (c, w, h) => {
      c.fillStyle = "#c9b690";
      c.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 51.2) {
        c.fillStyle = "#4a2c18";
        c.fillRect(x, 0, 16, h);
        c.fillStyle = "#6a4226";
        c.fillRect(x, 0, 4, h);
      }
      c.fillStyle = "#32190c";
      c.fillRect(0, h / 2 - 26, w, 52);
      c.fillStyle = "#553219";
      c.fillRect(0, h / 2 - 26, w, 8);
      grain(c, w, h, 14, 41);
    }),
  railing: () =>
    make("railing", 512, 128, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = "#fff";
      c.strokeStyle = "#fff";
      c.fillRect(0, 0, w, 10);
      c.fillRect(0, h - 12, w, 12);
      c.fillRect(0, h * 0.62, w, 5);
      for (let x = 0; x < w; x += 32) c.fillRect(x + 14, 0, 4, h);
      c.lineWidth = 4;
      for (let x = 0; x < w; x += 64) {
        c.beginPath();
        c.arc(x + 32, h * 0.35, 13, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.arc(x + 32, h * 0.35, 4, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(x, h * 0.62);
        c.quadraticCurveTo(x + 16, h * 0.84, x + 32, h * 0.62);
        c.quadraticCurveTo(x + 48, h * 0.84, x + 64, h * 0.62);
        c.stroke();
      }
    }),
  asphalt: () =>
    make("asphalt", 512, 512, (c, w, h) => {
      c.fillStyle = "#1f2023";
      c.fillRect(0, 0, w, h);
      blotches(c, w, h, 40, ["rgba(0,0,0,0.25)", "rgba(90,90,95,0.10)"], 51, 20, 110);
      grain(c, w, h, 34, 52);
    }),
  stripes: () =>
    make("stripes", 128, 128, (c, w, h) => {
      const cols = ["#b0141e", "#f1e6cf", "#e8a317", "#f1e6cf"];
      for (let i = -4; i < 8; i++) {
        c.fillStyle = cols[((i % 4) + 4) % 4];
        c.beginPath();
        c.moveTo(i * 32, 0);
        c.lineTo(i * 32 + 32, 0);
        c.lineTo(i * 32 + 32 + h, h);
        c.lineTo(i * 32 + h, h);
        c.fill();
      }
    }),
  carpet: () =>
    make("carpet", 256, 256, (c, w, h) => {
      c.fillStyle = "#86101a";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "rgba(230,170,80,0.18)";
      for (let y = 16; y < h; y += 32)
        for (let x = (y / 32) % 2 ? 16 : 0; x < w; x += 32) {
          c.beginPath();
          c.moveTo(x, y - 5);
          c.lineTo(x + 5, y);
          c.lineTo(x, y + 5);
          c.lineTo(x - 5, y);
          c.fill();
        }
      grain(c, w, h, 26, 61);
    }),
  leaf: () =>
    make(
      "leaf",
      256,
      192,
      (c, w, h) => {
        c.clearRect(0, 0, w, h);
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#2d6a22");
        g.addColorStop(0.5, "#4c8f33");
        g.addColorStop(1, "#2d6a22");
        c.fillStyle = g;
        c.beginPath();
        c.roundRect(6, 10, w - 12, h - 20, 26);
        c.fill();
        c.strokeStyle = "rgba(190,230,140,0.35)";
        c.lineWidth = 1;
        for (let x = 12; x < w - 12; x += 7) {
          c.beginPath();
          c.moveTo(x, h / 2);
          c.lineTo(x + 20, 12);
          c.moveTo(x, h / 2);
          c.lineTo(x + 20, h - 12);
          c.stroke();
        }
        c.fillStyle = "#b8d58a";
        c.fillRect(6, h / 2 - 2, w - 12, 4);
      },
      false,
    ),
  windowGlow: () =>
    make(
      "windowGlow",
      128,
      160,
      (c, w, h) => {
        const g = c.createRadialGradient(w / 2, h * 0.7, 4, w / 2, h * 0.6, h * 0.8);
        g.addColorStop(0, "#fff1d0");
        g.addColorStop(1, "#6b3a18");
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        c.fillStyle = "rgba(120,40,20,0.55)";
        c.fillRect(0, 0, 26, h);
        c.fillRect(w - 26, 0, 26, h);
        c.fillStyle = "#20130b";
        c.fillRect(w / 2 - 3, 0, 6, h);
        c.fillRect(0, h * 0.42, w, 6);
        c.fillRect(0, 0, w, 6);
        c.fillRect(0, h - 6, w, 6);
        c.fillRect(0, 0, 6, h);
        c.fillRect(w - 6, 0, 6, h);
      },
      false,
    ),
};

/** Canvas text textures: redrawn once the page's web fonts (Bengali + display serif) have loaded. */
function textTexture(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, fonts: { bn: string; display: string }) => void) {
  const fallback = { bn: "serif", display: "serif" };
  const t = make(key, w, h, (c) => draw(c, fallback), false);
  if (!(t.userData as { fonts?: boolean }).fonts && typeof document !== "undefined" && document.fonts) {
    (t.userData as { fonts?: boolean }).fonts = true;
    const fonts = { bn: cssVar("--font-bengali") || "serif", display: cssVar("--font-display") || "serif" };
    // Load only the web font itself: the metric-matched fallback face points at local() fonts
    // that don't exist on every system, and a failed face would reject the whole load.
    const first = (list: string) => list.split(",")[0].trim();
    Promise.allSettled([
      document.fonts.load(`500 80px ${first(fonts.bn)}`, "শুভ বিবাহ ধন্যবাদ স্মৃতিকে করি চিরস্থায়ী"),
      document.fonts.load(`400 80px ${first(fonts.display)}`, "RAJIB STUDIO"),
    ]).then(() => {
      draw((t.image as HTMLCanvasElement).getContext("2d")!, fonts);
      t.needsUpdate = true;
    });
  }
  return t;
}

function goldFrame(c: CanvasRenderingContext2D, w: number, h: number) {
  c.strokeStyle = "#e7c677";
  c.lineWidth = 6;
  c.strokeRect(12, 12, w - 24, h - 24);
  c.lineWidth = 2;
  c.strokeRect(24, 24, w - 48, h - 48);
}

export const bannerTexture = (side: "front" | "back") =>
  textTexture(`banner-${side}`, 1024, 220, (c, f) => {
    const w = 1024;
    const h = 220;
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#a3121c");
    g.addColorStop(1, "#6d0a12");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    goldFrame(c, w, h);
    c.fillStyle = "#f5d98c";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `500 112px ${f.bn}`;
    c.fillText(side === "front" ? "শুভ বিবাহ" : "ধন্যবাদ", w / 2, h / 2 + 6);
    for (const x of [96, w - 96]) {
      c.beginPath();
      c.arc(x, h / 2, 28, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(x, h / 2, 10, 0, Math.PI * 2);
      c.fill();
    }
  });

export const signTexture = () =>
  textTexture("studio-sign", 768, 384, (c, f) => {
    const w = 768;
    const h = 384;
    c.fillStyle = "#0e0a0b";
    c.fillRect(0, 0, w, h);
    goldFrame(c, w, h);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#f3ead8";
    c.font = `400 92px ${f.display}`;
    c.fillText("RAJIB STUDIO", w / 2, h * 0.36);
    c.fillStyle = "#e4c786";
    c.font = `500 44px ${f.bn}`;
    c.fillText("স্মৃতিকে করি চিরস্থায়ী", w / 2, h * 0.62);
    c.font = `400 26px ${f.display}`;
    c.fillText("P H O T O   C O R N E R", w / 2, h * 0.82);
  });

/* --------------------------------- materials --------------------------------- */

let M: ReturnType<typeof build> | null = null;

function build() {
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
  const glow = (r: number, g: number, b: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), toneMapped: false });
  const banner = (side: "front" | "back") => std({ map: bannerTexture(side), roughness: 0.6 });
  const trimMat = std({ map: tex.trim(), roughness: 0.82 });
  return {
    plaster: std({ map: tex.plaster(), roughness: 0.92 }),
    trim: trimMat,
    stone: std({ map: tex.stone(), roughness: 0.78 }),
    step: std({ map: tex.trim(), color: "#bdb4a5", roughness: 0.8 }),
    redOxide: new THREE.MeshPhysicalMaterial({ map: tex.redOxide(), roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
    shutter: std({ map: tex.shutter(), roughness: 0.7 }),
    door: std({ map: tex.door(), roughness: 0.62 }),
    glass: new THREE.MeshBasicMaterial({ map: tex.glass(), color: new THREE.Color(1.5, 1.35, 1.2), toneMapped: false, side: THREE.DoubleSide }),
    ceiling: std({ map: tex.ceiling(), roughness: 0.85, side: THREE.DoubleSide }),
    railing: std({ map: tex.railing(), color: "#17181a", metalness: 0.6, roughness: 0.45, alphaTest: 0.5, side: THREE.DoubleSide }),
    asphalt: std({ map: tex.asphalt(), roughness: 0.93 }),
    stripes: std({ map: tex.stripes(), roughness: 0.7 }),
    carpet: std({ map: tex.carpet(), roughness: 0.95 }),
    cloth: new THREE.MeshPhysicalMaterial({ color: "#f1ece2", roughness: 0.82, sheen: 0.5, sheenColor: new THREE.Color("#ffffff") }),
    satin: new THREE.MeshPhysicalMaterial({ color: "#a3121c", roughness: 0.4, sheen: 1, sheenColor: new THREE.Color("#ff9a7a") }),
    silk: new THREE.MeshPhysicalMaterial({ color: "#eadbb9", roughness: 0.5, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color("#ffe0a0"), side: THREE.DoubleSide }),
    velvet: new THREE.MeshPhysicalMaterial({ color: "#6d0a14", roughness: 0.85, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color("#ff6a6a") }),
    purpleVelvet: new THREE.MeshPhysicalMaterial({ color: "#2b0f33", roughness: 0.9, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color("#a26ad0"), side: THREE.DoubleSide }),
    bamboo: std({ color: "#b39455", roughness: 0.55 }),
    houses: std({ map: tex.plaster(), vertexColors: true, roughness: 0.93 }),
    windowLit: new THREE.MeshBasicMaterial({ map: tex.windowGlow(), toneMapped: false }),
    windowDark: std({ color: "#101218", roughness: 0.35, metalness: 0.3 }),
    shopShutter: std({ color: "#3b3d42", roughness: 0.6, metalness: 0.4 }),
    concrete: std({ color: "#7d7a73", roughness: 0.9 }),
    wire: new THREE.LineBasicMaterial({ color: "#050506" }),
    sodium: glow(3.2, 1.5, 0.45),
    warm: glow(2.6, 1.55, 0.7),
    crystal: glow(1.6, 1.5, 1.3),
    ringLight: glow(3, 2.9, 2.7),
    carPaint: new THREE.MeshPhysicalMaterial({ color: "#efece4", roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carGlass: new THREE.MeshPhysicalMaterial({ color: "#07090d", roughness: 0.06, metalness: 0.6 }),
    rubber: std({ color: "#0f0f10", roughness: 0.9 }),
    chrome: std({ color: "#d9d9d9", metalness: 1, roughness: 0.22 }),
    headlight: glow(2.6, 2.5, 2.2),
    taillight: glow(2.2, 0.15, 0.1),
    leafPlate: std({ map: tex.leaf(), roughness: 0.5, alphaTest: 0.5, side: THREE.DoubleSide }),
    terracotta: std({ color: "#9b4a27", roughness: 0.85 }),
    rice: std({ color: "#f4efe3", roughness: 0.9 }),
    luchi: std({ color: "#e0b25c", roughness: 0.6 }),
    dal: std({ color: "#d9a520", roughness: 0.4 }),
    curry: std({ color: "#b8521e", roughness: 0.45 }),
    rosogolla: std({ color: "#f7f1e2", roughness: 0.35 }),
    pantua: std({ color: "#5a2a14", roughness: 0.5 }),
    lime: std({ color: "#7fb03a", roughness: 0.5 }),
    fish: std({ color: "#b8c2c8", metalness: 0.55, roughness: 0.32 }),
    betel: std({ color: "#3f7a2a", roughness: 0.5 }),
    bannerFront: banner("front"),
    bannerBack: banner("back"),
    sign: std({ map: signTexture(), roughness: 0.6 }),
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z — the banner reads from the lane (+z)
    bannerFaces: [] as THREE.Material[],
  };
}

export function tourMaterials() {
  if (!M) {
    M = build();
    M.bannerFaces = [M.trim, M.trim, M.trim, M.trim, M.bannerFront, M.bannerBack];
  }
  return M;
}
