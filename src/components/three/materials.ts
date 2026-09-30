import * as THREE from "three";
import { alpanaTexture, sareeTexture, silkTexture, solaTexture, bananaLeafTexture, velvetTexture, knurlTexture, lensPrintTexture } from "./textures";

/**
 * Shared, physically based materials. Built lazily once per page and reused by
 * every mesh to minimise shader programs and GPU uploads.
 */
let M: ReturnType<typeof build> | null = null;

function build() {
  const skin = (color: string) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.52,
      sheen: 0.6,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color("#ff9f80"),
      clearcoat: 0.08,
      clearcoatRoughness: 0.6,
    });

  const fabric = (map: THREE.Texture | null, color = "#ffffff", sheenColor = "#ffd9a0", extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
    new THREE.MeshPhysicalMaterial({
      map,
      color,
      roughness: 0.62,
      sheen: 1,
      sheenRoughness: 0.35,
      sheenColor: new THREE.Color(sheenColor),
      side: THREE.DoubleSide,
      ...extra,
    });

  return {
    // People
    skinBride: skin("#d69a74"),
    skinGroom: skin("#c08560"),
    skinPhoto: skin("#a8704f"),
    hair: new THREE.MeshPhysicalMaterial({ color: "#0d0907", roughness: 0.38, sheen: 1, sheenColor: new THREE.Color("#5a3b2a"), sheenRoughness: 0.3 }),
    saree: fabric(sareeTexture(), "#ffffff", "#ff6a55"),
    sareeVeil: fabric(sareeTexture(), "#ffffff", "#ff7766", { transparent: true, opacity: 0.88, roughness: 0.55 }),
    blouse: fabric(null, "#7a0b12", "#ff5a4a"),
    groomSilk: fabric(silkTexture("groom", "#d8c7a4"), "#ffffff", "#fff2cc"),
    dhoti: fabric(silkTexture("dhoti", "#e2d5b8"), "#ffffff", "#fff6dd"),
    shawl: fabric(silkTexture("shawl", "#caa45c"), "#ffffff", "#ffe6a3", { roughness: 0.45 }),
    suit: fabric(null, "#17171a", "#565a66", { roughness: 0.8, side: THREE.FrontSide }),
    shirt: fabric(null, "#232327", "#6a6f7c", { roughness: 0.75, side: THREE.FrontSide }),
    shoe: new THREE.MeshPhysicalMaterial({ color: "#0c0b0b", roughness: 0.3, clearcoat: 0.8 }),
    sola: new THREE.MeshPhysicalMaterial({ map: solaTexture(), color: "#fffaf0", roughness: 0.7, sheen: 0.4, sheenColor: new THREE.Color("#fff"), side: THREE.DoubleSide }),
    chandan: new THREE.MeshStandardMaterial({ color: "#fdf7ea", roughness: 0.9 }),
    sindoor: new THREE.MeshStandardMaterial({ color: "#b3121b", roughness: 0.6 }),
    eye: new THREE.MeshPhysicalMaterial({ color: "#1a0f0a", roughness: 0.15, clearcoat: 1 }),
    lips: new THREE.MeshPhysicalMaterial({ color: "#8e2a2a", roughness: 0.35, clearcoat: 0.5 }),
    shankha: new THREE.MeshPhysicalMaterial({ color: "#f5efe3", roughness: 0.3, clearcoat: 0.7 }),
    pola: new THREE.MeshPhysicalMaterial({ color: "#a50d17", roughness: 0.25, clearcoat: 0.9 }),

    // Metals
    gold: new THREE.MeshStandardMaterial({ color: "#d7a94f", metalness: 1, roughness: 0.28 }),
    goldSoft: new THREE.MeshStandardMaterial({ color: "#b98d3e", metalness: 0.9, roughness: 0.45 }),
    brass: new THREE.MeshStandardMaterial({ color: "#b4832f", metalness: 1, roughness: 0.32 }),

    // Mandap
    alpana: new THREE.MeshStandardMaterial({ map: alpanaTexture(), roughness: 0.78 }),
    platformSide: new THREE.MeshStandardMaterial({ color: "#2a0d0b", roughness: 0.6 }),
    wood: new THREE.MeshPhysicalMaterial({ color: "#4b2415", roughness: 0.42, clearcoat: 0.5 }),
    canopy: fabric(silkTexture("canopy", "#7a1520", false), "#ffffff", "#ff8a6a", { roughness: 0.5 }),
    velvet: new THREE.MeshPhysicalMaterial({
      color: "#2b0f2e",
      roughness: 0.9,
      roughnessMap: velvetTexture(),
      sheen: 1,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color("#9a5fb8"),
      side: THREE.DoubleSide,
    }),
    sheer: new THREE.MeshPhysicalMaterial({ color: "#f3d9a8", roughness: 0.6, transparent: true, opacity: 0.22, side: THREE.DoubleSide, sheen: 1, sheenColor: new THREE.Color("#ffd28a"), depthWrite: false }),
    bananaLeaf: new THREE.MeshStandardMaterial({ map: bananaLeafTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.55 }),
    bananaStem: new THREE.MeshStandardMaterial({ color: "#6b8a3a", roughness: 0.6 }),
    brick: new THREE.MeshStandardMaterial({ color: "#6a2a17", roughness: 0.95 }),
    ember: new THREE.MeshStandardMaterial({ color: "#1a0703", emissive: new THREE.Color("#ff5a12"), emissiveIntensity: 2.2, roughness: 1 }),
    flame: new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.2, 0.8), toneMapped: false, transparent: true, opacity: 0.95, depthWrite: false }),
    clay: new THREE.MeshStandardMaterial({ color: "#8a4a2a", roughness: 0.85 }),

    // Flowers (colour comes from instance colours)
    flower: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.75 }),
    petal: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, side: THREE.DoubleSide }),
    leaf: new THREE.MeshStandardMaterial({ color: "#2f5a22", roughness: 0.6, side: THREE.DoubleSide }),

    // Camera
    camBody: new THREE.MeshPhysicalMaterial({ color: "#141416", roughness: 0.55, metalness: 0.2, clearcoat: 0.3, clearcoatRoughness: 0.6 }),
    camGrip: new THREE.MeshStandardMaterial({ color: "#0b0b0c", roughness: 0.95, bumpMap: velvetTexture(), bumpScale: 0.6 }),
    camMetal: new THREE.MeshStandardMaterial({ color: "#2a2a2e", metalness: 0.9, roughness: 0.35 }),
    camKnurl: new THREE.MeshStandardMaterial({ color: "#ffffff", map: knurlTexture(), bumpMap: knurlTexture(), bumpScale: 1.2, roughness: 0.85 }),
    lensPrint: new THREE.MeshStandardMaterial({ map: lensPrintTexture(), roughness: 0.5, metalness: 0.2 }),
    lensGlass: new THREE.MeshPhysicalMaterial({
      color: "#0a0a12",
      metalness: 0,
      roughness: 0.02,
      clearcoat: 1,
      clearcoatRoughness: 0,
      // Coating tint via sheen instead of iridescence (iridescence can emit NaNs on some GPUs,
      // which bloom/DOF then smear into black blocks).
      sheen: 1,
      sheenRoughness: 0.25,
      sheenColor: new THREE.Color("#7b4dff"),
      reflectivity: 1,
      envMapIntensity: 2.5,
    }),
    lensInner: new THREE.MeshStandardMaterial({ color: "#020203", roughness: 0.25, metalness: 0.4 }),
    blade: new THREE.MeshStandardMaterial({ color: "#111114", metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide }),
    screen: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
    afLamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.03, 0.02), toneMapped: false }),

    // Floor
    floorDark: new THREE.MeshStandardMaterial({ color: "#0b0706", roughness: 0.35, metalness: 0.1 }),
  };
}

export function materials() {
  if (!M) M = build();
  return M;
}

export type Materials = ReturnType<typeof build>;
