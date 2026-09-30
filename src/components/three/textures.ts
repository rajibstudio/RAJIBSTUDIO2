import * as THREE from "three";

/**
 * Procedural textures, painted once on <canvas> at runtime.
 * This keeps the hero free of large texture downloads — the entire 3D scene
 * ships as code (a few KB) instead of megabytes of GLB/KTX assets.
 */

const cache = new Map<string, THREE.Texture>();

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, opts?: { repeat?: [number, number]; srgb?: boolean }) {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = opts?.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (opts?.repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...opts.repeat);
  }
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

// Deterministic PRNG so textures look identical on every load.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed = 7) {
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

/** Alpana — white rice-paste floor art on a sindoor-red floor. */
export function alpanaTexture() {
  return make("alpana", 1024, 1024, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.72);
    g.addColorStop(0, "#7a1d15");
    g.addColorStop(1, "#3e0c09");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 18, 3);

    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = "rgba(250,244,230,0.92)";
    ctx.fillStyle = "rgba(250,244,230,0.92)";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(255,255,255,0.35)";
    ctx.shadowBlur = 3;

    const petalRing = (count: number, rIn: number, rOut: number, width: number, lw: number, fill = false) => {
      for (let i = 0; i < count; i++) {
        ctx.save();
        ctx.rotate((i / count) * Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(0, rIn);
        ctx.bezierCurveTo(width, rIn + (rOut - rIn) * 0.35, width * 0.6, rOut * 0.95, 0, rOut);
        ctx.bezierCurveTo(-width * 0.6, rOut * 0.95, -width, rIn + (rOut - rIn) * 0.35, 0, rIn);
        ctx.lineWidth = lw;
        if (fill) ctx.fill();
        else ctx.stroke();
        ctx.restore();
      }
    };
    const dots = (count: number, r: number, size: number) => {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const ring = (r: number, lw: number) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.lineWidth = lw;
      ctx.stroke();
    };

    // Central lotus (padma)
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    petalRing(8, 30, 110, 34, 6);
    petalRing(8, 30, 90, 20, 3);
    ctx.save();
    ctx.rotate(Math.PI / 8);
    petalRing(8, 60, 150, 36, 6);
    ctx.restore();
    ring(162, 5);
    dots(48, 176, 4.5);
    ring(190, 3);
    petalRing(24, 196, 262, 16, 5);
    ring(272, 4);
    // Conch-and-leaf (shankha lata) band
    for (let i = 0; i < 36; i++) {
      ctx.save();
      ctx.rotate((i / 36) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 282);
      ctx.quadraticCurveTo(24, 305, 0, 336);
      ctx.quadraticCurveTo(-10, 312, 0, 282);
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 330, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ring(350, 5);
    dots(72, 364, 4);
    ring(378, 2.5);
    petalRing(40, 384, 440, 12, 4);
    ring(452, 6);
    // Corner creepers
    for (let c = 0; c < 4; c++) {
      ctx.save();
      ctx.rotate(Math.PI / 4 + (c * Math.PI) / 2);
      ctx.translate(0, 600);
      petalRing(6, 8, 60, 18, 4);
      ctx.restore();
    }
  });
}

/** Banarasi saree: deep red body with gold buti and a heavy zari border at the bottom. */
export function sareeTexture() {
  return make(
    "saree",
    512,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = "#8e0d14";
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, 14, 11);
      // woven sheen stripes
      for (let x = 0; x < w; x += 3) {
        ctx.fillStyle = `rgba(255,120,110,${0.02 + (x % 9 === 0 ? 0.03 : 0)})`;
        ctx.fillRect(x, 0, 1, h);
      }
      // buti motifs
      ctx.fillStyle = "#d9ae54";
      for (let y = 40; y < h * 0.8; y += 64) {
        for (let x = (y / 64) % 2 ? 32 : 0; x < w + 32; x += 64) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-4, -4, 8, 8);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(x, y - 11, 2.4, 0, Math.PI * 2);
          ctx.arc(x, y + 11, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // zari border (bottom of the canvas = bottom of the garment)
      const top = h * 0.82;
      const bg = ctx.createLinearGradient(0, top, 0, h);
      bg.addColorStop(0, "#b8862f");
      bg.addColorStop(0.5, "#f1d27f");
      bg.addColorStop(1, "#a8741f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, top, w, h - top);
      ctx.fillStyle = "#7d0a10";
      ctx.fillRect(0, top + 14, w, 6);
      ctx.fillRect(0, h - 20, w, 6);
      ctx.strokeStyle = "#7d0a10";
      ctx.lineWidth = 3;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, top + 30);
        ctx.quadraticCurveTo(x + 16, top + 90, x + 32, top + 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 16, top + 110, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    { repeat: [5, 1] },
  );
}

/** Ivory silk (garad / tussar) with a slim gold border. */
export function silkTexture(key: string, base: string, border = true) {
  return make(
    `silk-${key}`,
    256,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, 10, key.length * 7);
      for (let y = 0; y < h; y += 2) {
        ctx.fillStyle = `rgba(255,255,255,${y % 6 === 0 ? 0.05 : 0.015})`;
        ctx.fillRect(0, y, w, 1);
      }
      if (border) {
        const g = ctx.createLinearGradient(0, h * 0.9, 0, h);
        g.addColorStop(0, "#c89a3c");
        g.addColorStop(0.5, "#f3d98f");
        g.addColorStop(1, "#b0822a");
        ctx.fillStyle = g;
        ctx.fillRect(0, h * 0.92, w, h * 0.08);
        ctx.fillStyle = "rgba(120,30,20,0.8)";
        ctx.fillRect(0, h * 0.94, w, 3);
      }
    },
    { repeat: [4, 1] },
  );
}

/** Sola (pith) lace used for the bride's mukut and groom's topor. */
export function solaTexture() {
  return make(
    "sola",
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#f6f1e6";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(160,130,90,0.55)";
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 42) {
        for (let x = (y / 42) % 2 ? 21 : 0; x < w + 42; x += 42) {
          ctx.beginPath();
          ctx.arc(x, y, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = "rgba(200,160,60,0.9)";
      ctx.lineWidth = 4;
      for (let y = 20; y < h; y += 128) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
    { repeat: [3, 2] },
  );
}

/** Banana leaf with midrib, parallel veins and a torn edge (alpha). */
export function bananaLeafTexture() {
  return make("banana-leaf", 256, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.bezierCurveTo(w * 1.02, h * 0.75, w * 0.98, h * 0.2, w / 2, 0);
    ctx.bezierCurveTo(w * 0.02, h * 0.2, -w * 0.02, h * 0.75, w / 2, h);
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#1f4a1a");
    g.addColorStop(0.5, "#3d7a27");
    g.addColorStop(1, "#1f4a1a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(180,220,120,0.25)";
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 6) {
      ctx.beginPath();
      ctx.moveTo(w / 2, y);
      ctx.lineTo(0, y - 60);
      ctx.moveTo(w / 2, y);
      ctx.lineTo(w, y - 60);
      ctx.stroke();
    }
    // tears
    ctx.globalCompositeOperation = "destination-out";
    const r = rng(5);
    for (let i = 0; i < 9; i++) {
      const y = r() * h * 0.85;
      const side = r() > 0.5 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(w / 2 + side * w * 0.52, y);
      ctx.lineTo(w / 2 + side * 6, y - 40 - r() * 30);
      ctx.lineTo(w / 2 + side * w * 0.52, y - 3);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#b9d38a";
    ctx.fillRect(w / 2 - 3, 0, 6, h);
  });
}

/** Soft radial glow sprite — candle halos, fairy lights, fire. */
export function glowTexture() {
  return make("glow", 128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(255,236,200,0.75)");
    g.addColorStop(0.45, "rgba(255,190,110,0.18)");
    g.addColorStop(1, "rgba(255,160,80,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Velvet drape nap — used as a roughness/bump detail. */
export function velvetTexture() {
  return make(
    "velvet",
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, 60, 21);
    },
    { repeat: [8, 8], srgb: false },
  );
}

/** Lens barrel knurling (rubber focus/zoom ring grip). */
export function knurlTexture() {
  return make(
    "knurl",
    512,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#050505";
      for (let x = 0; x < w; x += 8) ctx.fillRect(x, 0, 4, h);
    },
    { repeat: [6, 1], srgb: false },
  );
}

/** Lens barrel print: distance scale and brand ring. */
export function lensPrintTexture() {
  return make(
    "lens-print",
    1024,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = "#0b0b0c";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#e9e3d6";
      ctx.font = "600 34px Arial, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText("85mm  1:1.2  ASPH  ∞ — 0.8m", 40, h * 0.5);
      ctx.fillText("Ø77   RAJIB STUDIO", 560, h * 0.5);
      ctx.fillStyle = "#c9a45c";
      ctx.fillRect(0, h - 10, w, 5);
    },
    { srgb: true },
  );
}
