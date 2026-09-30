/**
 * Generates web-sized WebP copies of the gallery photographs.
 *
 *   assets/gallery/g000.jpg  →  public/optimized/{width}/g000.webp
 *
 * Runs automatically before `npm run dev` and `npm run build`. Files that are
 * already up to date are skipped, so repeat runs take well under a second.
 * The widths come from src/lib/image-sizes.json, the same list next/image uses.
 */
import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sizes from "../src/lib/image-sizes.json" with { type: "json" };

const SRC = "assets/gallery";
const OUT = "public/optimized";
const widths = [...sizes.imageSizes, ...sizes.deviceSizes];

const mtime = async (file) => {
  try {
    return (await stat(file)).mtimeMs;
  } catch {
    return 0;
  }
};

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
await Promise.all(widths.map((w) => mkdir(path.join(OUT, String(w)), { recursive: true })));

let made = 0;
await Promise.all(
  files.map(async (file) => {
    const input = path.join(SRC, file);
    const inputTime = await mtime(input);
    const name = file.replace(/\.[^.]+$/, "");
    for (const w of widths) {
      const output = path.join(OUT, String(w), `${name}.webp`);
      if ((await mtime(output)) >= inputTime) continue;
      await sharp(input).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 76, effort: 5 }).toFile(output);
      made += 1;
    }
  }),
);

console.log(`images: ${files.length} photos × ${widths.length} sizes — ${made ? `${made} generated` : "all up to date"}`);
