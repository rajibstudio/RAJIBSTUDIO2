import sizes from "./image-sizes.json";

const WIDTHS = [...sizes.imageSizes, ...sizes.deviceSizes].sort((a, b) => a - b);
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const GALLERY = /^\/images\/gallery\/([\w-]+)\.(?:jpe?g|png)$/i;

/**
 * Image loader for the static (GitHub Pages) build. There is no image server,
 * so next/image is pointed at WebP files pre-generated for every width it can
 * request (see scripts/optimize-images.mjs, which runs before dev and build).
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const match = GALLERY.exec(src);
  if (!match) return `${BASE}${src}`;
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1];
  return `${BASE}/optimized/${w}/${match[1]}.webp`;
}
